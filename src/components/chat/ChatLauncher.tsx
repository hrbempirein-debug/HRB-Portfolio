import { forwardRef } from 'react'
import { Sparkles, X } from 'lucide-react'
import { cn } from '../../lib/cn'

interface ChatLauncherProps {
  open: boolean
  onClick: () => void
}

/**
 * Floating launcher button. Stays in the main bundle (tiny, no runtime deps)
 * so it appears instantly; the chat panel itself is lazy-loaded on first open.
 * The ambient glow is a CSS-only opacity/transform animation that is disabled
 * entirely under prefers-reduced-motion — and quieted while the panel is open
 * so the conversation surface stays calm.
 */
export const ChatLauncher = forwardRef<HTMLButtonElement, ChatLauncherProps>(
  function ChatLauncher({ open, onClick }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-expanded={open}
        aria-controls="hrb-assistant"
        aria-haspopup="dialog"
        aria-label={open ? 'Close HRB assistant' : 'Open HRB assistant'}
        className={cn(
          'chat-launcher fixed z-[45] isolate grid h-14 w-14 place-items-center rounded-full',
          'bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))]',
          'border border-lite/20 bg-ink-soft/85 text-lite',
          'shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur-md',
          'transition-[transform,color,border-color,background-color] duration-300',
          'hover:-translate-y-0.5 hover:border-lite/45 hover:text-paper',
          'active:translate-y-0 active:scale-[0.96]',
          'md:bottom-6 md:right-6',
        )}
      >
        <span
          aria-hidden="true"
          className={cn('chat-launcher-glow', open && 'chat-launcher-glow--open')}
        />
        <span aria-hidden="true" className="relative grid h-5 w-5 place-items-center">
          <Sparkles
            size={20}
            strokeWidth={1.5}
            className={cn(
              'absolute inset-0 transition-all duration-300 ease-out',
              open && 'rotate-[-90deg] scale-50 opacity-0',
            )}
          />
          <X
            size={20}
            strokeWidth={1.75}
            className={cn(
              'absolute inset-0 transition-all duration-300 ease-out',
              !open && 'rotate-90 scale-50 opacity-0',
            )}
          />
        </span>
      </button>
    )
  },
)