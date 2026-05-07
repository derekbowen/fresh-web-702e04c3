# PSEO Plan 2026 — Stored for later

Source PDF: `.lovable/docs/PSEO_PLAN_2026.pdf`
Stashed: 2026-05-07

## Summary of the external plan
Gap analysis recommending ~3.5–5K net new programmatic pages over 12 months across 8 template families. Top 3 priorities in the doc: Spanish-language US Hispanic metros, neighborhood-level rentals in top 20 metros, pool-builder + pool-service directories.

## Lovable's take (saved for the next planning session)

**Strongest parts**
- Spanish-language is the real find. Verifiably uncontested by Swimply / Peerspace / Giggster. Fits our existing `/p/{slug}` + `content_pages` engine with no new infra.
- Pool-service directory cloning Swimply's `/pool-services/{city}-{state}` is a layup — proven SERP, our template engine handles it.
- "Fewer, better" framing (3.5–5K, not 50K) is the right discipline.

**Pushback**
- Pool-builder directory is a lead-gen business (Angi/Houzz/HomeAdvisor turf). Wrong monetization for us. Defer or skip.
- Neighborhood pages risk thin content / doorway-page penalty. Gate on actual listing density per metro, not flat top-20 rule.
- Problem/troubleshooting hub ("green pool water") has wrong intent — searcher wants to fix, not rent. Test 10 pages before committing 120.
- State legal/permit content is high-value but high-liability. Either lawyer it or hedge framing.

**Missing from the external plan**
- Doesn't account for technical-SEO cleanup work (canonical, TTI, Intercom scoping) that should ship before any new content cohorts.
- No internal linking strategy — 3.5K new pages without hub-and-spoke wastes crawl budget.
- No measurement plan — needs GSC API → Supabase weekly per-template rank tracking + kill-switch criteria.
- No image strategy — 3.5K hero images need a generation pipeline or a stock budget line.

**Lovable's recommended priority order if/when we fund this**
1. Spanish v1 — 200 pages, single Hispanic-metro family (Miami / Houston / LA intents). Test the thesis cheap.
2. Pool-service directory clone — Swimply parity in our top 50 cities (~500 pages).
3. Pool-rental-cost calculator hub — ~250 pages, low effort, high-intent.
4. Stop. Measure 60 days. Expand only on cohorts that hit GSC impression targets.

Total commit: ~950 pages, not 3.5K. Decision gate before going further.

## Open questions for when we revisit
- Bilingual writer sourcing + budget approval (~$8–12K for Spanish v1).
- Local-pro data source for pool-services directory (Google Places API vs paid feed vs manual).
- Who owns weekly GSC rank reporting once the first cohort ships.
