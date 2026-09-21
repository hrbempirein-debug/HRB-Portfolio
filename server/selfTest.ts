/**
 * Assistant self-test — run with:
 *   npm run test:assistant
 *
 * Exercises knowledge loading, retrieval (including the pronoun/follow-up
 * fallback and current-project context), prompt grounding, request
 * validation, the not-configured provider path, and the Gemini provider
 * against a mocked fetch (no real API calls). Exits non-zero on failure
 * so CI-style runs can rely on it.
 */
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createKnowledgeBase } from './knowledge.ts'
import { buildRetrievalContext, retrieveDocs } from './retrieval.ts'
import { buildMessages } from './prompt.ts'
import { FALLBACK_REPLY } from './prompt.ts'
import { generatePortfolioAnswer, ProviderUnavailableError, resolveProvider } from './provider.ts'
import { GEMINI_DEFAULT_MODEL, normalizeAnswer, resolveGeminiConfig } from './gemini.ts'
import { parseAssistantRequest, readBody } from './handler.ts'
import { askAssistant, AssistantRequestError, CLIENT_FALLBACK_REPLY } from '../src/lib/chatClient.ts'
import { EventEmitter } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)))

let failures = 0
let checks = 0

function check(name: string, ok: boolean, detail?: string): void {
  checks += 1
  if (!ok) failures += 1
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

function checkTopDocs(
  name: string,
  docs: Array<{ doc: { id: string } }>,
  expectedIds: string[],
): void {
  const found = docs.slice(0, 3).map((d) => d.doc.id)
  const expected = docs.slice(0, 3).some((d) => expectedIds.includes(d.doc.id))
  check(name, expected, `top=${found.join(', ')}`)
}

const base = createKnowledgeBase(ROOT)

check('knowledge loads documents', base.docs.length > 0, `${base.docs.length} docs`)
check(
  'knowledge includes all three projects',
  ['hrb-legal-ai', 'hrb-legal-reader', 'hrb-digital-systems'].every((id) =>
    base.docs.some((d) => d.kind === 'project' && d.projectId === id),
  ),
)
check('knowledge includes contact email', base.contactEmail !== null, base.contactEmail ?? 'none')

/* Retrieval — direct queries */
const legalAi = retrieveDocs(base.docs, 'What is HRB Legal AI?')
checkTopDocs('retrieval: HRB Legal AI', legalAi, ['project:hrb-legal-ai'])

const reader = retrieveDocs(base.docs, 'document OCR legal')
checkTopDocs('retrieval: document/OCR', reader, ['project:hrb-legal-reader'])

const web = retrieveDocs(base.docs, 'web development')
checkTopDocs('retrieval: web development', web, ['service:web-development', 'capability:web'])

const contact = retrieveDocs(base.docs, 'how can I contact HRB')
checkTopDocs('retrieval: contact email', contact, ['contact', 'faq:1', 'faq:5'])

const company = retrieveDocs(base.docs, 'what does the company do')
checkTopDocs('retrieval: company', company, ['company'])

/* Homepage grounding — generic company/capability/methodology/contact
   questions must surface canonical docs (not be drowned out by projects) */
const CAPABILITY_STATEMENT =
  'I design digital experiences, intelligent systems, and the infrastructure that connects them.'
const HOMEPAGE_QUERIES: Array<{ q: string; first: string; expects: string[] }> = [
  { q: 'What do you build?', first: 'company', expects: ['company', 'faq:1'] },
  { q: 'What does HRB do?', first: 'company', expects: ['company'] },
  { q: 'What services do you offer?', first: 'company', expects: ['company', 'faq:2'] },
  { q: 'Tell me about your web capabilities.', first: 'capability:web', expects: ['capability:web'] },
  {
    q: 'What AI systems do you build?',
    first: 'company',
    expects: ['company', 'capability:ai', 'service:ai-development'],
  },
  { q: 'What does your systems practice involve?', first: 'capability:systems', expects: ['capability:systems'] },
  { q: 'What projects have you built?', first: 'faq:3', expects: ['faq:3'] },
  { q: 'Tell me about HRB Legal AI.', first: 'project:hrb-legal-ai', expects: ['project:hrb-legal-ai'] },
  { q: 'What is HRB Legal Reader?', first: 'project:hrb-legal-reader', expects: ['project:hrb-legal-reader'] },
  { q: 'What is HRB Digital Systems?', first: 'project:hrb-digital-systems', expects: ['project:hrb-digital-systems'] },
  { q: 'What is your approach?', first: 'methodology', expects: ['methodology'] },
  { q: 'How can I contact HRB?', first: 'faq:5', expects: ['contact', 'faq:5'] },
]
for (const row of HOMEPAGE_QUERIES) {
  const docs = retrieveDocs(base.docs, row.q)
  const ids = docs.slice(0, 6).map((d) => d.doc.id)
  check(`homepage: "${row.q}" ranks ${row.first} first`, ids[0] === row.first, `top=${ids.join(' | ')}`)
  check(
    `homepage: "${row.q}" retrieves ${row.expects.join('/')}`,
    row.expects.every((id) => ids.includes(id)),
    `top=${ids.join(' | ')}`,
  )
}

const buildDocs = retrieveDocs(base.docs, 'What do you build?')
const buildIds = buildDocs.slice(0, 3).map((d) => d.doc.id)
const buildTopIds = buildDocs.slice(0, 6).map((d) => d.doc.id)
check(
  'homepage: "What do you build?" is not answered by projects alone',
  buildIds.some((id) => id.startsWith('capability:') || id === 'company'),
  `top=${buildIds.join(', ')}`,
)
check(
  'homepage: "What do you build?" retrieves a capability doc',
  buildTopIds.some((id) => id.startsWith('capability:')),
  `top=${buildTopIds.join(', ')}`,
)
const buildBlock = buildMessages({ query: 'What do you build?', history: [], docs: buildDocs, currentProject: null })
  .map((m) => m.content)
  .join('\n')
check('homepage: "What do you build?" knowledge reaches prompt', buildBlock.includes(CAPABILITY_STATEMENT))

for (const q of ['Who are your clients?', 'How much revenue has HRB Legal AI generated?']) {
  const docs = retrieveDocs(base.docs, q)
  const text = docs.map((d) => d.doc.text).join('\n')
  check(`grounding: "${q}" surfaces no fabricated figure`, !text.includes('$') && !/clients[:]/i.test(text))
}

/* Retrieval — project-aware context */
const withProject = retrieveDocs(base.docs, 'what is this?', { currentProject: 'hrb-legal-ai' })
checkTopDocs('retrieval: current project context', withProject, ['project:hrb-legal-ai'])

/* Retrieval — conversational follow-up ("the first one") */
const followUp = buildRetrievalContext(
  base.docs,
  'Tell me more about the first one.',
  [
    {
      role: 'assistant',
      content: 'Here are the projects I know about: HRB Legal AI, HRB Legal Reader, and HRB Digital Systems.',
    },
  ],
)
checkTopDocs('retrieval: follow-up pronoun', followUp, ['project:hrb-legal-ai'])

/* Prompt grounding */
const messages = buildMessages({
  query: 'What is HRB Legal AI?',
  history: [{ role: 'user', content: 'Hi' }],
  docs: legalAi,
  currentProject: 'hrb-legal-ai',
})
const systemText = messages[0].content
check('prompt: has system rules', systemText.includes('GROUNDING RULES'))
check('prompt: forbids invention', /never invent projects/i.test(systemText))
check('prompt: has fallback', systemText.includes(FALLBACK_REPLY))
check(
  'prompt: knowledge message present',
  messages.some((m) => m.content.startsWith('PORTFOLIO KNOWLEDGE')),
)
check(
  'prompt: project message includes current project',
  messages.some((m) => m.content.includes('CURRENT PROJECT: the visitor is currently viewing')),
)

/* Validation */
check('validation: accepts valid payload', parseAssistantRequest(JSON.stringify({
  message: 'Hello',
  history: [{ role: 'user', content: 'Hi' }],
  currentProject: 'hrb-legal-ai',
})).ok === true)

const badProject = parseAssistantRequest(JSON.stringify({
  message: 'Hello',
  history: [],
  currentProject: 'not-a-project',
}))
check('validation: rejects unknown project', badProject.ok === false)

const empty = parseAssistantRequest(JSON.stringify({ message: '   ', history: [] }))
check('validation: rejects empty message', empty.ok === false)

const oversized = parseAssistantRequest(JSON.stringify({
  message: 'a'.repeat(1000),
  history: [],
}))
check('validation: rejects oversized message', oversized.ok === false)

const malformed = parseAssistantRequest('{not json')
check('validation: rejects malformed JSON', malformed.ok === false)

/* Request body reading — oversized bodies get a clean 413, not a socket reset */
let oversizedStatus = 0
let oversizedPayload = ''
const oversizedReq = new EventEmitter() as unknown as IncomingMessage
const oversizedRes = {
  writeHead(status: number) {
    oversizedStatus = status
  },
  end(payload: string) {
    oversizedPayload = payload
  },
} as unknown as ServerResponse

const oversizedRead = readBody(oversizedReq, oversizedRes)
oversizedReq.emit('data', Buffer.from(JSON.stringify({ message: 'x'.repeat(20_000), history: [] })))
oversizedReq.emit('end')
await oversizedRead
check('body: oversized request is rejected with 413', oversizedStatus === 413)
check(
  'body: oversized response is clean JSON with no raw content echo',
  oversizedPayload ===
    JSON.stringify({ error: 'payload_too_large', message: 'Request body is too large.' }),
)

const normalReq = new EventEmitter() as unknown as IncomingMessage
const normalRes = { writeHead() {}, end() {} } as unknown as ServerResponse
const normalRead = readBody(normalReq, normalRes)
normalReq.emit('data', Buffer.from(JSON.stringify({ message: 'hi', history: [] })))
normalReq.emit('end')
const normalBody = await normalRead
check(
  'body: under-limit request resolves to the parsed body',
  normalBody === JSON.stringify({ message: 'hi', history: [] }),
)

/* Provider — must not throw a leaky error when unconfigured */
await generatePortfolioAnswer([{ role: 'user', content: 'hi' }], {})
  .then(() => check('provider: missing key throws', false, 'should have thrown'))
  .catch((error) => {
    check(
      'provider: missing key throws ProviderUnavailableError(not_configured)',
      error instanceof ProviderUnavailableError && error.code === 'not_configured',
      error instanceof Error ? error.message : String(error),
    )
  })

/* ------------------------------------------------------------------ */
/*  Gemini provider (mocked fetch — never calls the real API)          */
/* ------------------------------------------------------------------ */

interface CapturedGeminiRequest {
  url: string
  headers: Record<string, string>
  body: Record<string, unknown>
}

function mockedGeminiFetch(
  data: unknown,
  status = 200,
): { fetch: typeof globalThis.fetch; last: () => CapturedGeminiRequest | null } {
  let captured: CapturedGeminiRequest | null = null
  const impl = async (input: string, init?: RequestInit): Promise<Response> => {
    captured = {
      url: input,
      headers: (init?.headers as Record<string, string>) ?? {},
      body: init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {},
    }
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => (status >= 400 ? {} : data),
      headers: new Headers(),
    } as unknown as Response
  }
  return { fetch: impl as unknown as typeof globalThis.fetch, last: () => captured }
}

