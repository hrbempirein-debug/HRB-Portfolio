import { useSpring } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import { CURSOR_SPRING, ENV_SPRING } from '../lib/motion'
import { usePointerPosition } from './usePointerPosition'
import type { PointerPosition } from './usePointerPosition'

export interface SmoothPointer extends PointerPosition {
  /** Floaty, inertial environment position — drives the mood crossfade. */
  smoothNx: MotionValue<number>
  smoothNy: MotionValue<number>
  /** Tight cursor light position (px). */
  smoothX: MotionValue<number>
  smoothY: MotionValue<number>
}

/**
 * Springs around the raw pointer position so everything feels physical.
 * The environment moves with a slow, massy spring; the cursor light snaps
 * close behind the pointer.
 */
export function useSmoothPointer(): SmoothPointer {
  const { x, y, nx, ny, interactive, reduced } = usePointerPosition()

  const smoothNx = useSpring(nx, ENV_SPRING)
  const smoothNy = useSpring(ny, ENV_SPRING)
  const smoothX = useSpring(x, CURSOR_SPRING)
  const smoothY = useSpring(y, CURSOR_SPRING)

  return { x, y, nx, ny, interactive, reduced, smoothNx, smoothNy, smoothX, smoothY }
}