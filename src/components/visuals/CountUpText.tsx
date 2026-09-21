import { useEffect, useRef } from 'react'
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { EASE } from '../../lib/motion'

interface CountUpTextProps {
  /** Value the count starts at. */
  from: number
  /** Value the count animates up to. */
  to: number
  /** Duration of the count, in seconds. */
  duration: number
}

/**
 * CountUpText — the animated "0 → n" landing value.
 *
 * Counts from `from` to `to` once, when the element scrolls into view, using
 * the existing framer `animate`/motion-value architecture (no rAF loop, no new
 * engine). Digits are `tabular-nums` so the count doesn't jitter, and reduced
 * motion renders the final value immediately.
 */
export function CountUpText({ from, to, duration }: CountUpTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' })

  const count = useMotionValue(from)
  const rounded = useTransform(count, (value) => Math.round(value).toString())

  useEffect(() => {
    if (!inView) return
    const controls = animate(count, to, { duration, ease: EASE })
    return () => controls.stop()
  }, [count, duration, inView, to])

  if (reduced) {
    return (
      <span ref={ref} className="tabular-nums">
        {to}
      </span>
    )
  }

  return (
    <motion.span ref={ref} className="tabular-nums">
      {rounded}
    </motion.span>
  )
}