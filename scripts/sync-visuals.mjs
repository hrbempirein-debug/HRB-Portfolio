/**
 * Canonical → mirror sync for hero artwork.
 *
 * public/svg/hero-*.svg are the single source of truth. This script keeps the
 * environment mirrors in public/visuals/{web,ai,systems}/ byte-identical by
 * copying only when content differs (idempotent).
 *
 *   node scripts/sync-visuals.mjs          → copy changed files
 *   node scripts/sync-visuals.mjs --verify → fail if any mirror is stale
 *
 * Mirrors intentionally share the canonical filename so drift is trivial to
 * detect and there is never a second, independently-edited copy of the art.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

const CANONICAL_HOST = join(root, 'public', 'svg')

/** canonical filename → mirror path relative to repo root. */
const MIRRORS = {
  'hero-web.svg': join('public', 'visuals', 'web', 'hero-web.svg'),
  'hero-ai.svg': join('public', 'visuals', 'ai', 'hero-ai.svg'),
  'hero-systems.svg': join('public', 'visuals', 'systems', 'hero-systems.svg'),
}

const verifyMode = process.argv.includes('--verify')
let changed = 0
let drift = 0

for (const [file, rel] of Object.entries(MIRRORS)) {
  const source = join(CANONICAL_HOST, file)
  const mirror = join(root, rel)

  if (!existsSync(source)) {
    console.error(`missing canonical: ${source}`)
    drift += 1
    continue
  }

  const sourceBytes = readFileSync(source)
  const identical = existsSync(mirror) && readFileSync(mirror).equals(sourceBytes)

  if (verifyMode) {
    if (!identical) {
      console.error(`DRIFT: ${rel} differs from canonical ${file}`)
      drift += 1
    } else {
      console.log(`ok: ${rel}`)
    }
    continue
  }

  if (!identical) {
    mkdirSync(dirname(mirror), { recursive: true })
    copyFileSync(source, mirror)
    console.log(`synced: ${rel} <- public/svg/${file}`)
    changed += 1
  } else {
    console.log(`unchanged: ${rel}`)
  }
}

if (verifyMode && drift > 0) {
  console.error(`\n${drift} mirror(s) out of sync. Run: node scripts/sync-visuals.mjs`)
  process.exit(1)
}
if (!verifyMode) {
  console.log(`\n${changed} file(s) copied; mirrors are in sync with public/svg/.`)
}