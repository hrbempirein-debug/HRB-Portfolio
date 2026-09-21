import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useSmoothPointer } from '../../hooks/useSmoothPointer'
import { cn } from '../../lib/cn'

/**
 * AnimatedArtwork — the body-section visual treatment.
 *
 * Source pixel artwork (public/source-art/*.png) is displayed as-is and only
 * animated. Every layer is transform/opacity only, driven by the project's
 * existing shared pointer store (`useSmoothPointer` / `lib/pointer.ts`) and
 * one Framer scroll listener — no new rAF loops, no second animation engine,
 * no layout-property animation. The PNG is never inspected, retraced,
 * converted or re-rendered; it stays an opaque asset.
 *
 * Layers (back → front):
 *   0. Entrance            — one settling-in choreography when visible.
 *   1. Atmospheric glow    — faint ambient haze that responds to pointer
 *                            proximity and, on "work", hover.
 *   2. Artwork layer       — ambient float + breath (existing), pointer
 *                            drift with a softened response curve, and a
 *                            cinematic internal hover zoom (frame stable).
 *   3. Soft reflection     — a very faint travelling light on glass.
 *   4. Cursor light        — a diffuse highlight that lags the pointer
 *                            slightly and only materialises on approach.
 *
 * Activation model: a single proximity scalar (from the shared pointer vs
 * this artwork's frame, spring-smoothed) fades cursor light in, boosts the
 * glow, and ramps pointer drift as the pointer nears — and relaxes back on
 * departure. On "work" artwork, hovering bumps that scalar, so light, glow
 * and drift intensify together with the internal zoom.
 *
 * Tablet scales ambience; coarse/mobile pointers get no cursor effects;
 * `prefers-reduced-motion` returns a completely static image.
 */

interface AnimatedArtworkProps {
  className?: string
  /** Source still under public/. */
  src: string
  /** `contain` shows the whole artwork; `cover` fills the frame edge-to-edge. */
  fit?: 'contain' | 'cover'
  /** Editorial flavor: selects the animation character. */
  personality?: 'capability' | 'work' | 'about'
}

type Tier = 'desktop' | 'tablet' | 'mobile'
type Personality = 'capability' | 'work' | 'about'

const TIER_MOTION: Record<Tier, { ambient: number; parallax: number }> = {
  desktop: { ambient: 1, parallax: 1 },
  tablet: { ambient: 0.65, parallax: 0.5 },
  mobile: { ambient: 0.45, parallax: 0 },
}

const FLOAT_PX = { x: 6, y: 4 }
const SCALE_PEAK = 0.025
const PARALLAX_PX = { x: 8, y: 5 }

/** Snappy physical spring for the internal hover zoom. */
const HOVER_SPRING = { type: 'spring', stiffness: 240, damping: 30 } as const
/** Laminar lag for the cursor light — it trails the pointer very slightly. */
const LIGHT_LAG = { stiffness: 90, damping: 22, mass: 1.6 } as const
/** Smooths the proximity activation in/out so nothing snaps. */
const ACTIVATE_SPRING = { stiffness: 150, damping: 26, mass: 1.1 } as const
/** Entrance "settling into the page" spring. */
const ENTRANCE_SPRING = { type: 'spring', stiffness: 120, damping: 24, mass: 1 } as const

interface ArtworkPersonality {
  float: number
  floatMs: number
  breathScale: number
  breathMs: number
  /** Half of the maximum rotateX/rotateY range, in degrees (max 2). */
  tilt: number
  rootTranslate: number
  parallax: number
  light: number
  lightRange: number
  glow: number
  glowReach: number
  scan: number
  scrollTravel: number
  /** Entrance settle distance in px. */
  entrance: number
  /** Set for "work": internal hover zoom scale (container stays stable). */
  hoverScale: number | null
}

