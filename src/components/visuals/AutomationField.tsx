import { useEffect, useRef } from 'react'
import { animate, motion, useMotionValue, useScroll, useTransform } from 'framer-motion'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useSmoothPointer } from '../../hooks/useSmoothPointer'
import { EASE } from '../../lib/motion'

/**
 * AutomationField — the dominant "0 → 100" visual.
 *
 * A continuous transformation rather than a diagram: at the left (0) the field
 * is sparse and raw — a handful of disconnected fragments; moving right, faint
 * workflow threads emerge in stages and fan into a structured orchestration
 * lattice, dense but controlled (100). Nothing is a card, box, arrow or chart.
 *
 * Built entirely from the shared environment vocabulary (`.env-*`,
 * `.cap-accent-*` tokens and keyframes), the shared pointer store and a single
 * Framer scroll listener — transform/opacity only, no canvas/WebGL, no added
 * rAF loop, no new engine. An active stage drives a soft spotlight column and
 * quiets the rest of the field, so hovering/focusing a stage illuminates the
 * relevant part of the journey without any layout shift.
 */

interface AutomationFieldProps {
  /** Index of the highlighted stage, or null when the field is at rest. */
  activeIndex: number | null
  /** Number of stages the journey is divided into. */
  stageCount: number
}

const VW = 1200
const VH = 620
const JX0 = 90
const JX1 = 1110
const CY = 300
const RAIL_Y = 560
const STREAM_N = 16

/** Thread i emerges progressively further right, then fans out toward 100. */
function streamPath(i: number): string {
  const t = i / (STREAM_N - 1)
  const startX = JX0 + t * 520
  const startY = CY + (t - 0.5) * 16
  const endX = JX1
  const endY = CY + (t - 0.5) * 300
  const c1 = startX + (endX - startX) * 0.42
  const c2 = startX + (endX - startX) * 0.7
  return `M ${startX} ${startY} C ${c1} ${startY}, ${c2} ${endY}, ${endX} ${endY}`
}

const STREAMS = Array.from({ length: STREAM_N }, (_, i) => ({
  d: streamPath(i),
  accent: i % 4 === 0,
}))

/** Disconnected manual-workflow fragments at the raw origin. */
const RAW_MARKS = [
  [118, 232, 168, 232],
  [150, 368, 214, 368],
  [96, 300, 134, 300],
  [206, 266, 250, 300],
  [234, 352, 268, 328],
  [300, 212, 324, 244],
  [330, 390, 368, 360],
] as const

const GRID_X = [90, 240, 390, 540, 690, 840, 990, 1110]

/** Orchestration lattice — rows multiply and spread as the journey scales. */
const NODES = (() => {
  const out: { x: number; y: number; r: number }[] = []
  for (let c = 0; c < 7; c += 1) {
    const x = 660 + c * 76
    const rows = 2 + c
    const span = 120 + c * 26
    for (let r = 0; r < rows; r += 1) {
      const y = rows === 1 ? CY : CY + ((r - (rows - 1) / 2) * span) / (rows - 1)
      out.push({ x, y, r: 1.4 + c * 0.16 })
    }
  }
  return out
})()

const CORES = [
  { x: 250, y: 300, r: 2.2 },
  { x: 470, y: 288, r: 2.6 },
  { x: 700, y: 300, r: 3 },
  { x: 920, y: 300, r: 3.4 },
]

const STAGE_TICKS = Array.from(
  { length: 8 },
  (_, i) => JX0 + ((JX1 - JX0) * i) / 7,
)

const SIGNALS = [streamPath(3), streamPath(7), streamPath(11)]

const NUMERAL_STYLE = {
  fontFamily: 'var(--font-display)',
  fontSize: 58,
  fontWeight: 600,
  letterSpacing: '-0.02em',
} as const

