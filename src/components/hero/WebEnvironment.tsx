import { motion } from 'framer-motion'
import type { EnvironmentDepth } from '../../lib/environment'
import { ENV_VIEWBOX, GRID_X } from '../../lib/environment'
import { useLayerParallax } from '../../hooks/useLayerParallax'

const HORIZONTALS = [140, 500, 860]

/** The ecosystem's shared conduit — weaves between the interface panels. */
const SPINE_D = 'M 150 290 C 300 230 380 320 470 400 C 545 466 640 640 770 690 C 900 740 1090 700 1200 600 C 1290 520 1400 560 1490 520'
const SPINE_POINTS: ReadonlyArray<readonly [number, number]> = [
  [150, 290],
  [470, 400],
  [770, 690],
  [1200, 600],
  [1490, 520],
]

/** Fine connective filaments between panels (barely-there threads). */
const THREADS = [
  'M 400 372 C 520 440 560 560 640 652',
  'M 1180 470 C 1180 560 1140 640 1010 662',
  'M 150 290 C 70 260 70 180 140 150',
  'M 1490 520 C 1560 470 1540 420 1490 380',
]

/** Mid-field interface panels — the ecosystem's residents. */
interface PanelSpec {
  x: number
  y: number
  w: number
  h: number
  rx?: number
}

/** Data fragments drifting in the foreground. */
const DATA_SQUARES: ReadonlyArray<readonly [number, number, number]> = [
  [380, 150, 4],
  [620, 190, 3],
  [1010, 170, 4],
  [1290, 260, 3],
  [1490, 340, 4],
  [260, 520, 3],
  [900, 470, 3],
  [560, 880, 4],
  [1260, 880, 3],
  [700, 300, 3],
  [1340, 760, 4],
  [440, 760, 3],
]

/** Filled panel body + its stroke outline, sharing one geometry. */
function Panel({ x, y, w, h, fill, stroke, rx = 10, slot = '' }: PanelSpec & { fill: string; stroke: string; slot?: string }) {
  return (
    <g className={slot || undefined}>
      <rect className={fill} x={x} y={y} width={w} height={h} rx={rx} />
      <rect className={stroke} x={x} y={y} width={w} height={h} rx={rx} />
    </g>
  )
}

/**
 * STATE 1 — WEB.
 * A living ecosystem of interfaces. Distant oversized frames sink into the
 * dark; mid-field panels hold quiet content; a glowing conduit threads
 * between them while fine filaments drift on their own slow currents. Bright
 * fragments float in the foreground, and a single near panel reads clearly.
 */
