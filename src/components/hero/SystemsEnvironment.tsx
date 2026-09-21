import { motion } from 'framer-motion'
import type { EnvironmentDepth } from '../../lib/environment'
import { ENV_VIEWBOX } from '../../lib/environment'
import { useLayerParallax } from '../../hooks/useLayerParallax'

/** The main bus — a long curved corridor carrying trains of data. */
const BUS_D = 'M -320 540 C 160 500 400 580 660 600 C 940 620 1180 620 1360 580 C 1480 550 1560 535 1600 530'

/** Rack rows receding in the distance. */
const RACK_ROWS: ReadonlyArray<readonly [number, number]> = [
  [140, 900],
  [210, 700],
  [280, 820],
]

/** A node-house: filled body, status bar, one live indicator. */
function NodeHouse({
  x,
  y,
  w,
  h,
  delay,
  label = 'env-line',
}: {
  x: number
  y: number
  w: number
  h: number
  delay: number
  label?: string
}) {
  return (
    <g className="systems-modules">
      <rect className="env-fill-panel" x={x} y={y} width={w} height={h} rx={8} />
      <rect className={label} x={x} y={y} width={w} height={h} rx={8} />
      <rect className="env-line-faint" x={x + 12} y={y + 12} width={w - 24} height="5" rx="1" />
      <rect className="env-line-faint" x={x + 12} y={y + 26} width={w - 44} height="3" rx="1" />
      <rect className="env-line-faint" x={x + 12} y={y + 34} width={w - 58} height="3" rx="1" />
      <circle
        className="env-node-accent env-float"
        cx={x + w - 16}
        cy={y + h - 18}
        r="3"
        style={{ animationDelay: `${delay}s` }}
      />
    </g>
  )
}

/** Bright data fragments in the foreground. */
const DATA_SQUARES: ReadonlyArray<readonly [number, number, number]> = [
  [360, 220, 3],
  [600, 300, 4],
  [980, 200, 3],
  [1240, 220, 4],
  [1480, 300, 3],
  [220, 640, 3],
  [760, 460, 3],
  [1080, 840, 4],
  [1430, 760, 3],
  [520, 880, 3],
  [900, 900, 3],
  [1320, 520, 4],
]

/**
 * STATE 3 — SYSTEMS.
 * A distributed architecture. A long bus sweeps across the field carrying
 * packets toward the horizon while node-houses hang off it like terminals on
 * a fabric; a radar arc listens on the right and one near console sits crisp
 * in the foreground, its scanline sweeping.
 */
