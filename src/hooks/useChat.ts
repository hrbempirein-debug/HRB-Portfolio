import { useCallback, useRef, useState } from 'react'
import { askAssistant, clientResponseFallback, isSendableMessage } from '../lib/chatClient'
import { projectSlug } from '../lib/chatContext'
import type { ActiveProject } from '../lib/chatContext'

export interface UiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  /** Retrieval doc ids echoed by the server (unused in UI today). */
  sources?: string[]
  /** True when the server could not reach its AI provider. */
  unavailable?: boolean
  /** True when the request itself failed (client-side fallback shown). */
  failed?: boolean
}

export interface ChatDraft {
  message: string
  /** Page context at send time (the project the visitor is viewing). */
  activeProject: ActiveProject
}

export const GREETING: UiMessage = {
  id: 'greeting',
  role: 'assistant',
  content:
    "Hi, I'm HRB's portfolio assistant. Ask me about our projects, services, capabilities, and how we build.",
}

let counter = 0
function nextId(prefix: string): string {
  counter += 1
  return `${prefix}-${counter}-${Date.now().toString(36)}`
}

function asHistory(messages: readonly UiMessage[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  // Exclude the greeting so sessions don't re-send the intro as context.
  return messages
    .filter((message) => message.id !== GREETING.id)
    .map((message) => ({ role: message.role, content: message.content }))
}

export function useChat() {
  const [messages, setMessages] = useState<UiMessage[]>([GREETING])
  const [pending, setPending] = useState(false)
  const pendingRef = useRef(false)

  const send = useCallback(
    async (draft: ChatDraft) => {
      const message = draft.message.trim()
      if (!isSendableMessage(message)) return
      if (pendingRef.current) return

      const history = asHistory(messages)
      pendingRef.current = true
      setPending(true)

      setMessages((previous) => [
        ...previous,
        { id: nextId('user'), role: 'user', content: message },
      ])

      const request = {
        message,
        history,
        currentProject: projectSlug(draft.activeProject),
      }

      try {
        const response = await askAssistant(request)
        setMessages((previous) => [
          ...previous,
          {
            id: nextId('assistant'),
            role: 'assistant',
            content: response.answer,
            sources: response.sources,
            unavailable: response.unavailable === true,
          },
        ])
      } catch {
        setMessages((previous) => [
          ...previous,
          {
            id: nextId('assistant'),
            role: 'assistant',
            content: clientResponseFallback(),
            failed: true,
          },
        ])
      } finally {
        pendingRef.current = false
        setPending(false)
      }
    },
    [messages],
  )

  return { messages, pending, send }
}