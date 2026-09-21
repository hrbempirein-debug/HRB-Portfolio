import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { capabilitiesCopy } from '../../data/capabilities'
import type { CapabilityId } from '../../data/capabilities'
import { EASE } from '../../lib/motion'
import { CapabilityItem } from './CapabilityItem'

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

const capabilityEntry: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
}

const REVEAL_VIEWPORT = { once: true, margin: '0px 0px -15% 0px' } as const

/**
 * SECTION 02 — WHAT I BUILD.
 *
 * An editorial capabilities section that continues the hero's WEB → AI →
 * SYSTEMS philosophy without restating it. The three capabilities read as
 * progressive layers, connected by a thin traveled line rather than as cards.
 */
export function CapabilitiesSection() {
  const { sectionNumber, sectionLabel, heading, statement, capabilities } = capabilitiesCopy
  const [hovered, setHovered] = useState<CapabilityId | null>(null)

  const canHover = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches,
    [],
  )

  const onEnd = canHover ? () => setHovered(null) : undefined

  return (
    <section
      id="capabilities"
      aria-labelledby="capabilities-heading"
      className="relative overflow-hidden border-t border-line bg-ink"
    >
      {/* Slightly elevated tone at the top, atmosphere echoing the hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            'radial-gradient(70% 55% at 22% 0%, rgb(152 180 205 / 5%) 0%, transparent 60%)',
            'linear-gradient(to bottom, var(--color-ink-soft) 0%, var(--color-ink) 34%, var(--color-ink) 100%)',
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
            id="capabilities-heading"
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

        <div className="relative mt-20 md:mt-28">
          {/* Connector — WEB ends where AI begins, AI ends where SYSTEMS begins */}
          <div aria-hidden="true" className="absolute inset-x-0 top-0 hidden md:block">
            <svg viewBox="0 0 1200 20" preserveAspectRatio="none" className="block h-px w-full">
              <line className="env-line-faint" x1="0" y1="10" x2="1200" y2="10" />
              <line className="env-line-faint env-march" x1="0" y1="10" x2="1200" y2="10" />
              <circle
                className="env-travel cap-accent-node"
                cx="0"
                cy="10"
                r="2.5"
                style={{ offsetPath: 'path("M 0 10 L 1200 10")' }}
              />
              <circle className="env-node" cx="200" cy="10" r="2" />
              <circle className="env-node" cx="600" cy="10" r="2" />
              <circle className="env-node" cx="1000" cy="10" r="2" />
            </svg>
          </div>

          <motion.div
            variants={gridStagger}
            initial="hidden"
            whileInView="show"
            viewport={REVEAL_VIEWPORT}
            className="grid gap-16 pt-12 md:grid-cols-3 md:gap-0"
          >
            {capabilities.map((item, index) => (
              <CapabilityItem
                key={item.id}
                item={item}
                index={index}
                active={canHover && hovered === item.id}
                dimmed={canHover && hovered !== null && hovered !== item.id}
                entry={capabilityEntry}
                onHoverStart={canHover ? () => setHovered(item.id) : undefined}
                onHoverEnd={onEnd}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}