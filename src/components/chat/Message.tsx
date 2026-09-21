import { Bot } from 'lucide-react'
import { formatAssistantContent } from '../../lib/formatContent'
import { cn } from '../../lib/cn'
import type { UiMessage } from '../../hooks/useChat'

interface MessageProps {
  message: UiMessage
  /** Editorial presentation for the opening greeting message. */
  intro?: boolean
}

function AssistantAvatar() {
  return (
    <span
      aria-hidden="true"
      className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line text-lite"
    >
      <Bot size={13} strokeWidth={1.75} />
    </span>
  )
}

/**
 * A single conversation turn. Assistant answers are structured with a safe
 * plain-text formatter (paragraphs, bullets, **bold**) — never raw HTML.
 * Content is otherwise escaped by React, so there is no injection surface.
 */
export function Message({ message, intro = false }: MessageProps) {
  const isUser = message.role === 'user'
  const isFallback = message.unavailable === true || message.failed === true

  if (intro && !isUser) {
    return (
      <div className="flex w-full items-start justify-start">
        <AssistantAvatar />
        <div className="min-w-0 max-w-[88%] pt-1">
          <p className="font-display text-[15px] leading-[1.55] tracking-[-0.01em] text-paper">
            {message.content}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex w-full items-start', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && <AssistantAvatar />}
      <div
        className={cn(
          'min-w-0 max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed',
          isUser
            ? 'rounded-br-md bg-paper text-ink'
            : 'rounded-bl-md border border-line bg-ink-soft text-paper',
        )}
      >
        {isUser ? message.content : formatAssistantContent(message.content)}
        {isFallback && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-dim/85">
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-dim/60" />
            <span>Temporary</span>
          </div>
        )}
      </div>
    </div>
  )
}