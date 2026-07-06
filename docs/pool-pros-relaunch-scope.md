# Pool-Pros Directory — What a Proper Relaunch (KEEP + index) Requires

Status: NOINDEXed 2026-07-06 (commit b8672f38). Revert that commit to re-index
once the work below lands. This is a scope note only — nothing here is built.

## Two independent problems, in priority order

### 1. Rendering bug — pages don't show their own content (BLOCKER)
- `src/routes/p.pool-pros.tsx` (the hub) has a `component` but no `<Outlet/>`.
  In TanStack file-based routing it is the *parent layout* for every
  `/p/pool-pros/*` route, so without an `<Outlet/>` the child route bodies
  (city, category, state, provider profile) never render. Every URL shows the
  hub's "Find a pool pro near you" + the full 891-provider filter instead.
- Confirmed empirically: a 50-provider city, a 1-provider city, a 7-provider
  category, and a single provider profile all return byte-identical bodies
  (~72,620 visible chars, one h1). Only `<title>`/JSON-LD differ.
- **Fix:** split the hub route. Move the hub's filter UI into an index route
  (`p.pool-pros.index.tsx`) and reduce `p.pool-pros.tsx` to a pathless layout
  that renders `<SiteHeader/><Outlet/><SiteFooter/>`. Then `/p/pool-pros`
  renders the hub, and children render their own `CityCategoryPage` /
  `StateHub` / profile content. Re-verify each level renders a unique body.
- Est: small-to-medium code change + full re-verify of all 4 nested levels.

### 2. Content is scraped NAP with no substance (QUALITY GATE)
- 891 published providers. Only **14 (2%)** have a description ≥120 chars
  (avg description length across all providers: **5 chars**). Only **9 (1%)**
  have an image. 91% are pool-builders; pool-cleaners has 7 nationwide.
- 77% of city pages map to exactly one business.
- Even with rendering fixed, a page = one business's name + phone + website +
  star rating. That is thin for indexing at 1,357-page scale.
- **Fix options:** (a) generate real per-provider descriptions (there is
  already an `adminGenerateProviderContent` server fn — could batch-fill),
  (b) add images, (c) OR narrow the indexable set to only cities/categories
  with 3+ real, enriched providers and noindex the long tail.

### 3. Sitemap + noindex coherence (do alongside re-index, not now)
- `sitemap-directory.xml` currently lists all 1,357 pool-pros URLs. While the
  tree is noindexed, those are "noindex URLs in a sitemap" — Google will flag
  "Submitted URL marked noindex" in Search Console (cosmetic, not harmful).
- When re-indexing: keep sitemap listing only the pages that pass the quality
  gate in #2. While noindexed, optionally drop the directory sitemap entry.

## Suggested sequence when you greenlight relaunch
1. Fix the `<Outlet/>` layout split; verify all 4 levels render unique content.
2. Batch-generate descriptions + add images; define the quality bar.
3. Trim `sitemap-directory` to only quality-passing URLs.
4. Revert commit b8672f38 (removes noindex) for the passing set.
5. Re-crawl to confirm unique bodies + one canonical + indexable.
