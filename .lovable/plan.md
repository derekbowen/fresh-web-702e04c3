# Activity-modifier city pages: take Swimply's long-tail

## Goal

Build pages targeting `{activity} in {city}` queries that Swimply currently ranks #1-3 for with thin pages. Our advantage: real depth, EEAT, $2M insurance angle, 10% fee.

## Slug pattern

`/p/{activity}-venues-{city-state}` — e.g. `/p/pool-party-venues-los-angeles-ca`, `/p/baby-shower-venues-houston-tx`, `/p/hot-tub-rental-miami-fl`.

Reasons: matches actual SERP queries ("baby shower venues", "pool party venues near me"), keeps everything under the existing `/p/*` prefix that nginx forwards, no new route file needed (the `p.$slug.tsx` resolver handles it via `template_type`).

## Activities (phase 1)

| Activity | Slug fragment | Target query | Swimply best rank |
|---|---|---|---|
| Pool party | `pool-party-venues-` | "pool party venues {city}" | #2 (LA) |
| Baby shower | `baby-shower-venues-` | "baby shower venues {city}" | #2 (Covina) |
| Birthday party | `birthday-party-venues-` | "birthday party at a pool {city}" | #2 (LA) |
| Hot tub rental | `hot-tub-rental-` | "hot tub near me {city}" | #7 (Austin) |
| Dog-friendly pools | `dog-friendly-pools-` | "dog pool {city}" | #3 (SD) |

## Metros (phase 1, top 50)

Pull from `cities` table ranked by population (or by existing `gsc_impressions` on the city's `content_pages` row). Top 50 US metros = ~250 pages.

## Implementation

1. **New template type** `activity_city` in `content_pages.template_type`.
2. **New template component** `src/components/templates/activity-city.tsx` rendering:
   - H1: `{Activity} venues in {City}, {ST}`
   - Author byline (Derek Bowen)
   - 4-paragraph intro: why this activity in this city (climate, scene, demand signals)
   - "What you get when you book through PRNM": $2M insurance, instant book, hourly pricing, 10% host fee context
   - Activity-specific guide block (e.g. baby shower: capacity, decor rules, food, photographer access)
   - Price benchmarks for that activity in that city (pulled from city-level rates, never invented)
   - Top 3-5 pool features renters want for this activity (heated, shallow end, shade, etc.)
   - "How PRNM compares to Swimply for {activity}" — fee table, insurance, payout speed
   - FAQ (6-8 Qs, JSON-LD FAQPage schema)
   - Nearby city links (reuse `compute_related_city_slugs`)
   - CTA to `/s?address={City}%2C+{ST}` (relative path, Sharetribe)
   - Internal link to the canonical city page `/p/{city-slug}`
3. **Generator server function** `src/server/activity-city-generator.functions.ts`:
   - Admin-only (`requireSupabaseAuth` + admin role check)
   - Takes `{ activity, citySlugs[] }`, calls Lovable AI Gateway (`google/gemini-2.5-pro`) to produce 1.5k-2k words per page following a strict prompt template
   - Inserts into `content_pages` with `template_type='activity_city'`, status='draft' for review
   - Word count target: 1500-2000 (less than host-acq 2.5-3.5k because intent is more transactional)
4. **Admin UI panel** at existing admin route (small addition): list activities × metros grid, batch-generate button, draft preview, bulk publish.
5. **Sitemap inclusion**: auto-pulled since sitemap reads from `content_pages` where status='published'.
6. **Schema markdown** stored in `content` column; rendered via existing markdown pipeline.

## EEAT requirements (workspace voice rules)

- Sentence case headings, second person, no banned words
- Derek Bowen byline + JSON-LD author Person entity (already wired sitewide)
- Real numbers only — pull hourly rates from existing city rate data, never invent
- City-specific facts in intro (no copy-paste between cities) — the AI prompt must require 2 city-specific signals (neighborhood, climate, event scene, local landmark)

## Phase 1 deliverable (this turn)

- DB: add `activity_city` template type to any enum/check constraint
- Template component
- Generator server fn + admin trigger UI
- Generate 10 pages as a pilot (2 activities × 5 metros: LA, NYC, Houston, Miami, Phoenix) as drafts for review

Once you approve the pilot output quality, run the full 250 in one batch.

## Out of scope

- No new top-level routes — everything under `/p/{slug}`
- Spanish variants (phase 2)
- Activity-modifier directory pages (phase 2)

## Technical notes

- AI provider: Lovable AI Gateway, model `google/gemini-2.5-pro`, no extra API key
- Word count enforcement in generator (reject and regenerate if < 1500)
- Each generated page gets a unique `seo_title` (≤60) and `seo_description` (≤160) from the AI, validated server-side
- Slug uniqueness check before insert
- 301 redirect setup: not needed (new pages, no legacy)