const geminiOk = mockedGeminiFetch({
  candidates: [{ content: { parts: [{ text: '  Gemini mock answer.  ' }] } }],
})
const geminiProvider = resolveProvider(
  {
    PORTFOLIO_AI_PROVIDER: 'gemini',
    PORTFOLIO_AI_API_KEY: 'test-key-123',
    PORTFOLIO_AI_MODEL: 'gemini-3.6-flash',
  },
  { fetch: geminiOk.fetch },
)

const groundedMessages = buildMessages({
  query: 'What is HRB Legal AI?',
  history: [{ role: 'user', content: 'Hi' }],
  docs: legalAi,
  currentProject: 'hrb-legal-ai',
})
const geminiAnswer = await geminiProvider.generate(groundedMessages)
check('gemini: provider selection returns mock answer', geminiAnswer === 'Gemini mock answer.')

const geminiSent = geminiOk.last()
check(
  'gemini: native generateContent endpoint used',
  geminiSent !== null && geminiSent.url.includes('/v1beta/models/gemini-3.6-flash:generateContent'),
  geminiSent?.url ?? 'no request captured',
)
const geminiBody = geminiSent ? JSON.stringify(geminiSent.body) : ''
check('gemini: grounding rules reach provider', geminiBody.includes('GROUNDING RULES'))
check('gemini: retrieved knowledge reaches provider', geminiBody.includes('PORTFOLIO KNOWLEDGE'))
check(
  'gemini: retrieved project doc text reaches provider',
  geminiBody.includes('Project: HRB Legal AI'),
)
check(
  'gemini: current project context reaches provider',
  geminiBody.includes('CURRENT PROJECT: the visitor is currently viewing'),
)
check('gemini: visitor question reaches provider', geminiBody.includes('What is HRB Legal AI?'))
check(
  'gemini: key only in x-goog-api-key header',
  geminiSent?.headers['x-goog-api-key'] === 'test-key-123' &&
    !(geminiSent?.url.includes('test-key-123') ?? true) &&
    !geminiBody.includes('test-key-123'),
)

