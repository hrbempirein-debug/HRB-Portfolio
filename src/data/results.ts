export interface ResultItem {
  number: string
  title: string
  description: string
}

export interface ResultsCopy {
  sectionNumber: string
  sectionLabel: string
  heading: string
  supportingHeading: string
  supportingStatement: string
  items: readonly ResultItem[]
}

/**
 * What the systems are designed to accomplish. Positioning statements, not
 * quantified claims — no invented metrics, client counts, or outcomes.
 */
export const resultsCopy: ResultsCopy = {
  sectionNumber: '04',
  sectionLabel: 'Results',
  heading: 'RESULTS THAT MATTER',
  supportingHeading: 'Built Around Your Success',
  supportingStatement:
    'We measure digital work by what it enables — clearer workflows, more capable software, better access to information, and systems that help complex operations move forward.',
  items: [
    {
      number: '01',
      title: 'Clearer Workflows',
      description:
        'Complex processes become easier to understand when information, interfaces, and automation are designed as one connected experience.',
    },
    {
      number: '02',
      title: 'Useful Intelligence',
      description:
        'AI is applied where it can reduce friction, surface useful information, and support decisions without becoming a layer of unnecessary complexity.',
    },
    {
      number: '03',
      title: 'Connected Systems',
      description:
        'Applications, data, APIs, retrieval, automation, and intelligent agents can work together as one coherent digital system.',
    },
    {
      number: '04',
      title: 'Built to Move Forward',
      description:
        'The goal is not simply to ship an interface. It is to create a foundation that can evolve as the product, workflow, and organization grow.',
    },
  ],
}