export function SystemsEnvironment({ dx, dy }: EnvironmentDepth) {
  const { bgX, bgY, fgX, fgY } = useLayerParallax(dx, dy)

  return (
    <svg
      viewBox={ENV_VIEWBOX}
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      data-env="systems"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sys-veil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(203 213 225)" stopOpacity="0" />
          <stop offset="0.5" stopColor="rgb(203 213 225)" stopOpacity="1" />
          <stop offset="1" stopColor="rgb(203 213 225)" stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id="sys-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgb(120 139 163)" stopOpacity="0.1" />
          <stop offset="1" stopColor="rgb(120 139 163)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* BACKGROUND — distant racks + tall connectors fading into haze */}
      <motion.g style={{ x: bgX, y: bgY }} className="env-layer-bg" data-depth="bg">
        <g className="env-drift-sm systems-depth">
          <circle cx="1180" cy="600" r="620" fill="url(#sys-glow)" />
        </g>
        <g className="env-drift-bg env-hero-bg-far systems-depth" stroke="url(#sys-veil)" strokeWidth="1">
          {RACK_ROWS.map(([rowY, endX]) => (
            <g key={rowY} className="env-line-thin">
              <line x1="-80" y1={rowY} x2={endX} y2={rowY} />
              {Array.from({ length: 10 }, (_, index) => {
                const tx = -80 + index * 96
                return <line key={tx} x1={tx} y1={rowY - 6} x2={tx} y2={rowY + 6} />
              })}
            </g>
          ))}
          <path d="M 1130 -200 V 1400" fill="none" />
          <path d="M 1290 -200 V 1400" fill="none" />
          <path d="M 1450 -200 V 1400" fill="none" />
        </g>
      </motion.g>

      {/* MIDGROUND — the bus, node-houses, mesh and radar arc */}
      <g className="env-drift systems-connections systems-modules" data-depth="mid">
        <path className="env-line-strong env-line-soft env-march" d={BUS_D} fill="none" style={{ animationDuration: '32s' }} />
        <circle
          className="env-travel env-node-accent"
          r="3"
          style={{ offsetPath: `path("${BUS_D}")`, animationDuration: '28s' }}
        />
        <circle
          className="env-travel env-node-accent"
          r="2"
          style={{ offsetPath: `path("${BUS_D}")`, animationDuration: '52s' }}
        />

        {/* Stub connections — houses hang off the fabric */}
        <g className="env-line-faint">
          <path d="M 348 558 L 375 718" fill="none" />
          <path d="M 610 596 L 680 718" fill="none" />
          <path d="M 1010 602 L 1115 390" fill="none" />
          <path d="M 880 610 L 955 700" fill="none" />
          <path d="M 1240 595 L 1315 690" fill="none" />
        </g>

        <NodeHouse x={300} y={718} w={150} h={80} delay={-2.5} />
        <NodeHouse x={600} y={718} w={160} h={80} delay={-5} />
        <NodeHouse x={1040} y={320} w={150} h={70} delay={-7.5} label="env-line-strong" />
        <NodeHouse x={880} y={700} w={150} h={80} delay={-4} />
        <NodeHouse x={1240} y={690} w={150} h={90} delay={-9} />

        {/* Mesh between the uppermost houses */}
        <g className="env-line-faint env-hero-mg-extra">
          <path d="M 1080 390 L 1260 690" fill="none" />
          <path d="M 680 718 L 880 716" fill="none" />
        </g>

        {/* Radar arc — listening on the right */}
        <g className="env-hero-mg-extra systems-nodes" transform="translate(1420, 480)">
          <g className="env-spin-slower">
            <path d="M 0 -150 A 150 150 0 0 1 130 150" fill="none" className="env-accent-soft" />
            <path d="M 0 -88 A 88 88 0 0 1 76 88" fill="none" className="env-line-faint" />
          </g>
          <circle
            className="env-travel env-node-accent"
            r="2.5"
            style={{ offsetPath: 'path("M 0 -150 A 150 150 0 0 1 130 150")' }}
          />
          <line y1="0" y2="96" className="env-line-faint" />
          <circle r="3" className="env-node" />
        </g>
      </g>

      {/* FOREGROUND — the near console and its sweeping scanline */}
      <motion.g style={{ x: fgX, y: fgY }} className="env-layer-fg" data-depth="fg">
        <g className="env-drift-fg systems-flow systems-nodes">
          <g className="systems-flow" transform="translate(1220, 810)">
            <rect className="env-fill-panel-strong" x="0" y="0" width="230" height="150" rx="10" />
            <rect className="env-line-strong" x="0" y="0" width="230" height="150" rx="10" />
            <line x1="16" y1="16" x2="198" y2="16" className="env-accent-soft" />
            <rect x="16" y="30" width="140" height="6" rx="1" className="env-line-strong" />
            <rect x="16" y="54" width="30" height="82" rx="2" className="env-fill-accent" />
            <rect x="56" y="78" width="30" height="58" rx="2" className="env-line" />
            <rect x="96" y="66" width="30" height="70" rx="2" className="env-line" />
            <line x1="16" y1="140" x2="198" y2="140" className="env-line-faint" />
            <rect className="env-accent-soft env-scanline" x="8" y="34" width="214" height="2" opacity="0.4" />
            <circle cx="202" cy="24" r="3" className="env-node-accent env-pulse" />
          </g>

          <g className="systems-nodes">
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