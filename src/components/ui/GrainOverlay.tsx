const GRAIN_SVG = [
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>",
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter>",
  "<rect width='180' height='180' filter='url(#n)' opacity='0.85'/>",
  '</svg>',
].join('')

const GRAIN_IMAGE = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`

/** Subtle cinematic grain, tiled and GPU-cheap (pure background-image). */
export function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
      style={{ backgroundImage: GRAIN_IMAGE }}
    />
  )
}