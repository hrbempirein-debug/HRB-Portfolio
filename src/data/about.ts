export interface AboutPrinciple {
  id: string
  number: string
  title: string
  description: string
}

export interface AboutCopy {
  sectionNumber: string
  sectionLabel: string
  heading: string
  statement: string
  /** Personal introduction — one paragraph per entry. */
  introduction: readonly string[]
  principles: readonly AboutPrinciple[]
}

/**
 * Philosophy and approach, not biography. No fabricated claims — every line
 * describes the actual work: practical, grounded and production-oriented.
 */
export const aboutCopy: AboutCopy = {
  sectionNumber: '06',
  sectionLabel: 'About',
  heading: 'ABOUT / APPROACH',
  statement: 'I build at the intersection of design, software, and intelligent systems.',
  introduction: [
    'HRB focuses on building practical digital systems where thoughtful interface design, modern software engineering, artificial intelligence, and automation work together.',
    'The work spans web platforms, legal technology, document intelligence, agentic AI, and production-oriented system architecture.',
  ],
  principles: [
    {
      id: 'clarity',
      number: '01',
      title: 'Clarity',
      description:
        'Complex systems should remain understandable. Interfaces, workflows, and information should communicate their purpose without unnecessary friction.',
    },
    {
      id: 'intelligence',
      number: '02',
      title: 'Intelligence',
      description:
        'AI should solve useful problems rather than exist as decoration. The focus is on grounded, practical intelligence that supports real workflows.',
    },
    {
      id: 'systems',
      number: '03',
      title: 'Systems',
      description:
        'Strong products depend on the architecture behind them. Data, APIs, retrieval, automation, agents, and interfaces should work as one coherent system.',
    },
    {
      id: 'craft',
      number: '04',
      title: 'Craft',
      description:
        'Technical depth and visual quality belong together. Details in interaction, performance, structure, and implementation shape the final experience.',
    },
  ],
}