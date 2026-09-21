import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { EASE } from '../../lib/motion'
import { navigation } from '../../data/navigation'

function BrandMark() {
  return (
    <a href="#hero" className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-5 w-5 items-center justify-center text-lite"
      >
        <svg viewBox="0 0 20 20" className="h-full w-full" fill="none">
          <rect x="2.5" y="2.5" width="15" height="15" stroke="currentColor" strokeWidth="1" opacity="0.85" />
          <rect x="6.5" y="6.5" width="7" height="7" fill="currentColor" opacity="0.65" />
        </svg>
      </span>
      <span className="font-display text-sm font-semibold uppercase tracking-[0.25em] text-paper">
        HRB
      </span>
    </a>
  )
}

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled || open ? 'border-b border-line bg-ink/70 backdrop-blur-md' : 'bg-transparent',
      )}
    >
      <nav aria-label="Primary" className="container-hero flex h-16 items-center justify-between">
        <BrandMark />

        <div className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-mist transition-colors duration-200 hover:text-paper"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a
            href="#contact"
            className="hidden rounded-full border border-line px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-mist transition-colors duration-300 hover:border-paper/35 hover:text-paper md:inline-flex"
          >
            Get in touch
          </a>
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-paper transition-colors hover:border-paper/35 md:hidden"
          >
            {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden border-t border-line bg-ink/95 backdrop-blur-md md:hidden"
          >
            <div className="container-hero flex flex-col gap-1 py-4">
              {navigation.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="py-3 text-base text-paper transition-colors hover:text-mist"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}