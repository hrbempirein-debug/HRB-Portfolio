export type CapabilityId = 'web' | 'ai' | 'systems'

export interface Capability {
  id: CapabilityId
  number: string
  title: string
  description: string
  keywords: readonly string[]
}

export const capabilitiesCopy = {
  sectionNumber: '02',
  sectionLabel: 'Capabilities',
  heading: 'WHAT I BUILD',
  statement:
    'I design digital experiences, intelligent systems, and the infrastructure that connects them.',
  capabilities: [
    {
      id: 'web',
      number: '01',
      title: 'Web',
      description:
        'Modern interfaces and production-ready web applications designed around clarity, interaction, performance, and maintainable architecture.',
      keywords: ['Interfaces', 'Responsive', 'Performance'],
    },
    {
      id: 'ai',
      number: '02',
      title: 'AI',
      description:
        'AI-powered products and workflows spanning agentic systems, retrieval, document intelligence, legal research, and grounded automation.',
      keywords: ['Agents', 'Workflows', 'Automation'],
    },
    {
      id: 'systems',
      number: '03',
      title: 'Systems',
      description:
        'The architecture connecting applications, data, APIs, automation, databases, retrieval systems, and intelligent agents into coherent digital products.',
      keywords: ['Architecture', 'Integration', 'Scale'],
    },
  ] as const satisfies readonly Capability[],
} as const