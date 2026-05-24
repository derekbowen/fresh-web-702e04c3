## The 10 opportunities (from your GSC export, last period)

Ranked by upside (impressions × distance from #1, weighted by CTR gap).

| # | URL | Pos | Impr | Clicks | Problem | Play |
|---|---|---|---|---|---|---|
| 1 | `/p/all-locations` | 16.8 | 20,720 | 209 | Page 2, weak title/H1, thin intro | Rewrite title+meta with primary kw; add 400-word intro w/ state-grouped TOC; bump to internal-link target from city pages |
| 2 | `/` (home) | 10.5 | 17,346 | 434 | Stuck just below top 10 for "pool rentals near me" (3,636 impr) | Tighten H1+meta around "pool rentals near me", add FAQ schema, add city-grid above fold, internal links from top 50 city pages |
| 3 | `/p/newyork` | 10.4 | 10,407 | 159 | Slug is `/newyork` not `/new-york`; light content vs SERP competitors | Expand to 2.5k words on Jurupa Valley template, add neighborhood cluster (Fort Greene, Brooklyn, etc. — we have these), add LocalBusiness JSON-LD, add 301 from a clean slug if missing |
| 4 | `/p/privatepoolrentalssandiego` | 13.2 | 6,981 | 49 | Awful slug, low CTR, page 2 | Migrate to `/p/private-pool-rentals-san-diego` w/ 301, full host-acq-city template rewrite, add 6+ neighborhood sections |
| 5 | `/p/why-hosts-are-leaving-swimply` | 5.9 | 5,762 | **4** | Pos 6 with 0.07% CTR = title/meta total failure | Rewrite title for click bait + clarity ("Why Swimply hosts are switching to Pool Rental Near Me in 2026"), rewrite meta, add comparison table above fold, add year in title |
| 6 | `/p/riverside` | 11.2 | 4,763 | 70 | Page 2, slug missing state | Add `/p/riverside-ca` canonical, expand content to Jurupa Valley template, add nearby cities block, internal links from `/p/all-locations` |
| 7 | `/p/best-poolside-beers` | 6.5 | 2,680 | 22 | Pos 6 / 0.8% CTR — title isn't competitive | Rewrite title with number+year ("17 best poolside beers for 2026, ranked"), add product schema, add image alt tags, refresh updated_at |
| 8 | `/p/swimply-alternative-vs-pool-rental-near-me` | 7.2 | 2,633 | 14 | Pos 7 / 0.5% CTR — title is robotic | Rewrite to "Swimply alternatives: 5 better options for renting backyard pools (2026)", lead with comparison table, FAQ schema |
| 9 | `/p/insurance-guide-for-pool-owners` | 7.2 | 2,158 | 13 | Pos 7 / 0.6% CTR; matches "pool insurance for renters" (1,393 impr, 0 clicks) | Rewrite title to lead with "Pool insurance for owners & renters: 2026 guide", add a dedicated H2 for renters intent, FAQ schema |
| 10 | `/p/american-cities-with-pools` | 8.4 | 2,533 | 35 | Pos 8 / 1.4% CTR; list-post intent | Rewrite title with number+year, convert to ranked list with jump-links, add data table sortable by pool count |

Bonus mentions tracked but not in top 10: `/p/pool-rental-tax-write-offs-your-missing-out-on` (typo in slug — fix in Phase 2), `/p/hosting`, `/p/host-poolside-movie-night`, `/p/ai-cameras-pool-safety-drowning-prevention`.

## Execution plan

**Phase 1 — CTR fixes (ship first, 1 DB migration)**
For pages 5, 7, 8, 9, 10 (low-CTR / good-position): UPDATE `content_pages` rows to rewrite `seo_title`, `seo_description`, `og_title`, `og_description` only. No body changes. These are the fastest wins — pos 6–8 with sub-1% CTR is purely a SERP-snippet problem. Expected: 3–10× clicks within 2–3 weeks, no rerank needed.

**Phase 2 — Content depth (5 pages, larger UPDATE)**
For pages 1, 2, 3, 4, 6: rewrite `content` / `body_markdown` to follow the Jurupa Valley host-city template (2.5k–3.5k words, EEAT, neighborhood clusters, calculator/advocacy/side-hustle comparison block, city-specific FAQ). Update meta at same time. For #4 and #6 also queue 301 redirects via `legacy_slugs` to clean slugs (same pattern we used for the Spanish migration).

**Phase 3 — Internal linking pass**
- Add `/p/all-locations` link to footer of all 5,100+ city pages (boosts #1).
- Add city-grid block to homepage (boosts #2).
- Add "nearby cities" block to NY/Riverside pages pointing to existing neighborhood pages.

**Phase 4 — Verify**
Re-pull GSC in 3 weeks. Track delta on each URL.

## Open questions before I start

1. **Ship order**: Phase 1 (5 CTR-only rewrites, low risk, ~30 min) first, then come back for Phase 2/3 next session? Or batch all of Phase 1+2 now (~2 hours, 10 rows updated, ~25k tokens of new content)?
2. **AI for content rewrites**: For Phase 2 I'll generate the 5 long-form rewrites via Lovable AI (google/gemini-2.5-pro) using the Jurupa Valley template as the system prompt — same approach you've sanctioned before. Confirm?
3. **Slug redirects** (#4 SD, #6 Riverside, #3 NY): you want me to add 301s via `legacy_slugs` like the Spanish migration, right? Same pattern — old slug stays in `legacy_slugs[]`, new slug becomes primary, sitemap regenerates automatically.
4. **Year in titles**: OK to use "2026" in titles for #5, #7, #8, #10? Helps CTR but requires a refresh annually.

Reply with answers and I'll execute Phase 1 immediately.