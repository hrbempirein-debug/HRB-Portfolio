import { motion, useMotionValue, useTransform } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import type { SmoothPointer } from '../../hooks/useSmoothPointer'
import { environmentWeights } from '../../lib/environment'
import { EASE, PARALLAX } from '../../lib/motion'
import { WebEnvironment } from './WebEnvironment'
import { AIEnvironment } from './AIEnvironment'
import { SystemsEnvironment } from './SystemsEnvironment'
import { CursorLight } from '../ui/CursorLight'
import { GrainOverlay } from '../ui/GrainOverlay'

interface EnvLayerProps {
  opacity: MotionValue<number>
  x: MotionValue<number>
  y: MotionValue<number>
  children: ReactNode
}

function EnvLayer({ opacity, x, y, children }: EnvLayerProps) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      style={{ opacity, x, y }}
      aria-hidden="true"
    >
      {children}
    </motion.div>
  )
}

interface HeroVisualProps {
  pointer: SmoothPointer
}

/**
 * Full-viewport interactive environment.
 *
 * Layer order (bottom → top):
 *   atmosphere → WEB / AI / SYSTEMS → cursor light → readability → grain
 *
 * Position spread (nx) sets crossfade weights; vertical position (ny) sets
 * atmospheric intensity. Per-environment depth comes from the shared dx/dy.
 */
export function HeroVisual({ pointer }: HeroVisualProps) {
  const { smoothNx, smoothNy, smoothX, smoothY, interactive, reduced } = pointer

  const webOpacity = useTransform(smoothNx, (v) => environmentWeights(v).web)
  const aiOpacity = useTransform(smoothNx, (v) => environmentWeights(v).ai)
  const systemsOpacity = useTransform(smoothNx, (v) => environmentWeights(v).systems)

  const intensity = useTransform(smoothNy, (v) => 0.8 + 0.2 * v)

  /** Normalized -1..1 offsets feeding each environment's depth parallax. */
  const dx = useTransform(smoothNx, (v) => (v - 0.5) * 2)
  const dy = useTransform(smoothNy, (v) => (v - 0.5) * 2)

  const webX = useTransform(smoothNx, (v) => (v - 0.5) * -PARALLAX.x * 0.7)
  const aiX = useTransform(smoothNx, (v) => (v - 0.5) * -PARALLAX.x)
  const systemsX = useTransform(smoothNx, (v) => (v - 0.5) * -PARALLAX.x * 1.3)
  const driftY = useTransform(smoothNy, (v) => (v - 0.5) * PARALLAX.y)

  const showCursor = interactive && !reduced

  /** Fade the cursor light out when the pointer leaves the window so it never
   *  leaves a frozen glow behind. */
  const lightVisible = useMotionValue(1)
  useEffect(() => {
    const onLeave = () => lightVisible.set(0)
    const onEnter = () => lightVisible.set(1)
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)
    return () => {
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
    }
  }, [lightVisible])

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className="env-atmosphere absolute inset-0"
        style={{
          opacity: intensity,
          background: [
            'radial-gradient(80% 55% at 50% 0%, rgb(152 180 205 / 8%) 0%, transparent 62%)',
            'radial-gradient(55% 45% at 78% 82%, rgb(120 140 160 / 5%) 0%, transparent 70%)',
            'linear-gradient(to bottom, var(--color-ink) 0%, transparent 24%, transparent 84%, var(--color-ink) 100%)',
          ].join(', '),
        }}
      />

      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}
      >
        <EnvLayer opacity={webOpacity} x={webX} y={driftY}>
          <WebEnvironment dx={dx} dy={dy} />
        </EnvLayer>
        <EnvLayer opacity={aiOpacity} x={aiX} y={driftY}>
          <AIEnvironment dx={dx} dy={dy} />
        </EnvLayer>
        <EnvLayer opacity={systemsOpacity} x={systemsX} y={driftY}>
          <SystemsEnvironment dx={dx} dy={dy} />
        </EnvLayer>
      </motion.div>

      <CursorLight x={smoothX} y={smoothY} active={showCursor} opacity={lightVisible} />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            'radial-gradient(120% 90% at 50% 18%, transparent 40%, rgb(10 10 12 / 0.5) 100%)',
            'linear-gradient(to bottom, rgb(10 10 12 / 0.65) 0%, transparent 26%, transparent 72%, rgb(10 10 12 / 0.88) 100%)',
          ].join(', '),
        }}
      />

      <GrainOverlay />
    </div>
  )
}