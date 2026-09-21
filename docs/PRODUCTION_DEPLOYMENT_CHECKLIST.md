# PRODUCTION DEPLOYMENT CHECKLIST — HRB Portfolio

Single-page portfolio (React + Vite + Tailwind v4) with an **optional**
server-side AI assistant. Production output: `dist/` (root document + hash
anchors — no SPA routing, no rewrites required). The assistant, when enabled,
is served by the Node server in `server/index.ts`.

> **Policy:** never publish metadata, URLs, or content that cannot be verified.
> Do not reference a domain, an OG image, or a sitemap before it actually
> exists. See `SEO_CONTENT_TEMPLATE.md` and `CONTENT_REQUIREMENTS.md`.

---

## Deployment mode decision

Choose one mode before deploying. The two modes have different runtime,
hosting, and secret requirements.

- [ ] **Static-only portfolio** — deploy `dist/` only. No Node server, no
      reverse proxy, no API key, no server-side environment variables.
      The chatbot API is unavailable in this mode.
- [ ] **Portfolio + AI assistant** — deploy `dist/` **and** run
      `node server/index.ts` behind a trusted reverse proxy. Requires a
      server-side Gemini API key and server-side environment variables.

Static-only mode needs only `dist/`. Assistant-enabled mode requires the Node
server and a trusted reverse proxy — the server must not be exposed directly to
the public internet.

---

## Before deployment

### Both modes

- [ ] **Real domain confirmed** — decide the production origin.
- [ ] **Canonical URL added** — in `index.html` `<head>`:
      `<link rel="canonical" href="https://YOUR-DOMAIN/">`
- [ ] **`og:url` added** — `<meta property="og:url" content="https://YOUR-DOMAIN/">`
- [ ] **OG image added** — 1200 × 630, dark, HRB brand-consistent, readable at
      thumbnail size, no photo/awards/excess text; hosted under the domain;
      referenced via `og:image` + `og:image:width=1200` + `og:image:height=630`.
- [ ] **Twitter/X metadata finalized** — `twitter:card=summary_large_image`,
      `twitter:title`, `twitter:description`, `twitter:image` (same asset).
- [ ] **Sitemap** — add one URL (`https://YOUR-DOMAIN/`) when the domain is
      confirmed; hash anchors (`#work/#about/#contact`) do **not** need
      sitemap entries. Add the matching `Sitemap:` line to `public/robots.txt`.
- [ ] **Contact email confirmed** — `hrbempirein@gmail.com` is in
      `src/data/contact.ts` (exactly one field) and the mailto link renders.
- [ ] **Project content confirmed** — `src/data/projects.ts` contains the real
      HRB projects.
- [ ] **Real project URLs added where applicable** — set `href` only for
      projects that genuinely have a live case-study page.
- [ ] **No placeholder content remains** — no "Project 01/02/03", no
      `hello@example.com`.
- [ ] **No invented claims** — no fabricated clients, metrics, awards, roles,
      credentials, or testimonials. The only testimonials present are clearly
      labeled illustrative samples (`src/data/testimonials.ts`), never shown
      as genuine feedback.
- [ ] **Production build passes** — `npm run build && npm run lint && npx tsc -b`.

> Domain-dependent SEO tasks (canonical, `og:url`, OG image, Twitter/X
> metadata, sitemap) remain **pending until the real production domain
> exists**. Do not fill in placeholder origins.

### Static-only mode (MODE A)

