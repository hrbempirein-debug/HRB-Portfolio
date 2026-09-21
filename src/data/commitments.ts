/**
 * SECTION 05 — WHAT USEFUL TECHNOLOGY SHOULD ENABLE.
 *
 * Positioning commitments grounded in the portfolio's actual methodology and
 * published work. No invented clients, quotes, names, or metrics: verified
 * feedback and measured results will only be added when authorized source
 * material exists (see docs/CONTENT_REQUIREMENTS.md).
 */
export interface Commitment {
  number: string
  title: string
  description: string
}

export interface CommitmentCopy {
  sectionNumber: string
  sectionLabel: string
  heading: string
  statement: string
  itemsLabel: string
  items: readonly Commitment[]
}

export const commitmentCopy: CommitmentCopy = {
  sectionNumber: '05',
  sectionLabel: 'Clients & Partners',
  heading: 'WHAT USEFUL TECHNOLOGY SHOULD ENABLE',
  statement:
    'The strongest measure of useful technology is the experience it creates for the people who use it.',
  itemsLabel: 'WHAT MATTERS',
  items: [
    {
      number: '01',
      title: 'Work That Stays Understandable',
      description:
        'Complex systems communicate their purpose. Interfaces, workflows, and information are designed to remove friction rather than add it.',
    },
    {
      number: '02',
      title: 'Intelligence That Can Be Trusted',
      description:
        'Answers are grounded in source material through retrieval, and legal workflows are human-reviewed — practical intelligence over decoration.',
    },
    {
      number: '03',
      title: 'Built Around the Work',
      description:
        'Technology is built around the actual workflow: thoughtful design, modern engineering, AI, and automation working together in one system.',
    },
  ],
}