const PERSONALITY: Record<Personality, ArtworkPersonality> = {
  capability: {
    float: 1,
    floatMs: 26,
    breathScale: 0.025,
    breathMs: 16,
    tilt: 0.5,
    rootTranslate: 3,
    parallax: 0.8,
    light: 0.55,
    lightRange: 44,
    glow: 0.5,
    glowReach: 0.6,
    scan: 0.8,
    scrollTravel: 8,
    entrance: 12,
    hoverScale: null,
  },
  work: {
    float: 1,
    floatMs: 24,
    breathScale: 0.03,
    breathMs: 15,
    tilt: 0.82,
    rootTranslate: 4,
    parallax: 1.1,
    light: 0.85,
    lightRange: 62,
    glow: 0.85,
    glowReach: 0.9,
    scan: 0.9,
    scrollTravel: 11,
    entrance: 14,
    hoverScale: 1.035,
  },
  about: {
    float: 0.55,
    floatMs: 32,
    breathScale: 0.015,
    breathMs: 22,
    tilt: 0.3,
    rootTranslate: 2,
    parallax: 0.5,
    light: 0.35,
    lightRange: 28,
    glow: 0.45,
    glowReach: 0.4,
    scan: 0.6,
    scrollTravel: 7,
    entrance: 10,
    hoverScale: null,
  },
}

const GLOW_RADIAL =
  'radial-gradient(circle at 50% 50%, rgb(152 180 205 / 0.5) 0%, transparent 64%)'
const LIGHT_RADIAL =
  'radial-gradient(circle at 50% 50%, rgb(255 255 255 / 0.22) 0%, transparent 65%)'

/* Soft-step easing for the activation ramps. */
function softstep(t: number): number {
  const c = t < 0 ? 0 : t > 1 ? 1 : t
  return c * c * (3 - 2 * c)
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/* Softer near the resting position, stronger toward the centre-to-edge. */
function edgeResponse(dev: number): number {
  const amp = Math.min(1, Math.abs(dev))
  return 0.35 + 0.65 * amp
}

/** Deterministic per-instance phase seed — stable between renders. */
function hashSeed(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 1000) / 1000
}

function getTier(): Tier {
  if (typeof window === 'undefined') return 'desktop'
  if (window.matchMedia('(min-width: 1024px)').matches) return 'desktop'
  if (window.matchMedia('(min-width: 768px)').matches) return 'tablet'
  return 'mobile'
}

function useResponsiveTier(): Tier {
  const [tier, setTier] = useState<Tier>(getTier)
  useEffect(() => {
    const queries = [
      window.matchMedia('(min-width: 1024px)'),
      window.matchMedia('(min-width: 768px)'),
    ]
    const sync = (): void => setTier(getTier())
    queries.forEach((query) => query.addEventListener('change', sync))
    return () => queries.forEach((query) => query.removeEventListener('change', sync))
  }, [])
  return tier
}

interface FrameRect {
  cx: number
  docCy: number
  halfW: number
  halfH: number
}

