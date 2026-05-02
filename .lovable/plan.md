## Goal

Every city page should have a strong, unique hero. Pull the hero used on the corresponding source page at `poolrentalnearme.com/p/{citykey}` and store it in `cities.hero_image_url`, then render it (with a graceful fallback for the rare miss).

## What I confirmed

- 355 of 358 published cities currently have `hero_image_url` null. Only LA, Miami, KC have an image set.
- Each source page has its own banner image, but the source site is a Sharetribe SPA (poolrentalnearme.com). The hero is hydrated client-side from a Sharetribe Asset Delivery JSON keyed by a per-asset version string, so plain `curl` can't fetch it. OG meta tags on most city pages return the generic site default — not a reliable signal.
- Source URL pattern is `/p/{citykey}` where `citykey` is the city name lowercased, no spaces or hyphens (Los Angeles → `losangeles`, San Diego → `sandiego`).
- Firecrawl is available as a workspace connector (not yet linked to this project). It renders the page in a real browser, so it can capture the rendered hero `<img>` / `background-image`.

## Plan

### 1. Link Firecrawl to this project
Use the existing workspace Firecrawl connection (no new key needed). After linking, `FIRECRAWL_API_KEY` is available to server functions.

### 2. One-time backfill server function (admin-only)
Create `src/server/cities-hero-backfill.functions.ts` with a server function that:
1. Loads all published cities missing `hero_image_url` (or all of them, with a `force` flag).
2. For each city, derives the source slug: lowercase the city name and strip everything except a–z (so "Los Angeles" → `losangeles`, "St. Petersburg" → `stpetersburg`). Maintain a small override map for cities where the source uses a different key.
3. Calls Firecrawl `scrape` on `https://www.poolrentalnearme.com/p/{key}` with `formats: ['html']`, `onlyMainContent: false`, `waitFor: 2500` so the SPA hydrates.
4. Parses the returned HTML for the first `sharetribe-assets.imgix.net/...` image in the hero `<section>` (regex on the `style="background-image:url(...)"` attribute, with a fallback to the largest matching `<img src>` above the search form).
5. Normalizes the URL: strip imgix `&s=...` signature only if present-and-stale, keep `auto=format&fit=clip&w=1600`.
6. Updates `cities.hero_image_url` via `supabaseAdmin`.
7. Returns a per-city result list `{ slug, status: "ok"|"miss"|"error", url?, error? }`.

Throttle to ~3 concurrent scrapes to stay polite and within Firecrawl rate limits. Total expected: ~358 scrapes, single one-off run.

### 3. Lightweight admin trigger
Add a small admin-only page `src/routes/admin.cities-heroes.tsx` (gated by `has_role('admin')`) with two buttons: "Backfill missing only" and "Force re-scrape all", a results table, and a CSV export of misses. This makes it repeatable without me having to re-run anything.

### 4. Render-time fallback (the per-page UX guarantee)
In `src/routes/pool-rental.$city.tsx`, replace the current `city.hero_image_url || poolHeroDefault` with a deterministic-rotation fallback so even the misses get a varied look:

- Build `HERO_FALLBACKS` — an array of 8 high-quality pool/backyard Unsplash URLs.
- Pick `HERO_FALLBACKS[hashSlug(city.slug) % 8]` when `hero_image_url` is null.
- Keep `poolHeroDefault` only as the absolute last-resort `onError` swap.

This means the section is no longer visually identical across cities even before the backfill runs, and stays unique afterwards.

### 5. og:image wiring
Where the route's `head()` builds `og:image`, use the same resolved hero URL (not the default asset) so social shares reflect the city.

## Files

- New: `src/server/cities-hero-backfill.functions.ts`
- New: `src/server/cities-hero-backfill.server.ts` (Firecrawl SDK calls + HTML parser)
- New: `src/routes/admin.cities-heroes.tsx`
- Edit: `src/routes/pool-rental.$city.tsx` (rotation fallback + og:image)
- Add dep: `@mendable/firecrawl-js`
- Connector link: Firecrawl

## Open question — answer before I start

**Source-key overrides:** about 95% of city names map cleanly (`lowercase + strip non-letters`). Outliers I expect to hit: cities with state suffixes in our DB slug ("kansas-city-mo" → strip the state), saint/st abbreviations, multi-word edge cases. I'll log every miss; if more than ~20 cities miss, I'll add an override map and re-run the "force" backfill on just those slugs. Acceptable?

## What this delivers

- ~340+ cities get a unique, source-matched hero stored in the DB (cached, SEO-stable, og:image-friendly).
- The remaining ~15 misses still look distinct page-to-page via the deterministic fallback rotation.
- An admin page to re-run the backfill anytime new cities are added.
