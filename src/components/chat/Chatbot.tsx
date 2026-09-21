import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence } from 'framer-motion'
import { ChatLauncher } from './ChatLauncher'

/**
 * Lazy-mounted so the portfolio main bundle stays fast: the launcher (below)
 * is tiny and renders immediately, while the full chat panel — messages,
 * typing, API client — is only fetched the first time the visitor opens it.
 */
const ChatPanel = lazy(() =>
  import('./ChatPanel').then((module) => ({ default: module.ChatPanel })),
)

export function Chatbot() {
  const [open, setOpen] = useState(false)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const wasOpenRef = useRef(false)

  const close = useCallback(() => setOpen(false), [])

  // True modal semantics: while the dialog is open the rest of the page is
  // inert (no focus or pointer competition), and the dialog is portaled to
  // <body> so it is not nested inside the inert root. On close, inert is
  // removed before focus returns to the launcher.
  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return
    if (open) {
      wasOpenRef.current = true
      root.setAttribute('inert', '')
      return undefined
    }
    if (wasOpenRef.current) {
      root.removeAttribute('inert')
      launcherRef.current?.focus()
      wasOpenRef.current = false
      return undefined
    }
    return undefined
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  return (
    <>
      <ChatLauncher ref={launcherRef} open={open} onClick={() => setOpen((value) => !value)} />
      <AnimatePresence>
        {open && (
          <Suspense fallback={null}>
            {createPortal(<ChatPanel onClose={close} />, document.body)}
          </Suspense>
        )}
      </AnimatePresence>
    </>
  )
}