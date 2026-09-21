import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { projectsCopy } from '../../data/projects'
import { EASE } from '../../lib/motion'
import { ProjectShowcase } from './ProjectShowcase'

const headerStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
}

const projectReveal: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
}

const REVEAL_VIEWPORT = { once: true, margin: '0px 0px -15% 0px' } as const

/**
 * SECTION 03 — SELECTED WORK.
 *
 * Editorial project showcase. Three large alternating spreads rather than a
 * card grid — each a case-study composition with an abstract product visual.
 * Anchored to the existing #work navigation link.
 */
export function SelectedWorkSection() {
  const { sectionNumber, sectionLabel, heading, statement, ctaLabel, projects } = projectsCopy

  return (
    <section
      id="work"
      aria-labelledby="work-heading"
      className="relative scroll-mt-24 overflow-hidden border-t border-line bg-ink"
    >
      {/* Quiet tonal shift — a slightly warmer echo of the section above */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            'radial-gradient(64% 48% at 78% 0%, rgb(120 139 163 / 4%) 0%, transparent 58%)',
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
            id="work-heading"
            className="mt-7 font-display text-[clamp(2.5rem,6vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-paper"
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

        <div className="mt-20 flex flex-col gap-y-24 md:mt-28 md:gap-y-32">
          {projects.map((project, index) => (
            <ProjectShowcase key={project.id} project={project} index={index} reveal={projectReveal} ctaLabel={ctaLabel} />
          ))}
        </div>
      </div>
    </section>
  )
}