export function AutomationField({ activeIndex, stageCount }: AutomationFieldProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { smoothNx, smoothNy, interactive } = useSmoothPointer()

  // Pointer response is fine-pointer only.
  const amp = interactive ? 1 : 0

  // Subtle scroll counter-drift plus a scroll-drawn journey rail.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const depth = useTransform(scrollYProgress, [0, 1], [24, -24])
  const railProgress = useTransform(scrollYProgress, [0.12, 0.72], [0, 1])
  const cometX = useTransform(railProgress, [0, 1], [JX0, JX1])

  // Layered pointer parallax — depth planes drift at different rates.
  const gridX = useTransform(smoothNx, (v) => (v - 0.5) * 2 * 10 * amp)
  const gridY = useTransform(smoothNy, (v) => (v - 0.5) * 2 * 6 * amp)
  const streamX = useTransform(smoothNx, (v) => (v - 0.5) * 2 * 18 * amp)
  const streamY = useTransform(smoothNy, (v) => (v - 0.5) * 2 * 10 * amp)
  const nodeX = useTransform(smoothNx, (v) => (v - 0.5) * 2 * 28 * amp)
  const nodeY = useTransform(smoothNy, (v) => (v - 0.5) * 2 * 14 * amp)
  const glowX = useTransform(smoothNx, (v) => (v - 0.5) * 2 * 40 * amp)
  const glowY = useTransform(smoothNy, (v) => (v - 0.5) * 2 * 22 * amp)

  // Spotlight travels the journey with the active stage; it holds its last
  // position while fading out so it never slides back to centre.
  const denom = Math.max(1, stageCount - 1)
  const focusX = activeIndex === null ? null : JX0 + ((JX1 - JX0) * activeIndex) / denom
  const spotX = useMotionValue((JX0 + JX1) / 2)
  useEffect(() => {
    if (focusX === null) return
    const controls = animate(spotX, focusX, { duration: 0.55, ease: EASE })
    return () => controls.stop()
  }, [focusX, spotX])

  const fieldOpacity = activeIndex === null ? 1 : 0.5

  return (
    <div ref={ref} aria-hidden="true" className="relative">
      <motion.div style={{ y: depth }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} role="presentation" className="block h-auto w-full">
          <defs>
            <linearGradient id="af-spot" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(152 180 205 / 0)" />
              <stop offset="50%" stopColor="rgb(152 180 205 / 0.12)" />
              <stop offset="100%" stopColor="rgb(152 180 205 / 0)" />
            </linearGradient>
            <radialGradient id="af-spot-glow">
              <stop offset="0%" stopColor="rgb(152 180 205 / 0.45)" />
              <stop offset="100%" stopColor="rgb(152 180 205 / 0)" />
            </radialGradient>
          </defs>

          {/* Architectural grid — slowest depth plane. */}
          <motion.g style={{ x: gridX, y: gridY }} className="env-layer-bg">
            {GRID_X.map((x) => (
              <line key={x} className="env-line-faint" x1={x} y1={110} x2={x} y2={500} />
            ))}
          </motion.g>

          {/* Raw, unconnected fragments at the origin. */}
          <motion.g style={{ x: gridX, y: gridY }} className="env-layer-bg">
            {RAW_MARKS.map(([x1, y1, x2, y2], i) => (
              <line
                key={i}
                className="env-line-faint"
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                strokeDasharray="3 5"
              />
            ))}
          </motion.g>

          {/* Active-stage spotlight — sits behind the threads so they cross it. */}
          <motion.g
            style={{ x: spotX }}
            animate={{ opacity: focusX === null ? 0 : 1 }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <rect x={-84} y={96} width={168} height={420} fill="url(#af-spot)" />
            <circle cx={0} cy={CY} r={120} fill="url(#af-spot-glow)" opacity={0.5} />
          </motion.g>

          {/* Workflow threads — emerging at the origin, fanning toward scale. */}
          <motion.g style={{ x: streamX, y: streamY }}>
            <motion.g
              className="env-layer-mid"
              animate={{ opacity: fieldOpacity }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              <g className="env-drift-x">
                {STREAMS.map((stream, i) => (
                  <path
                    key={i}
                    className={stream.accent ? 'env-accent-soft' : 'env-line-faint'}
                    d={stream.d}
                  />
                ))}
              </g>
            </motion.g>
          </motion.g>

          {/* Orchestration lattice — dense but ordered. */}
          <motion.g style={{ x: nodeX, y: nodeY }}>
            <motion.g
              animate={{ opacity: activeIndex === null ? 0.85 : 0.45 }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              {NODES.map((node, i) => (
                <circle key={i} className="env-node" cx={node.x} cy={node.y} r={node.r} />
              ))}
            </motion.g>
          </motion.g>

          {/* Luminous cores — quiet pulses across the field. */}
          <motion.g style={{ x: glowX, y: glowY }}>
            {CORES.map((core, i) => (
              <g key={`${core.x}-${core.y}`}>
                <circle className="env-fill-disc" cx={core.x} cy={core.y} r={core.r * 6} />
                <circle
                  className="env-fill-core env-pulse"
                  cx={core.x}
                  cy={core.y}
                  r={core.r}
                  style={{ animationDelay: `${i * 1.3}s` }}
                />
              </g>
            ))}
          </motion.g>

          {/* Travelling signals — the workflow in motion. */}
          {!reduced &&
            SIGNALS.map((d, i) => (
              <circle
                key={i}
                className="env-fill-core env-travel"
                cx={0}
                cy={0}
                r={2.6}
                style={{
                  offsetPath: `path("${d}")`,
                  animationDuration: `${26 + i * 6}s`,
                  animationDelay: `${i * 5}s`,
                }}
              />
            ))}

          {/* Journey rail — static line, marching flow, scroll-drawn accent. */}
          <line className="env-line" x1={JX0} y1={RAIL_Y} x2={JX1} y2={RAIL_Y} />
          <line className="env-line-faint env-march" x1={JX0} y1={RAIL_Y} x2={JX1} y2={RAIL_Y} />
          <motion.line
            className="cap-accent-line"
            x1={JX0}
            y1={RAIL_Y}
            x2={JX1}
            y2={RAIL_Y}
            style={{ pathLength: reduced ? 1 : railProgress }}
          />
          {STAGE_TICKS.map((x) => (
            <circle key={x} className="env-node" cx={x} cy={RAIL_Y} r={2} />
          ))}
          {!reduced && (
            <motion.circle
              className="cap-accent-node"
              cx={0}
              cy={RAIL_Y}
              r={3}
              style={{ x: cometX }}
            />
          )}

          {/* 0 → 100 — the journey bookends. */}
          <text
            x={8}
            y={CY}
            textAnchor="start"
            dominantBaseline="central"
            className="text-paper"
            fill="currentColor"
            opacity={0.9}
            style={NUMERAL_STYLE}
          >
            0
          </text>
          <text
            x={1192}
            y={CY}
            textAnchor="end"
            dominantBaseline="central"
            className="text-paper"
            fill="currentColor"
            opacity={0.9}
            style={NUMERAL_STYLE}
          >
            100
          </text>
        </svg>
      </motion.div>
    </div>
  )
}
