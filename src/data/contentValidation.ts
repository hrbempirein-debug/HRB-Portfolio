import type { CapabilityId } from './capabilities'
import { commitmentCopy } from './commitments'
import { contactCopy } from './contact'
import { projectsCopy } from './projects'
import { testimonialsCopy } from './testimonials'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HREF_RE = /^(https?:\/\/|\/)/
const VALID_TYPES: readonly CapabilityId[] = ['web', 'ai', 'systems']

function assert(ok: boolean, message: string): void {
  if (!ok) throw new Error(`[content] ${message}`)
}

/**
 * Development-time content checks, wired into src/main.tsx behind an
 * `import.meta.env.DEV` guard so production bundles never run (or include)
 * them. Deliberately tiny — no framework. Add one `assert` line when a field
 * becomes launch-critical.
 *
 * Throws with a descriptive message so a broken content edit fails fast in
 * the dev console instead of shipping a malformed page.
 */
export function validateContent(): void {
  const seen = new Set<string>()

  projectsCopy.projects.forEach((project, i) => {
    const where = `projects[${i}] (${project.id || 'no id'})`

    assert(project.id.trim().length > 0, `${where}: id must be non-empty`)
    assert(!seen.has(project.id), `${where}: duplicate project id "${project.id}"`)
    seen.add(project.id)
    assert(project.title.trim().length > 0, `${where}: title must be non-empty`)
    assert(project.description.trim().length > 0, `${where}: description must be non-empty`)
    assert(project.category.trim().length > 0, `${where}: category must be non-empty`)
    assert(
      VALID_TYPES.includes(project.visualType),
      `${where}: invalid visualType "${project.visualType}" (expected one of ${VALID_TYPES.join(', ')})`,
    )
    assert(
      Array.isArray(project.technologies) && project.technologies.length > 0,
      `${where}: technologies must be a non-empty array of strings`,
    )
    assert(
      project.technologies.every((t) => typeof t === 'string' && t.trim().length > 0),
      `${where}: technologies must be non-empty strings`,
    )
    if (project.href) {
      assert(
        HREF_RE.test(project.href) && !project.href.startsWith('#'),
        `${where}: href must be an absolute https:// URL, an http:// URL, or a rooted path (got "${project.href}")`,
      )
    }
  })

  assert(contactCopy.heading.trim().length > 0, 'contact: heading must be non-empty')
  assert(contactCopy.statement.trim().length > 0, 'contact: statement must be non-empty')
  assert(
    EMAIL_RE.test(contactCopy.email.trim()),
    `contact: email must be a valid address (got "${contactCopy.email}")`,
  )

  assert(commitmentCopy.heading.trim().length > 0, 'commitments: heading must be non-empty')
  assert(commitmentCopy.items.length > 0, 'commitments: items must not be empty')
  commitmentCopy.items.forEach((item, i) => {
    const where = `commitments[${i}]`
    assert(item.title.trim().length > 0, `${where}: title must be non-empty`)
    assert(item.description.trim().length > 0, `${where}: description must be non-empty`)
  })

  const seenT = new Set<string>()
  testimonialsCopy.items.forEach((item, i) => {
    const where = `testimonials[${i}] (${item.id || 'no id'})`
    assert(item.id.trim().length > 0, `${where}: id must be non-empty`)
    assert(!seenT.has(item.id), `${where}: duplicate testimonial id "${item.id}"`)
    seenT.add(item.id)
    assert(item.quote.trim().length > 0, `${where}: quote must be non-empty`)
    assert(item.name.trim().length > 0, `${where}: name must be non-empty`)
    assert(item.role.trim().length > 0, `${where}: role must be non-empty`)
  })
}