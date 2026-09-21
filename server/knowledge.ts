/**
 * Knowledge layer — loads the structured portfolio knowledge base.
 *
 * Every fact originates from the JSON files in `knowledge/`, which are
 * grounded in the actual site content (`src/data/*`, `index.html`, `docs/`).
 * Nothing here invents projects, capabilities, clients, or results.
 *
 * Reading via `node:fs` (not static JSON imports) keeps the knowledge layer
 * swappable later (e.g. a database or vector store) without touching the
 * UI, and lets the dev server pick up edits without a rebuild in CI-mode
 * tooling. The production bundle ships the same loader.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export type KnowledgeKind =
  | 'company'
  | 'service'
  | 'capability'
  | 'technology'
  | 'methodology'
  | 'faq'
  | 'contact'
  | 'project'

export interface KnowledgeDoc {
  /** Stable, unique identifier (e.g. `project:hrb-legal-ai`). */
  id: string
  kind: KnowledgeKind
  /** Human-readable label used in the prompt and suggestion traces. */
  topic: string
  /** Search terms used by the retrieval layer. */
  keywords: string[]
  /** Full grounded text handed to the LLM. */
  text: string
  /** Set for project docs. */
  projectId?: string
  /** Content priority boost used by retrieval. */
  priority?: number
}

export interface KnowledgeBase {
  docs: readonly KnowledgeDoc[]
  /** Fallback contact email used by graceful error messages. */
  contactEmail: string | null
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T
}

function buildFromCompany(data: unknown): KnowledgeDoc[] {
  const record = data as {
    name?: string
    tagline?: string
    metaDescription?: string
    positioning?: string
    statement?: string
    focus?: string[]
    principles?: Array<{ title?: string; description?: string }>
    footerLine?: string
  }
  const principles = (record.principles ?? [])
    .map((p) => `\n- ${p.title ?? ''}: ${p.description ?? ''}`)
    .join('')
  const focus = (record.focus ?? []).map((line) => `\n- ${line}`).join('')
  const text = [
    `Name: ${record.name ?? 'HRB'}`,
    `Tagline: ${record.tagline ?? ''}`,
    `Positioning: ${record.positioning ?? ''}`,
    `Statement: ${record.statement ?? ''}`,
    `Focus:${focus}`,
    `Principles:${principles}`,
    `Footer line: ${record.footerLine ?? ''}`,
    `Meta description: ${record.metaDescription ?? ''}`,
  ]
    .filter(Boolean)
    .join('\n')

  return [
    {
      id: 'company',
      kind: 'company',
      topic: 'Company — HRB',
      keywords: [
        'hrb',
        'company',
        'about',
        'who is hrb',
        'what does hrb do',
        'what do you build',
        'what does hrb build',
        'what services do you offer',
        'what can hrb build',
        'hrb services',
        'hrb capabilities',
        'web ai systems',
        'digital systems',
        'building digital systems',
        'digital products',
        'digital experiences',
        'intelligent systems',
        'infrastructure',
        'software',
        'automation',
        'ai solutions',
        'design',
        'hrb law firm and ai solutions',
        'hrb law firm',
        'hrb lawyers',
      ],
      text,
      priority: 2,
    },
  ]
}

function buildFromServices(data: unknown): KnowledgeDoc[] {
  const record = data as {
    services?: Array<{
      id?: string
      name?: string
      description?: string
      keywords?: string[]
      deliverables?: string[]
    }>
  }
  return (record.services ?? []).map((service) => {
    const name = service.name ?? 'Service'
    const deliverables = (service.deliverables ?? []).map((d) => `\n  - ${d}`).join('')
    return {
      id: `service:${service.id ?? name.toLowerCase()}`,
      kind: 'service' as const,
      topic: `Service — ${name}`,
      keywords: [...(service.keywords ?? []), name.toLowerCase(), ...(name.split(/\s+/))],
      text: [
        `Service: ${name}`,
        `Description: ${service.description ?? ''}`,
        `What this covers:${deliverables}`,
      ].join('\n'),
      priority: 1,
    }
  })
}

