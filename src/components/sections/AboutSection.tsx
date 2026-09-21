import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { aboutCopy } from '../../data/about'
import { EASE } from '../../lib/motion'
import { artwork } from '../../lib/artwork'
import { AnimatedArtwork } from '../visuals/AnimatedArtwork'
import { AboutPrinciples } from './AboutPrinciples'

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
 * SECTION 06 — ABOUT / APPROACH.
 *
 * Who is behind the work and how the building happens. An editorial two-part
 * composition: a concise personal introduction on the left, the approach
 * principles on the right. Philosophy, not résumé.
 */
export function AboutSection() {
  const { sectionNumber, sectionLabel, heading, statement, introduction, principles } = aboutCopy

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="relative scroll-mt-24 overflow-hidden border-t border-line bg-ink"
    >
      {/* Subtle tonal shift — atmosphere continues, never resets */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            'radial-gradient(58% 46% at 18% 0%, rgb(152 180 205 / 4%) 0%, transparent 62%)',
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
            id="about-heading"
            className="mt-7 font-display text-[clamp(2.5rem,6vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-paper"
          >
            {heading}
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mt-7 max-w-3xl font-display text-[clamp(1.5rem,3vw,2.25rem)] leading-[1.3] tracking-[-0.01em] text-mist"
          >
            {statement}
          </motion.p>
        </motion.div>

        <motion.div
          variants={bodyStagger}
          initial="hidden"
          whileInView="show"
          viewport={REVEAL_VIEWPORT}
          className="mt-20 grid gap-16 md:mt-28 md:grid-cols-12 md:gap-10 lg:gap-16"
        >
          <motion.div variants={fadeUp} className="md:col-start-1 md:col-span-5">
            {introduction.map((paragraph, index) => (
              <p
                key={index}
                className={index === 0 ? 'text-[15px] leading-relaxed text-mist' : 'mt-6 text-[15px] leading-relaxed text-mist'}
              >
                {paragraph}
              </p>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="md:col-start-7 md:col-span-6">
            <AboutPrinciples principles={principles} />
          </motion.div>

          <motion.div variants={fadeUp} className="md:col-span-12">
            <div className="mx-auto aspect-[3/2] w-full max-w-[60rem]">
              <AnimatedArtwork src={artwork.about} personality="about" className="h-full w-full" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}