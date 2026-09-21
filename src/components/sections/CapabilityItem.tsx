import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import type { Capability } from '../../data/capabilities'
import { EASE } from '../../lib/motion'
import { cn } from '../../lib/cn'
import { artwork } from '../../lib/artwork'
import { AnimatedArtwork } from '../visuals/AnimatedArtwork'

interface CapabilityItemProps {
  item: Capability
  index: number
  active: boolean
  dimmed: boolean
  entry: Variants
  onHoverStart: (() => void) | undefined
  onHoverEnd: (() => void) | undefined
}

/**
 * One capability column. The reveal happens on the OUTER article while the
 * hover dim/prominence is animated on the INNER wrapper so the two never
 * fight over the same style property.
 */
export function CapabilityItem({
  item,
  index,
  active,
  dimmed,
  entry,
  onHoverStart,
  onHoverEnd,
}: CapabilityItemProps) {
  return (
    <motion.article
      variants={entry}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      className={cn(
        `cap-tone-${item.id} h-full pt-2`,
        index > 0 && 'md:border-l md:border-line md:pl-10',
      )}
    >
      <motion.div
        animate={{ opacity: dimmed ? 0.55 : 1 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="flex h-full flex-col"
      >
        <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.25em] text-dim">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--cap-accent)' }}
          />
          {item.number}
        </div>

        <motion.h3
          animate={{ y: active ? 4 : 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="mt-7 font-display text-2xl font-semibold tracking-[-0.01em] text-paper md:text-[1.75rem]"
        >
          {item.title}
        </motion.h3>

        <div aria-hidden="true" className="mt-6 h-px w-10 bg-line" />

        <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-mist">
          {item.description}
        </p>

        <div
          className="mt-6 text-[11px] uppercase tracking-[0.18em] text-dim"
          aria-label={`${item.title} focus areas`}
        >
          {item.keywords.join(' · ')}
        </div>

        <motion.div
          animate={{ opacity: active ? 1 : 0.86, y: active ? 2 : 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="mt-10 aspect-[5/3] w-full max-w-[320px]"
        >
          {artwork[item.id] ? (
            <AnimatedArtwork src={artwork[item.id]} className="h-full w-full" />
          ) : (
            <div aria-hidden="true" className="project-visual-placeholder" />
          )}
        </motion.div>
      </motion.div>
    </motion.article>
  )
}