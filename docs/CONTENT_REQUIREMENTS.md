# CONTENT REQUIREMENTS — HRB Portfolio

This document lists every piece of real information required to turn the
current placeholder portfolio into a genuinely personal production site.

> **Policy:** do **not** invent facts about the owner — no fabricated clients,
> employers, results, awards, certifications, education, years of experience,
> job titles, testimonials, or URLs. Every item below is answered only with
> verified, authentic information. The one exception is the clearly labeled
> **illustrative** sample testimonials in the Clients section, which are
> visibly marked as sample quotes (not genuine feedback) until real,
> authorized testimonials are supplied.

The visual homepage is LOCKED. Supplying content never requires changing the
UI — only the data files under `src/data/` (and `index.html` for SEO values).

---

## Identity

Required:

- **Display name / brand name** — used in the header brand (`HRB`) and footer.
- **Short positioning** — one line describing what the owner does.
- **Professional title** *(optional)* — e.g. an actual role or specialization.
- **Production domain** — the domain the site will be hosted on; required
  before `og:url` and `canonical` are added to `index.html`.

## Hero

File: `src/data/hero.ts`

Required:

- **Heading** — currently `"Building Digital Systems."` (two lines).
- **Supporting statement** — the one-sentence intro beneath the heading.
- **CTA labels** — `"Explore Work"` and `"Contact"`.
- **CTA destinations** — currently internal anchors (`#work`, `#contact`);
  both are real and already work. There is **no external URL** to supply here.

## Capabilities

File: `src/data/capabilities.ts`

For each capability (WEB, AI, SYSTEMS):

- **Title** — `Web`, `AI`, `Systems`.
- **Short description** — one sentence each.
- **Optional supporting detail** — none currently rendered; not required.

Current descriptions are generic and on-brand; personalization is optional
(see the status table).

## Projects

File: `src/data/projects.ts`

For each project to be shown:

- **Project title**
- **Category** — e.g. `Digital Experience`, `Intelligent System`, `Automation Platform`.
- **Concise description**
- **Technologies** — short list rendered under the description.
- **Real URL or case-study URL** — required for the CTA to become an active link.
- **Featured status** *(optional)* — the `featured` field exists in the model
  but the UI does not use it yet; harmless to set.
- **Project image / visual** *(optional)* — the site currently uses abstract
  inline SVG visuals per category (`visualType: 'web' | 'ai' | 'systems'`).
  No image asset is required.

## Results

File: `src/data/results.ts`

Required:

- **Result titles** — one sentence each (currently: Clearer Workflows, Useful
  Intelligence, Connected Systems, Built to Move Forward).
- **Result descriptions** — one sentence each.

These are **positioning statements, not quantified claims**. Do not add
numbers, percentages, customer counts, revenue, or any metric without a
verified source. The UI deliberately reads as editorial/statistical in style
while asserting nothing measured.

## Clients & Partners / What Useful Technology Should Enable

File: `src/data/commitments.ts`

Required (currently grounded in the published methodology):

- **Section statement** — a truthful, non-quantified positioning line.
- **Items** — three concise commitments, each an exact restatement of content
  in `knowledge/methodology.json`, `src/data/about.ts`, and `src/data/results.ts`.

This section deliberately renders **no genuine testimonials or metrics**. The
testimonials shown here are illustrative sample quotes with fictional names,
clearly labeled as such on the page. Replace them with verified, authorized
source material before presenting them as real — never fabricate authentic
feedback.

## About

File: `src/data/about.ts`

Required (currently generic but readable):

- **Main statement** — the large line under the heading.
- **Introduction** — the paragraph set describing approach.
- **Principles** — 4 items (Clarity, Intelligence, Systems, Craft).

These read as intentional, so they are **optional** to replace — but real
factual biography/philosophy would make the page genuinely personal.

## Contact

File: `src/data/contact.ts`

Required:

- **Real email** — the site-wide contact address: `hrbempirein@gmail.com`.
  One field (`email`) in `src/data/contact.ts`; update it there if it ever changes.
- **Availability wording** — currently generic; optional to refine.

## SEO

Where: `index.html` (metadata), no data file involved.

Required:

- **Production title** — currently `HRB — Building Digital Systems`. Accurate
  as-is; adjust only if the real name/positioning differs.
- **Meta description** — currently present and accurate.
- **Production domain** — required before adding `og:url` / `canonical`.
- **Social preview image** *(optional)* — a 1200 × 630 asset (see
  `SEO_CONTENT_TEMPLATE.md`); none exists yet.

---

## Content Status Table

| Content         | File              | Status                      | Required |
| --------------- | ----------------- | --------------------------- | -------- |
| Contact email   | `contact.ts`      | Integrated (`hrbempirein@gmail.com`) | YES |
| Project 01      | `projects.ts`     | Integrated — HRB Legal AI   | YES      |
| Project 02      | `projects.ts`     | Integrated — HRB Legal Reader | YES    |
| Project 03      | `projects.ts`     | Integrated — HRB Digital Systems | YES |
| Project URLs    | `projects.ts`     | Not set (no `href`) — real case-study URLs still pending | YES |
| Results copy    | `results.ts`      | Integrated (positioning only, no metrics) | YES |
| Testimonials    | `testimonials.ts` | Illustrative samples, clearly labeled (fictional names) | OPTIONAL |
| About text      | `about.ts`        | Intentional generic         | OPTIONAL |
| Capabilities    | `capabilities.ts` | Intentional generic         | OPTIONAL |
| Hero copy       | `hero.ts`         | Production-ready            | NO       |
| Navigation      | `navigation.ts`   | Production-ready            | NO       |
| Contact wording | `contact.ts`      | Production-ready            | OPTIONAL |
| Title           | `index.html`      | Production-ready            | NO       |
| Meta description| `index.html`      | Production-ready            | NO       |
| Domain (`og:url` / `canonical`) | `index.html` | Unknown — not configured | YES |
| OG image        | `index.html`      | Not configured              | OPTIONAL |

---

## How to supply content

```
src/data/contact.ts         → real email (1 field)
src/data/projects.ts        → real titles, descriptions, URLs (per project)
src/data/about.ts           → optional personal biography
src/data/capabilities.ts    → optional personal capability copy
src/data/testimonials.ts    → replace illustrative samples with verified, authorized feedback
index.html                  → og:url + canonical once the domain is known
```

After any change:

```bash
npm run build && npm run lint
```

The dev-time validator (`src/data/contentValidation.ts`) auto-checks projects
and contact on every dev reload and fails fast on broken content.