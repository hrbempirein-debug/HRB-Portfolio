import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { commitmentCopy } from '../../data/commitments'
import { testimonialsCopy } from '../../data/testimonials'
import { EASE } from '../../lib/motion'

const headerStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
}

const bodyStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
}

const REVEAL_VIEWPORT = { once: true, margin: '0px 0px -15% 0px' } as const

/**
 * SECTION 05 — CLIENTS & PARTNERS / WHAT USEFUL TECHNOLOGY SHOULD ENABLE.
 *
 * Shows how HRB measures the work — a truthful three-part positioning
 * statement grounded in the published methodology. Testimonials shown below
 * are clearly labeled illustrative examples, never genuine client feedback.
 */
export function CommitmentSection() {
  const { sectionNumber, sectionLabel, heading, statement, itemsLabel, items } = commitmentCopy

  return (
    <section
      id="commitments"
      aria-labelledby="commitments-heading"
      className="relative scroll-mt-24 overflow-hidden border-t border-line bg-ink"
    >
      {/* Quiet tonal shift — the page is heading toward its close */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            'radial-gradient(52% 42% at 72% 0%, rgb(152 180 205 / 4%) 0%, transparent 62%)',
            'linear-gradient(to bottom, var(--color-ink-soft) 0%, var(--color-ink) 30%, var(--color-ink) 100%)',
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
            id="commitments-heading"
            className="mt-7 max-w-[19ch] font-display text-[clamp(2.125rem,5vw,3.75rem)] font-semibold leading-[1.06] tracking-[-0.02em] text-paper"
          >
            {heading}
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mt-7 max-w-3xl font-display text-[clamp(1.3rem,2.55vw,1.85rem)] leading-[1.32] tracking-[-0.01em] text-mist"
          >
            {statement}
          </motion.p>
        </motion.div>

        <div className="mt-16 md:mt-28">
          <motion.h3
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={REVEAL_VIEWPORT}
            className="flex items-center gap-4 text-[11px] uppercase tracking-[0.35em] text-dim"
          >
            <span aria-hidden="true" className="h-px w-8 bg-line" />
            {itemsLabel}
          </motion.h3>

          <motion.div
            variants={bodyStagger}
            initial="hidden"
            whileInView="show"
            viewport={REVEAL_VIEWPORT}
            className="mt-12 gap-y-14 md:mt-16 md:grid md:grid-cols-3 md:gap-x-10 lg:gap-x-12"
          >
            {items.map((item) => (
              <motion.article
                key={item.number}
                variants={fadeUp}
                className="border-t border-line pt-8 md:pt-10"
              >
                <span
                  aria-hidden="true"
                  className="block font-display text-[clamp(1rem,1.6vw,1.25rem)] font-semibold leading-none tracking-[-0.02em] text-dim tabular-nums"
                >
                  {item.number}
                </span>
                <h4 className="mt-5 font-display text-lg font-semibold tracking-[-0.01em] text-paper md:text-xl">
                  {item.title}
                </h4>
                <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-mist">
                  {item.description}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </div>

        {/* Client voices — clearly labeled illustrative sample quotes */}
        <div className="mt-16 md:mt-28">
          <motion.h3
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={REVEAL_VIEWPORT}
            className="flex items-center gap-4 text-[11px] uppercase tracking-[0.35em] text-dim"
          >
            <span aria-hidden="true" className="h-px w-8 bg-line" />
            {testimonialsCopy.label}
          </motion.h3>

          <p className="mt-4 max-w-md text-xs tracking-[0.08em] text-dim">
            {testimonialsCopy.note}
          </p>

          <motion.div
            variants={bodyStagger}
            initial="hidden"
            whileInView="show"
            viewport={REVEAL_VIEWPORT}
            className="mt-12 grid gap-x-12 gap-y-12 md:grid-cols-2 md:gap-y-14"
          >
            {testimonialsCopy.items.map((item) => (
              <motion.figure
                key={item.id}
                variants={fadeUp}
                className="border-t border-line pt-8 md:pt-10"
              >
                <blockquote
                  aria-label={`Illustrative quote from ${item.name}`}
                  className="font-display text-[clamp(1.15rem,2vw,1.55rem)] leading-[1.4] tracking-[-0.01em] text-mist"
                >
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6">
                  <span className="block font-display text-sm font-semibold tracking-[-0.01em] text-paper">
                    {item.name}
                  </span>
                  <span className="mt-1 block text-[11px] uppercase tracking-[0.22em] text-dim">
                    {item.role}
                  </span>
                </figcaption>
              </motion.figure>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}