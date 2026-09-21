# Project Content Template

Reusable template for documenting a real project **before** it is added to
`src/data/projects.ts`.

> **IMPORTANT — do not invent metrics, outcomes, clients, roles, or URLs.**
> Every line you fill in must be factual and verifiable. Leave a section
> blank rather than inventing it. If there is no verified outcome, write
> "not available" — never a fabricated number.

---

# Project

## Basic Information

Title:

Category:

URL:

## Description

One-sentence description:

Short project summary:

## Role

Role on the project:

## Technologies

-

## Problem

What problem did the project solve?

## Approach

What was built and why?

## Outcome

Only include measurable outcomes if they are verified:

## Links

Live project:

Case study:

Repository:

---

## How this maps to `src/data/projects.ts`

The current UI renders only a subset of this template. Map to the fields in
`src/data/projects.ts` as follows:

| Template section  | Data field       | Notes                                                        |
| ----------------- | ---------------- | ------------------------------------------------------------ |
| Title             | `title`          | Required.                                                    |
| Category          | `category`       | Required. E.g. `Digital Experience`, `Intelligent System`.   |
| URL / Case study  | `href`           | Omit if not real yet — the CTA stays a non-interactive placeholder. |
| Short summary     | `description`    | Required, concise.                                            |
| Technologies      | `technologies`   | Required; short list of words.                                |
| —                 | `number`         | Editorial ordering label (`01`, `02`, …).                     |
| —                 | `visualType`     | `'web' \| 'ai' \| 'systems'` — picks the abstract SVG visual. |
| —                 | `featured`       | Optional; not used by the current UI.                         |
| Role / Problem / Approach / Outcome | — | Not rendered by the UI today. Record here for future case studies. |

## Checks before entering a project

- [ ] Title is real and non-empty.
- [ ] Description is concise and non-empty.
- [ ] Every technology is a real, non-empty word.
- [ ] `href` is a real `https://` URL — otherwise omit it.
- [ ] No fabricated metrics, clients, roles, or outcomes anywhere.