/* Missing key → graceful not_configured */
await generatePortfolioAnswer([{ role: 'user', content: 'hi' }], { PORTFOLIO_AI_PROVIDER: 'gemini' })
  .then(() => check('gemini: missing key throws', false, 'should have thrown'))
  .catch((error) => {
    check(
      'gemini: missing key throws ProviderUnavailableError(not_configured)',
      error instanceof ProviderUnavailableError && error.code === 'not_configured',
      error instanceof Error ? error.message : String(error),
    )
  })

/* Malformed configuration → safe defaults */
const malformedConfig = resolveGeminiConfig({
  PORTFOLIO_AI_MODEL: '   ',
  PORTFOLIO_AI_TIMEOUT_MS: 'not-a-number',
})
check(
  'gemini: malformed config resolves to safe defaults',
  malformedConfig.model === GEMINI_DEFAULT_MODEL && malformedConfig.timeoutMs === 30000,
  `model=${malformedConfig.model} timeout=${malformedConfig.timeoutMs}`,
)

/* HTTP error → non-revealing downstream error (body may contain a fake secret) */
const geminiErr = mockedGeminiFetch({ error: { message: 'internal sk-abc123supersecret' } }, 500)
const errProvider = resolveProvider(
  { PORTFOLIO_AI_PROVIDER: 'gemini', PORTFOLIO_AI_API_KEY: 'test-key-123' },
  { fetch: geminiErr.fetch },
)
await errProvider
  .generate([{ role: 'user', content: 'hi' }])
  .then(() => check('gemini: 500 maps to error', false, 'should have thrown'))
  .catch((error) => {
    check(
      'gemini: 500 maps to downstream_error',
      error instanceof ProviderUnavailableError && error.code === 'downstream_error',
    )
    check(
      'gemini: error reveals no upstream body or key',
      error instanceof ProviderUnavailableError &&
        !error.message.includes('sk-abc123supersecret') &&
        !error.message.includes('test-key-123'),
      error instanceof Error ? error.message : String(error),
    )
  })

