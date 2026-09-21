# SEO Content Template

Template for the production metadata that will be added to `index.html`.

> **IMPORTANT — do not publish metadata containing claims that cannot be
> verified.** Never add `og:url` or `canonical` until the production domain is
> actually known. Never reference a social preview image that does not exist.

---

## Metadata fields

```
Production title:
Meta description:
Canonical URL:
OG title:
OG description:
OG image:
Twitter/X title:
Twitter/X description:
Twitter/X image:
```

## Where each value goes

All values live in `index.html` `<head>`. Currently configured:

| Property                | Present today          | Action when supplied                       |
| ----------------------- | ---------------------- | ------------------------------------------ |
| `<title>`               | `HRB — Building Digital Systems` | Verify/adjust            |
| `<meta name="description">` | present           | Verify/adjust            |
| `og:title`              | present                | Verify/adjust            |
| `og:description`        | present                | Verify/adjust            |
| `og:type`               | `website`              | Keep                       |
| `<html lang>`           | `en`                   | Keep while content is English-only |
| `og:url`                | **missing**            | Add `content="https://<domain>/"` when known |
| `link rel="canonical"`  | **missing**            | Add `href="https://<domain>/"` when known |
| `og:image`              | **missing**            | Add only when the asset exists |
| `twitter:card` / `twitter:title` / `twitter:description` / `twitter:image` | **missing** | Optional; add when a domain and image exist |

## Social preview image specification

- **Size:** 1200 × 630 px
- **Format:** PNG preferred
- **Content:** should visually match the existing portfolio — dark
  (`#0a0a0c`) background, the HRB brand mark, the site's type and accents —
  so shared links look like the site itself.
- **File:** project-local (e.g. `public/og-image.png`), then set `og:image`
  to an absolute URL under the production domain (`https://<domain>/og-image.png`).
- Do **not** create or reference the image until it actually exists.

## Checks before publishing metadata

- [ ] Production domain confirmed before `og:url` / `canonical` are added.
- [ ] Title and description contain no unverifiable claims.
- [ ] OG image exists at 1200 × 630 and is hosted under the production domain.