export function AnimatedArtwork({
  className,
  src,
  fit = 'contain',
  personality = 'capability',
}: AnimatedArtworkProps) {
  const reduced = useReducedMotion()
  const tier = useResponsiveTier()
  const { smoothNx, smoothNy, smoothX, smoothY, interactive } = useSmoothPointer()

  const frameRef = useRef<HTMLDivElement>(null)
  const rectRef = useRef<FrameRect | null>(null)
  const hoverRef = useRef(0)
  const persona = PERSONALITY[personality]
  const factor = TIER_MOTION[tier]

  // Deterministic timing desync so sibling artworks never move in sync.
  const seed = useMemo(() => hashSeed(src), [src])

  // Fine-pointer desktop/tablet cursor effects only.
  const cursorEnabled = interactive && factor.parallax > 0
  const ambient = factor.ambient
  const feel = cursorEnabled ? factor.parallax : 0

  // Scroll depth — one Framer scroll listener, ease-transformed Y drift.
  // Cubic-bezier solution of the EASE curve (x1=.22 y1=1 x2=.36 y2=1). Monotone, no overshoot.
  const eased05 = useCallback((t: number, x1: number, y1: number, x2: number, y2: number): number => {
    let u = t
    for (let i = 0; i < 6; i++) {
      const u2 = u * u
      const u3 = u2 * u
      const cx = 3 * x1 * u * (1 - u) * (1 - u) + 3 * x2 * u2 * (1 - u) + u3
      const dx = 3 * x1 * (1 - u) * (1 - u) + 6 * (x2 - x1) * u * (1 - u) + 3 * (1 - x2) * u2
      const err = cx - t
      if (Math.abs(err) < 1e-6) break
      u -= err / Math.max(1e-6, dx)
    }
    const u2 = u * u
    const u3 = u2 * u
    return 3 * y1 * u * (1 - u) * (1 - u) + 3 * y2 * u2 * (1 - u) + u3
  }, [])
  const { scrollY, scrollYProgress } = useScroll({
    target: frameRef,
    offset: ['start end', 'end start'],
  })
  const scrollDepth = useTransform(scrollYProgress, (p): number => {
    const tri = p < 0.5 ? p * 2 : (1 - p) * 2
    return (1 - eased05(tri, 0.22, 1, 0.36, 1)) * persona.scrollTravel
  })

  // Activation scalar — pointer proximity to this artwork + hover accent.
  const proxMotion = useMotionValue(0)
  const activation = useSpring(proxMotion, ACTIVATE_SPRING)

  const recompute = useCallback((): void => {
    const rect = rectRef.current
    if (!rect) return
    const dx = smoothX.get() - rect.cx
    const dy = smoothY.get() - (rect.docCy - scrollY.get())
    const d = Math.hypot(dx / rect.halfW, dy / rect.halfH)
    const base = clamp01(1.3 - d * 0.8)
    proxMotion.set(clamp01(base + hoverRef.current * 0.55))
  }, [proxMotion, scrollY, smoothX, smoothY])
  useMotionValueEvent(smoothX, 'change', recompute)
  useMotionValueEvent(smoothY, 'change', recompute)
  useMotionValueEvent(scrollY, 'change', recompute)

  useLayoutEffect(() => {
    const el = frameRef.current
    if (!el) return
    const measure = (): void => {
      const rect = el.getBoundingClientRect()
      rectRef.current = {
        cx: rect.left + rect.width / 2,
        docCy: rect.top + scrollY.get() + rect.height / 2,
        halfW: Math.max(1, rect.width / 2),
        halfH: Math.max(1, rect.height / 2),
      }
      recompute()
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recompute, scrollY])

  const onHoverStart = (): void => {
    hoverRef.current = 1
    recompute()
  }
  const onHoverEnd = (): void => {
    hoverRef.current = 0
    recompute()
  }

  // Atmospheric glow — base haze, boosted gently by proximity/hover.
  const glowBase = 0.045 * persona.glow * ambient

  // Reactive ramps chained from the activation scalar (smooth, no snap).
  const driftRamp = useTransform(activation, (p) => 0.06 + 0.94 * softstep(p))
  const glowOpacity = useTransform(
    activation,
    (p) => (cursorEnabled ? glowBase * (1 + 0.45 * softstep(p) * persona.glowReach) : glowBase),
  )

  const lightOpacity = useTransform(
    activation,
    (p) => 0.1 * persona.light * ambient * (cursorEnabled ? 1 : 0) * softstep(p),
  )

  // Depth parallax — rotateX/rotateY (≤±2°) with a softened response curve,
  // ramping up as the pointer approaches and easing back on departure.
  const tiltBump = persona.hoverScale ? 1 + 0.12 * hoverRef.current : 1
  const rotateX = useTransform(smoothNy, (v) => {
    const dev = (v - 0.5) * 2
    return -dev * persona.tilt * tiltBump * feel * edgeResponse(dev) * driftRamp.get()
  })
  const rotateY = useTransform(smoothNx, (v) => {
    const dev = (v - 0.5) * 2
    return dev * persona.tilt * tiltBump * feel * edgeResponse(dev) * driftRamp.get()
  })
  const pointerRootX = useTransform(smoothNx, (v) => {
    const dev = (v - 0.5) * 2
    return dev * persona.rootTranslate * feel * edgeResponse(dev) * driftRamp.get()
  })

  // Artwork-layer parallax — drift inside the stable frame.
  const parallaxX = useTransform(smoothNx, (v) => {
    const dev = (v - 0.5) * 2
    return dev * PARALLAX_PX.x * factor.parallax * persona.parallax * (cursorEnabled ? 1 : 0) * edgeResponse(dev) * driftRamp.get()
  })
  const parallaxY = useTransform(smoothNy, (v) => {
    const dev = (v - 0.5) * 2
    return dev * PARALLAX_PX.y * factor.parallax * persona.parallax * (cursorEnabled ? 1 : 0) * edgeResponse(dev) * driftRamp.get()
  })

  // Cursor light — a slightly lagging, diffuse highlight from the shared
  // pointer. Position lags via a damped spring chain.
  const lightX = useSpring(
    useTransform(smoothNx, (v) => (v - 0.5) * 2 * persona.lightRange * feel * edgeResponse((v - 0.5) * 2)),
    LIGHT_LAG,
  )
  const lightY = useSpring(
    useTransform(smoothNy, (v) => (v - 0.5) * 2 * persona.lightRange * 0.55 * feel * edgeResponse((v - 0.5) * 2)),
    LIGHT_LAG,
  )

  const image = (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
      className={cn('h-full w-full select-none', fit === 'cover' ? 'object-cover' : 'object-contain')}
    />
  )

  // Reduced motion — a completely static image.
  if (reduced) {
    return (
      <div aria-hidden="true" className={cn('relative overflow-hidden', className)}>
        {image}
      </div>
    )
  }

  // Deterministic duration desync (stable per source, not random at runtime).
  const floatMs = persona.floatMs * (0.9 + 0.2 * seed)
  const breathMs = persona.breathMs * (0.9 + 0.2 * seed)

  const floatX = FLOAT_PX.x * persona.float * ambient
  const floatY = FLOAT_PX.y * persona.float * ambient
  const scalePeak = 1 + SCALE_PEAK * persona.breathScale * ambient
  const scanOpacity = 0.03 * persona.scan * (tier === 'mobile' ? 0.5 : 1)

  // Work-only cinematic hover zoom handled by the artwork layer's own variants
  // so the card/container frame never moves (transform-only, no layout shift).
  const hoverVariants: Variants | undefined = persona.hoverScale
    ? {
        hover: {
          scale: persona.hoverScale,
          transition: HOVER_SPRING,
        },
      }
    : undefined

  return (
    <motion.div
      ref={frameRef}
      aria-hidden="true"
      onHoverStart={persona.hoverScale ? onHoverStart : undefined}
      onHoverEnd={persona.hoverScale ? onHoverEnd : undefined}
      className={cn('relative overflow-hidden', className)}
    >
      {/* 0. Entrance — settle once into the page, never replay. */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0.45, y: persona.entrance, scale: 0.985 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '0px 0px -12% 0px' }}
        transition={ENTRANCE_SPRING}
      >
        {/* Frame — depth tilt, scroll depth and pointer drift. Stable clip box. */}
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={{
            x: pointerRootX,
            y: scrollDepth,
            rotateX,
            rotateY,
            transformPerspective: 1000,
            transformOrigin: '50% 50%',
          }}
        >
          {/* 1. Atmospheric glow — faint haze, brighter as the pointer nears. */}
          <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ opacity: glowOpacity }}>
            <div className="h-full w-full" style={{ background: GLOW_RADIAL }} />
          </motion.div>

          {/* 2. Artwork layer — ambient float + breath, internal pointer drift
               and cinematic hover zoom (frame stays stable). */}
          <motion.div
            className="relative h-full w-full will-change-transform"
            style={{ x: parallaxX, y: parallaxY }}
            variants={hoverVariants}
            whileHover={persona.hoverScale ? 'hover' : undefined}
          >
            <motion.div
              className="h-full w-full"
              animate={{
                x: [0, floatX, 0, -floatX, 0],
                y: [0, floatY, 0, -floatY, 0],
                scale: [1, scalePeak, 1],
                opacity: [0.94, 1, 0.94],
              }}
              transition={{
                x: { duration: floatMs, ease: 'easeInOut', repeat: Infinity },
                y: { duration: floatMs, ease: 'easeInOut', repeat: Infinity },
                scale: { duration: breathMs, ease: 'easeInOut', repeat: Infinity },
                opacity: { duration: breathMs, ease: 'easeInOut', repeat: Infinity },
              }}
            >
              {image}

              {/* 3. Soft reflection — faint, broad, slow light on glass. */}
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ opacity: scanOpacity }}
                animate={{ x: ['-115%', '115%'] }}
                transition={{
                  duration: 34,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
              >
                <div
                  className="h-full w-full"
                  style={{
                    background:
                      'linear-gradient(100deg, transparent 26%, rgb(255 255 255 / 0.045) 50%, transparent 74%)',
                  }}
                />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* 4. Cursor light — diffuse highlight, appears as the pointer nears. */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ x: lightX, y: lightY, opacity: lightOpacity }}
          >
            <div className="h-full w-full" style={{ background: LIGHT_RADIAL }} />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}