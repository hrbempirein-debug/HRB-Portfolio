/**
 * Shared server-side types for the portfolio assistant.
 *
 * These types are duplicated (in a small, stable form) by the client in
 * `src/lib/chatClient.ts`. The server bundle stays independent of the
 * browser bundle on purpose — no shared runtime import between the two.
 */

export type ChatRole = 'system' | 'user' | 'assistant'

/** A single resolved conversation turn sent from the client. */
export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

/** A message handed to the AI provider. */
export interface ChatMessage {
  role: ChatRole
  content: string
}

/** Validated payload accepted by POST /api/assistant. */
export interface AssistantRequest {
  message: string
  history: ChatTurn[]
  /** One of the known project slugs, or null when none is in view. */
  currentProject: string | null
}

export const KNOWN_PROJECT_IDS = [
  'hrb-legal-ai',
  'hrb-legal-reader',
  'hrb-digital-systems',
] as const

export type KnownProjectId = (typeof KNOWN_PROJECT_IDS)[number]

export function isKnownProjectId(value: string): value is KnownProjectId {
  return (KNOWN_PROJECT_IDS as readonly string[]).includes(value)
}