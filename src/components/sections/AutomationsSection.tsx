import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { automationsCopy } from '../../data/automations'
import { EASE } from '../../lib/motion'
import { cn } from '../../lib/cn'
import { AutomationField } from '../visuals/AutomationField'
import { CountUpText } from '../visuals/CountUpText'

const headerStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
}

const reveal: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
}

const REVEAL_VIEWPORT = { once: true, margin: '0px 0px -15% 0px' } as const

/**
 * SECTION — 0 → 100 AUTOMATION.
 *
 * A visual framework, not a results claim. The journey field carries the story
 * from a raw workflow to a scalable system; the stage index below lets a
 * visitor illuminate any point along it. "0 → 100" is never a delivered count.
 */
export function AutomationsSection() {
  const { headingMain, headingSub, supporting, sequence, caption, counter, stages } = automationsCopy
  const [active, setActive] = useState<number | null>(null)

  const canHover = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches,
    [],
  )

  const activeStage = active === null ? null : stages[active]

  return (
    <section
      id="automations"
      aria-labelledby="automations-heading"
      className="relative scroll-mt-24 overflow-hidden border-t border-line bg-ink"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            'radial-gradient(60% 48% at 68% 0%, rgb(152 180 205 / 4%) 0%, transparent 60%)',
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
          <motion.h2
            variants={fadeUp}
            id="automations-heading"
            className="font-display font-semibold tracking-[-0.03em] text-paper"
          >
            <span className="block text-[clamp(3.25rem,9vw,8rem)] leading-[0.9]">
              {headingMain}{' '}
              <CountUpText from={counter.from} to={counter.to} duration={counter.duration} />
            </span>
            <span className="mt-3 block text-[clamp(1.05rem,2.3vw,1.85rem)] uppercase tracking-[0.42em] text-lite/80">
              {headingSub}
            </span>
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mt-8 max-w-xl text-[clamp(1.05rem,1.8vw,1.3rem)] leading-relaxed text-mist"
          >
            {supporting}
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="mt-4 text-[11px] uppercase tracking-[0.3em] text-dim"
          >
            {sequence}
          </motion.p>
        </motion.div>

        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={REVEAL_VIEWPORT}
          className="mt-12 md:mt-16"
        >
          <AutomationField activeIndex={active} stageCount={stages.length} />
        </motion.div>

        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={REVEAL_VIEWPORT}
          className="mt-10 md:mt-12"
        >
          <div
            role="group"
            aria-label="Automation stages"
            className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 lg:grid-cols-8 lg:gap-x-4"
          >
            {stages.map((stage, index) => {
              const isActive = active === index
              const dimmed = active !== null && !isActive
              return (
                <button
                  key={stage.id}
                  type="button"
                  aria-pressed={isActive}
                  onMouseEnter={canHover ? () => setActive(index) : undefined}
                  onMouseLeave={canHover ? () => setActive(null) : undefined}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  onClick={() => setActive(index)}
                  className={cn(
                    'group relative block border-t border-line pt-4 text-left transition-opacity duration-500',
                    dimmed ? 'opacity-40' : 'opacity-100',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute -top-px left-0 h-px w-full origin-left bg-lite transition-transform duration-500 ease-out',
                      isActive ? 'scale-x-100' : 'scale-x-0',
                    )}
                  />
                  <span
                    className={cn(
                      'block font-display text-sm font-semibold tabular-nums tracking-[0.08em] transition-colors duration-300',
                      isActive ? 'text-lite' : 'text-dim',
                    )}
                  >
                    {stage.index}
                  </span>
                  <span
                    className={cn(
                      'mt-1 block text-[11px] uppercase tracking-[0.18em] transition-colors duration-300',
                      isActive ? 'text-paper' : 'text-mist',
                    )}
                  >
                    {stage.title}
                  </span>
                </button>
              )
            })}
          </div>

          <p className="mt-6 min-h-[1.25rem] text-sm text-mist" aria-live="polite">
            {activeStage ? activeStage.note : ''}
          </p>

          <p className="mt-8 text-xs tracking-[0.08em] text-dim">{caption}</p>
        </motion.div>
      </div>
    </section>
  )
}