No additional server or secret configuration is required. See
[MODE A — Static-only portfolio](#mode-a--static-only-portfolio).

### Assistant-enabled mode (MODE B)

- [ ] **Node 23.6+ available** — the server runs the TypeScript source directly
      via native type stripping.
- [ ] **Trusted reverse proxy configured** — in front of the Node server.
- [ ] **Proxy overwrites/strips `X-Forwarded-For`** — so the server receives a
      trustworthy client IP.
- [ ] **Server is not directly exposed** to the public internet.
- [ ] **Server-side environment variables set** — `PORTFOLIO_AI_PROVIDER`,
      `PORTFOLIO_AI_API_KEY`, `PORTFOLIO_AI_MODEL` (see
      [Environment / secrets](#environment--secrets)).
- [ ] **Gemini API key is server-side only** — never in a `VITE_*` variable and
      never shipped to the browser.
- [ ] **`.env` is gitignored** and never committed.

See [MODE B — Assistant-enabled portfolio](#mode-b--assistant-enabled-portfolio).

---

## Deployment modes

### MODE A — Static-only portfolio

Deploy `dist/` as a static site. Characteristics:

- Portfolio UI works.
- Artwork/assets work.
- Chatbot API is unavailable (`POST /api/assistant` is not served).
- No Gemini API key is required.
- No Node server is required.
- No server-side environment variables are required.

Suitable for static hosting / a CDN.

### MODE B — Assistant-enabled portfolio

The production deployment must serve **both**:

- `dist/` (the built portfolio)
- `node server/index.ts` (static files + `POST /api/assistant`)

Requirements:

- **Node 23.6+** — the server uses native TypeScript type stripping to run
  `server/index.ts` directly.
- **HTTPS** at the hosting layer / reverse proxy.
- **Trusted reverse proxy** in front of the Node server.
- The reverse proxy must **overwrite or strip incoming `X-Forwarded-For`** so
  the client IP used by the server is trustworthy.
- The server must **not be directly exposed** to the public internet.

Configure (server-side):

```
PORTFOLIO_AI_PROVIDER=gemini
PORTFOLIO_AI_API_KEY=<real server-side Gemini API key>
PORTFOLIO_AI_MODEL=gemini-3.6-flash
```

Optional:

```
PORTFOLIO_AI_TIMEOUT_MS
PORTFOLIO_AI_BASE_URL
```

- **Never** use a `VITE_*` variable for the API key.
- **Never** expose the Gemini key to the browser.
- **Do not commit** `.env`.

#### Rate limiting

The current rate limiter is designed for a **trusted proxy / single-instance**
deployment:

- **12 requests per 60 seconds per IP.**
- State is **in-memory** (per process).
- The proxy must provide **trustworthy client IP information** (see the
  `X-Forwarded-For` requirement above).

This is **not** multi-instance or distributed rate limiting. If the
deployment scales to multiple instances, the limiter must be revisited before
relying on it as a global limit.

---

## After deployment

- [ ] Homepage loads
- [ ] HTTPS works
- [ ] favicon works (inline data-URI — no external request)
- [ ] robots.txt works (`/robots.txt` reachable; `User-agent: *` + `Allow: /`)
- [ ] sitemap works if applicable (`/sitemap.xml` under the real domain)
- [ ] canonical resolves correctly to the production origin
- [ ] OG preview verified (share the URL on Slack/Discord/WhatsApp or a
      validator; card shows the 1200 × 630 image)
- [ ] mobile layout verified (430×932, 390×844, 360×800; no horizontal overflow)
- [ ] desktop layout verified (1920×1080, 1440×900, 1280×800)
- [ ] no console errors (DevTools / server log)
- [ ] no broken assets
- [ ] **(MODE B)** assistant responds at `POST /api/assistant`
- [ ] **(MODE B)** assistant fails gracefully (no stack traces, keys, or
      upstream details) when the provider is unavailable

---

## Deployment hosts

Static deployment and assistant-enabled deployment are different targets.

### Static deployment

`dist/` only. Served by a static host or CDN. Hash navigation needs no
rewrites, so no host-specific rewrite configuration is required for the
portfolio itself. The assistant API is unavailable.

### Assistant-enabled deployment

`dist/` **+ the Node server** (`node server/index.ts`) **+ appropriate reverse
proxy / runtime configuration** (HTTPS, trusted proxy that overwrites
`X-Forwarded-For`, server not directly exposed). Do not assume a static host or
CDN automatically supports the assistant — the assistant requires the Node
server to be running and reachable behind the proxy.

No specific hosting provider or architecture is prescribed here; select one
and apply the requirements in
[MODE B](#mode-b--assistant-enabled-portfolio).

---

## Environment / secrets

- **Static-only mode** needs **no server-side environment variables**.
- **Assistant-enabled mode** requires the server-side `PORTFOLIO_AI_*`
  variables (`PORTFOLIO_AI_PROVIDER`, `PORTFOLIO_AI_API_KEY`,
  `PORTFOLIO_AI_MODEL`, and optionally `PORTFOLIO_AI_TIMEOUT_MS` /
  `PORTFOLIO_AI_BASE_URL`).
- Secrets belong **only** in the deployment environment / server. The codebase
  itself contains no API keys, tokens, or secrets.
- `.env` must remain **gitignored** and must never be committed.
- **Never** place a secret in a `VITE_*` variable — anything prefixed `VITE_`
  ships to the browser.
- The Gemini API key is sent only from the server to the provider and is never
  exposed to the browser.
