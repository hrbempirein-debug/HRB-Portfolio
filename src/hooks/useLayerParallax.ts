import { useTransform } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import { DEPTH_PARALLAX } from '../lib/motion'

export interface LayerParallax {
  bgX: MotionValue<number>
  bgY: MotionValue<number>
  fgX: MotionValue<number>
  fgY: MotionValue<number>
}

/**
 * Two independent parallax banks for an environment — the background pushes
 * gently against the pointer, the foreground trails with it. This is what
 * makes the three SVG states read as stacked depth rather than flat art.
 */
export function useLayerParallax(dx: MotionValue<number>, dy: MotionValue<number>): LayerParallax {
  const bgX = useTransform(dx, (value) => value * -DEPTH_PARALLAX.bg)
  const bgY = useTransform(dy, (value) => value * -DEPTH_PARALLAX.bg * 0.7)
  const fgX = useTransform(dx, (value) => value * DEPTH_PARALLAX.fg)
  const fgY = useTransform(dy, (value) => value * DEPTH_PARALLAX.fg * 0.7)
  return { bgX, bgY, fgX, fgY }
}