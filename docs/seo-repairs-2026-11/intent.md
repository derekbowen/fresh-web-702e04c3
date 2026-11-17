# Renter intent vs host-recruitment intent on city pages (F1, F7) and generated link variants (F2, template part)

Branch `seo/05-intent`, stacked on `seo/01-failed-read-503` (b3e2ace). Nothing
here is deployed. All numbers below come from one read-only export of
production taken 2026-11-15 19:10 UTC (`content_pages`, `cities`,
`synced_listings`) and from `scripts/intent-report.mjs`, which runs the same
modules the pages run. To reproduce: run the SQL in the header of
`scripts/intent-report.mjs`, save the `export` value as JSON, then
`node scripts/intent-report.mjs export.json [--plan] [--sql] [--json]`.

## 1. The rule

One module, `src/lib/city-intent.ts`, one rule, decided on the slug alone:

| Class | Rule | Published rows | Rows that render* |
|---|---|---:|---:|
| **HOST** | slug starts with `become-a-` | 3,731 (3,730 `become-a-swimming-pool-host-…`, 1 `become-a-pool-host-highlands-ranch-co`) | 3,696 |
| **RENTER** | every other `host_acq_city` slug | 277 | 256 |
| total | | 4,008 | 3,952 |

\* A published row with `redirect_to` set never renders: `lookupContentPage`
answers it with a 301 (56 such rows, e.g. `fresno-ca` → `/p/fresno`,
`become-a-swimming-pool-host-akron` → `…-akron-oh`). Every before/after count
below is over the 3,952 rows that render.

The RENTER class is 182 `<city>-<st>` slugs, 92 bare `<city>` slugs and 3
topic slugs. The 92 "other" rows were read in bulk (slug, title, seo_title,
first 160 characters of body, headings of a sample): every one is a bare city
slug titled `Pool Rental in {City}, {ST}` (e.g. `chapel-hill`, `charleston`,
`des-moines`, `the-woodlands`) — renter titles on the site's guest-facing
city URL shape — so they are RENTER, with the state read from the title.
The 3 topic pages are `birthday-pool-party-austin-tx`,
`quinceanera-pool-rental-austin-tx` and `renta-de-alberca-austin-tx`
(locale `es`); they keep their own stored title as H1 so they do not collide
with `austin-tx`. Their bodies are renter-written; most other RENTER bodies are
host-written (headings like "How This Affects Pool Rental Hosts", "Ready to
Turn Your Pool Into Income?"), some mixed (`austin-tx`).

Place identity (`slugIdentity` / `placeForPage`): the state comes from the slug
(`-xx`, or a full state name such as `-idaho` when the title agrees), else the
cities row, else the title (`… in {City}, {ST}`). The cities row is now looked
up with a state-suffixed slug whenever a state is known, so RENTER pages get
one at all (before: never, because `cityForContentPage()` returns null for
non-`become-` slugs) and a bare `jackson` (title "…, MS") can never resolve to
another state's Jackson. Rows that render with a cities row: 493 → 749 (254 of
256 RENTER rows). No row's city or state changed except 13 that were wrong
before (`boise-idaho` was "Boise Idaho" with no state, `newbury-park-a` was
"Newbury Park A", the topic pages were "Birthday Pool Party Austin", `New Haven
CT, CT`).

No schema change. No data change in this branch (§6 lists the proposed ones, not applied).

## 2. What each class renders now

**HOST** (`/p/become-a-swimming-pool-host-<city>-<st>`)

- H1 `Rent out your pool in {City}, {ST} by the hour. 0% host fees. Keep 100%.`
  — copy already on the page, now with the state.
- `<title>`: **the stored `seo_title`, unchanged.** HOST rows with
  `title_variant` NULL are the control arm of the running A/B/C/D title test
  (`host-acq-variants.ts`: "NULL = control = no change"); rewriting them would
  invalidate the test. The one exception: a stored title that states an
  earnings figure (`$` amount or `3k`-style number, 154 of 3,596 control rows,
  e.g. "Become a swimming pool host in Eureka, MO | Earn $40-$150/hr") is
  replaced by `Become a Pool Host in {City}, {ST} | 0% Host Fees`, because no
  figure on these pages comes from data. "Earn Extra Income in …" with no
  number is a proposition and stays.
- `title_variant` A/B/C/D rows (100): title, H1, meta and intro computed exactly
  as b3e2ace did (cities row name, unmodified in `<title>`, " ST" stripped in the
  H1). Replaying b3e2ace's head and template logic over the export: 0 of 100
  variant titles and 0 of 100 variant H1s change. None of them is part of a
  duplicate (§4).
