import { useEffect } from 'react'
import { useMotionValue } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import { isFinePointer, readPointer } from '../lib/pointer'
import { useReducedMotion } from './useReducedMotion'

export interface PointerPosition {
  /** Raw viewport position (px). */
  x: MotionValue<number>
  y: MotionValue<number>
  /** Raw normalized position (0..1). */
  nx: MotionValue<number>
  ny: MotionValue<number>
  /** True on devices with a fine pointer and when motion is allowed. */
  interactive: boolean
  /** True when the user prefers reduced motion. */
  reduced: boolean
}

/**
 * Bridges the imperative pointer store into Framer Motion values.
 * A single rAF loop polls the store and copies changed values, so pointer
 * events never trigger React renders.
 */
export function usePointerPosition(): PointerPosition {
  const reduced = useReducedMotion()
  const pointer = readPointer()

  const x = useMotionValue(pointer.x)
  const y = useMotionValue(pointer.y)
  const nx = useMotionValue(pointer.nx)
  const ny = useMotionValue(pointer.ny)

  const interactive = isFinePointer() && !reduced

  useEffect(() => {
    if (reduced) return

    let rafId = 0
    let last = readPointer()
    const loop = (): void => {
      const current = readPointer()
      // Skip writes on unchanged frames so idle pages are essentially free.
      if (current.x !== last.x || current.y !== last.y || current.nx !== last.nx || current.ny !== last.ny) {
        x.set(current.x)
        y.set(current.y)
        nx.set(current.nx)
        ny.set(current.ny)
        last = current
      }
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [nx, ny, reduced, x, y])

  return { x, y, nx, ny, interactive, reduced }
}