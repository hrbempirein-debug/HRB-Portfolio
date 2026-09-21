import type { MouseEvent } from 'react'
import { navigation } from '../../data/navigation'
import { useReducedMotion } from '../../hooks/useReducedMotion'

function BrandMark() {
  return (
    <a href="#hero" className="inline-flex items-center gap-3">
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

/**
 * PAGE END — quiet editorial colophon.
 *
 * Deliberately smaller than everything above it: identity, a compact page
 * map, back-to-top, and a copyright line. No animation — the page comes to
 * rest here.
 */
export function Footer() {
  const reduced = useReducedMotion()
  const year = new Date().getFullYear()

  const scrollTop = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <footer className="relative border-t border-line bg-ink">
      <div className="container-hero pt-12 md:pt-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between md:gap-12">
          <div>
            <BrandMark />
            <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-dim">
              Portfolio / Digital Systems
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-col gap-1 md:flex-row md:items-center md:gap-10"
          >
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center py-3 text-sm uppercase tracking-[0.2em] text-mist transition-colors duration-300 hover:text-paper md:py-0"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <button
            type="button"
            aria-label="Back to top"
            onClick={scrollTop}
            className="footer-top inline-flex items-baseline gap-2 self-start text-sm uppercase tracking-[0.2em] text-mist transition-colors duration-300 hover:text-paper md:self-end"
          >
            <span aria-hidden="true" className="footer-top-arrow inline-block">
              ↑
            </span>
            <span>Top</span>
          </button>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-line pb-10 pt-6 md:mt-14 md:flex-row md:items-center md:justify-between md:gap-6 md:pb-12 md:pt-7">
          <p className="text-[12px] tracking-[0.12em] text-dim">© {year} HRB</p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-dim">
            Design / Software / Intelligent Systems
          </p>
        </div>
      </div>
    </footer>
  )
}