function buildFromCapabilities(data: unknown): KnowledgeDoc[] {
  const record = data as {
    statement?: string
    capabilities?: Array<{ id?: string; name?: string; description?: string; keywords?: string[] }>
  }
  const statement = record.statement ? [record.statement] : []
  return (record.capabilities ?? []).map((c) => {
    const name = c.name ?? c.id ?? 'Capability'
    return {
      id: `capability:${c.id ?? name.toLowerCase()}`,
      kind: 'capability' as const,
      topic: `Capability — ${name}`,
      keywords: [...(c.keywords ?? []), name.toLowerCase()],
      text: [`Capability: ${name}`, `Description: ${c.description ?? ''}`, ...statement].join(
        '\n',
      ),
      priority: 1,
    }
  })
}

function buildFromTechnology(data: unknown): KnowledgeDoc[] {
  const record = data as {
    portfolioStack?: { name?: string; note?: string; technologies?: string[] }
    projectTechnologies?: Record<string, string[]>
    techs?: Array<{ name?: string; gloss?: string }>
  }
  const docs: KnowledgeDoc[] = []

  const stack = record.portfolioStack
  if (stack) {
    docs.push({
      id: 'technology:portfolio-stack',
      kind: 'technology',
      topic: 'Technology — Portfolio stack',
      keywords: ['react', 'typescript', 'vite', 'tailwind', 'framer motion', 'frontend', 'stack'],
      text: [
        `Technology group: ${stack.name ?? 'Portfolio stack'}`,
        `Technologies: ${(stack.technologies ?? []).join(', ')}`,
        stack.note ? `Note: ${stack.note}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    })
  }

  for (const tech of record.techs ?? []) {
    const name = tech.name ?? 'Technology'
    docs.push({
      id: `technology:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      kind: 'technology',
      topic: `Technology — ${name}`,
      keywords: [name.toLowerCase()],
      text: [`Technology: ${name}`, `About: ${tech.gloss ?? ''}`].join('\n'),
    })
  }

  return docs
}

function buildFromMethodology(data: unknown): KnowledgeDoc[] {
  const record = data as {
    philosophy?: string
    principles?: Array<{ title?: string; description?: string }>
    qualitySignals?: string[]
    howWeMeasure?: string
  }
  const docs: KnowledgeDoc[] = []

  const signals = (record.qualitySignals ?? []).map((s) => `\n- ${s}`).join('')
  docs.push({
    id: 'methodology',
    kind: 'methodology',
    topic: 'Methodology — How HRB works',
keywords: [
        'methodology',
        'approach',
        'how do you work',
        'how do you build',
        'what is your approach',
        'process',
        'principles',
        'philosophy',
        'results',
        'outcomes',
        'quality',
        'how do you measure',
        'clearer workflows',
        'useful intelligence',
        'connected systems',
        'built to move forward',
      ],
    text: [
      `Philosophy: ${record.philosophy ?? ''}`,
      `How work is measured: ${record.howWeMeasure ?? ''}`,
      `Quality signals:${signals}`,
    ]
      .filter(Boolean)
      .join('\n'),
    priority: 1,
  })

  for (const p of record.principles ?? []) {
    const title = p.title ?? 'Principle'
    docs.push({
      id: `methodology:${title.toLowerCase()}`,
      kind: 'methodology',
      topic: `Principle — ${title}`,
      keywords: ['principle', title.toLowerCase()],
      text: [`Principle: ${title}`, `Description: ${p.description ?? ''}`].join('\n'),
    })
  }

  return docs
}

function buildFromFaq(data: unknown): KnowledgeDoc[] {
  const record = data as { faqs?: Array<{ question?: string; answer?: string }> }
  return (record.faqs ?? []).map((faq, index) => {
    const question = faq.question ?? ''
    const tokens = question.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
    return {
      id: `faq:${index + 1}`,
      kind: 'faq' as const,
      topic: `FAQ — ${question}`,
      keywords: ['faq', ...tokens],
      text: [`Question: ${question}`, `Answer: ${faq.answer ?? ''}`].join('\n'),
    }
  })
}

function buildFromContact(data: unknown): { doc: KnowledgeDoc; email: string | null } {
  const record = data as {
    email?: string
    availability?: string
    statement?: string
    engagement?: { path?: string; guidance?: string }
  }
  const email = typeof record.email === 'string' && record.email.trim() ? record.email.trim() : null
  return {
    email,
    doc: {
      id: 'contact',
      kind: 'contact',
      topic: 'Contact — how to reach HRB',
      keywords: [
        'contact',
        'email',
        'hire',
        'reach',
        'get in touch',
        'project',
        'consultation',
        'collaborate',
        'phone',
        'linkedin',
        'who do i contact',
        'who can i talk to',
        'email hrb',
        'work with hrb',
        'hire hrb',
        'reach out',
        'available for',
        'collaborations',
      ],
      text: [
        `Email: ${email ?? 'not available'}`,
        `Open for: ${record.availability ?? ''}`,
        `Statement: ${record.statement ?? ''}`,
        `Engagement path: ${record.engagement?.path ?? ''}`,
        `Guidance: ${record.engagement?.guidance ?? ''}`,
      ]
        .filter(Boolean)
        .join('\n'),
      priority: 1,
    },
  }
}

function buildFromProject(data: unknown): KnowledgeDoc {
  const record = data as {
    id?: string
    name?: string
    category?: string
    summary?: string
    problem?: string
    solution?: string
    features?: string[]
    technologies?: string[]
    targetUsers?: string
    businessApplications?: string[]
    relatedProjects?: string[]
    limitations?: string[]
    status?: string
  }
  const id = record.id ?? 'project-unknown'
  const name = record.name ?? 'Project'
  const list = (label: string, items: string[] | undefined): string =>
    (items ?? []).length
      ? `${label}:${(items ?? []).map((i) => `\n  - ${i}`).join('')}`
      : ''

  return {
    id: `project:${id}`,
    kind: 'project',
    topic: `Project — ${name}`,
    projectId: id,
    keywords: [
      name.toLowerCase(),
      ...(name.split(/\s+/).map((word) => word.toLowerCase())),
      ...(record.category ?? '').toLowerCase().split(/[/\s]+/),
      ...(record.technologies ?? []).map((t) => t.toLowerCase()),
      id.toLowerCase().replace(/-/g, ' '),
    ],
    text: [
      `Project: ${name}`,
      `Category: ${record.category ?? ''}`,
      `Summary: ${record.summary ?? ''}`,
      `Problem: ${record.problem ?? 'Not specified in the public portfolio.'}`,
      `Solution: ${record.solution ?? ''}`,
      list('Features', record.features),
      list('Technologies', record.technologies),
      `Target users: ${record.targetUsers ?? 'Not specified in the public portfolio.'}`,
      list('Business applications', record.businessApplications),
      list('Related projects', record.relatedProjects),
      list('Limitations', record.limitations),
      `Status: ${record.status ?? ''}`,
    ]
      .filter(Boolean)
      .join('\n'),
    priority: 3,
  }
}

/**
 * Build (and cache) the knowledge base from `rootDir/knowledge`.
 * `rootDir` is the project root — the folder that contains `knowledge/`.
 */
export function createKnowledgeBase(rootDir: string): KnowledgeBase {
  const knowledgeDir = join(rootDir, 'knowledge')
  const projectsDir = join(knowledgeDir, 'projects')

  const docs: KnowledgeDoc[] = []
  let contactEmail: string | null = null

  const companyFile = join(knowledgeDir, 'company.json')
  if (existsSync(companyFile)) docs.push(...buildFromCompany(readJson(companyFile)))

  const servicesFile = join(knowledgeDir, 'services.json')
  if (existsSync(servicesFile)) docs.push(...buildFromServices(readJson(servicesFile)))

  const capabilitiesFile = join(knowledgeDir, 'capabilities.json')
  if (existsSync(capabilitiesFile)) docs.push(...buildFromCapabilities(readJson(capabilitiesFile)))

  const technologyFile = join(knowledgeDir, 'technology.json')
  if (existsSync(technologyFile)) docs.push(...buildFromTechnology(readJson(technologyFile)))

  const methodologyFile = join(knowledgeDir, 'methodology.json')
  if (existsSync(methodologyFile)) docs.push(...buildFromMethodology(readJson(methodologyFile)))

  const faqFile = join(knowledgeDir, 'faq.json')
  if (existsSync(faqFile)) docs.push(...buildFromFaq(readJson(faqFile)))

  const contactFile = join(knowledgeDir, 'contact.json')
  if (existsSync(contactFile)) {
    const contact = buildFromContact(readJson(contactFile))
    docs.push(contact.doc)
    contactEmail = contact.email
  }

  if (existsSync(projectsDir)) {
    for (const file of readdirSync(projectsDir).filter((f) => f.endsWith('.json'))) {
      docs.push(buildFromProject(readJson(join(projectsDir, file))))
    }
  }

  return { docs, contactEmail }
}