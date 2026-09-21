import { Bot } from 'lucide-react'

/**
 * Typing indicator shown while a request is in flight. Purely decorative
 * dots; the loading state itself is conveyed to screen readers via the
 * message list's aria-live region / visible label.
 */
export function TypingIndicator() {
  return (
    <div className="flex w-full items-start justify-start">
      <span
        aria-hidden="true"
        className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line text-lite"
      >
        <Bot size={13} strokeWidth={1.75} />
      </span>
      <div
        role="status"
        aria-label="HRB assistant is typing"
        className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-line bg-ink-soft px-4 py-3"
      >
        <span aria-hidden="true" className="chat-typing-dot" />
        <span aria-hidden="true" className="chat-typing-dot" />
        <span aria-hidden="true" className="chat-typing-dot" />
        <span className="sr-only">HRB assistant is typing</span>
      </div>
    </div>
  )
}