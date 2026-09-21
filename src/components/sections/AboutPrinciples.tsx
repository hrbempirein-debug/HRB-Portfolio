import type { AboutPrinciple } from '../../data/about'

interface AboutPrinciplesProps {
  principles: readonly AboutPrinciple[]
}

/**
 * The approach principles. Grouped under `.about-group` so a pointer hovering
 * the list dims the neighbours while the active principle brightens, shifts
 * its title and clarifies its separator — all via CSS, no pointer state.
 */
export function AboutPrinciples({ principles }: AboutPrinciplesProps) {
  return (
    <ol className="about-group">
      {principles.map((principle) => (
        <li key={principle.id} className="about-principle py-6 md:py-7">
          <div className="flex items-baseline gap-4">
            <span className="about-num text-[11px] tabular-nums leading-none">
              {principle.number}
            </span>
            <h3 className="about-title font-display text-xl font-semibold uppercase tracking-[-0.01em] text-paper md:text-2xl">
              {principle.title}
            </h3>
          </div>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-mist">
            {principle.description}
          </p>
        </li>
      ))}
    </ol>
  )
}