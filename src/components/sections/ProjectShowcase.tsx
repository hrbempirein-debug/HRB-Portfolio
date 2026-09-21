import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import type { Project } from '../../data/projects'
import { cn } from '../../lib/cn'
import { artwork } from '../../lib/artwork'
import type { ArtworkKey } from '../../lib/artwork'
import { AnimatedArtwork } from '../visuals/AnimatedArtwork'

interface ProjectShowcaseProps {
  project: Project
  index: number
  reveal: Variants
  ctaLabel: string
}

function CtaLink({ project, label }: { project: Project; label: string }) {
  const arrow = (
    <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" className="work-cta-arrow" />
  )
  if (project.href) {
    return (
      <a
        href={project.href}
        target="_blank"
        rel="noreferrer"
        className="mt-8 inline-flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-mist transition-colors duration-300 hover:text-paper"
      >
        {label}
        {arrow}
      </a>
    )
  }
  return (
    <span
      aria-disabled="true"
      title="Case study coming soon"
      className="mt-8 inline-flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-dim"
    >
      {label}
      {arrow}
    </span>
  )
}

/**
 * One editorial project spread. Desktop alternates the text column side per
 * project (flip), with the visual stretched against the full text column.
 * On mobile the three blocks simply stack in the intended reading order:
 * meta → title → description → visual → technology → CTA.
 */
export function ProjectShowcase({ project, index, reveal, ctaLabel }: ProjectShowcaseProps) {
  const flip = index % 2 === 1
  const textCol = flip
    ? 'md:col-start-8 md:col-span-5 lg:col-start-9 lg:col-span-4'
    : 'md:col-start-1 md:col-span-5 lg:col-span-4'
  const visualCol = flip
    ? 'md:col-start-1 md:col-span-7'
    : 'md:col-start-6 md:col-span-7'

  return (
    <motion.article
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -15% 0px' }}
      className={cn('work-group')}
      data-project={project.id}
    >
      <div className="flex flex-col gap-y-10 md:grid md:grid-cols-12 md:gap-x-8 md:gap-y-10 lg:gap-x-12">
        <div className={cn(textCol)}>
          <p className="work-meta flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-dim">
            <span className="tabular-nums">{project.number}</span>
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-dim" />
            <span aria-hidden="true" className="h-px w-8 bg-line" />
            <span>{project.category}</span>
          </p>

          <h3 className="work-title mt-7 font-display text-[clamp(1.625rem,3vw,2.5rem)] font-semibold leading-[1.08] tracking-[-0.015em] text-paper">
            {project.title}
          </h3>

          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-mist">
            {project.description}
          </p>
        </div>

        <div
          className={cn(
            'work-visual relative aspect-[8/5] w-full md:row-start-1 md:row-span-2 md:aspect-auto',
            visualCol,
          )}
        >
          <div className="flex h-full w-full items-center">
            {artwork[project.id as ArtworkKey] ? (
              <AnimatedArtwork
                src={artwork[project.id as ArtworkKey]}
                fit="cover"
                personality="work"
                className="h-full w-full"
              />
            ) : (
              <div aria-hidden="true" className="project-visual-placeholder" />
            )}
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent"
          />
        </div>

        <div className={cn(textCol)}>
          <p className="mt-0 text-[11px] uppercase tracking-[0.18em] text-dim">
            <span className="sr-only">Technologies and capabilities</span>
            <span aria-hidden="true" className="opacity-60">
              Technology /
            </span>{' '}
            {project.technologies.join(' · ')}
          </p>
          <CtaLink project={project} label={ctaLabel} />
        </div>
      </div>
    </motion.article>
  )
}