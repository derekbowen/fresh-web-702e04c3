## Goal

Make SEO consistently strong across the entire site: a single source of truth for canonical URLs / OG metadata, site-wide structured data on every page, ItemList schema for footer-linked navigation hubs, and a sitemap that covers academy + courses.

## What's already in place

- `src/lib/seo.ts` has `buildMeta` (canonical, OG, Twitter, prev/next, noindex) + `breadcrumbJsonLd` + `ldJsonScript`.
- Most leaf routes already use `buildMeta` and emit relevant JSON-LD (Article, Course, LocalBusiness, FAQ, ItemList, Breadcrumbs).
- Sitemap covers cities, categories, providers, blog posts.

## Gaps to fix

1. Root route emits no canonical, no Twitter image, no Organization/WebSite JSON-LD, and a generic OG meta repeated on every page.
2. `academy.tsx` (layout) and a few list routes lack their own meta beyond `buildMeta` defaults — no breadcrumbs/ItemList.
3. Sitemap omits `/academy`, academy course pages, and key footer hubs (`/blog`, `/providers` already there but missing `/academy`).
4. No default OG image; pages without a hero share an empty card.
5. No site-wide `SearchAction` (sitelinks search box) or `Organization` schema with sameAs (socials live in footer already).

## Plan

### 1. Extend `src/lib/seo.ts`

- Add `DEFAULT_OG_IMAGE` constant (use `/og-default.png`, file already in `public/` or fallback to existing hero).
- In `buildMeta`, when no `image` passed, use `DEFAULT_OG_IMAGE` so every page has a share card.
- Add helpers:
  - `organizationJsonLd()` — `Organization` with name, url, logo, sameAs (Facebook/X/YouTube/LinkedIn/Instagram/TikTok/Pinterest, matching the footer SOCIALS list), contactPoint (phone + email from footer).
  - `websiteJsonLd()` — `WebSite` with `potentialAction` SearchAction pointing to `https://www.poolrentalnearme.com/s?q={search_term_string}`.
  - `itemListJsonLd(items)` — generic ItemList helper (used by hub pages).

### 2. Root route (`src/routes/__root.tsx`)

- Replace the inline `head()` with `buildMeta({...})` so root gets a canonical for `/` AND a default OG image.
- Add `scripts: [ldJsonScript(organizationJsonLd()), ldJsonScript(websiteJsonLd())]` so every page on the site carries Organization + WebSite structured data.
- Keep child routes overriding title/description/canonical via their own `head()`.

### 3. Footer hub routes — add proper meta + ItemList

- `src/routes/academy.tsx` (layout): currently has no head. Move into `academy.index.tsx` (already done) — but add a noop head on the layout to avoid inheriting stale meta. No change if layout has none; verified.
- `src/routes/providers.tsx`: already has `buildMeta`. Extend to include `breadcrumbJsonLd([{Home}, {Providers}])` and `itemListJsonLd(providers.map(...))`.
- `src/routes/blog.tsx`: already has ItemList — leave as is.

### 4. Sitemap (`src/routes/api/sitemap[.]xml.ts`)

- Add static entries: `/academy`, `/academy?lang=es`.
- Query `courses` table (published) and emit `/academy/$slug` URLs with `lastmod`.
- Add `/category` index isn't a route — skip.

### 5. Site footer / header

- No structural changes; the new `Organization.sameAs` mirrors the footer SOCIALS so the existing footer markup is unchanged.

## Technical notes

- All JSON-LD goes in `head().scripts` via `ldJsonScript(...)` so it's SSR-rendered (TanStack `<HeadContent />` already in root shell).
- `buildMeta` already handles canonical, prev/next, noindex — no API change beyond the new default image fallback.
- Cache for sitemap stays at 1 hour.
- No DB schema changes; only adds course rows to the existing sitemap query.

## Files to touch

- `src/lib/seo.ts` — add helpers + default OG.
- `src/routes/__root.tsx` — switch to `buildMeta` + Org/WebSite JSON-LD.
- `src/routes/providers.tsx` — add Breadcrumbs + ItemList JSON-LD.
- `src/routes/api/sitemap[.]xml.ts` — include academy + courses.
- `public/og-default.png` — add a simple branded fallback (if missing, generate a 1200×630 placeholder via existing pool-hero asset).

## Out of scope

- Image generation pipeline for per-page OG cards (only fallback added).
- Hreflang for the Spanish academy variant — can be a follow-up once `/academy/es` becomes its own route.