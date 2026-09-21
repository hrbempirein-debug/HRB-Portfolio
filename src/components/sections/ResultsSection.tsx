import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { resultsCopy } from '../../data/results'
import { EASE } from '../../lib/motion'

const headerStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
}

const gridStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
}

const outcomeEntry: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
}

const REVEAL_VIEWPORT = { once: true, margin: '0px 0px -15% 0px' } as const

/**
 * SECTION 04 — RESULTS THAT MATTER.
 *
 * An outcome-focused editorial continuation of the case-study language. No
 * fabricated statistics — large numbers, thin rules, and restrained type all
 * speak to a measured approach without claiming measured results.
 */
export function ResultsSection() {
  const { sectionNumber, sectionLabel, heading, supportingHeading, supportingStatement, items } = resultsCopy
  const [hovered, setHovered] = useState<number | null>(null)

  const canHover = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches,
    [],
  )

  const onEnd = canHover ? () => setHovered(null) : undefined

  return (
    <section
      id="results"
      aria-labelledby="results-heading"
      className="relative scroll-mt-24 overflow-hidden border-t border-line bg-ink"
    >
      {/* Quiet tonal shift — atmosphere continues, never resets */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            'radial-gradient(62% 50% at 30% 0%, rgb(152 180 205 / 4%) 0%, transparent 60%)',
            'linear-gradient(to bottom, var(--color-ink-soft) 0%, var(--color-ink) 32%, var(--color-ink) 100%)',
          ].join(', '),
        }}
      />

      <div className="container-hero relative pb-28 pt-16 md:pb-40 md:pt-24">
        <motion.div
          variants={headerStagger}
          initial="hidden"
          whileInView="show"
          viewport={REVEAL_VIEWPORT}
        >
          <motion.p
            variants={fadeUp}
            className="flex items-center gap-4 text-[11px] uppercase tracking-[0.35em] text-dim"
          >
            <span className="tabular-nums">{sectionNumber}</span>
            <span aria-hidden="true" className="h-px w-8 bg-line" />
            <span>{sectionLabel}</span>
          </motion.p>

          <motion.h2
            variants={fadeUp}
            id="results-heading"
            className="mt-7 font-display text-[clamp(2.5rem,6vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-paper"
          >
            {heading}
          </motion.h2>

          <motion.h3
            variants={fadeUp}
            className="mt-7 font-display text-[clamp(1.3rem,2.55vw,1.85rem)] leading-[1.32] tracking-[-0.01em] text-mist"
          >
            {supportingHeading}
          </motion.h3>

          <motion.p
            variants={fadeUp}
            className="mt-4 max-w-3xl text-[15px] leading-relaxed text-mist"
          >
            {supportingStatement}
          </motion.p>
        </motion.div>

        {/* Hairline connector — echoes the capability language, purely static */}
        <div aria-hidden="true" className="mt-16 hidden md:block">
          <svg
            viewBox="0 0 1200 20"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="block h-px w-full"
          >
            <line className="env-line-faint" x1="0" y1="10" x2="1200" y2="10" />
            <circle className="env-node" cx="0" cy="10" r="2" />
            <circle className="env-node" cx="400" cy="10" r="2" />
            <circle className="env-node" cx="800" cy="10" r="2" />
            <circle className="env-node" cx="1200" cy="10" r="2" />
          </svg>
        </div>

        <motion.div
          variants={gridStagger}
          initial="hidden"
          whileInView="show"
          viewport={REVEAL_VIEWPORT}
          className="mt-12 grid gap-y-14 md:mt-16 md:grid-cols-2 md:gap-x-12 md:gap-y-16"
        >
          {items.map((item, index) => (
            <motion.article
              key={item.number}
              variants={outcomeEntry}
              onHoverStart={canHover ? () => setHovered(index) : undefined}
              onHoverEnd={onEnd}
              className="border-t border-line pt-8"
            >
              <motion.div
                animate={{ opacity: canHover && hovered !== null && hovered !== index ? 0.55 : 1 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <span
                  aria-hidden="true"
                  className="block font-display text-[clamp(2.25rem,3.2vw,3rem)] font-semibold leading-none tracking-[-0.02em] text-dim tabular-nums"
                >
                  {item.number}
                </span>
                <h4 className="mt-4 font-display text-xl font-semibold tracking-[-0.01em] text-paper md:text-2xl">
                  {item.title}
                </h4>
                <div aria-hidden="true" className="mt-5 h-px w-10 bg-line" />
                <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-mist">
                  {item.description}
                </p>
              </motion.div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}