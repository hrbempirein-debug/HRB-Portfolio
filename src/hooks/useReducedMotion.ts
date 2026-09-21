import { useReducedMotion as useFramerReducedMotion } from 'framer-motion'

/** True when the user prefers reduced motion (SSR-safe). */
export function useReducedMotion(): boolean {
  const reduced = useFramerReducedMotion()
  return reduced === null ? false : reduced
}