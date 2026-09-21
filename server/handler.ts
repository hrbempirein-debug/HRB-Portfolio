/**
 * Assistant HTTP handler, shared by the Vite dev server plugin and the
 * production Node server.
 *
 * All secrets stay server-side: the client only ever POSTs plain text and
 * receives a plain-text answer back. Failures are mapped to graceful,
 * non-revealing replies — no keys, stack traces, or upstream details leak.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createKnowledgeBase } from './knowledge.ts'
import type { KnowledgeBase } from './knowledge.ts'
import { buildRetrievalContext } from './retrieval.ts'
import { buildMessages } from './prompt.ts'
import { generatePortfolioAnswer } from './provider.ts'
import type { AnswerProvider } from './provider.ts'
import { ProviderUnavailableError } from './provider.ts'
import { createRateLimiter } from './rateLimit.ts'
import type { ChatTurn } from './types.ts'
import { isKnownProjectId } from './types.ts'

export const ASSISTANT_PATH = '/api/assistant'

export const MAX_MESSAGE_LENGTH = 600
export const MAX_HISTORY_TURNS = 12
export const MAX_BODY_BYTES = 16 * 1024

export interface AssistantResponse {
  answer: string
  sources: string[]
  unavailable?: boolean
}

export interface HandlerOptions {
  /** Project root — the folder that contains `knowledge/`. */
  rootDir: string
  /** Optional override (used by tests / future routing). */
  provider?: AnswerProvider
}

type RequestListener = (req: IncomingMessage, res: ServerResponse, next?: () => void) => void

/* ------------------------------------------------------------------ */
/*  Request parsing + validation (pure, unit-tested via self-test)      */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line no-control-regex -- intentional: strip control chars from user input
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]+/g

function sanitize(value: string): string {
  return value.replace(CONTROL_RE, ' ').trim()
}

export type ParseResult =
  | { ok: true; value: { message: string; history: ChatTurn[]; currentProject: string | null } }
  | { ok: false; reason: string }

function readHistory(raw: unknown): ChatTurn[] | null {
  if (!Array.isArray(raw)) return null
  const result: ChatTurn[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) return null
    const record = item as Record<string, unknown>
    const role = record.role
    const content = typeof record.content === 'string' ? sanitize(record.content) : null
    if (role !== 'user' && role !== 'assistant') return null
    if (content === null || content.length === 0) return null
    if (content.length > 800) return null
    result.push({ role, content })
    if (result.length >= MAX_HISTORY_TURNS) break
  }
  return result
}

export function parseAssistantRequest(raw: string): ParseResult {
  let body: unknown
  try {
    body = JSON.parse(raw) as unknown
  } catch {
    return { ok: false, reason: 'Request body is not valid JSON.' }
  }

  if (typeof body !== 'object' || body === null) {
    return { ok: false, reason: 'Request must be a JSON object.' }
  }

  const record = body as Record<string, unknown>
  if (typeof record.message !== 'string') {
    return { ok: false, reason: '`message` must be a string.' }
  }

  const message = sanitize(record.message)
  if (message.length === 0) {
    return { ok: false, reason: '`message` must not be empty.' }
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, reason: `message must be at most ${MAX_MESSAGE_LENGTH} characters.` }
  }

  const history = readHistory(record.history) ?? []
  let currentProject: string | null = null
  if (record.currentProject != null) {
    if (typeof record.currentProject !== 'string') {
      return { ok: false, reason: '`currentProject` must be a string or null.' }
    }
    if (record.currentProject.trim() !== '' && !isKnownProjectId(record.currentProject)) {
      return { ok: false, reason: '`currentProject` is not a known project.' }
    }
    currentProject = record.currentProject.trim() === '' ? null : record.currentProject
  }

  return { ok: true, value: { message, history, currentProject } }
}

/* ------------------------------------------------------------------ */
/*  Graceful fallback text                                             */
/* ------------------------------------------------------------------ */

