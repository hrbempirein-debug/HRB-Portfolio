/**
 * Page-awareness helpers for the assistant: detects which project showcase
 * the visitor is currently viewing and derives contextual suggestions.
 *
 * Detection is zero-render: it observes the existing project article elements
 * (each carries `data-project`) without touching their markup, styles, or
 * behaviour.
 */

/** DOM project ids from `src/data/projects.ts`. */
export type ActiveProject =
  | 'project-legal-ai'
  | 'project-legal-reader'
  | 'project-digital-systems'
  | null

/** Map DOM id → knowledge-base slug sent to the server. */
const PROJECT_SLUG: Record<Exclude<ActiveProject, null>, string> = {
  'project-legal-ai': 'hrb-legal-ai',
  'project-legal-reader': 'hrb-legal-reader',
  'project-digital-systems': 'hrb-digital-systems',
}

export function projectSlug(active: ActiveProject): string | null {
  return active ? PROJECT_SLUG[active] : null
}

const DEFAULT_SUGGESTIONS = [
  'What does HRB build?',
  'What services do you offer?',
  'What AI systems do you build?',
  'Tell me about your projects.',
]

const SUGGESTIONS: Record<Exclude<ActiveProject, null>, string[]> = {
  'project-legal-ai': [
    'What is HRB Legal AI?',
    'What problem does it solve?',
    'What technologies power it?',
    'How does its grounded legal AI approach work?',
  ],
  'project-legal-reader': [
    'What is HRB Legal Reader?',
    'How does it process legal documents?',
    'What role does OCR play?',
    'How is AI used in the workflow?',
  ],
  'project-digital-systems': [
    'What is HRB Digital Systems?',
    'What kinds of systems does HRB build?',
    'How do AI and automation fit into the system?',
    'What technologies are used?',
  ],
}

/** Short display name for the active project, used in prompts and labels. */
const PROJECT_LABEL: Record<Exclude<ActiveProject, null>, string> = {
  'project-legal-ai': 'HRB Legal AI',
  'project-legal-reader': 'HRB Legal Reader',
  'project-digital-systems': 'HRB Digital Systems',
}

export function suggestedQuestions(active: ActiveProject): string[] {
  return active ? SUGGESTIONS[active] : DEFAULT_SUGGESTIONS
}

/** Friendly label for the page the visitor is viewing, or null when generic. */
export function projectLabel(active: ActiveProject): string | null {
  return active ? PROJECT_LABEL[active] : null
}

/**
 * Observe the project showcase articles and report the one most in view.
 * Returns an unsubscribe function.
 */
export function watchActiveProject(onChange: (active: ActiveProject) => void): () => void {
  const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-project]'))
  if (elements.length === 0) return () => undefined

  let current: ActiveProject = null

  const observer = new IntersectionObserver(
    (entries) => {
      let best: ActiveProject = null
      let bestRatio = 0
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
          bestRatio = entry.intersectionRatio
          best = entry.target.getAttribute('data-project') as ActiveProject
        }
      }
      if (best && best !== current) {
        current = best
        onChange(best)
      }
    },
    { threshold: [0.15, 0.45, 0.8], rootMargin: '-20% 0px -20% 0px' },
  )

  elements.forEach((el) => observer.observe(el))
  return () => observer.disconnect()
}