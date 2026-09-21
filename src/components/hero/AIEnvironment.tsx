import { motion, useTransform } from 'framer-motion'
import type { EnvironmentDepth } from '../../lib/environment'
import { ENV_VIEWBOX } from '../../lib/environment'
import { useLayerParallax } from '../../hooks/useLayerParallax'

/** The plexus settles off-center — this is an organic field, not a target. */
const PX = 600
const PY = 620

/** Dendrite fibers branching outward from the plexus, each with a synapse. */
const DENDRITES: ReadonlyArray<readonly [string, number, number]> = [
  ['M 560 540 C 480 400 420 320 330 260', 360, 280],
  ['M 620 500 C 700 380 760 300 830 220', 830, 230],
  ['M 690 600 C 820 560 900 520 1010 480', 920, 520],
  ['M 660 700 C 760 820 840 860 960 900', 880, 860],
  ['M 540 700 C 460 790 420 830 340 880', 380, 850],
  ['M 600 500 C 540 440 500 400 470 360', 480, 380],
]

/** The main axon — a bright nervous connection to the far cluster. */
const AXON_D = 'M 660 560 C 780 520 940 440 1100 350'

/** Far constellation — the field continues into the dark. */
const STARS: ReadonlyArray<readonly [number, number, number]> = [
  [1100, 60, 1],
  [1250, 110, 1.5],
  [1400, 90, 1],
  [1480, 170, 1.5],
  [720, 90, 1],
  [980, 60, 1],
]

/** Two distant neuron clusters reached by thin fibers. */

/**
 * STATE 2 — AI.
 * A neural intelligence field. One asymmetric plexus inhabits the lower left
 * and sends dendrites into the surrounding dark; a bright axon carries an
 * electrical pulse toward distant clusters of thought. The foreground core
 * leans toward the pointer — the whole system listens.
 */