export function WebEnvironment({ dx, dy }: EnvironmentDepth) {
  const { bgX, bgY, fgX, fgY } = useLayerParallax(dx, dy)

  return (
    <svg
      viewBox={ENV_VIEWBOX}
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      data-env="web"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="web-veil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(226 232 240)" stopOpacity="0" />
          <stop offset="0.12" stopColor="rgb(226 232 240)" stopOpacity="1" />
          <stop offset="0.9" stopColor="rgb(226 232 240)" stopOpacity="1" />
          <stop offset="1" stopColor="rgb(226 232 240)" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="web-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgb(152 180 205)" stopOpacity="0.1" />
          <stop offset="1" stopColor="rgb(152 180 205)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* BACKGROUND — the grid + overarching frames fading into haze */}
      <motion.g style={{ x: bgX, y: bgY }} className="env-layer-bg" data-depth="bg">
        <g className="env-drift-bg web-grid" stroke="url(#web-veil)" strokeWidth="1">
          {GRID_X.map((x) => (
            <line key={x} className="env-line-thin" x1={x} y1="0" x2={x} y2="1000" />
          ))}
          {HORIZONTALS.map((y) => (
            <line key={y} className="env-line-thin" x1="0" y1={y} x2="1600" y2={y} />
          ))}
        </g>

        <g className="env-drift-bg env-hero-bg-far web-depth">
          <circle cx="1180" cy="320" r="620" fill="url(#web-glow)" />
          <circle cx="300" cy="860" r="520" fill="url(#web-glow)" />
          <g stroke="url(#web-veil)" strokeWidth="1">
            <rect className="env-line-faint" x="860" y="60" width="620" height="720" rx="28" />
            <line className="env-line-thin" x1="1080" y1="60" x2="1080" y2="780" />
            <line className="env-line-thin" x1="1300" y1="60" x2="1300" y2="780" />
            <rect className="env-line-faint" x="80" y="240" width="460" height="620" rx="24" />
            <line className="env-line-thin" x1="230" y1="240" x2="230" y2="860" />
            <path d="M -160 980 C 300 560 1300 560 1760 980" fill="none" />
          </g>
        </g>
      </motion.g>

      {/* MIDGROUND — the conduit, its panels and drifting threads */}
      <g className="env-drift web-connections" data-depth="mid">
        <path className="env-line-strong env-line-soft env-march" d={SPINE_D} fill="none" />
        {SPINE_POINTS.map(([px, py]) => (
          <circle key={`${px}-${py}`} cx={px} cy={py} r={3} className="env-node web-nodes" />
        ))}

        {THREADS.map((d) => (
          <path key={d} className="env-line-faint env-drift-x" d={d} fill="none" />
        ))}

        {/* Signal — the ecosystem's pulse */}
        <g className="env-drift-x web-nodes" transform="translate(470, 400)">
          <g className="env-spin-slower">
            <circle r="46" className="env-line-faint" />
            <circle r="62" className="env-line-faint" />
          </g>
          <g className="env-spin-slower env-spin-reverse">
            <circle
              r="62"
              className="env-accent-soft"
              strokeDasharray="3 9"
              style={{ transformOrigin: 'center' }}
              fill="none"
            />
          </g>
          <circle
            className="env-travel env-node-accent"
            r="2.5"
            style={{ offsetPath: 'path("M 0 0 m -46 0 a 46 46 0 1 1 92 0 a 46 46 0 1 1 -92 0")' }}
          />
          <circle className="env-fill-core env-pulse" r="5" />
        </g>

        {/* Mid-field panels */}
        <Panel x={150} y={200} w={260} h={180} fill="env-fill-panel" stroke="env-line" slot="web-panels" />
        <g transform="translate(150, 200)">
          <rect x="16" y="16" width="120" height="6" rx="1" className="env-line-strong" />
          <line x1="16" y1="44" x2="206" y2="44" className="env-line-faint" />
          <line x1="16" y1="62" x2="170" y2="62" className="env-line-faint" />
          <line x1="180" y1="30" x2="180" y2="156" className="env-line-faint" />
          <circle cx="196" cy="152" r="2" className="env-node" />
          <path d="M 226 146 H 240 V 160" fill="none" className="env-accent-soft" />
        </g>
        <Panel x={980} y={360} w={270} h={200} fill="env-fill-panel" stroke="env-line" slot="web-panels" />
        <g transform="translate(980, 360)">
          <line x1="16" y1="16" x2="214" y2="16" className="env-accent-soft" />
          <rect x="16" y="32" width="150" height="7" rx="1" className="env-line" />
          <rect x="16" y="54" width="40" height="90" rx="2" className="env-line-faint" />
          <rect x="68" y="78" width="40" height="66" rx="2" className="env-line-faint" />
          <rect x="120" y="102" width="40" height="42" rx="2" className="env-fill-accent" />
          <line x1="16" y1="152" x2="238" y2="152" className="env-line-faint" />
          <g transform="translate(214, 44)">
            <circle r="14" className="env-line-faint" />
            <circle r="6" className="env-line-faint" />
            <circle r="2" className="env-node" />
          </g>
        </g>
        <Panel x={620} y={660} w={280} h={130} fill="env-fill-panel" stroke="env-line" slot="web-panels" />
        <g transform="translate(620, 660)">
          <rect x="16" y="16" width="90" height="6" rx="1" className="env-line-strong" />
          <line x1="16" y1="40" x2="248" y2="40" className="env-line-faint" />
          <line x1="16" y1="56" x2="210" y2="56" className="env-line-faint" />
          <line x1="16" y1="80" x2="164" y2="80" className="env-line-faint" />
          <circle cx="48" cy="96" r="2" className="env-node" />
          <circle cx="100" cy="96" r="2" className="env-node" />
          <circle cx="152" cy="96" r="2" className="env-node" />
          <circle cx="246" cy="16" r="3" className="env-node-accent env-pulse" />
        </g>
      </g>

      {/* FOREGROUND — one crisp near panel, carets and bright fragments */}
      <motion.g style={{ x: fgX, y: fgY }} className="env-layer-fg" data-depth="fg">
        <g className="env-drift-fg web-depth">
          <Panel x={1010} y={740} w={230} h={150} fill="env-fill-panel-strong" stroke="env-line-strong" rx={12} slot="web-panels" />
          <g transform="translate(1010, 740)">
            <line x1="16" y1="16" x2="198" y2="16" className="env-accent" />
            <rect x="16" y="30" width="110" height="6" rx="1" className="env-line-strong" />
            <rect x="16" y="56" width="34" height="74" rx="2" className="env-fill-accent" />
            <rect x="62" y="80" width="34" height="50" rx="2" className="env-line" />
            <rect x="108" y="68" width="34" height="62" rx="2" className="env-line" />
            <circle cx="202" cy="24" r="3" className="env-node-accent env-pulse" />
            <path d="M 136 118 H 152 V 134" fill="none" className="env-accent-soft" />
          </g>

          <path d="M 446 446 v 18 h 18" fill="none" className="env-accent env-float" />

          <g className="web-nodes">
            {DATA_SQUARES.map(([px, py, size], index) => (
              <rect
                key={`${px}-${py}`}
                x={px - size / 2}
                y={py - size / 2}
                width={size}
                height={size}
                className="env-node-accent env-float"
                style={{ animationDelay: `${index * -1.4}s` }}
              />
            ))}
          </g>
        </g>
      </motion.g>
    </svg>
  )
}