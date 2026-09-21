/**
 * AI provider abstraction (server-side only).
 *
 * `generatePortfolioAnswer()` is the single entry point the handler uses.
 * The concrete provider is chosen from environment configuration, so the
 * provider (and its API key) is replaceable without touching the UI.
 *
 * Environment variables (server-side only — never `VITE_*`):
 *   PORTFOLIO_AI_PROVIDER    provider name, "openai-compatible" (default) or "gemini"
 *   PORTFOLIO_AI_API_KEY     API key (required for a live provider)
 *   PORTFOLIO_AI_BASE_URL    OpenAI-compatible base URL (openai-compatible only)
 *   PORTFOLIO_AI_MODEL       model name (provider-format)
 *   PORTFOLIO_AI_TIMEOUT_MS  upstream request timeout, default 30000
 */
import { createGeminiProvider } from './gemini.ts'
import type { ChatMessage } from './types.ts'

export class ProviderUnavailableError extends Error {
  readonly code: 'not_configured' | 'downstream_error'

  constructor(code: 'not_configured' | 'downstream_error', message: string) {
    super(message)
    this.name = 'ProviderUnavailableError'
    this.code = code
  }
}

export interface AnswerProvider {
  /** Return the plain-text reply for the given message thread. */
  generate(messages: readonly ChatMessage[]): Promise<string>
}

export interface ProviderEnv {
  PORTFOLIO_AI_PROVIDER?: string
  PORTFOLIO_AI_API_KEY?: string
  PORTFOLIO_AI_BASE_URL?: string
  PORTFOLIO_AI_MODEL?: string
  PORTFOLIO_AI_TIMEOUT_MS?: string
  OPENAI_API_KEY?: string
}

/** Injection seam used by self-tests — never required at runtime. */
export interface ProviderDeps {
  fetch?: typeof globalThis.fetch
}

interface ProviderFactory {
  (env: ProviderEnv, deps?: ProviderDeps): AnswerProvider
}

function createOpenAICompatibleProvider(env: ProviderEnv): AnswerProvider {
  const apiKey = env.PORTFOLIO_AI_API_KEY ?? env.OPENAI_API_KEY ?? ''
  const baseUrl = (env.PORTFOLIO_AI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/+$/, '')
  const model = env.PORTFOLIO_AI_MODEL ?? 'gpt-4o-mini'
  const timeoutMs = Math.max(1000, Number(env.PORTFOLIO_AI_TIMEOUT_MS ?? 30000))

  return {
    async generate(messages) {
      if (!apiKey) {
        throw new ProviderUnavailableError(
          'not_configured',
          'PORTFOLIO_AI_API_KEY is not set on the server.',
        )
      }

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.3,
            max_tokens: 480,
            stream: false,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new ProviderUnavailableError(
            'downstream_error',
            `Upstream provider responded with status ${response.status}.`,
          )
        }

        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>
        }
        const content = data.choices?.[0]?.message?.content?.trim()
        if (!content) {
          throw new ProviderUnavailableError('downstream_error', 'Upstream returned an empty completion.')
        }
        return content
      } catch (error) {
        if (error instanceof ProviderUnavailableError) throw error
        throw new ProviderUnavailableError(
          'downstream_error',
          error instanceof Error ? error.message : 'Unknown provider error.',
        )
      } finally {
        clearTimeout(timer)
      }
    },
  }
}

/** Registry of provider factories — add a new provider here to extend. */
const PROVIDERS: Record<string, ProviderFactory> = {
  'openai-compatible': createOpenAICompatibleProvider,
  gemini: createGeminiProvider,
}

/**
 * Resolve the configured provider. Missing configuration does not throw —
 * the returned provider throws `ProviderUnavailableError('not_configured')`
 * when invoked, which the handler turns into a graceful reply. Unknown
 * provider names fall back to the OpenAI-compatible provider.
 */
export function resolveProvider(env: ProviderEnv, deps?: ProviderDeps): AnswerProvider {
  const name = (env.PORTFOLIO_AI_PROVIDER ?? 'openai-compatible').toLowerCase()
  const factory = PROVIDERS[name] ?? createOpenAICompatibleProvider
  return factory(env, deps)
}

/**
 * Server-side abstraction used by the assistant route.
 * The UI never contacts a provider directly and never holds a key.
 */
export async function generatePortfolioAnswer(
  messages: readonly ChatMessage[],
  env: ProviderEnv = process.env as ProviderEnv,
  deps?: ProviderDeps,
): Promise<string> {
  const provider = resolveProvider(env, deps)
  return provider.generate(messages)
}