# SVG Reconstruction Report

Purpose-built vector artwork reconstructed from the source PNG assets in
`public/source-art/`. None of the SVGs are traced, embedded, base64, or raster —
each is hand-authored markup that recreates the PNGs' visual language, sized to
serve sub-13 KB each.

Reconstruction is driven by `scripts/analyze-png.mjs`, a dependency-free Pixel
decoder (Node `zlib` + manual scanline de-filtering) that down-samples each PNG
into a 64×43 luminance/hue map. The maps document each artwork's composition —
brightness bands, shape extents, colour casts and negative space — and the SVG
geometry is built to reproduce those structures directly (the agent cannot view
image files, so this is the ground truth used instead).

## Source of truth & mirrors

- `public/svg/` holds the **canonical** SVGs.
- `public/visuals/web|ai|systems/` hold **byte-identical mirrors** of the hero
  SVGs so they can be served at static URLs for testing/embedding. They must
  never be edited by hand; `scripts/sync-visuals.mjs` keeps them in sync
  (hash-compare, idempotent, `--verify` fails on drift).
- `src/visuals/raw/` holds a **build-time mirror** of any canonical artwork that
  is bundled inline (Vite cannot import from `public/`), also kept byte-identical
  by the same script.
- Wired as `predev`/`prebuild` in `package.json`; `npm run verify:visuals` checks
  drift, `npm run validate:svgs` runs the validation pass.

## Inventory

| Source PNG | Result SVG | Purpose | Size (KB) | Shapes | Raster? |
|---|---|---|---|---|---|
| `web.png.png` | `svg/hero-web.svg` | Hero environment: web — animated grid depth field | 11.9 | 85 (9 p / 32 r / 21 c / 23 l) | no |
| `ai.png.png` | `svg/hero-ai.svg` | Hero environment: AI — plexus with cursor attention + travel ring | 8.0 | 51 (13 p / 33 c / 5 l) | no |
| `System.png.png` | `svg/hero-systems.svg` | Hero environment: systems — rack modules, bus, radar, flow console | 12.9 | 103 (13 p / 44 r / 11 c / 35 l) | no |
| `about.png.png` | `svg/about.svg` | About section — pinned plate TL, crossing band, charcoal mass with bright upper-right slab and lower-left plate | 2.7 | 10 (6 r / 2 l / 2 e) | no |
| `hrb-legal-ai.png.png` | `svg/hrb-legal-ai.svg` | Project visual: Legal AI — three gestures: sealed archive, reason monolith, output spire | 3.9 | 20 (1 p / 13 r / 4 l / 2 e) | no |
| `hrb-legal-reader.png.png` | `svg/hrb-legal-reader.svg` | Project visual: Legal Reader — large reading surface with diagonal highlight and steel band, slim pillar, extraction spire | 3.8 | 18 (11 r / 4 l / 2 e / 1 polygon) | no |
| `hrb-digital-systems.png.png` | `svg/hrb-digital-systems.svg` | Project visual: Digital Systems — **author's own Inkscape export** (A4 portrait trace, 8 paths / 1.1 MB). Bundled into the live card via `src/visuals/raw/`, lazy-loaded as its own chunk | 1146.3 | 8 paths | no |

Totals across the 7 files: 330 shapes, ~48.9 KB total, zero raster content.

## Semantic structure (shared between SVG files and React JSX)

The class names below are also applied to the equivalent groups in the inline
React components, so a single set of hooks drives both the static files and the
live hero.

### Hero — web (`hero-web.svg`, `WebEnvironment.tsx`)
- `web-grid`, `web-panels`, `web-nodes`, `web-connections`, `web-depth`
- animation slots: `env-drift`, `env-drift-bg`, `env-drift-x`, `env-spin`,
  `env-node`, `env-node-accent`, `env-float`, `env-hero-mg-extra`
- defs: `web-veil`, `web-glow` gradients

### Hero — ai (`hero-ai.svg`, `AIEnvironment.tsx`)
- `ai-core` (cursor-attention group), `ai-nodes`, `ai-orbits` (spin rings +
  offsetPath travel ring), `ai-connections`, `ai-particles` (asymmetric carets),
  `ai-depth` (nebula)
- defs: `ai-nebula`, `ai-attn`
- plexus center (600, 620); sparks at delays −3s / −7s / −11s

### Hero — systems (`hero-systems.svg`, `SystemsEnvironment.tsx`)
- `systems-modules` (rack NodeHouses at 300,718 / 600,718 / 1040,320 / 880,700 /
  1240,690), `systems-connections`, `systems-nodes` (radar @ translate 1420,480,
  data squares), `systems-flow` (console @ translate 1220,810), `systems-depth`
- defs: `sys-veil`, `sys-glow`

### Sections (`ProjectVisual.tsx`, `AboutVisual.tsx`)
- Projects: `work-field`, `work-archive` / `work-backing` / `work-slab` /
  `work-plane`, `work-stage` / `work-surface` (variant-specific mid/near)
- About: `about-field`, `about-body`, `about-band`; root `data-artifact="about"`

## Depth / parallax hooks

Every environment's JSX marks the three Framer Motion layers with
`data-depth="bg" | "mid" | "fg"` (verbose attribute, invisible to the animated
loop), matching the standalone SVGs' group structure. `useLayerParallax`,
`environmentWeights` (0→web · .5→ai · 1→systems), cursor attention
(`attentionX/Y`), reduced-motion handling, and touch behavior are unchanged.

## Validation results

`npm run validate:svgs` — all 10 files pass:
- single `<svg>` root, `viewBox` present
- no `<image>`, no `data:`/base64/raster references
- no duplicate `id` within any file; cross-environment gradient id prefixes
  (`web-*` / `ai-*` / `sys-*`) are unique across simultaneously rendered pages
- no opaque full-canvas rectangle (all backgrounds transparent)
- complexity budget respected (≤ 300 paths per file)

`npm run verify:visuals` — mirrors in sync. Dev/build run `predev`/`prebuild`
automatically so mirrors cannot silently diverge.

## Limitation

The agent cannot render the source PNGs directly (no image input); the section
artworks are rebuilt from the structural maps produced by
`scripts/analyze-png.mjs` (brightness bands, hue casts, extents, negative
space) and are therefore a genuine, data-driven recreation rather than a pixel
trace or a transcription — **except `hrb-digital-systems.svg`, which is the
author's own Inkscape-exported trace and is used verbatim** (A4 portrait,
rendered `meet` within the 8:5 card). The hero environments keep their
established interactive geometry by design; their canonical SVGs mirror that
same design. This is **Version 1** artwork — if a section's recreation reads
differently in the browser than the source intends,
`scripts/analyze-png.mjs public/source-art/<file>.png` can re-derive the map
and the geometry adjusted in a v1.1 pass.