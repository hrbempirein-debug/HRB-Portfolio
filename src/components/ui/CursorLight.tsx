import { motion, useTransform } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import { CURSOR_LIGHT_SIZE } from '../../lib/motion'

interface CursorLightProps {
  /** Sprung viewport position (px). */
  x: MotionValue<number>
  y: MotionValue<number>
  /** Only render on fine-pointer devices when motion is allowed. */
  active: boolean
  /** 1 while the pointer is inside the window, 0 after it leaves. */
  opacity?: MotionValue<number>
}

/**
 * A soft radial light that trails the cursor. Pure CSS gradient + transform
 * follow, no canvas. Fades away when the pointer leaves the window.
 */
export function CursorLight({ x, y, active, opacity }: CursorLightProps) {
  const left = useTransform(x, (value) => value - CURSOR_LIGHT_SIZE / 2)
  const top = useTransform(y, (value) => value - CURSOR_LIGHT_SIZE / 2)

  if (!active) return null

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 rounded-full will-change-transform"
      style={{
        width: CURSOR_LIGHT_SIZE,
        height: CURSOR_LIGHT_SIZE,
        x: left,
        y: top,
        opacity,
        transition: 'opacity 900ms ease',
        background:
          'radial-gradient(circle, rgb(158 189 214 / 22%) 0%, rgb(150 180 205 / 10%) 26%, rgb(140 170 195 / 4%) 52%, transparent 72%)',
        mixBlendMode: 'screen',
      }}
    />
  )
}