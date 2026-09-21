import { motion, useTransform } from 'framer-motion'
import type { MotionValue, Variants } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { EASE } from '../../lib/motion'
import { environmentWeights } from '../../lib/environment'
import type { EnvId } from '../../lib/environment'
import { heroCopy } from '../../data/hero'

const reveal: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
}

const rise: Variants = {
  hidden: { y: '118%' },
  show: { y: '0%', transition: { duration: 1.1, ease: EASE } },
}

const fade: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: EASE },
  },
}

const ENV_INDEX: Record<EnvId, string> = { web: '01', ai: '02', systems: '03' }

function StateItem({ env, smoothNx }: { env: EnvId; smoothNx: MotionValue<number> }) {
  const weight = useTransform(smoothNx, (v) => environmentWeights(v)[env])
  const labelOpacity = useTransform(weight, (w) => 0.4 + 0.6 * w)
  const sliderScale = useTransform(weight, (w) => 0.15 + 0.85 * w)
  const indexOpacity = useTransform(weight, (w) => 0.25 + 0.75 * w)

  return (
    <div className="flex flex-col items-start gap-2.5">
      <div className="flex w-full items-baseline justify-between gap-3">
        <motion.span
          style={{ opacity: labelOpacity }}
          className="text-[10px] font-medium uppercase tracking-[0.3em] text-paper"
        >
          {heroCopy.environmentLabels[env]}
        </motion.span>
        <motion.span
          style={{ opacity: indexOpacity }}
          className="text-[10px] tabular-nums tracking-[0.18em] text-dim"
        >
          {ENV_INDEX[env]}
        </motion.span>
      </div>
      <span className="relative h-[3px] w-full overflow-hidden rounded-full bg-line">
        <motion.span
          style={{ scaleX: sliderScale }}
          className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-lite"
        />
      </span>
    </div>
  )
}

function StateIndicator({ smoothNx }: { smoothNx: MotionValue<number> }) {
  return (
    <div
      className="grid w-full max-w-sm grid-cols-3 gap-6"
      aria-hidden="true"
    >
      {heroCopy.environment.map((env) => (
        <StateItem key={env} env={env} smoothNx={smoothNx} />
      ))}
    </div>
  )
}

interface HeroContentProps {
  smoothNx: MotionValue<number>
  interactive: boolean
}

export function HeroContent({ smoothNx, interactive }: HeroContentProps) {
  const {
    environmentLabels,
    heading,
    statement,
    primaryCta,
    secondaryCta,
    desktopHint,
    touchHint,
  } = heroCopy
  const environmentLine = Object.values(environmentLabels).join(' · ')

  return (
    <div className="container-hero pointer-events-none absolute inset-0 z-10 flex flex-col">
      <div className="min-h-24 flex-1 basis-28" />

      <motion.div
        variants={reveal}
        initial="hidden"
        animate="show"
        className="pointer-events-auto max-w-3xl"
      >
        <motion.div variants={fade} className="mb-6 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-px w-8 bg-paper/40"
          />
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-mist">
            {environmentLine}
          </p>
        </motion.div>

        <h1
          id="hero-heading"
          className="font-display text-[clamp(2.75rem,7.5vw,6.5rem)] font-semibold leading-[0.97] tracking-[-0.03em] text-paper"
        >
          <span className="block overflow-hidden">
            <motion.span variants={rise} className="block will-change-transform">
              {heading[0]}
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span variants={rise} className="block will-change-transform">
              {heading[1].replace('.', '')}
              <span className="text-lite">.</span>
            </motion.span>
          </span>
        </h1>

        <motion.p
          variants={fade}
          className="mt-7 max-w-md text-base leading-relaxed text-mist md:text-lg"
        >
          {statement}
        </motion.p>

        <motion.div variants={fade} className="mt-9 flex flex-wrap items-center gap-4">
          <a
            href="#work"
            className="inline-flex items-center gap-2 rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink transition-colors duration-300 hover:bg-white"
          >
            {primaryCta}
            <ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" />
          </a>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-medium text-paper/85 transition-colors duration-300 hover:border-paper/35 hover:text-paper"
          >
            {secondaryCta}
          </a>
        </motion.div>
      </motion.div>

      <div className="flex-1" />

      <motion.div
        variants={reveal}
        initial="hidden"
        animate="show"
        className="pointer-events-auto flex flex-wrap items-end justify-between gap-6 pb-10"
      >
        <motion.p
          variants={fade}
          className="hidden text-[11px] uppercase tracking-[0.3em] text-dim md:block"
        >
          {interactive ? desktopHint : touchHint}
        </motion.p>
        <motion.div variants={fade}>
          <StateIndicator smoothNx={smoothNx} />
        </motion.div>
      </motion.div>
    </div>
  )
}