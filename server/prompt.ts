/**
 * Prompt construction — turns retrieved knowledge + conversation into the
 * message thread sent to the AI provider.
 *
 * Grounding is enforced here: the knowledge is the only factual material the
 * model receives, and the system prompt forbids anything beyond it.
 */
import type { RetrievedDoc } from './retrieval.ts'
import type { ChatMessage, ChatTurn } from './types.ts'

export interface PromptInput {
  query: string
  history: ChatTurn[]
  docs: RetrievedDoc[]
  currentProject: string | null
}

export const FALLBACK_REPLY =
  "I don't have that information in my portfolio knowledge base. I can answer questions about our projects, services, capabilities, and work."

const MAX_HISTORY_TURNS = 12
const MAX_TURN_LENGTH = 1000
const MAX_DOCS = 6

function buildSystemPrompt(): string {
  return [
    'You are the HRB portfolio assistant, embedded in the HRB digital systems portfolio website.',
    'You answer questions from visitors about HRB, its projects, services, capabilities, technologies, methodology, and how to engage with HRB.',
    '',
    'GROUNDING RULES — follow every rule strictly:',
    '1. Answer using the PORTFOLIO KNOWLEDGE provided in this conversation and nothing else.',
    '2. Never invent projects, features, technologies, clients, results, statistics, capabilities, roles, prices, or timelines.',
    '3. Never claim a capability unless it appears in the provided portfolio knowledge.',
    '4. If needed information is missing from the knowledge, say so explicitly — it is not available in the public portfolio.',
    '5. Never present assumptions as facts.',
    '6. Never pretend to have access to internal company information beyond the provided knowledge.',
    '7. When a question is unrelated to the portfolio (general or generic topics), do not answer it as though it were portfolio fact.',
    '   Prefer exactly this fallback when nothing in the knowledge applies:',
    `   "${FALLBACK_REPLY}"`,
    '8. Be concise, warm, and professional. Use short paragraphs and a few bullet points when helpful.',
    '9. Commercial intent (e.g. "I need something like this", "I want you to build this", "How can I hire you?", "I have a project"):',
    '   naturally transition to consultation — confirm a custom solution can be discussed, help outline requirements,',
    '   and point to the contact email shown in the knowledge as the existing contact pathway.',
    '   Do not invent contact details that are not in the knowledge. Do not quote prices or guarantees.',
    '10. If CURRENT PROJECT context is supplied, keep it in mind while answering.',
    '',
    'Keep answers grounded, helpful, and aligned with the portfolio tone: clear, calm, and precise.',
  ].join('\n')
}

function buildKnowledgeMessage(docs: RetrievedDoc[], currentProject: string | null): string {
  const sections = docs.slice(0, MAX_DOCS).map((doc, index) => {
    return `[${index + 1}] ${doc.doc.topic}\n${doc.doc.text}`
  })

  let projectLine = ''
  if (currentProject) {
    projectLine = [
      '',
      `CURRENT PROJECT: the visitor is currently viewing the "${currentProject}" project on the site. Use this as context when it is relevant.`,
    ].join('\n')
  }

  return [
    'PORTFOLIO KNOWLEDGE',
    'The only factual material you may use is below. If the visitor asks about something not covered here, follow grounding rule 4/7.',
    ...sections,
    projectLine,
  ]
    .filter(Boolean)
    .join('\n\n')
}

function trimTurn(content: string): string {
  // eslint-disable-next-line no-control-regex -- intentional: strip control chars from history
  const cleaned = content.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]+/g, ' ')
  return cleaned.length > MAX_TURN_LENGTH ? cleaned.slice(0, MAX_TURN_LENGTH) : cleaned
}

export function buildMessages(input: PromptInput): ChatMessage[] {
  const system: ChatMessage = { role: 'system', content: buildSystemPrompt() }
  const knowledge: ChatMessage = {
    role: 'user',
    content: buildKnowledgeMessage(input.docs, input.currentProject),
  }

  const history: ChatMessage[] = input.history
    .slice(-MAX_HISTORY_TURNS)
    .map((turn) => ({
      role: turn.role,
      content: trimTurn(turn.content),
    }))
    .filter((turn) => turn.content.trim().length > 0)

  const query: ChatMessage = {
    role: 'user',
    content: trimTurn(input.query),
  }

  return [system, knowledge, ...history, query]
}