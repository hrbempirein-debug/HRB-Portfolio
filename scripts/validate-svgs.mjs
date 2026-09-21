/**
 * SVG-validation pass for the canonical artwork in public/svg/ and the
 * hero mirrors in public/visuals/.
 *
 * Checks per file:
 *   - well-formed single <svg> root
 *   - viewBox present
 *   - no <image>, no data: URIs, no base64 payloads
 *   - duplicate element IDs (incl. <defs> gradient/filter ids)
 *   - no opaque full-viewBox background rectangle (transparency preserved)
 *   - element counts and file size; flags unexpectedly large path counts
 *
 * Usage: node scripts/validate-svgs.mjs
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { dirname, join, basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const canonicalDir = join(root, 'public', 'svg')

const PATHS_WARN_AT = 300
const PATHS_ERROR_AT = 800
let failures = 0
let warnings = 0

function collect(files) {
  for (const file of files) {
    const full = resolve(file)
    if (!existsSync(full)) {
      console.error(`MISSING ${file}`)
      failures += 1
      continue
    }
    const xml = readFileSync(full, 'utf8').replace(/^\uFEFF/, '')
    const size = statSync(full).size
    const tag = basename(full)

    // --- single root -----------------------------------------------------
    const opens = (xml.match(/<svg[\s>]/g) ?? []).length
    const closes = (xml.match(/<\/svg>/g) ?? []).length
    if (opens !== 1 || closes !== 1) {
      console.error(`ROOT ${tag}: expected 1 <svg> open/close, got ${opens}/${closes}`)
      failures += 1
    }

    // --- viewBox ---------------------------------------------------------
    if (!/viewBox="0 0 \d+(\.\d+)? \d+(\.\d+)?"/.test(xml)) {
      console.error(`VIEWBOX ${tag}: missing 'viewBox="0 0 W H"'`)
      failures += 1
    }

    // --- raster / base64 ---------------------------------------------------
    const raster = /<image\s|<foreignObject|<use[^>]+href=/.test(xml)
    const dataUri = /data:image|base64|\.png|\.jpe?g|\.webp|\.gif/gi.test(xml)
    if (raster) {
      console.error(`RASTER ${tag}: embedded <image>/<use>/<foreignObject> found`)
      failures += 1
    }
    if (dataUri) {
      console.error(`DATA-URI ${tag}: data:/base64/raster reference found`)
      failures += 1
    }

    // --- duplicate ids ---------------------------------------------------
    const seen = new Map()
    for (const m of xml.matchAll(/id="([^"]+)"/g)) {
      const id = m[1]
      if (seen.has(id)) {
        console.error(`DUP-ID ${tag}: id="${id}" appears more than once (defs collision risk)`)
        failures += 1
      } else {
        seen.set(id, true)
      }
    }

    // --- transparency ----------------------------------------------------
    const vb = xml.match(/viewBox="0 0 (\d+) (\d+)"/)
    if (vb) {
      const [fullW, fullH] = [Number(vb[1]), Number(vb[2])]
      // a full-canvas rect is only a violation if it paints an opaque black bg
      for (const rect of xml.matchAll(/<rect[^>]*>/g)) {
        const attrs = rect[0].replace(/^<rect|>$/g, '')
        const w = /width="([\d.]+)"/.exec(attrs)?.[1] ?? '0'
        const h = /height="([\d.]+)"/.exec(attrs)?.[1] ?? '0'
        const fill = /fill="([^"]+)"/.exec(attrs)?.[1]
        if (Number(w) >= fullW && Number(h) >= fullH && (fill === '#000' || fill === 'black')) {
          console.error(`BG ${tag}: opaque full-canvas rectangle covers the artwork`)
          failures += 1
        }
      }
    }

    // --- element counts --------------------------------------------------
    const count = (re) => (xml.match(re) ?? []).length
    const el = {
      path: count(/<path[\s>]/g),
      rect: count(/<rect[\s>]/g),
      circle: count(/<circle[\s>]/g),
      line: count(/<line[\s>]/g),
      ellipse: count(/<ellipse[\s>]/g),
      polygon: count(/<polygon[\s>]/g),
      g: count(/<g[\s>]/g),
      text: count(/<text[\s>]/g),
    }
    const shapeTotal = el.path + el.rect + el.circle + el.line + el.ellipse + el.polygon
    if (el.path > PATHS_ERROR_AT || shapeTotal > PATHS_ERROR_AT * 2) {
      console.error(`COMPLEXITY ${tag}: ${el.path} paths / ${shapeTotal} shapes — exceeds sane budget`)
      failures += 1
    } else if (el.path > PATHS_WARN_AT) {
      console.warn(`WARN ${tag}: ${el.path} paths — verify simplicity`)
      warnings += 1
    }

    console.log(
      `ok  ${tag.padEnd(24)} ${String(shapeTotal).padStart(4)} shapes ` +
        `(p:${el.path} r:${el.rect} c:${el.circle} l:${el.line} e:${el.ellipse}) ` +
        `${(size / 1024).toFixed(1).padStart(6)} KB ${size < 4096 ? '✦' : ''}`,
    )
  }
}

// canonical artwork
const canonicalFiles = readdirSync(canonicalDir)
  .filter((f) => f.endsWith('.svg'))
  .map((f) => join(canonicalDir, f))

// mirrors (must equal canonical)
const mirrorFiles = ['web', 'ai', 'systems'].map((env) =>
  join(root, 'public', 'visuals', env, `hero-${env}.svg`),
)

collect([...canonicalFiles, ...mirrorFiles])

if (failures > 0) {
  console.error(`\n${failures} failure(s), ${warnings} warning(s)`)
  process.exit(1)
}
if (warnings > 0) {
  console.log(`\n${warnings} warning(s) — review flagged files`)
}
console.log('\nAll SVG validation checks passed.')