import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { contactCopy } from '../../data/contact'
import { EASE } from '../../lib/motion'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const headerStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
}

const bodyStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
}

const REVEAL_VIEWPORT = { once: true, margin: '0px 0px -15% 0px' } as const

/**
 * SECTION 07 — CONTACT / CLOSING CTA.
 *
 * The final statement of the homepage: a large, calm closing frame that asks
 * a single question — "start a conversation" — without a conventional form.
 * The headline stays below the hero's rightfully larger scale.
 */
export function ContactSection() {
  const {
    sectionNumber,
    sectionLabel,
    heading,
    statement,
    emailLabel,
    email,
    availabilityLabel,
    availability,
  } = contactCopy

  const sectionRef = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  // Subtle 1–2% scroll counter-drift on the artwork only — otherwise static.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const artY = useTransform(scrollYProgress, [0, 1], [20, -20])

  return (
    <section
      id="contact"
      ref={sectionRef}
      aria-labelledby="contact-heading"
      className="relative scroll-mt-24 overflow-hidden border-t border-line bg-ink"
    >
      {/* Closer, quieter tonal shift — the page is winding down */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            'radial-gradient(46% 38% at 26% 0%, rgb(152 180 205 / 3%) 0%, transparent 64%)',
            'linear-gradient(to bottom, var(--color-ink-soft) 0%, var(--color-ink) 26%, var(--color-ink) 100%)',
          ].join(', '),
        }}
      />

      {/* Artwork layer — dark architectural band behind the content.
          Mobile: full-width subtle band near the bottom. Desktop: right-aligned,
          object-position right preserves the right-side structure; the mask
          feathers the band's left edge only, so the artwork never meets the
          text stiffly and the content stays readable. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-0 h-[30vh] w-full scale-[1.02] md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-[52%] md:scale-[1.03] md:[mask-image:linear-gradient(to_right,transparent_0%,#000_30%,#000_100%)]">
          <motion.img
            src="/source-art/a_wide_dark_cinematic_abstract_3d_digital_art_sc.png.png"
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            style={reduced ? undefined : { y: artY }}
            className="h-full w-full object-cover object-bottom opacity-35 md:object-right md:opacity-90"
          />
        </div>
      </div>

      <div className="container-hero relative pb-40 pt-16 md:pb-64 md:pt-24">
        <motion.div
          variants={headerStagger}
          initial="hidden"
          whileInView="show"
          viewport={REVEAL_VIEWPORT}
        >
          <motion.p
            variants={fadeUp}
            className="flex items-center gap-4 text-[11px] uppercase tracking-[0.35em] text-dim"
          >
            <span className="tabular-nums">{sectionNumber}</span>
            <span aria-hidden="true" className="h-px w-8 bg-line" />
            <span>{sectionLabel}</span>
          </motion.p>

          <motion.h2
            variants={fadeUp}
            id="contact-heading"
            className="mt-7 max-w-[13ch] font-display text-[clamp(2.5rem,7vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-paper md:text-[clamp(3.25rem,6.5vw,5.5rem)] lg:text-[clamp(3.75rem,6.25vw,6rem)]"
          >
            {heading}
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mt-8 max-w-2xl font-display text-[clamp(1.25rem,2.2vw,1.6rem)] leading-[1.35] tracking-[-0.01em] text-mist"
          >
            {statement}
          </motion.p>
        </motion.div>

        <motion.div
          variants={bodyStagger}
          initial="hidden"
          whileInView="show"
          viewport={REVEAL_VIEWPORT}
          className="mt-16 grid gap-16 md:mt-28 md:grid-cols-12 md:gap-10 lg:gap-16"
        >
          <motion.div variants={fadeUp} className="md:col-start-1 md:col-span-5">
            <div className="border-t border-line pt-5">
              <p className="text-[11px] uppercase tracking-[0.35em] text-dim">
                {emailLabel}
              </p>
              <a
                href={`mailto:${email}`}
                className="mt-1.5 inline-flex items-center gap-2 font-display text-xl text-paper underline-offset-4 transition-colors hover:text-lite hover:underline md:text-2xl"
              >
                {email}
                <ArrowUpRight size={18} strokeWidth={1.75} aria-hidden="true" />
              </a>
            </div>

            <div className="mt-10 border-t border-line pt-5 md:mt-12">
              <p className="text-[11px] uppercase tracking-[0.35em] text-dim">
                {availabilityLabel}
              </p>
              <p className="mt-1.5 max-w-sm text-[15px] leading-relaxed text-mist">
                {availability}
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}