/* Content-safety block and empty completion → downstream error */
const geminiBlocked = mockedGeminiFetch({ promptFeedback: { blockReason: 'SAFETY' } }, 200)
const blockedProvider = resolveProvider(
  { PORTFOLIO_AI_PROVIDER: 'gemini', PORTFOLIO_AI_API_KEY: 'test-key-123' },
  { fetch: geminiBlocked.fetch },
)
await blockedProvider
  .generate([{ role: 'user', content: 'hi' }])
  .then(() => check('gemini: blocked completion maps to error', false, 'should have thrown'))
  .catch((error) =>
    check(
      'gemini: blocked completion maps to downstream_error',
      error instanceof ProviderUnavailableError && error.code === 'downstream_error',
    ),
  )

const geminiEmpty = mockedGeminiFetch({ candidates: [{ content: { parts: [{ text: '   ' }] } }] })
const emptyProvider = resolveProvider(
  { PORTFOLIO_AI_PROVIDER: 'gemini', PORTFOLIO_AI_API_KEY: 'test-key-123' },
  { fetch: geminiEmpty.fetch },
)
await emptyProvider
  .generate([{ role: 'user', content: 'hi' }])
  .then(() => check('gemini: empty completion maps to error', false, 'should have thrown'))
  .catch((error) =>
    check(
      'gemini: empty completion maps to downstream_error',
      error instanceof ProviderUnavailableError && error.code === 'downstream_error',
    ),
  )

