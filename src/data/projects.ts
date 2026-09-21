import type { CapabilityId } from './capabilities'

/**
 * A project's abstract visual + accent tone. The values mirror the capability
 * ids from Section 02, so each showcase reuses a known visual language without
 * importing the hero environments.
 */
export type ProjectVisualType = CapabilityId

export interface Project {
  id: string
  number: string
  category: string
  title: string
  description: string
  /** Technology / capability labels shown under the description. */
  technologies: readonly string[]
  /** Which abstract visual placeholder to render. */
  visualType: ProjectVisualType
  /**
   * Link to the real case study. Omit for placeholders — a project without
   * an href renders a safe, non-interactive CTA state instead of a fake link.
   */
  href?: string
  /** Editorial ordering hint; unused for layout so far. */
  featured?: boolean
}

export interface SelectedWorkCopy {
  sectionNumber: string
  sectionLabel: string
  heading: string
  statement: string
  ctaLabel: string
  projects: readonly Project[]
}

/**
 * Real, factual projects. No client names, metrics, awards or claims — and no
 * `href` until a genuine public case-study URL exists.
 */
export const projectsCopy: SelectedWorkCopy = {
  sectionNumber: '03',
  sectionLabel: 'Selected Work',
  heading: 'SELECTED WORK',
  statement:
    "A small selection of digital experiences, intelligent products, and systems I've built.",
  ctaLabel: 'View case study',
  projects: [
    {
      id: 'project-legal-ai',
      number: '01',
      category: 'AI / LEGAL TECHNOLOGY',
      title: 'HRB Legal AI',
      description:
        'An agentic legal AI platform designed for Pakistan-focused legal research, case-law discovery, document intelligence, grounded retrieval, and human-reviewed legal workflows.',
      technologies: ['Python', 'FastAPI', 'PostgreSQL', 'pgvector', 'RAG', 'Agentic AI', 'MCP'],
      visualType: 'ai',
      featured: true,
    },
    {
      id: 'project-legal-reader',
      number: '02',
      category: 'DOCUMENT INTELLIGENCE',
      title: 'HRB Legal Reader',
      description:
        'A legal document intelligence workflow focused on making complex and difficult-to-read legal documents more accessible through document processing, OCR, structured extraction, and AI-assisted understanding.',
      technologies: ['OCR', 'Document Intelligence', 'Python', 'AI', 'RAG'],
      visualType: 'ai',
    },
    {
      id: 'project-digital-systems',
      number: '03',
      category: 'DIGITAL SYSTEMS',
      title: 'HRB Digital Systems',
      description:
        'A broader digital systems practice combining modern web applications, AI-powered workflows, automation, structured content systems, and production-oriented software architecture.',
      technologies: ['React', 'TypeScript', 'Vite', 'AI', 'Automation', 'System Architecture'],
      visualType: 'systems',
    },
  ],
}