/**
 * Native Google Gemini provider (server-side only).
 *
 * Talks to Google's generateContent REST API using the same `AnswerProvider`
 * interface as the OpenAI-compatible provider, so the handler and prompt
 * pipeline don't change. The API key is sent only in the `x-goog-api-key`
 * header (never in the URL, body, or logs), and all failures are collapsed to
 * non-revealing `ProviderUnavailableError` instances.
 *
 * Environment variables (server-side only — never `VITE_*`):
 *   PORTFOLIO_AI_API_KEY     Google AI Studio API key (required)
 *   PORTFOLIO_AI_MODEL       Gemini model, default "gemini-3.6-flash"
 *   PORTFOLIO_AI_TIMEOUT_MS  upstream request timeout, default 30000
 */
import type { ChatMessage } from './types.ts'
import { ProviderUnavailableError } from './provider.ts'
import type { AnswerProvider, ProviderDeps, ProviderEnv } from './provider.ts'

export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com'
const GEMINI_API_VERSION = 'v1beta'
export const GEMINI_DEFAULT_MODEL = 'gemini-3.6-flash'
const DEFAULT_TIMEOUT_MS = 30000
const DEFAULT_MAX_OUTPUT_TOKENS = 480
const DEFAULT_TEMPERATURE = 0.3

/** Upstream statuses worth a single bounded retry — transient availability only. */
const RETRYABLE_STATUSES: readonly number[] = [429, 503]
/** Short, bounded backoff before the one retry (public-chatbot friendly). */
const RETRY_DELAY_MS = 300

export interface GeminiConfig {
  apiKey: string
  model: string
  /** Full `:generateContent` URL for the resolved model. */
  endpoint: string
  timeoutMs: number
}

interface GeminiPart {
  text: string
}

interface GeminiContent {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

/** Pure config resolution — exported for direct unit testing. */
export function resolveGeminiConfig(env: ProviderEnv): GeminiConfig {
  const apiKey = env.PORTFOLIO_AI_API_KEY ?? ''
  const model = (env.PORTFOLIO_AI_MODEL ?? GEMINI_DEFAULT_MODEL).trim() || GEMINI_DEFAULT_MODEL
  const rawTimeout = Number(env.PORTFOLIO_AI_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS)
  const timeoutMs =
    Number.isFinite(rawTimeout) && rawTimeout >= 1000 ? rawTimeout : DEFAULT_TIMEOUT_MS
  const encoded = encodeURIComponent(model)
  return {
    apiKey,
    model,
    endpoint: `${GEMINI_API_BASE}/${GEMINI_API_VERSION}/models/${encoded}:generateContent`,
    timeoutMs,
  }
}

/**
 * Gemini only accepts `user`/`model` content roles and places instructions in
 * `systemInstruction`. System messages from `buildMessages` (the grounding
 * rules) become the system instruction; user/assistant turns map directly.
 */
function toGeminiThread(
  messages: readonly ChatMessage[],
): { systemInstruction: GeminiPart[]; contents: GeminiContent[] } {
  const systemInstruction: GeminiPart[] = []
  const contents: GeminiContent[] = []
  for (const message of messages) {
    if (message.role === 'system') {
      systemInstruction.push({ text: message.content })
    } else {
      contents.push({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      })
    }
  }
  return { systemInstruction, contents }
}

function unwrapCompletion(data: unknown): string {
  const record = (typeof data === 'object' && data !== null ? data : {}) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    promptFeedback?: { blockReason?: string }
  }
  if (record.promptFeedback?.blockReason) {
    throw new ProviderUnavailableError(
      'downstream_error',
      'Upstream blocked the request for content safety.',
    )
  }
  const text = record.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
    .trim()
  if (!text) {
    throw new ProviderUnavailableError(
      'downstream_error',
      'Upstream returned an empty completion.',
    )
  }
  return text
}

/**
 * Gemini has been observed to occasionally prefix a completion with a
 * control-token-like artifact ("/Confirm:*"). Strip ONLY that exact token
 * when it appears at the very start of an answer; never touch legitimate
 * slash-prefixed content, Markdown, URLs, or punctuation elsewhere.
 */
const CONTROL_TOKEN_ARTIFACT = /^\/Confirm:\*[ \t]*/

export function normalizeAnswer(text: string): string {
  return text.replace(CONTROL_TOKEN_ARTIFACT, '')
}

/** Factory — registered under `gemini` in the provider registry. */
export function createGeminiProvider(
  env: ProviderEnv,
  deps?: ProviderDeps,
): AnswerProvider {
  const fetchImpl = deps?.fetch ?? globalThis.fetch
  const config = resolveGeminiConfig(env)

  return {
    async generate(messages) {
      if (!config.apiKey) {
        throw new ProviderUnavailableError(
          'not_configured',
          'PORTFOLIO_AI_API_KEY is not set on the server.',
        )
      }

      const { systemInstruction, contents } = toGeminiThread(messages)
      if (contents.length === 0) {
        throw new ProviderUnavailableError('downstream_error', 'No messages to send.')
      }

      const payload = JSON.stringify({
        systemInstruction: { parts: systemInstruction },
        contents,
        generationConfig: {
          temperature: DEFAULT_TEMPERATURE,
          maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
          candidateCount: 1,
        },
      })

      // One upstream attempt with its own timeout, so a retry never extends a
      // single request's timeout budget.
      const requestOnce = async (): Promise<Response> => {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), config.timeoutMs)
        try {
          return await fetchImpl(config.endpoint, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-goog-api-key': config.apiKey,
            },
            body: payload,
            signal: controller.signal,
          })
        } finally {
          clearTimeout(timer)
        }
      }

      try {
        let response = await requestOnce()

        // Bounded retry: exactly one extra attempt, only for transient upstream
        // availability failures (429/503). Permanent failures — 400/401/403,
        // malformed requests, safety blocks, empty completions, configuration
        // errors, and timeouts — are never retried.
        if (!response.ok && RETRYABLE_STATUSES.includes(response.status)) {
          await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
          response = await requestOnce()
        }

        if (!response.ok) {
          // Deliberately drop the body: status-only, so nothing upstream
          // reveals itself (or any echoed key material) to the client.
          throw new ProviderUnavailableError(
            'downstream_error',
            `Upstream provider responded with status ${response.status}.`,
          )
        }

        return normalizeAnswer(unwrapCompletion(await response.json()))
      } catch (error) {
        if (error instanceof ProviderUnavailableError) throw error
        throw new ProviderUnavailableError('downstream_error', 'Upstream request failed.')
      }
    },
  }
}