function unavailableReply(base: KnowledgeBase): string {
  const email = base.contactEmail
  const contact = email
    ? ` You can continue browsing, or reach out at ${email} for anything you need.`
    : ''
  return (
    "I'm having trouble reaching my answering service right now, so I can't generate a full reply." +
    contact
  )
}

/* ------------------------------------------------------------------ */
/*  Handler factory                                                    */
/* ------------------------------------------------------------------ */

export function createAssistantHandler(options: HandlerOptions): RequestListener {
  const knowledge = createKnowledgeBase(options.rootDir)
  const provider: AnswerProvider = options.provider ?? {
    generate: generatePortfolioAnswer,
  }
  const limiter = createRateLimiter({ windowMs: 60_000, max: 12 })

  const handle = async (
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> => {
    // Deployment assumption: this server sits behind a trusted reverse proxy /
    // platform (e.g. a CDN or PaaS) that strips or overwrites X-Forwarded-For,
    // so the first entry can be trusted as the client address. If the Node
    // server is ever exposed directly on a public interface, the limiter must
    // be hardened first: validate/single-hop the proxy header and bound the
    // per-IP key map (LRU + TTL) against spoofed or rotating addresses.
    const clientIp =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown'

    if (!limiter.allow(clientIp)) {
      sendJson(res, 429, { error: 'rate_limited', message: 'Too many requests. Please try again shortly.' })
      return
    }

    const raw = await readBody(req, res)
    if (raw === null) return

    const parsed = parseAssistantRequest(raw)
    if (!parsed.ok) {
      sendJson(res, 400, { error: 'invalid_request', message: parsed.reason })
      return
    }

    const { message, history, currentProject } = parsed.value

    let docs: import('./retrieval.ts').RetrievedDoc[] = []
    try {
      docs = buildRetrievalContext(knowledge.docs, message, history, { currentProject })
    } catch {
      docs = []
    }

    const response: AssistantResponse = { answer: '', sources: docs.map((d) => d.doc.id) }

    try {
      const messages = buildMessages({ query: message, history, docs, currentProject })
      response.answer = await provider.generate(messages)
    } catch (error) {
      if (error instanceof ProviderUnavailableError) {
        console.error(`[assistant] provider unavailable (${error.code}).`)
      } else {
        console.error('[assistant] unexpected provider error.', error)
      }
      response.answer = unavailableReply(knowledge)
      response.unavailable = true
      response.sources = []
    }

    sendJson(res, 200, response)
  }

  return (req, res, next) => {
    const pathname = (req.url ?? '/').split('?')[0]
    if (req.method === 'POST' && pathname === ASSISTANT_PATH) {
      void handle(req, res).catch(() => {
        try {
          sendJson(res, 500, { error: 'server_error', message: 'Something went wrong. Please try again.' })
        } catch {
          /* response already sent */
        }
      })
      return
    }

    if (next) {
      next()
      return
    }

    try {
      sendJson(res, 404, { error: 'not_found', message: 'Not found.' })
    } catch {
      /* ignore */
    }
  }
}

/**
 * Read the request body, bounding memory to MAX_BODY_BYTES. Oversized bodies
 * are rejected with a clean 413 JSON response (the socket is never destroyed
 * mid-request, so the client always receives the response), while the
 * remaining bytes are drained without being buffered.
 */
export function readBody(req: IncomingMessage, res: ServerResponse): Promise<string | null> {
  return new Promise((resolve) => {
    let size = 0
    let chunks: Buffer[] = []
    let oversized = false

    const reply = (status: number, payload: Record<string, string>): void => {
      try {
        sendJson(res, status, payload)
      } catch {
        /* response already sent */
      }
      resolve(null)
    }

    req.on('data', (chunk: Buffer) => {
      if (oversized) return
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        oversized = true
        chunks = []
        reply(413, { error: 'payload_too_large', message: 'Request body is too large.' })
        return
      }
      chunks.push(chunk)
    })

    req.on('end', () => {
      if (oversized) return
      resolve(Buffer.concat(chunks).toString('utf8'))
    })

    req.on('error', () => reply(400, { error: 'invalid_request', message: 'Could not read the request body.' }))
  })
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  })
  res.end(body)
}