- Hero lede and meta description: the stored description, unless it states an
  earnings figure (722 HOST rows, e.g. "Host a pool in Newport, KY and earn
  $40-$150/hour … earn up to $10,000/month"); then the fee facts already on the
  page: "List your {City} pool on Pool Rental Near Me and rent it out by the
  hour. 0% host fees: you keep 100% of your listed price, paid after each
  completed booking." (meta: "Rent out your pool in {City}, {ST} by the hour on
  Pool Rental Near Me. 0% host fees: …"). The no-description fallback that called
  PRNM "the fastest-growing hourly pool marketplace" is replaced by the same
  sentence. None of the 722 descriptions mentions insurance, liability,
  coverage, claims or damage (read-only count: 0), so no rule-8 sentence is
  removed by this.
- `og:title` is the page's `<title>` (stored `og_title`s carried "earn
  $3K-$10K/month" on 9 rows and disagreed with the title); the host JSON-LD
  `WebPage.name` is the `<title>` too.
- The empty-inventory notice is gone from the top. The inventory section
  appears only when eligible pools exist in or near the city
  (`CityInventorySection framing="host"`: "{n} pools already listed in {City}" /
  "Pools already listed near {City}" with "{m} pools are listed within 60 miles
  of {City}", true counts, real distances, and "Listing data as of {date}"),
  below "how it works"; otherwise there is no inventory section at all. The
  "No pools are listed in {City} itself yet." clause is gone from the nearby
  lede for both classes (see RENTER).
- Primary CTA "List my pool — it's free", now straight to `/wizard/` (every host
  CTA in this template; `/l/draft/0000…/new/details` answers 302 → `/wizard/`).
- Hero card: "Typical {City} host earns $3,600/mo at ~$75/hr" removed (no data
  behind it); the card states 0% host fees, keep 100%, payout after booking.
  JSON-LD `LocalBusiness.priceRange` (`$75/hr`) removed on both classes.
- Breadcrumb: Home › Become a host › {City}, {ST} (was the stored title, which
  could carry an earnings figure). One BreadcrumbList per page (was three:
  head(), the template's @graph and `BreadcrumbsWithSchema`).

**RENTER** (`/p/<city>-<st>`, `/p/<city>`, topic slugs)

- H1 `Private pool rentals in {City}, {ST}`, `<title>` `Private Pool Rentals in
  {City}, {ST} | Pool Rental Near Me` (topic pages: their stored title).
- Meta description and hero paragraph are written from the inventory read for
  the page, nothing else:
  - exact-city pools: "{n} private pools are listed in {City}, {ST} on Pool
    Rental Near Me. Open a listing to see its photos and details." (+ "{m} more
    are listed within 60 miles.")
  - only nearby: "{m} private pools are listed within 60 miles of {City}, {ST}
    on Pool Rental Near Me. The nearest is {d} miles from {City}." It no longer
    opens with "No pools are listed in {City} yet": exact matching reads the
    listing's city field, so a pool filed under a neighbourhood or with no city
    can sit inside the city (`/p/queens`: nearest pool 0.8 mi, city "Jamaica";
    a second at the same point has no city).
  - nearby not checked (the city has no coordinates, 85 pages): "No pools are
    listed with {City}, {ST} as their city on Pool Rental Near Me yet." — with
    "Browse all pools" (`/s`) as the CTA, no claim that nothing is near, and no
    promise of a map search near the city (without coordinates there is no
    bounded search; see "Primary CTA" below). Before, these pages said "No pools are
    listed … browse every pool" although the radius search never ran
    (`/p/chevy-chase-md`, a Silver Spring pool ~5 miles away). A failed cities
    read lands here too, never on "none".
  - none (radius search ran, nothing within 60 miles): "No pools are listed in
    {City}, {ST} yet. You can browse every pool listed on Pool Rental Near Me."
  - inventory read failed: a neutral sentence with no count and no "no pools".
  `n` is a true count of distinct pools (every exact match is read and one pool
  stored under two Sharetribe ids — `swim-relax-in-stylepersonal-oasis`, Rocky
  Point NY — counts once: `/p/rocky-point-ny` now says 1, not 2), `m` the
  distinct listings inside the radius, `d` the haversine distance of the
  nearest from the centre in §1. No availability, dates, "book now" or reviews.
- Topic pages (3) and the non-English page (`renta-de-alberca-austin-tx`,
  locale `es`) keep their stored meta description and show it as the hero's
  first paragraph, followed by the inventory sentence; the four Austin pages no
  longer share one meta description.
- Primary CTA: "Search pools near {City}" → the bounded marketplace search
  `/s?address={City}%2C%20{ST}&bounds={neLat}%2C{neLng}%2C{swLat}%2C{swLng}`
  when pools are listed in or near the city **and** the inventory centre has
  coordinates; otherwise "Browse all pools" → `/s`. The same rule drives the
  sticky mobile CTA ("Search pools" / "Browse pools"), and a stored body link to
  the page's own city search is rendered as that same link (or `/s`).
  **Why bounds (release-verifier defect, fixed after 0116e9f):** WEST's search
  page drops `address` and searches by `bounds` only
  (poolrentalnearme-web `SearchPage.duck.js` `loadData`), and skips its
  nearest-to-visitor default whenever `address` is present
  (`SearchPageWithMap.js`). So the address-only link the branch first shipped
  showed every pool, unordered (live 2026-11-17: `/s?address=Tempe%2C%20AZ` →
  129), worse than the bare `/s` these pages linked on 7702845. The box is
  `searchBoundsAround()` in `src/lib/search-links.ts`: lat ± 60/69°, lng ±
  60/(69·cos lat)°, 5 decimals, in the `neLat,neLng,swLat,swLng` order and
  `encodeURIComponent` form of the homepage city cards — i.e. exactly the box
  `loadCityInventory` queries for the page's "within 60 miles" counts, around
  the same centre, so the map holds every pool the page counted as near
  (`CITY_SEARCH_RADIUS_MI`, shared by both). The homepage's only point-based box
  (the "near me" button, ±0.45° ≈ 31 mi) was not used: it would cut off pools
  the page itself lists at 31–60 miles. Live 2026-11-17 with fixture centres:
  Tempe AZ (33.4255, −111.94) → 3 pools, Mesa AZ (33.4152, −111.8315) → 3,
  Chapel Hill NC (35.9132, −79.0558) → 2 (address-only: 129). Chevy Chase MD
  has no coordinates, so its CTAs are the bare `/s`.
- The inventory section comes directly under the hero
  (`framing="renter"`: "Private pools listed in {City}" / "Pools near {City}" /
  "Browse private pools — No pools are listed with {City} as their city yet." +
  Browse all pools (not checked) / "No pools listed in {City} yet —
  There are no pools listed in {City} yet." + Browse all pools), with "Listing
  data as of {date}" — the newest `updated_at` among the listings shown
  (September 25, 2026 on the current mirror). The hero no longer shows a
  "Last updated" date that rolled forward on every request; the byline and the
  Article `dateModified` carry the page's own `updated_at`.
- Then a labelled host section, `#own-a-pool`: "Own a pool in {City}?", 0% host
  fees / keep 100% / paid after each completed booking, "List my pool — it's
  free" (→ `/wizard/`). Below it the rest of the page (why-PRNM, calculator, how
  it works, the stored body, FAQ), with three things dropped on RENTER pages
  only: the state-tier sentence ("{City} is a top-tier U.S. pool rental
  market" / "wide open — first-mover advantage" / "has steady, growing pool
  rental demand" — chosen by state code alone, so a demand claim no data
  supports, often directly under "No pools are listed"); the calculator's
  state-tier default rate and "Defaults are pre-tuned to local pricing" (now the
  neutral $75 default with no local-pricing claim); and the host take-home
  comparison table (it compares host payouts, and its "$180 on $200" row
  contradicts 0% host fees — F14). The paragraph's next sentence, "We give you
  more of every booking, real liability coverage, and payouts before your
  skimmer's even dry.", is kept word for word, as are the waiver and every other
  insurance/coverage sentence (CLAUDE.md rule 8: none added, edited or removed).
- Host-only extras dropped on RENTER pages: the host lead popup, the
  host-acquisition JSON-LD (BusinessAudience "Pool Owners", ProfessionalService,
  Offer, HowTo). Breadcrumb: Home › Pool rentals (`/p/pool-rentals`) › {City},
  {ST}, emitted once. Sticky mobile CTA: search/browse instead of "List my pool".

What the inventory looks like on the current mirror (synced 2026-09-25):

| | exact-city pools | nearby only | nearby not checked (no coordinates) | none within 60 mi |
|---|---:|---:|---:|---:|
| RENTER (256) | 11 | 110 | 85 | 50 |

| | inventory section shown | no inventory section |
|---|---:|---:|
| HOST (3,696) | 315 | 3,381 |

The 85 "not checked" pages are listed by `node scripts/intent-report.mjs
export.json --json` (`all.inventory.renterUncheckedSlugs`), e.g.
`chevy-chase-md`, `corte-madera-ca`, `cresskill-nj`, `damascus-md`,
`deerfield-il`, `discovery-bay-ca`, `duvall-wa`, `east-northport-ny`,
`eastchester-ny`, `eastvale-ca`. Giving them coordinates is a data fix
(geocode the 160+ published `cities` rows with null latitude/longitude from a
named public source); it is not proposed as SQL here because it needs the
values from that source, not invented ones.

## 3. Before / after, real slugs

Before = production today (b3e2ace); `scripts/intent-report.mjs` reproduces
the strings.

| Slug | Class | Before H1 / `<title>` | After H1 / `<title>` |
|---|---|---|---|
| `become-a-swimming-pool-host-aberdeen-sd` | HOST, no coordinates | Rent your Aberdeen pool by the hour. 0% host fees. Keep 100%. / Become a Swimming Pool Host in Aberdeen, SD \| Step-by-Step | Rent out your pool in Aberdeen, SD by the hour. 0% host fees. Keep 100%. / title unchanged — no inventory section |
| `become-a-swimming-pool-host-springfield-mo` | HOST | Rent your Springfield pool by the hour. … (shared with 6 other Springfields) / Earn Extra Income in Springfield, MO Renting Your Pool | Rent out your pool in Springfield, MO by the hour. 0% host fees. Keep 100%. / title unchanged |
| `become-a-swimming-pool-host-liguna-niguel-ca` | HOST, misspelled slug | Rent your Liguna Niguel pool by the hour. … / Become a swimming pool host in Laguna Niguel, CA | Rent out your pool in Laguna Niguel, CA by the hour. … / title unchanged; a second copy of `…-laguna-niguel-ca` (§6) |
| `become-a-swimming-pool-host-reston` | HOST, variant A, 3 pools nearby | Become a Pool Host in Reston, Virginia / … \| Pool Rental Near Me | unchanged (variant respected); "Pools already listed near Reston" section |
| `become-a-swimming-pool-host-newport-ky` | HOST, stored earnings description | hero + meta: "Host a pool in Newport, KY and earn $40-$150/hour. … earn up to $10,000/month." | hero: "List your Newport pool on Pool Rental Near Me and rent it out by the hour. 0% host fees: …"; title "Become a swimming pool host in Newport" unchanged |
| `chapel-hill` | RENTER, 2 pools nearby | Rent your Chapel Hill pool by the hour. … / Pool Rental in Chapel Hill, NC \| Hourly Backyard Pools — "We're still adding pools in Chapel Hill" | Private pool rentals in Chapel Hill, NC / Private Pool Rentals in Chapel Hill, NC \| Pool Rental Near Me — "2 private pools are listed within 60 miles of Chapel Hill, NC on Pool Rental Near Me. The nearest is 26 miles from Chapel Hill." |
| `houston` | RENTER, 2 exact + 4 nearby | Rent your Houston pool by the hour. … | Private pool rentals in Houston, TX — "2 private pools are listed in Houston, TX … 4 more are listed within 60 miles."; nearby distances from downtown (nearest 21 mi, was "2 miles" from the off-centre row in the committed draft) |
| `chevy-chase-md` | RENTER, no coordinates | Rent your Chevy Chase pool by the hour. … — "We're still adding pools" | Private pool rentals in Chevy Chase, MD — "No pools are listed with Chevy Chase, MD as their city on Pool Rental Near Me yet." + "Browse all pools" (`/s`; no coordinates, so no bounded search) |
| `birthday-pool-party-austin-tx` | RENTER topic | Rent your Birthday Pool Party Austin pool by the hour. … / Birthday Pool Party Rental Austin, TX \| Private Hourly Pools | Birthday Pool Party Rental in Austin, TX / Birthday Pool Party Rental in Austin, TX \| Pool Rental Near Me; stored meta description kept |

Note on the brief: `/p/san-diego-ca` is `template_type = 'resource'`, not
`host_acq_city`, so it is not affected by this change.

## 4. Duplicate H1 / `<title>` — before and after

Over the 3,952 rows that render (sitemap subset 3,932: the same groups, 517 /
1,311 pages before):

| | before | after (code) | after (code + §6 redirects) | after (code + §6 redirects + §6 titles) |
|---|---|---|---|---|
| duplicate H1 | 518 groups / 1,313 pages | 25 groups / 51 pages | **0** | 0 |
| duplicate `<title>` | 4 groups / 8 pages | 4 groups / 8 pages (the same 4) | 4 groups / 8 pages | **0** |
| cities with a HOST and a RENTER page sharing the exact H1 | 185 of 222 pairs | 0 of 222 | 0 | 0 |
| duplicates caused by a `title_variant` override | 0 | 0 | 0 | 0 |

Before, the H1 duplicates were same-name cities in different states ("Rent your
Springfield pool…" on 7 pages, Auburn 7, Columbia 7, Lebanon 7, Monroe 7, …)
and HOST/RENTER pairs. The state in every H1 and the separate RENTER headings
remove all of them.

**The 25 H1 groups left are not heading collisions: each is one place
published twice under two URLs** — a bare or full-state-name slug next to the
`-xx` slug (`become-a-swimming-pool-host-buffalo` / `…-buffalo-ny`,
`…-santa-fe`, `…-santa-fe-new-mexico` / `…-santa-fe-nm`, `…--ofallon-mo` /
`…-ofallon-mo`) or a misspelled slug next to the correct one (`…-eastion-pa` /
`…-easton-pa`, `…-liguna-niguel-ca` / `…-laguna-niguel-ca`, `…-redbluff-ca` /
`…-red-bluff-ca`). Giving one copy an artificially different heading would hide
duplicate content, not fix it; the fix is to 301 the copy (§6, 29 rows).

**The 4 title groups are stored control-arm titles without a state** on
same-name cities ("Become a swimming pool host in Belmont" on `-nc` and `-va`;
Danville CA/IN, Derby CT/KS, Fairview OR/TX). They were duplicates before this
change and are unchanged by it: fixing them in code would mean rewriting
control-arm titles (292 stored control titles name no state; only these 8
collide). The fix is the 8-row data change in §6, which needs Derek's GO
because it touches the title test's control arm.

## 5. Generated links (F2, template part)

"Places with >1 spelling" groups `/s?address=` links by an **independent**
normalisation in `scripts/intent-report.mjs` (`placeKey`: decoded, `+` as space,
lower-cased, full state names mapped to codes, "Saint"/"St." to "st",
punctuation and spacing dropped, a state repeated in the city name dropped), not
by `normalizeSearchHref()`, so a spelling the normaliser misses would still be
counted. (The committed draft grouped by `normalizeSearchHref()` itself, which
made the after-count zero by construction.)

host_acq_city pages (3,952 served):

| | before | after |
|---|---|---|
| `/p/pool-pros…` links | 3,952, **3,107 distinct URLs** (3,088 on sitemap pages) | 3,952, **1 URL** (`/p/pool-pros`) |
| `/s?address=` links (bodies + template) | 3,247 links, 3,094 distinct URLs for 3,083 places, **11 places with >1 spelling** (`buffalo%2C%20NY` / `Buffalo%2C%20NY`, …) | 3,453 links, 3,154 distinct URLs for 3,154 places, **0 places with >1 spelling** |

The other templates moved to `src/lib/search-links.ts`, measured from the data
that generates their links (published `cities` rows for the comparison routes,
`ADVOCACY_STATES`, `STATE_NAMES` for the state hubs):

| template | links | before: distinct / places with >1 spelling | after | links changed |
|---|---:|---|---|---:|
| giggster + peerspace `-in-{city}` comparisons (2 per published city) | 1,184 | 545 / 1 (`New Haven%2C%20CT` vs `New Haven%20CT%2C%20CT`) | 544 / 0 | 8 |
| advocacy state pages (2 per state) | 100 | 50 / 0 | 50 / 0 | 0 |
| `p.pool-rentals-{$state}` (2 per state) | 102 | 51 / 0 | 51 / 0 | 0 |
| activity_city | 0 (no published rows) | — | — | — |
| **all of the above + host_acq_city** | 4,633 → 4,839 | 3,392 distinct / **19** places with >1 spelling | 3,372 distinct / **0** | |

- `/p/pool-pros?city=X` renders the whole, unfiltered directory (the route reads
  no search parameter and is noindex), so the label "Pool pros in {City}" was
  not true and every city minted its own URL. There is no category-less
  city/state path in `src/routes/p.pool-pros*.tsx`; the only city paths are
  `/p/pool-pros/c/{category}/{st}/{city}`, which need a category. The link is
  now the hub once: "Pool pros directory" → `/p/pool-pros`.
- `/s?address=` stays (useful navigation; `/s` is noindex,follow), in one form
  per place: `address` only, `encodeURIComponent("City, ST")`, single spaces,
  periods dropped, an all-lowercase name title-cased, no dangling ", " when the
  state is unknown, a state repeated in the city name dropped. Every
  `/s?address=` link in a stored body is rewritten to that form at render. The
  host_acq_city link count rises by 206 only because RENTER pages now carry a
  search CTA for their city; the distinct-URL total across templates falls.
  **Superseded for RENTER CTAs (after 0116e9f):** they are now the bounded form
  (§2 "Primary CTA"), and pages without coordinates link the bare `/s`, so the
  "after" row above (measured with the address-only CTA on the 2026-11-15
  export) is not current: renter CTA links now exist only on RENTER pages with
  pools in or near the city and a centre with coordinates (at most the 121
  exact + nearby pages, not 206). `scripts/intent-report.mjs` now builds them
  with `searchHrefNearPlace()` and counts spellings on the `address` value only;
  re-run it on a fresh export for the new numbers. Still address-only (they
  predate this branch, and WEST ignores them the same way): the comparison
  routes, state hubs, advocacy pages, activity_city, and stored body links on
  HOST pages and to other cities.
- HOST pages: the primary CTA is listing a pool; they generate no search CTA.

## 6. Proposed data changes — need Derek's GO (not applied)

### 6a. 301 the 29 second copies of a place

29 published HOST rows are second copies of a place that already has its
canonical page (the 25 H1 groups in §4). Apply with the existing redirect
mechanism (`status='redirect'`, `redirect_to`, which `lookupContentPage`
301s). Keeper = the canonical `become-a-swimming-pool-host-<city>-<st>` row;
every keeper is already in the sitemap. Three keepers are `title_variant` rows
(`…-boise-id` B, `…-huntsville-al` A, `…-plano-tx` B); the redirected copies
are control rows, so no variant arm loses a page. Generated by
`node scripts/intent-report.mjs export.json --sql`.

```sql
-- APPLY (needs Derek's GO): 301 29 duplicate rows to their keeper
begin;
update content_pages c set status = 'redirect', redirect_to = v.keeper, in_sitemap = false
from (values
  ('become-a-swimming-pool-host--ofallon-mo', 'become-a-swimming-pool-host-ofallon-mo'),
  ('become-a-swimming-pool-host-boise-idaho', 'become-a-swimming-pool-host-boise-id'),
  ('become-a-swimming-pool-host-buffalo', 'become-a-swimming-pool-host-buffalo-ny'),
  ('become-a-swimming-pool-host-caldwell-idaho', 'become-a-swimming-pool-host-caldwell-id'),
  ('become-a-swimming-pool-host-cambridge', 'become-a-swimming-pool-host-cambridge-ma'),
  ('become-a-swimming-pool-host-eastion-pa', 'become-a-swimming-pool-host-easton-pa'),
  ('become-a-swimming-pool-host-erie', 'become-a-swimming-pool-host-erie-pa'),
  ('become-a-swimming-pool-host-hartford', 'become-a-swimming-pool-host-hartford-ct'),
  ('become-a-swimming-pool-host-huntsville', 'become-a-swimming-pool-host-huntsville-al'),
  ('become-a-swimming-pool-host-idaho-falls-idaho', 'become-a-swimming-pool-host-idaho-falls-id'),
  ('become-a-swimming-pool-host-independence', 'become-a-swimming-pool-host-independence-mo'),
  ('become-a-swimming-pool-host-las-cruces-new-mexico', 'become-a-swimming-pool-host-las-cruces-nm'),
  ('become-a-swimming-pool-host-lawrence', 'become-a-swimming-pool-host-lawrence-ks'),
  ('become-a-swimming-pool-host-lewisville', 'become-a-swimming-pool-host-lewisville-tx'),
  ('become-a-swimming-pool-host-liguna-niguel-ca', 'become-a-swimming-pool-host-laguna-niguel-ca'),
  ('become-a-swimming-pool-host-los-alamintos-ca', 'become-a-swimming-pool-host-los-alamitos-ca'),
  ('become-a-swimming-pool-host-mesquite', 'become-a-swimming-pool-host-mesquite-tx'),
  ('become-a-swimming-pool-host-montgomery', 'become-a-swimming-pool-host-montgomery-al'),
  ('become-a-swimming-pool-host-moore-park-ca', 'become-a-swimming-pool-host-moorpark-ca'),
  ('become-a-swimming-pool-host-nampa-idaho', 'become-a-swimming-pool-host-nampa-id'),
  ('become-a-swimming-pool-host-new-haven', 'become-a-swimming-pool-host-new-haven-ct'),
  ('become-a-swimming-pool-host-northbridge-ca', 'become-a-swimming-pool-host-northridge-ca'),
  ('become-a-swimming-pool-host-pasadena', 'become-a-swimming-pool-host-pasadena-ca'),
  ('become-a-swimming-pool-host-plano', 'become-a-swimming-pool-host-plano-tx'),
  ('become-a-swimming-pool-host-redbluff-ca', 'become-a-swimming-pool-host-red-bluff-ca'),
  ('become-a-swimming-pool-host-rio-rancho-new-mexico', 'become-a-swimming-pool-host-rio-rancho-nm'),
  ('become-a-swimming-pool-host-santa-fe', 'become-a-swimming-pool-host-santa-fe-nm'),
  ('become-a-swimming-pool-host-santa-fe-new-mexico', 'become-a-swimming-pool-host-santa-fe-nm'),
  ('become-a-swimming-pool-host-springfield', 'become-a-swimming-pool-host-springfield-mo')
) as v(dup, keeper)
where c.slug = v.dup and c.template_type = 'host_acq_city' and c.status = 'published';
commit;

-- ROLLBACK
begin;
update content_pages c set status = 'published', redirect_to = null, in_sitemap = v.was_in_sitemap
from (values
  ('become-a-swimming-pool-host--ofallon-mo', true),
  ('become-a-swimming-pool-host-boise-idaho', true),
  ('become-a-swimming-pool-host-buffalo', true),
  ('become-a-swimming-pool-host-caldwell-idaho', true),
  ('become-a-swimming-pool-host-cambridge', true),
  ('become-a-swimming-pool-host-eastion-pa', true),
  ('become-a-swimming-pool-host-erie', true),
  ('become-a-swimming-pool-host-hartford', true),
  ('become-a-swimming-pool-host-huntsville', true),
  ('become-a-swimming-pool-host-idaho-falls-idaho', true),
  ('become-a-swimming-pool-host-independence', true),
  ('become-a-swimming-pool-host-las-cruces-new-mexico', true),
  ('become-a-swimming-pool-host-lawrence', true),
  ('become-a-swimming-pool-host-lewisville', true),
  ('become-a-swimming-pool-host-liguna-niguel-ca', true),
  ('become-a-swimming-pool-host-los-alamintos-ca', true),
  ('become-a-swimming-pool-host-mesquite', true),
  ('become-a-swimming-pool-host-montgomery', true),
  ('become-a-swimming-pool-host-moore-park-ca', true),
  ('become-a-swimming-pool-host-nampa-idaho', true),
  ('become-a-swimming-pool-host-new-haven', true),
  ('become-a-swimming-pool-host-northbridge-ca', true),
  ('become-a-swimming-pool-host-pasadena', true),
  ('become-a-swimming-pool-host-plano', true),
  ('become-a-swimming-pool-host-redbluff-ca', true),
  ('become-a-swimming-pool-host-rio-rancho-new-mexico', true),
  ('become-a-swimming-pool-host-santa-fe', true),
  ('become-a-swimming-pool-host-santa-fe-new-mexico', true),
  ('become-a-swimming-pool-host-springfield', true)
) as v(dup, was_in_sitemap)
where c.slug = v.dup and c.template_type = 'host_acq_city' and c.status = 'redirect';
commit;
```

### 6b. Add the state to 8 duplicate control-arm titles

```sql
-- APPLY (needs Derek's GO; changes 8 control-arm titles): add the state to duplicate stored titles
begin;
update content_pages set seo_title = 'Become a swimming pool host in Belmont, NC' where slug = 'become-a-swimming-pool-host-belmont-nc' and template_type = 'host_acq_city' and seo_title = 'Become a swimming pool host in Belmont';
update content_pages set seo_title = 'Become a swimming pool host in Belmont, VA' where slug = 'become-a-swimming-pool-host-belmont-va' and template_type = 'host_acq_city' and seo_title = 'Become a swimming pool host in Belmont';
update content_pages set seo_title = 'Become a swimming pool host in Danville, CA' where slug = 'become-a-swimming-pool-host-danville-ca' and template_type = 'host_acq_city' and seo_title = 'Become a swimming pool host in Danville';
update content_pages set seo_title = 'Become a swimming pool host in Danville, IN' where slug = 'become-a-swimming-pool-host-danville-in' and template_type = 'host_acq_city' and seo_title = 'Become a swimming pool host in Danville';
update content_pages set seo_title = 'Become a swimming pool host in Derby, CT' where slug = 'become-a-swimming-pool-host-derby-ct' and template_type = 'host_acq_city' and seo_title = 'Become a swimming pool host in Derby';
update content_pages set seo_title = 'Become a swimming pool host in Derby, KS' where slug = 'become-a-swimming-pool-host-derby-ks' and template_type = 'host_acq_city' and seo_title = 'Become a swimming pool host in Derby';
update content_pages set seo_title = 'Become a swimming pool host in Fairview, OR' where slug = 'become-a-swimming-pool-host-fairview-or' and template_type = 'host_acq_city' and seo_title = 'Become a swimming pool host in Fairview';
update content_pages set seo_title = 'Become a swimming pool host in Fairview, TX' where slug = 'become-a-swimming-pool-host-fairview-tx' and template_type = 'host_acq_city' and seo_title = 'Become a swimming pool host in Fairview';
commit;
-- ROLLBACK
begin;
update content_pages set seo_title = 'Become a swimming pool host in Belmont' where slug = 'become-a-swimming-pool-host-belmont-nc' and template_type = 'host_acq_city' and seo_title = 'Become a swimming pool host in Belmont, NC';
update content_pages set seo_title = 'Become a swimming pool host in Belmont' where slug = 'become-a-swimming-pool-host-belmont-va' and template_type = 'host_acq_city' and seo_title = 'Become a swimming pool host in Belmont, VA';
update content_pages set seo_title = 'Become a swimming pool host in Danville' where slug = 'become-a-swimming-pool-host-danville-ca' and template_type = 'host_acq_city' and seo_title = 'Become a swimming pool host in Danville, CA';
update content_pages set seo_title = 'Become a swimming pool host in Danville' where slug = 'become-a-swimming-pool-host-danville-in' and template_type = 'host_acq_city' and seo_title = 'Become a swimming pool host in Danville, IN';
update content_pages set seo_title = 'Become a swimming pool host in Derby' where slug = 'become-a-swimming-pool-host-derby-ct' and template_type = 'host_acq_city' and seo_title = 'Become a swimming pool host in Derby, CT';
update content_pages set seo_title = 'Become a swimming pool host in Derby' where slug = 'become-a-swimming-pool-host-derby-ks' and template_type = 'host_acq_city' and seo_title = 'Become a swimming pool host in Derby, KS';
update content_pages set seo_title = 'Become a swimming pool host in Fairview' where slug = 'become-a-swimming-pool-host-fairview-or' and template_type = 'host_acq_city' and seo_title = 'Become a swimming pool host in Fairview, OR';
update content_pages set seo_title = 'Become a swimming pool host in Fairview' where slug = 'become-a-swimming-pool-host-fairview-tx' and template_type = 'host_acq_city' and seo_title = 'Become a swimming pool host in Fairview, TX';
commit;
```

Before applying either: re-run the export and the report (rows change), and
check in Search Console which URL of each 6a pair gets the impressions; where
the non-canonical URL is the one Google ranks, swap keeper and dup for that pair.

### 6c. Listing data (no SQL; reported)

- `synced_listings` holds one pool twice (`6a823407-8e8c-46ab-bcb8-f7be327b37f3`
  and `6a8234c2-6ff4-42dc-a27c-ac1b99765c33`, both
  `swim-relax-in-stylepersonal-oasis`, Rocky Point NY, same coordinates; both
  resolve on the live site). The pages now count it once; whether one Sharetribe
  listing should be closed is a marketplace decision.
- Listings `68816fa0…` (city "Jamaica") and `6a54df9b…` (city null) sit at the
  same point in Queens; exact-city matching cannot place them in Queens.
- 160+ published `cities` rows have null coordinates (85 RENTER pages cannot run
  the nearby search); several `-xx` rows are off-centre (§1).

## 7. What still depends on data freshness

- **The listing mirror is stale.** `synced_listings` was last written
  2026-09-25 05:05 UTC and no scheduled sync exists. Every count and distance a
  page states, and whether a HOST page shows its inventory section at all, is
  true *of the mirror*, not necessarily of the marketplace today. The pages now
  say so: the inventory section carries "Listing data as of September 25, 2026"
  (the newest `updated_at` of the listings shown) instead of the old rolling
  "Last updated: today" next to the counts. The marketplace is closed to
  bookings until January 1, which is why nothing on these pages says a pool is
  available or bookable.
- Pages are cached (Cloudflare, `/p/*` 600 s), so a sync shows up within ten
  minutes of the next render, not instantly.
- 3,200 of the 3,952 rendering rows still have no cities row (no centroid), so
  only exact-city matching works for them. For HOST pages that means no
  section; RENTER pages without coordinates say "not checked" (§2), never "none".
- A failed inventory read no longer reads as "no pools": the loader and
  `getCityInventory` return `readFailed`, and the page then states no count.
- Each tier reads at most 500 rows (the whole eligible mirror is 125), so the
  counts are exact today; if one city's 120-mile box ever holds more than 500
  eligible listings, the stated nearby count becomes a lower bound.

## 8. Seen, not changed (outside this brief or rule 8)

- HOST pages still carry the comparison table's "You take home on $200: $180",
  which contradicts 0% host fees (should be $200). Fee copy — F14 (task 19).
  RENTER pages no longer show the table.
- HOST pages keep the state-tier sentence ("top-tier U.S. pool rental market" /
  "has steady, growing pool rental demand") and "Defaults are pre-tuned to
  local pricing". Both are state-code defaults, not local data, and were on
  every HOST page before this branch; whether to drop them on HOST pages is a
  copy decision for Derek (the tier sentence shares a paragraph with the
  "real liability coverage" sentence, rule 8).
- Some stored HOST titles are truncated ("Earn Extra Income in Magna metro
  township, UT Renting Your"). They are control-arm titles and stay.
- RENTER pages still emit FAQPage JSON-LD from host FAQs / stored `faq_items`;
  the visible FAQ sits inside the host section.
- HOST pages keep a render-date "Last updated" line (no inventory claim next to
  it unless pools are listed, and then the section carries its own as-of date).
- Other templates still link the 302 URL `/l/draft/0000…/new/details`
  (generic-page, advocacy, pool-maintenance, `p.pool-rentals-{$state}`,
  `p.hosting`, …). Internal links — F5 (task 19).
- Future bodies: the content generator prompt in
  `src/server/backfill-content-pages.server.ts` still tells the model to write
  `/s?address={City%2C+ST}`. Pages render those in the one form anyway
  (`normalizeSearchHref`); not edited because production runs server-only files
  that differ from the repo.
- Other `/s?address=` producers outside this brief: `home-page.tsx` (do-not-edit
  file), `home-page-winter.tsx` (adds `&bounds=`), `admin.click-report.tsx`
  (admin, not crawled).

Read-only counts, 2026-11-15 (same filters as the export, published rows that
render): 722 HOST control descriptions and 154 HOST control `seo_title`s state
an earnings figure; 0 of those descriptions mention insurance, liability,
coverage, claims or damage; 9 stored `og_title`s and 0 `og_description`s state
one; 0 RENTER rows have an empty body (so the state-tier host-city guide never
renders on a RENTER page); 1 RENTER row has a non-English locale; 1 duplicate
eligible listing pair; 125 eligible listings, mirror max `updated_at`
2026-09-25 05:05 UTC.

## 9. Tests

- `tests/city-intent.test.mjs` (in `node --test "tests/*.test.mjs"`): the
  classifier; place parsing (bare, full-state-name, truncated, topic, misspelled
  and census-suffixed slugs, census-style row names, and that a different place
  in the title is not taken); the bare-row centre slug; HOST H1; HOST title kept
  from the stored control-arm `seo_title` unless it states a figure; variant
  copy identical to b3e2ace; RENTER H1/title; same-name cities; the earnings
  figure detector; HOST hero/meta fallback; renter wording for exact, nearby
  (no "No pools" claim), not-checked, none and failed reads; topic and
  non-English meta descriptions; the one `/s?address=` form.
- `npm run test:failed-reads` renders seven intent fixtures against the local
  Supabase stub: HOST Tempe (2 pools listed, one of them stored twice; stored
  earnings title, description and og_title), HOST Mesa (nearby only, clean
  stored title), HOST Dayton (none), RENTER `tempe-az` (exact), RENTER
  `mesa-az` (nearby only; an off-centre `mesa-az` cities row next to the `mesa`
  centre, distances computed in the harness from `mesa`), RENTER
  `chevy-chase-md` (no coordinates: not checked), RENTER `chapel-hill` (bare
  slug, cities row, none within 60 miles). It checks the single H1, `<title>`,
  meta description, og:title = title, one BreadcrumbList, no earnings figure in
  hero/title/meta/og, host CTAs straight to `/wizard/`, primary CTA and its
  href, presence/absence of the empty-inventory and not-checked notices and of
  the host inventory section, section order (inventory → "Own a pool in …?" →
  body), the listing-data date, no rolling "Last updated", no tier claim /
  local-pricing claim / take-home table on RENTER pages with the liability
  sentence unchanged, each listing card shown once, and that every number in
  the renter intro, the host lede and the inventory sections is a fixture
  count, price, capacity, radius, distance or the mirror date.
  Run against the committed draft (46aa05e's src with these harness changes),
  34 of these checks fail; against this change all pass.