export function AIEnvironment({ dx, dy }: EnvironmentDepth) {
  const { bgX, bgY, fgX, fgY } = useLayerParallax(dx, dy)

  /** Cursor-attentive shift — stronger than generic parallax, so the plexus
   *  visibly turns toward where you look. Pure reuse of the pointer MotionValues. */
  const attentionX = useTransform(dx, (value) => value * 26)
  const attentionY = useTransform(dy, (value) => value * 18)

  return (
    <svg
      viewBox={ENV_VIEWBOX}
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      data-env="ai"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="ai-nebula" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#818cf8" stopOpacity="0.12" />
          <stop offset="0.55" stopColor="#818cf8" stopOpacity="0.04" />
          <stop offset="1" stopColor="#818cf8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ai-attn" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#a5b4fc" stopOpacity="0.16" />
          <stop offset="1" stopColor="#a5b4fc" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* BACKGROUND — the field's nebula and faint constellations */}
      <motion.g style={{ x: bgX, y: bgY }} className="env-layer-bg" data-depth="bg">
        <g className="env-drift-bg ai-depth">
          <circle cx={PX} cy={PY} r="720" fill="url(#ai-nebula)" />
          <circle cx="1280" cy="520" r="520" fill="url(#ai-nebula)" />
        </g>
        <g className="env-drift-bg env-hero-bg-far ai-connections ai-nodes" stroke="#a5b4fc" strokeWidth="1">
          <path d="M 700 40 C 900 70 1100 50 1290 80" fill="none" />
          <path d="M 120 300 C 200 260 280 240 350 200" fill="none" />
          {STARS.map(([sx, sy, sr]) => (
            <circle key={`${sx}-${sy}`} cx={sx} cy={sy} r={sr} className="env-node" />
          ))}
        </g>
      </motion.g>

      {/* MIDGROUND — dendrites, the axon and the distant clusters */}
      <g className="env-drift ai-connections ai-orbits" data-depth="mid">
        <path
          className="env-line-strong env-line-soft env-march"
          d={AXON_D}
          fill="none"
          style={{ animationDuration: '24s' }}
        />
        <circle
          className="env-travel env-node-accent"
          r="3"
          style={{ offsetPath: `path("${AXON_D}")`, animationDuration: '26s' }}
        />

        {DENDRITES.map(([d, cx, cy]) => (
          <g key={d} className="ai-connections">
            <path className="env-line-faint env-drift-x" d={d} fill="none" />
            <circle cx={cx} cy={cy} r="2" className="env-node-accent env-float ai-nodes" />
          </g>
        ))}

        {/* Secondary axon to the upper cluster */}
        <g className="env-hero-mg-extra ai-connections">
          <path className="env-line-faint env-march" d="M 660 500 C 740 380 820 240 880 160" fill="none" />
          <circle
            className="env-travel env-node-accent"
            r="2"
            style={{ offsetPath: 'path("M 660 500 C 740 380 820 240 880 160")' }}
          />
        </g>

        {/* Distant clusters of thought */}
        <g className="env-line-faint ai-nodes" transform="translate(1140, 300)">
          <line x1="0" y1="0" x2="60" y2="40" />
          <line x1="0" y1="0" x2="-50" y2="40" />
          <line x1="0" y1="0" x2="20" y2="-40" />
          <circle cx="0" cy="0" r="2.5" className="env-node" />
          <circle cx="60" cy="40" r="2" className="env-node" />
          <circle cx="-50" cy="40" r="2" className="env-node" />
          <circle cx="20" cy="-40" r="2" className="env-node" />
        </g>
        <g className="env-line-faint env-hero-mg-extra ai-nodes" transform="translate(900, 120)">
          <line x1="0" y1="0" x2="50" y2="-40" />
          <line x1="0" y1="0" x2="-50" y2="-40" />
          <circle cx="0" cy="0" r="2" className="env-node" />
          <circle cx="50" cy="-40" r="2" className="env-node" />
          <circle cx="-50" cy="-40" r="2" className="env-node" />
        </g>

        {/* The plexus — layered but deliberately uneven */}
        <circle cx={PX} cy={PY} r="150" fill="url(#ai-attn)" />
        <g className="env-spin-slower ai-orbits">
          <circle cx={PX} cy={PY} r="88" className="env-line-faint" />
          <circle cx={PX} cy={PY} r="58" className="env-line" />
        </g>
        <circle
          className="env-travel env-node-accent ai-orbits"
          r="2"
          style={{ offsetPath: 'path("M 600 620 m -58 0 a 58 58 0 1 1 116 0 a 58 58 0 1 1 -116 0")' }}
        />
        <g className="env-hero-mg-extra" transform="translate(490, 700)">
          <path d="M -20 0 H 0 V 20" fill="none" className="env-line" />
        </g>
      </g>

      {/* FOREGROUND — the bright attentive core, leaning with the pointer */}
      <motion.g style={{ x: fgX, y: fgY }} className="env-layer-fg" data-depth="fg">
        <motion.g style={{ x: attentionX, y: attentionY }} className="ai-core">
          <g className="env-drift-fg ai-core ai-particles ai-nodes">
            <circle className="env-fill-accent" cx={PX} cy={PY} r="26" />
            <circle className="env-fill-core env-pulse" cx={PX} cy={PY} r="10" />
            <circle className="env-node" cx={PX} cy={PY} r="3" />

            {/* Asymmetric attention carets — lower-left + upper-right only */}
            <path d={`M ${PX - 64} ${PY + 64} v 20 M ${PX - 64} ${PY + 84} h -20`} fill="none" className="env-accent-soft ai-particles" />
            <path d={`M ${PX + 64} ${PY - 64} v -20 M ${PX + 64} ${PY - 84} h 20`} fill="none" className="env-accent-soft ai-particles" />

            {/* Synaptic sparks on the plexus edge */}
            <circle className="env-node-accent env-float ai-nodes" cx={PX + 58} cy={PY} r="2.5" style={{ animationDelay: '-3s' }} />
            <circle className="env-node-accent env-float ai-nodes" cx={PX - 48} cy={PY + 34} r="2.5" style={{ animationDelay: '-7s' }} />
            <circle className="env-node-accent env-float ai-nodes" cx={PX + 12} cy={PY - 62} r="2.5" style={{ animationDelay: '-11s' }} />
          </g>
        </motion.g>
      </motion.g>
    </svg>
  )
}