/* ------------------------------------------------------------------ */
/*  Gemini transient-failure retry (mocked — never calls the real API) */
/* ------------------------------------------------------------------ */

interface SequencedResponse {
  status: number
  data?: unknown
}

function sequencedGeminiFetch(responses: SequencedResponse[]): {
  fetch: typeof globalThis.fetch
  calls: () => number
} {
  let index = 0
  const impl = async (): Promise<Response> => {
    const entry = responses[Math.min(index, responses.length - 1)]
    index += 1
    return {
      ok: entry.status >= 200 && entry.status < 300,
      status: entry.status,
      json: async () => (entry.status >= 400 ? {} : (entry.data ?? {})),
      headers: new Headers(),
    } as unknown as Response
  }
  return { fetch: impl as unknown as typeof globalThis.fetch, calls: () => index }
}

const geminiEnv = { PORTFOLIO_AI_PROVIDER: 'gemini', PORTFOLIO_AI_API_KEY: 'test-key-123' }
const geminiSuccess = { candidates: [{ content: { parts: [{ text: 'Recovered answer.' }] } }] }

/* 503 → retry → success */
const retry503 = sequencedGeminiFetch([{ status: 503 }, { status: 200, data: geminiSuccess }])
const retry503Answer = await resolveProvider(geminiEnv, { fetch: retry503.fetch }).generate([
  { role: 'user', content: 'hi' },
])
check('gemini: 503 retries once and returns the recovered answer', retry503Answer === 'Recovered answer.')
check('gemini: 503 retry makes exactly two attempts', retry503.calls() === 2)

/* 429 → retry → success */
const retry429 = sequencedGeminiFetch([{ status: 429 }, { status: 200, data: geminiSuccess }])
const retry429Answer = await resolveProvider(geminiEnv, { fetch: retry429.fetch }).generate([
  { role: 'user', content: 'hi' },
])
check('gemini: 429 retries once and returns the recovered answer', retry429Answer === 'Recovered answer.')
check('gemini: 429 retry makes exactly two attempts', retry429.calls() === 2)

/* 503 → retry → 503 → graceful fallback (no further retries) */
const retry503x2 = sequencedGeminiFetch([
  { status: 503 },
  { status: 503 },
  { status: 200, data: geminiSuccess },
])
await resolveProvider(geminiEnv, { fetch: retry503x2.fetch })
  .generate([{ role: 'user', content: 'hi' }])
  .then(() => check('gemini: repeated 503 must throw', false, 'should have thrown'))
  .catch((error) =>
    check(
      'gemini: repeated 503 maps to downstream_error after one retry',
      error instanceof ProviderUnavailableError && error.code === 'downstream_error',
    ),
  )
check('gemini: repeated 503 stops after one retry (two attempts)', retry503x2.calls() === 2)

