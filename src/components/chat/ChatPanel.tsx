import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Bot, Send, X } from 'lucide-react'
import { useChat, GREETING } from '../../hooks/useChat'
import { isSendableMessage, MAX_MESSAGE_LENGTH } from '../../lib/chatClient'
import { suggestedQuestions, watchActiveProject, projectLabel } from '../../lib/chatContext'
import type { ActiveProject } from '../../lib/chatContext'
import { cn } from '../../lib/cn'
import { EASE } from '../../lib/motion'
import { Message } from './Message'
import { TypingIndicator } from './TypingIndicator'
import { SuggestedQuestions } from './SuggestedQuestions'

interface ChatPanelProps {
  onClose: () => void
}

/**
 * The chat dialog. Lazy-loaded on first open (see Chatbot.tsx) so the main
 * portfolio bundle stays light. Keyboard: Enter to send, Escape handled by
 * the root, Tab focus kept inside the dialog, visible focus states, and the
 * conversation region announces new messages via an aria-live log.
 */
export function ChatPanel({ onClose }: ChatPanelProps) {
  const { messages, pending, send } = useChat()
  const [activeProject, setActiveProject] = useState<ActiveProject>(null)
  const [draft, setDraft] = useState('')

  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => watchActiveProject(setActiveProject), [])

  useEffect(() => {
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, pending])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isSendableMessage(draft) || pending) return
    void send({ message: draft, activeProject })
    setDraft('')
  }

  const handlePick = (question: string) => {
    if (pending) return
    void send({ message: question, activeProject })
  }

  const handleDraftChange = (value: string) => {
    setDraft(value.slice(0, MAX_MESSAGE_LENGTH))
  }

  /** Keep Tab focus within the small dialog to avoid orphaning keyboard users. */
  const trapFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return
    const root = dialogRef.current
    if (!root) return
    const focusables = Array.from(
      root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    )
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      last.focus()
      event.preventDefault()
    } else if (!event.shiftKey && document.activeElement === last) {
      first.focus()
      event.preventDefault()
    }
  }

  const showSuggestions = messages.length === 1 && !pending
  const contextLabel = projectLabel(activeProject) ?? "HRB's work"
  const placeholder = activeProject
    ? `Ask about ${contextLabel}…`
    : "Ask about HRB's work…"

  return (
    <motion.div
      id="hrb-assistant"
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="assistant-title"
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ duration: 0.32, ease: EASE }}
      onKeyDown={trapFocus}
      className={cn(
        'fixed inset-x-2 bottom-2 z-[45] flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden',
        'rounded-3xl border border-line bg-ink/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl',
        'md:inset-x-auto md:bottom-24 md:right-6 md:h-[min(38rem,calc(100dvh-8rem))] md:w-[min(24rem,calc(100vw-3rem))]',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-lite/25 bg-ink-soft text-lite"
        >
          <Bot size={16} strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p
            id="assistant-title"
            className="truncate font-display text-[15px] font-semibold tracking-[-0.01em] text-paper"
          >
            HRB Assistant
          </p>
          <p className="truncate text-[10px] uppercase tracking-[0.22em] text-dim">
            Portfolio / Digital Systems
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close assistant"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-line text-mist transition-colors duration-200 hover:border-lite/40 hover:text-paper"
        >
          <X size={17} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation with HRB assistant"
        className="chat-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            intro={message.id === GREETING.id}
          />
        ))}
        {pending && <TypingIndicator />}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        aria-label="Send a message to HRB assistant"
        className="border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        {showSuggestions && (
          <div className="mb-3">
            <p className="mb-2.5 flex items-center gap-2.5 text-[10px] uppercase tracking-[0.22em] text-dim">
              <span aria-hidden="true" className="h-px w-5 bg-line" />
              Ask about {contextLabel}
            </p>
            <SuggestedQuestions
              questions={suggestedQuestions(activeProject)}
              onPick={handlePick}
              disabled={pending}
            />
          </div>
        )}

        <div className="mt-2 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            maxLength={MAX_MESSAGE_LENGTH}
            enterKeyHint="send"
            onChange={(event) => handleDraftChange(event.target.value)}
            placeholder={placeholder}
            aria-label="Message to HRB assistant"
            autoComplete="off"
            className="h-11 min-w-0 flex-1 rounded-full border border-line bg-ink-soft px-4 text-base text-paper placeholder:text-dim focus:border-lite/40 focus:outline-none md:text-[14px]"
          />
          <button
            type="submit"
            disabled={!isSendableMessage(draft) || pending}
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper text-ink transition-opacity duration-200 hover:opacity-90 disabled:cursor-default disabled:opacity-35"
          >
            <Send size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </form>
    </motion.div>
  )
}