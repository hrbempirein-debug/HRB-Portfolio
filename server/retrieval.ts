/**
 * Lightweight retrieval over the portfolio knowledge base.
 *
 * Current implementation is token-weighted keyword + phrase matching. It is
 * intentionally isolated behind `retrieveDocs` / `buildRetrievalContext` so
 * the UI and prompt pipeline never see the scoring internals. When the
 * portfolio later adopts embeddings / vector search, only this module needs
 * to change — the request shape and prompt interface stay identical.
 */
import type { KnowledgeDoc } from './knowledge.ts'
import type { ChatTurn } from './types.ts'

export interface RetrievedDoc {
  doc: KnowledgeDoc
  score: number
}

export interface RetrieveOptions {
  /** Project slug to prefer as context (e.g. `hrb-legal-ai`). */
  currentProject?: string | null
  /** Maximum number of docs returned. */
  limit?: number
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'for', 'of', 'to', 'in', 'on', 'at', 'with', 'that', 'this',
  'what', 'who', 'which', 'where', 'when', 'how', 'why', 'do', 'does', 'did', 'is', 'are', 'was',
  'be', 'it', 'its', 'than', 'by', 'from', 'as', 'about', 'you', 'your', 'me', 'can', 'could',
  'will', 'would', 'should', 'please', 'tell', 'more', 'some', 'any', 'i', 'we',
])

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]+/g, ' ')
    .replace(/[\s-]+/g, ' ')
    .trim()
}

function words(value: string): string[] {
  return normalize(value).split(' ').filter(Boolean)
}

function meaningfulWords(value: string): string[] {
  return words(value).filter((token) => !STOP_WORDS.has(token))
}

/** N-grams (1–3) of a normalized query, largest first. */
function shingles(tokens: string[]): string[] {
  const result: string[] = []
  const n = tokens.length
  for (let size = 3; size >= 1; size -= 1) {
    for (let i = 0; i <= n - size; i += 1) {
      result.push(tokens.slice(i, i + size).join(' '))
    }
  }
  return result
}

/**
 * Contiguous multi-word phrases of the raw query, stop words included.
 * Lets canonical aliases like "what does hrb do" match directly instead of
 * being fragmented by stop-word removal (which would leave only "hrb").
 */
function rawPhrases(tokens: string[]): string[] {
  const result: string[] = []
  const n = tokens.length
  for (let size = 4; size >= 2; size -= 1) {
    for (let i = 0; i <= n - size; i += 1) {
      result.push(tokens.slice(i, i + size).join(' '))
    }
  }
  return result
}

interface DocIndex {
  doc: KnowledgeDoc
  keywordSet: Set<string>
  topicSet: Set<string>
  phraseText: string
}

function indexDoc(doc: KnowledgeDoc): DocIndex {
  const keywordTokens = new Set<string>()
  for (const keyword of doc.keywords) {
    for (const token of meaningfulWords(keyword)) keywordTokens.add(token)
    keywordTokens.add(normalize(keyword))
  }
  const topicSet = new Set(meaningfulWords(doc.topic))
  const phraseText = normalize([doc.topic, ...doc.keywords, doc.text].join(' '))
  return { doc, keywordSet: keywordTokens, topicSet, phraseText }
}

interface Index {
  entries: DocIndex[]
}

export function createRetrievalIndex(docs: readonly KnowledgeDoc[]): Index {
  return { entries: docs.map(indexDoc) }
}

function scoreOne(entry: DocIndex, queryShingles: string[], queryPhrases: string[]): number {
  let score = 0
  for (const shingle of queryShingles) {
    const size = shingle.split(' ').length
    if (size === 1) {
      if (entry.keywordSet.has(shingle)) score += 3
      else if (entry.topicSet.has(shingle)) score += 2
      else if (entry.doc.text.includes(shingle)) score += 1.5
      else if (entry.phraseText.includes(shingle)) score += 0.75
    } else if (entry.phraseText.includes(shingle)) {
      score += size === 2 ? 3 : 4
    }
  }
  for (const phrase of queryPhrases) {
    if (entry.keywordSet.has(phrase)) score += 5
    else if (entry.phraseText.includes(phrase)) score += 3
  }
  return score
}

/**
 * Rank knowledge docs against a query. Returns docs scored above a small
 * floor, best first, clamped to `limit`.
 */
export function retrieveDocs(
  docs: readonly KnowledgeDoc[],
  query: string,
  options: RetrieveOptions = {},
): RetrievedDoc[] {
  const index = createRetrievalIndex(docs)
  const tokens = meaningfulWords(query)
  const queryShingles = shingles(tokens)
  const queryPhrases = rawPhrases(words(query))
  const limit = options.limit ?? 6

  const scored = index.entries.map((entry) => {
    let score = scoreOne(entry, queryShingles, queryPhrases)
    if (entry.doc.priority && score > 0) score += entry.doc.priority
    if (options.currentProject && entry.doc.projectId === options.currentProject) {
      score += 5
    }
    return { doc: entry.doc, score }
  })

  const kept = scored
    .filter((r) => r.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  // The project currently in view is always useful context — include it.
  if (options.currentProject) {
    const active = docs.find((d) => d.projectId === options.currentProject)
    if (active && !kept.some((r) => r.doc.id === active.id)) {
      kept.push({ doc: active, score: 4 })
    }
  }

  return kept.slice(0, Math.max(limit, limit + 1))
}

/** Minimal score that counts as a direct, confident match. */
const MIN_DIRECT_SCORE = 4

function lastAssistantText(history: ChatTurn[]): string {
  const last = [...history].reverse().find((turn) => turn.role === 'assistant')
  return last ? last.content.slice(0, 800) : ''
}

/**
 * Resolve the context documents for a visitor request.
 *
 * If the query alone is too weak to ground an answer (pronouns, "tell me
 * more about it", follow-ups), the latest assistant reply is folded in to
 * recover the thread. The active project is always preferred as context.
 */
export function buildRetrievalContext(
  docs: readonly KnowledgeDoc[],
  query: string,
  history: ChatTurn[],
  options: RetrieveOptions = {},
): RetrievedDoc[] {
  const direct = retrieveDocs(docs, query, { ...options, limit: 6 })
  if (direct.length > 0 && direct[0].score >= MIN_DIRECT_SCORE) return direct

  const combined = `${query} ${lastAssistantText(history)}`
  const recovered = retrieveDocs(docs, combined, { ...options, limit: 6 })

  const seen = new Set<string>()
  const merged: RetrievedDoc[] = []
  for (const entry of [...recovered, ...direct]) {
    if (!seen.has(entry.doc.id)) {
      seen.add(entry.doc.id)
      merged.push(entry)
    }
  }
  return merged.slice(0, 6)
}