/* 401 / 403 → no retry */
for (const status of [401, 403]) {
  const noRetry = sequencedGeminiFetch([{ status }, { status: 200, data: geminiSuccess }])
  await resolveProvider(geminiEnv, { fetch: noRetry.fetch })
    .generate([{ role: 'user', content: 'hi' }])
    .then(() => check(`gemini: ${status} must throw`, false, 'should have thrown'))
    .catch((error) =>
      check(
        `gemini: ${status} maps to downstream_error without retry`,
        error instanceof ProviderUnavailableError && error.code === 'downstream_error',
      ),
    )
  check(`gemini: ${status} is not retried (single attempt)`, noRetry.calls() === 1)
}

/* safety/block → no retry */
const blockedNoRetry = sequencedGeminiFetch([
  { status: 200, data: { promptFeedback: { blockReason: 'SAFETY' } } },
  { status: 200, data: geminiSuccess },
])
await resolveProvider(geminiEnv, { fetch: blockedNoRetry.fetch })
  .generate([{ role: 'user', content: 'hi' }])
  .then(() => check('gemini: safety block must throw', false, 'should have thrown'))
  .catch((error) =>
    check(
      'gemini: safety block maps to downstream_error without retry',
      error instanceof ProviderUnavailableError && error.code === 'downstream_error',
    ),
  )
check('gemini: safety block is not retried (single attempt)', blockedNoRetry.calls() === 1)

/* ------------------------------------------------------------------ */
/*  Output-artifact normalization (control-token prefix)               */
/* ------------------------------------------------------------------ */

check(
  'normalize: strips the /Confirm:* artifact prefix',
  normalizeAnswer('/Confirm:* Yes, HRB builds AI workflows.') === 'Yes, HRB builds AI workflows.',
)
check('normalize: strips the artifact with no following space', normalizeAnswer('/Confirm:*Yes') === 'Yes')
check('normalize: strips a lone artifact to empty', normalizeAnswer('/Confirm:*') === '')
check(
  'normalize: leaves legitimate slash-prefixed text intact',
  normalizeAnswer('/work is the selected work section') === '/work is the selected work section',
)
check(
  'normalize: leaves a similar-but-different token intact',
  normalizeAnswer('/Confirm: please verify') === '/Confirm: please verify',
)
check(
  'normalize: leaves the token when not at the start',
  normalizeAnswer('See https://example.com/Confirm:* for details') ===
    'See https://example.com/Confirm:* for details',
)
check(
  'normalize: leaves markdown intact',
  normalizeAnswer('**Bold** and /Confirm:* inline') === '**Bold** and /Confirm:* inline',
)

/* Provider end-to-end: artifact stripped from a real-shaped response */
const artifactFetch = mockedGeminiFetch({
  candidates: [{ content: { parts: [{ text: '/Confirm:* Yes, HRB designs custom AI workflows.' }] } }],
})
const artifactAnswer = await resolveProvider(geminiEnv, { fetch: artifactFetch.fetch }).generate([
  { role: 'user', content: 'hi' },
])
check(
  'gemini: control-token artifact is removed from the answer',
  artifactAnswer === 'Yes, HRB designs custom AI workflows.',
)
check('gemini: artifact removal keeps the answer non-empty', artifactAnswer.length > 0)

/* Provider end-to-end: legitimate slash-prefixed answer preserved */
const slashFetch = mockedGeminiFetch({
  candidates: [{ content: { parts: [{ text: '/work is the Selected Work section.' }] } }],
})
const slashAnswer = await resolveProvider(geminiEnv, { fetch: slashFetch.fetch }).generate([
  { role: 'user', content: 'hi' },
])
check(
  'gemini: legitimate slash-prefixed answer is preserved',
  slashAnswer === '/work is the Selected Work section.',
)

/* ------------------------------------------------------------------ */
/*  Client askAssistant (stubbed global fetch — never hits the network) */
/* ------------------------------------------------------------------ */

const CLIENT_DRAFT = { message: 'hello', history: [], currentProject: null }

async function withFetchStub(impl: typeof fetch, run: () => Promise<void>): Promise<void> {
  const original = globalThis.fetch
  globalThis.fetch = impl
  try {
    await run()
  } finally {
    globalThis.fetch = original
  }
}

