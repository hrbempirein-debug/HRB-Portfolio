/**
 * The three states of the hero. They are not pages — they are overlapping
 * visual environments whose dominance is derived continuously from the
 * normalized pointer X position.
 */

import type { MotionValue } from 'framer-motion'

export const ENV_IDS = ['web', 'ai', 'systems'] as const
export type EnvId = (typeof ENV_IDS)[number]

/** Shared SVG coordinate space so all environments feel like one system. */
export const ENV_VIEWBOX = '0 0 1600 1000'

/** Vertical grid lines shared by multiple environments (architectural base). */
export const GRID_X = [100, 300, 500, 700, 900, 1100, 1300, 1500]

/**
 * Normalized pointer depth in [-1, 1]. Passed into every environment so its
 * inner layers can parallax independently.
 */
export interface EnvironmentDepth {
  dx: MotionValue<number>
  dy: MotionValue<number>
}

export interface EnvWeights {
  web: number
  ai: number
  systems: number
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

function smoothstep(value: number): number {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
}

/**
 * Continuous crossfade weights that always sum to ~1.
 *
 * nx 0   → web dominates
 * nx .5  → ai dominates
 * nx 1   → systems dominates
 */
export function environmentWeights(nx: number): EnvWeights {
  const web = 1 - smoothstep(nx * 2)
  const systems = smoothstep(nx * 2 - 1)
  const ai = Math.max(0, 1 - web - systems)
  return { web, ai, systems }
}