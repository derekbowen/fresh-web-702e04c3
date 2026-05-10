# Per-city sources plan + required citations for pilot host pages

## Goal

Every pilot `host_acq_city` page is grounded in real, named, linkable sources so it earns EEAT trust and stops sounding interchangeable. The generator must (a) be fed a city-specific source dossier and (b) be forced to cite from it inline.

## Source categories (4 buckets per city)

For each pilot city we collect 4–6 sources spanning these buckets:

1. **City ordinances / pool & noise law** — municipal code section (e.g. "Boise City Code Title 5, Ch. 1: Noise"; "Nashville Metro Code §10.36 Pool Fencing"). Real URL on the city's `.gov` site.
2. **HOA / short-term rental policy** — county or city STR registry, HOA disclosure rules, or zoning page that governs hourly pool rentals (e.g. Arlington County STR program, Davidson County BZA).
3. **NOAA / climate** — NOAA Climate Normals page for the nearest station (gives real avg July high, swim-season length, rainfall). Always link the actual NOAA URL.
4. **Local demand signal** — one of: census QuickFacts (population/median income), state tourism board, parks & rec public-pool list (proves alternatives + pricing context).

Optional 5th: insurance / liability — state insurance commissioner page on personal liability + short-term rental.

## Storage shape

New table `city_sources` (one row per source, many per city):

```
id            uuid pk
city_slug     text   -- references cities.slug (resolved canonical)
bucket        text   -- 'ordinance' | 'hoa_str' | 'noaa' | 'demand' | 'insurance'
title         text   -- "Boise City Code Title 5, Ch. 1 — Noise"
url           text   -- full https URL
publisher     text   -- "City of Boise" / "NOAA NCEI" / "U.S. Census Bureau"
key_fact      text   -- one-sentence fact the writer must cite (e.g. "July avg high 92°F")
retrieved_at  date
notes         text   -- editor notes, not for output
```

Server-only access via `supabaseAdmin` (same posture as `content_pages` / `ig_leads`).

Pilot seeding is manual: 4–6 rows per pilot city written by us, no scraper. Once the format proves out we expand to the 200-keep list.

## Generator changes

In `supabase/functions/generate-content-batch/index.ts`:

1. Add a `host_acq_city` system prompt (today the source falls through to the generic `SYSTEM_VA`). New system prompt enforces:
   - Mandatory **Sources** section at the bottom with bullet markdown links to each provided source.
   - Inline citations: every claim about climate, ordinances, fencing law, HOA/STR rules, and population must end with `([Source N](url))` referencing the bullet number in the Sources section.
   - At least 4 distinct sources cited inline; at least 2 different buckets.
   - No fabricated URLs — only URLs from the dossier.
2. `buildPrompt` for `host_acq_city` injects a `SOURCES DOSSIER:` block: numbered list of `{publisher} — {title} — {key_fact} — {url}` pulled from `city_sources` for the resolved city slug.
3. New post-generation validator `validateCitations(body, dossier)` that:
   - Counts inline `(...](http...))` citations whose URL appears in the dossier — must be ≥ 4.
   - Confirms `## Sources` section exists and lists every dossier URL.
   - Rejects any URL in body that is not in the dossier (no hallucinated links).
   - Failure → page goes to `paused` with `last_error = 'citations_missing: ...'` exactly like the existing FAQ-count gate.

## Page rendering

`HostAcqCityTemplate` already renders the markdown body via `react-markdown` + `remark-gfm`, so a `## Sources` section and inline links Just Work. One small addition:

- Add a small "Sources" sidebar/footer chip on the page that pulls the same `city_sources` rows and renders them as a clean list with publisher names — gives Googlebot a structured citation block independent of how the LLM formatted them.

## Pilot scope

Apply to the 3 live pilots first (Boise ID, Nashville TN, Arlington VA), regenerate with the new prompt + dossier, then expand to the next 7 before rolling to the rest of the 200-keep list.

## Acceptance

A pilot page is "shipped" only when:
- ≥ 4 inline citations to dossier URLs
- `## Sources` section present, every dossier URL listed
- Zero non-dossier external URLs in body
- City name, July high °F, one ordinance §, and one STR/HOA fact all appear and each cites the matching dossier source
- Validator passes; page status = `published`

## Non-goals

- No scraper. Sources are hand-curated for the pilot batch.
- No frontend admin UI yet — `city_sources` rows are inserted via migration / SQL.
- No change to nearby-cities, FAQ, or calculator behavior.