const fetchWith = (body: string, status: number): typeof fetch =>
  (async () => new Response(body, { status })) as unknown as typeof fetch

const fetch200 = (body: string): typeof fetch => fetchWith(body, 200)

await withFetchStub(fetch200(JSON.stringify({ answer: 'Hello there.', sources: ['company'] })), async () => {
  const result = await askAssistant(CLIENT_DRAFT)
  check('client: 200 returns the answer', result.answer === 'Hello there.')
  check('client: 200 carries sources', Array.isArray(result.sources) && result.sources[0] === 'company')
  check('client: 200 is not flagged unavailable', result.unavailable === false)
})

await withFetchStub(fetch200(JSON.stringify({ answer: 'Offline note', unavailable: true })), async () => {
  const result = await askAssistant(CLIENT_DRAFT)
  check('client: 200 unavailable flag is preserved', result.unavailable === true)
})

await withFetchStub(
  fetchWith(JSON.stringify({ error: 'rate_limited', message: 'Too many requests. Please try again shortly.' }), 429),
  async () => {
    await askAssistant(CLIENT_DRAFT)
      .then(() => check('client: 429 must throw', false))
      .catch((error) => {
        const e = error as AssistantRequestError
        check('client: 429 maps to rate_limited', e instanceof AssistantRequestError && e.kind === 'rate_limited')
        check(
          'client: 429 uses calm fallback (no raw JSON)',
          e instanceof AssistantRequestError && e.message === CLIENT_FALLBACK_REPLY,
        )
        check(
          'client: 429 hides status code and server text',
          e instanceof AssistantRequestError &&
            !e.message.includes('429') &&
            !e.message.includes('Too many'),
        )
      })
  },
)

await withFetchStub(
  fetchWith(JSON.stringify({ error: 'server_error', message: 'Something went wrong.' }), 500),
  async () => {
    await askAssistant(CLIENT_DRAFT)
      .then(() => check('client: 500 must throw', false))
      .catch((error) => {
        const e = error as AssistantRequestError
        check('client: 500 maps to server error', e instanceof AssistantRequestError && e.kind === 'server')
        check(
          'client: 500 uses calm fallback (no raw JSON)',
          e instanceof AssistantRequestError && e.message === CLIENT_FALLBACK_REPLY,
        )
      })
  },
)

await withFetchStub(
  (async () => new Response('not-json-at-all', { status: 200 })) as unknown as typeof fetch,
  async () => {
    await askAssistant(CLIENT_DRAFT)
      .then(() => check('client: malformed body must throw', false))
      .catch((error) => {
        const e = error as AssistantRequestError
        check(
          'client: malformed body maps to server error',
          e instanceof AssistantRequestError && e.kind === 'server',
        )
        check(
          'client: malformed body uses calm fallback',
          e instanceof AssistantRequestError && e.message === CLIENT_FALLBACK_REPLY,
        )
      })
  },
)

await withFetchStub(fetch200(JSON.stringify({ nope: true })), async () => {
  await askAssistant(CLIENT_DRAFT)
    .then(() => check('client: 200 with missing answer must throw', false))
    .catch((error) => {
      const e = error as AssistantRequestError
      check(
        'client: 200 with missing answer maps to server error',
        e instanceof AssistantRequestError && e.kind === 'server',
      )
    })
})

await withFetchStub(
  (async () => {
    throw new TypeError('fetch failed')
  }) as unknown as typeof fetch,
  async () => {
    await askAssistant(CLIENT_DRAFT)
      .then(() => check('client: network failure must throw', false))
      .catch((error) => {
        const e = error as AssistantRequestError
        check(
          'client: network failure maps to network error',
          e instanceof AssistantRequestError && e.kind === 'network',
        )
        check(
          'client: network failure uses calm fallback',
          e instanceof AssistantRequestError && e.message === CLIENT_FALLBACK_REPLY,
        )
      })
  },
)

console.log(`\n${checks - failures}/${checks} checks passed.`)
if (failures > 0) process.exit(1)