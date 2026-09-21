/**
 * Client-side API wrapper for the portfolio assistant.
 *
 * The client only knows about the endpoint shape (plain text in, plain text
 * out). Retrieval, prompting, and the AI provider all live on the server.
 */

export interface ChatTurnDto {
  role: 'user' | 'assistant'
  content: string
}

export interface AssistantRequest {
  message: string
  history: ChatTurnDto[]
  currentProject: string | null
}

export interface AssistantResponse {
  answer: string
  sources?: string[]
  unavailable?: boolean
}

/** Must stay aligned with the server's MAX_MESSAGE_LENGTH. */
export const MAX_MESSAGE_LENGTH = 600

/** History sent to the server (kept short — the server caps it too). */
const MAX_HISTORY_TURNS = 12

export class AssistantRequestError extends Error {
  /**
   * Classification of why a request failed. Used by the UI to choose calm,
   * non-revealing copy — the message never exposes provider details, status
   * codes, or raw server payloads.
   */
  readonly kind: 'network' | 'server' | 'validation' | 'rate_limited'

  constructor(kind: AssistantRequestError['kind'], message: string) {
    super(message)
    this.name = 'AssistantRequestError'
    this.kind = kind
  }
}

/** True when the draft is safe to send (non-empty, within length limits). */
export function isSendableMessage(text: string): boolean {
  return text.trim().length > 0 && text.trim().length <= MAX_MESSAGE_LENGTH
}

/** Calm, non-revealing fallback for any client-side request failure. */
export const CLIENT_FALLBACK_REPLY =
  'The assistant is temporarily unavailable. You can still explore the portfolio or contact HRB directly.'

export function clientResponseFallback(): string {
  return CLIENT_FALLBACK_REPLY
}

export async function askAssistant(request: AssistantRequest): Promise<AssistantResponse> {
  let response: Response
  try {
    response = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: request.message,
        history: request.history.slice(-MAX_HISTORY_TURNS),
        currentProject: request.currentProject,
      }),
    })
  } catch {
    throw new AssistantRequestError('network', clientResponseFallback())
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new AssistantRequestError('server', clientResponseFallback())
  }

  // Detect rate limiting specifically. The client never surfaces the server's
  // JSON payload or status code — it replies with the same calm fallback as
  // any other failure.
  if (response.status === 429) {
    throw new AssistantRequestError('rate_limited', clientResponseFallback())
  }

  if (!response.ok) {
    throw new AssistantRequestError('server', clientResponseFallback())
  }

  const record = (typeof body === 'object' && body !== null ? body : {}) as AssistantResponse
  if (typeof record.answer !== 'string') {
    throw new AssistantRequestError('server', clientResponseFallback())
  }

  return {
    answer: record.answer,
    sources: Array.isArray(record.sources) ? record.sources : [],
    unavailable: record.unavailable === true,
  }
}