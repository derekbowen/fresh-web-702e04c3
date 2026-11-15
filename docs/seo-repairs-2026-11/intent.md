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

No schema change. No data change in this branch (see §6 for the one proposed).

## 2. What each class renders now

**HOST** (`/p/become-a-swimming-pool-host-<city>-<st>`)

- H1 `Rent out your pool in {City}, {ST} by the hour. 0% host fees. Keep 100%.`
  — copy already on the page, now with the state. `<title>`
  `Become a Pool Host in {City}, {ST} | 0% Host Fees`. Meta description:
  unchanged (stored).
- The empty-inventory notice is gone from the top. The inventory section
  appears only when eligible pools exist in or near the city
  (`CityInventorySection framing="host"`: "{n} pools already listed in
  {City}" / "Pools already listed near {City}", true counts, real distances),
  below "how it works"; otherwise there is no inventory section at all.
- Primary CTA unchanged: "List my pool — it's free".
- The hero card no longer shows "Typical {City} host earns $3,600/mo at ~$75/hr
  · 12 booked hrs/week": that projection had no data behind it (the same claim
  as the earnings band removed 2026-09-02). The card now says what is true:
  0% host fees, you keep 100% of your listed price, payout after booking.
- JSON-LD `LocalBusiness.priceRange` (`$75/hr`, the state-tier default, not a
  price from any listing) removed on both classes.
- `title_variant` A/B/C/D overrides: unchanged (100 HOST rows). None of them is
  part of a duplicate (§4).

**RENTER** (`/p/<city>-<st>`, `/p/<city>`, topic slugs)

- H1 `Private pool rentals in {City}, {ST}`, `<title>` `Private Pool Rentals in
  {City}, {ST} | Pool Rental Near Me` (topic pages: their stored title).
- Meta description and hero paragraph are written from the inventory read for
  the page, nothing else:
  - exact-city pools: "{n} private pools are listed in {City}, {ST} on Pool
    Rental Near Me. Open a listing to see its photos and details." (+ "{m} more
    are listed within 60 miles.")
  - only nearby: "No pools are listed in {City}, {ST} yet. {m} private pools are
    listed within 60 miles. The nearest is {d} miles from {City}."
  - none: "No pools are listed in {City}, {ST} yet. You can browse every pool
    listed on Pool Rental Near Me."
  - inventory read failed: a neutral sentence with no count and no "no pools".
  `n` is a true count (`exactTotal`, an exact count query — the cards are capped
  at 8), `m` the listings inside the 60-mile radius, `d` the haversine distance
  of the nearest. No availability, dates, "book now" or reviews. (Stored renter
  descriptions such as "…with photos, hourly prices, and reviews" are no longer
  used as the meta description.)
- Primary CTA: "Search pools near {City}" → `/s?address={City}%2C%20{ST}` when
  pools are listed in or near the city; otherwise "Browse all pools" → `/s`.
- The inventory section comes directly under the hero
  (`framing="renter"`: "Private pools listed in {City}" / "Pools near {City}" /
  "No pools listed in {City} yet — There are no pools listed in {City} yet." +
  Browse all pools). The old "We're still adding pools… New pools go live every
  week" is gone (the second sentence was not something the data says).
- Then a labelled host section, `#own-a-pool`: "Own a pool in {City}?", 0% host
  fees / keep 100% / paid after each completed booking, "List my pool — it's
  free". The rest of the existing page follows unchanged below it (why-PRNM,
  comparison, calculator, how it works, the stored body, FAQ). Those sections
  are kept verbatim, including their insurance/coverage/waiver sentences
  (CLAUDE.md rule 8: none added, edited or removed).
- Host-only extras dropped on RENTER pages: the host lead popup, the
  host-acquisition JSON-LD (BusinessAudience "Pool Owners", ProfessionalService,
  Offer, HowTo — `host-acq-schemas.ts` already said renter pages must not carry
  them). Breadcrumb: Home › Pool rentals (`/p/pool-rentals`) › {City}, {ST}.
  Sticky mobile CTA: search/browse instead of "List my pool".

What the inventory looks like on the current mirror (synced 2026-09-25):

| | exact-city pools | nearby only | none |
|---|---:|---:|---:|
| RENTER (256) | 11 | 110 | 135 |

| | inventory section shown | no inventory section |
|---|---:|---:|
| HOST (3,696) | 313 | 3,383 |

(Before: every one of these pages that had no exact-city pool, and every
RENTER page — which never had a centroid — opened on "We're still adding
pools".)

## 3. Before / after, real slugs

Before = production today (checked with GETs of the first three on
2026-11-15; `scripts/intent-report.mjs` reproduces the same strings).

| Slug | Class | Before H1 / `<title>` | After H1 / `<title>` |
|---|---|---|---|
| `become-a-swimming-pool-host-aberdeen-sd` | HOST, no pools near | Rent your Aberdeen pool by the hour. 0% host fees. Keep 100%. / Become a Swimming Pool Host in Aberdeen, SD \| Step-by-Step | Rent out your pool in Aberdeen, SD by the hour. 0% host fees. Keep 100%. / Become a Pool Host in Aberdeen, SD \| 0% Host Fees — no inventory section |
| `become-a-swimming-pool-host-springfield-mo` | HOST, no pools near | Rent your Springfield pool by the hour. … (shared with 6 other Springfields) / Earn Extra Income in Springfield, MO Renting Your Pool | Rent out your pool in Springfield, MO by the hour. 0% host fees. Keep 100%. / Become a Pool Host in Springfield, MO \| 0% Host Fees |
| `become-a-swimming-pool-host-reston` | HOST, variant A, 3 pools nearby | Become a Pool Host in Reston, Virginia / … \| Pool Rental Near Me | unchanged (variant respected); host-framed "Pools already listed near Reston" section |
| `chapel-hill` | RENTER, 2 pools nearby | Rent your Chapel Hill pool by the hour. 0% host fees. Keep 100%. / Pool Rental in Chapel Hill, NC \| Hourly Backyard Pools — "We're still adding pools in Chapel Hill" | Private pool rentals in Chapel Hill, NC / Private Pool Rentals in Chapel Hill, NC \| Pool Rental Near Me — "No pools are listed in Chapel Hill, NC yet. 2 private pools are listed within 60 miles. The nearest is …" |
| `austin-tx` | RENTER, 4 pools nearby | Rent your Austin pool by the hour. 0% host fees. Keep 100%. / Pool Rental Austin, TX \| Private Backyard Pools by the Hour | Private pool rentals in Austin, TX / Private Pool Rentals in Austin, TX \| Pool Rental Near Me |
| `birthday-pool-party-austin-tx` | RENTER topic | Rent your Birthday Pool Party Austin pool by the hour. 0% host fees. Keep 100%. / Birthday Pool Party Rental Austin, TX \| Private Hourly Pools | Birthday Pool Party Rental in Austin, TX / Birthday Pool Party Rental in Austin, TX \| Pool Rental Near Me |

Note on the brief: `/p/san-diego-ca` is `template_type = 'resource'`, not
`host_acq_city`, so it is not affected by this change.

## 4. Duplicate H1 / `<title>` — before and after

Over the 3,952 rows that render (sitemap subset: 3,932, same picture):

| | before | after (code) | after (code + §6 SQL) |
|---|---|---|---|
| duplicate H1 | 518 groups / 1,313 pages | 20 groups / 41 pages | **0** |
| duplicate `<title>` | 4 groups / 8 pages | 20 groups / 41 pages | **0** |
| cities with a HOST and a RENTER page sharing the exact H1 | 185 of 222 pairs | 0 of 222 | 0 |
| duplicates caused by a `title_variant` override | 0 | 0 | 0 |

Before, the H1 duplicates were same-name cities in different states ("Rent your
Springfield pool…" on 7 pages, Auburn 7, Columbia 7, Lebanon 7, Monroe 7, …)
and HOST/RENTER pairs; the 4 title duplicates were stored titles without a
state ("Become a swimming pool host in Belmont" on `-nc` and `-va`; Danville,
Derby, Fairview). The new rules put the state in every H1 and title and give
the two classes different templates, which removes all of them.

**The 20 groups left are not heading collisions: each is one place published
twice under two URLs** (bare or full-state-name slug next to the `-xx` slug,
e.g. `become-a-swimming-pool-host-buffalo` and `…-buffalo-ny`,
`…-santa-fe`, `…-santa-fe-new-mexico` and `…-santa-fe-nm`, `…-redbluff-ca` and
`…-red-bluff-ca`, `…--ofallon-mo` and `…-ofallon-mo`). Before, the two copies
carried two different stored titles, which is why the title count rises from 4
to 20 groups with the code alone. Giving one copy an artificially different
heading would hide duplicate content, not fix it; the fix is to 301 the copy,
which is a data change (§6).

## 5. Generated links (F2, template part)

Measured over the same rows; "places with >1 spelling" = one place linked
under more than one `/s?address=` URL.

| | before | after |
|---|---|---|
| `/p/pool-pros…` links | 3,952, **3,107 distinct URLs** (3,088 on sitemap pages) | 3,952, **1 URL** (`/p/pool-pros`) |
| `/s?address=` links (bodies + template) | 3,247, 3,094 distinct, **11 places with >1 spelling** (`buffalo%2C%20NY` / `Buffalo%2C%20NY`, …) | 3,503, 3,181 distinct, **0 places with >1 spelling** |

- `/p/pool-pros?city=X` renders the whole, unfiltered directory (the route reads
  no search parameter and is noindex), so the label "Pool pros in {City}" was
  not true and every city minted its own URL. There is no category-less
  city/state path in `src/routes/p.pool-pros*.tsx`; the only city paths are
  `/p/pool-pros/c/{category}/{st}/{city}`, which need a category and exist with
  real providers for ~352 (city, state) pairs out of 891 providers. Linking
  those would need a providers read per page render and a category choice, so
  the link is now the hub once: "Pool pros directory" → `/p/pool-pros`.
- `/s?address=` stays (useful navigation; `/s` is noindex,follow), in one form
  per place from `src/lib/search-links.ts`: `address` only,
  `encodeURIComponent("City, ST")`, single spaces, periods dropped, an
  all-lowercase name title-cased, no dangling ", " when the state is unknown, a
  state repeated in the city name dropped. Used by host-acq-city (primary renter
  CTA, and every `/s?address=` link in a stored body is rewritten at render),
  activity-city, advocacy, `p.pool-rentals-{$state}` and both comparison
  routes. The distinct count rises by 87 only because RENTER pages now carry a
  search CTA for their city; each place still has exactly one URL.
- HOST pages: the primary CTA is listing a pool; they generate no search CTA.

## 6. Proposed data change — needs Derek's GO (not applied)

24 published HOST rows are second copies of a place that already has a
`-xx` page (20 groups above). Apply with the existing redirect mechanism
(`status='redirect'`, `redirect_to`, which `lookupContentPage` 301s). Keeper =
the canonical `become-a-swimming-pool-host-<city>-<st>` row; every keeper is
already in the sitemap. Generated by `node scripts/intent-report.mjs
export.json --sql`.

```sql
-- APPLY
begin;
update content_pages c set status = 'redirect', redirect_to = v.keeper, in_sitemap = false
from (values
  ('become-a-swimming-pool-host--ofallon-mo', 'become-a-swimming-pool-host-ofallon-mo'),
  ('become-a-swimming-pool-host-boise-idaho', 'become-a-swimming-pool-host-boise-id'),
  ('become-a-swimming-pool-host-buffalo', 'become-a-swimming-pool-host-buffalo-ny'),
  ('become-a-swimming-pool-host-caldwell-idaho', 'become-a-swimming-pool-host-caldwell-id'),
  ('become-a-swimming-pool-host-cambridge', 'become-a-swimming-pool-host-cambridge-ma'),
  ('become-a-swimming-pool-host-erie', 'become-a-swimming-pool-host-erie-pa'),
  ('become-a-swimming-pool-host-hartford', 'become-a-swimming-pool-host-hartford-ct'),
  ('become-a-swimming-pool-host-huntsville', 'become-a-swimming-pool-host-huntsville-al'),
  ('become-a-swimming-pool-host-idaho-falls-idaho', 'become-a-swimming-pool-host-idaho-falls-id'),
  ('become-a-swimming-pool-host-independence', 'become-a-swimming-pool-host-independence-mo'),
  ('become-a-swimming-pool-host-las-cruces-new-mexico', 'become-a-swimming-pool-host-las-cruces-nm'),
  ('become-a-swimming-pool-host-lawrence', 'become-a-swimming-pool-host-lawrence-ks'),
  ('become-a-swimming-pool-host-lewisville', 'become-a-swimming-pool-host-lewisville-tx'),
  ('become-a-swimming-pool-host-mesquite', 'become-a-swimming-pool-host-mesquite-tx'),
  ('become-a-swimming-pool-host-montgomery', 'become-a-swimming-pool-host-montgomery-al'),
  ('become-a-swimming-pool-host-nampa-idaho', 'become-a-swimming-pool-host-nampa-id'),
  ('become-a-swimming-pool-host-new-haven', 'become-a-swimming-pool-host-new-haven-ct'),
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

-- ROLLBACK (all 24 were published, in_sitemap = true, redirect_to null on 2026-11-15)
begin;
update content_pages c set status = 'published', redirect_to = null, in_sitemap = true
from (values
  ('become-a-swimming-pool-host--ofallon-mo'), ('become-a-swimming-pool-host-boise-idaho'),
  ('become-a-swimming-pool-host-buffalo'), ('become-a-swimming-pool-host-caldwell-idaho'),
  ('become-a-swimming-pool-host-cambridge'), ('become-a-swimming-pool-host-erie'),
  ('become-a-swimming-pool-host-hartford'), ('become-a-swimming-pool-host-huntsville'),
  ('become-a-swimming-pool-host-idaho-falls-idaho'), ('become-a-swimming-pool-host-independence'),
  ('become-a-swimming-pool-host-las-cruces-new-mexico'), ('become-a-swimming-pool-host-lawrence'),
  ('become-a-swimming-pool-host-lewisville'), ('become-a-swimming-pool-host-mesquite'),
  ('become-a-swimming-pool-host-montgomery'), ('become-a-swimming-pool-host-nampa-idaho'),
  ('become-a-swimming-pool-host-new-haven'), ('become-a-swimming-pool-host-pasadena'),
  ('become-a-swimming-pool-host-plano'), ('become-a-swimming-pool-host-redbluff-ca'),
  ('become-a-swimming-pool-host-rio-rancho-new-mexico'), ('become-a-swimming-pool-host-santa-fe'),
  ('become-a-swimming-pool-host-santa-fe-new-mexico'), ('become-a-swimming-pool-host-springfield')
) as v(dup)
where c.slug = v.dup and c.template_type = 'host_acq_city' and c.status = 'redirect';
commit;
```

Before applying: re-run the export and the report (rows change), and check
in Search Console which URL of each pair gets the impressions; where the bare
URL is the one Google ranks, swap keeper and dup for that pair.

## 7. What still depends on data freshness

- **The listing mirror is stale.** `synced_listings` was last written
  2026-09-25 05:05 UTC and no scheduled sync exists. Every count and distance a
  RENTER page states ("2 private pools are listed…", "the nearest is 6 miles"),
  and whether a HOST page shows its inventory section at all, is true *of the
  mirror*, not necessarily of the marketplace today. A listing unpublished since
  September still counts; one published since does not. The marketplace is
  closed to bookings until January 1, which is why nothing on these pages says
  a pool is available or bookable.
- Pages are cached (Cloudflare, `/p/*` 600 s), so a sync shows up within ten
  minutes of the next render, not instantly.
- 3,203 of the 3,952 rendering rows still have no cities row (no centroid), so
  only exact-city matching works for them; they can never show nearby pools.
  For HOST pages that only means no section; for the 2 RENTER rows without a
  row it means "none" unless a listing is in that exact city.
- A failed inventory read no longer reads as "no pools": the loader and
  `getCityInventory` return `readFailed`, and the page then states no count.
- `nearbyTotal` is counted from the bounding-box read, which is capped at 200
  rows. With 125 eligible listings in the whole mirror that cap cannot bind
  today; if the mirror ever holds more than 200 eligible listings inside one
  city's 120-mile box, the stated nearby count becomes a lower bound and the
  cap should be raised or replaced by a count query.

## 8. Seen, not changed (outside this brief or rule 8)

- Comparison table on every host_acq_city page: "You take home on $200: $180"
  contradicts 0% host fees / keep 100% (should be $200). Fee copy — F14.
- "{City} is a top-tier U.S. pool rental market" / "has steady, growing pool
  rental demand" (`tierLabel`, derived from the state code only) and the
  host-city guide's "under-monetized asset" lines are demand claims with no
  data behind them. The tier sentence shares a paragraph with the "real
  liability coverage" sentence, so it is left for Derek (rule 8).
- Calculator: "Defaults are pre-tuned to local pricing" — the default rate is a
  state tier, not local data.
- HOST meta descriptions are the stored ones; some stored HOST `seo_title`s that
  are no longer used carried earnings figures ("Earn $150/hr", "Earn $3k+/mo").
- RENTER pages still emit FAQPage JSON-LD from host FAQs / stored `faq_items`;
  the visible FAQ now sits inside the host section.
- "Last updated" on these templates is the render date.
- Future bodies: the content generator prompt in
  `src/server/backfill-content-pages.server.ts` still tells the model to write
  `/s?address={City%2C+ST}`. Pages render those in the one form anyway
  (`normalizeSearchHref`), so this only affects stored text; not edited here
  because production runs server-only files that differ from the repo.
- Other `/s?address=` producers outside this brief: `home-page.tsx` (do-not-edit
  file), `home-page-winter.tsx` (adds `&bounds=`), `admin.click-report.tsx`
  (admin, not crawled).

Re-verified 2026-11-15 19:28 UTC with one read-only count query: 3,731
`become-a-*` rows, 277 others (185 `-xx`-suffixed incl. 3 topic slugs, 92
bare slugs, all 92 titled `Pool Rental in {City}, {ST}`), 56 with
`redirect_to`, 100 with `title_variant`, 125 eligible listings, mirror max
`updated_at` 2026-09-25 05:05 UTC — identical to the export used above.

## 9. Tests

- `tests/city-intent.test.mjs` (in `node --test "tests/*.test.mjs"`): the
  classifier, place parsing (bare, full-state-name, truncated, topic slugs),
  HOST/RENTER H1 and title builders, same-name cities, variants, renter wording
  (counts only, failed read states no count, ≤160-char meta), the one
  `/s?address=` form and normalisation of stored links.
- `npm run test:failed-reads` now also renders five intent fixtures against the
  local Supabase stub: HOST Tempe (2 pools listed), HOST Dayton (none), RENTER
  `tempe-az` (exact), RENTER `mesa-az` (nearby only, distances computed in the
  harness from the fixture coordinates), RENTER `chapel-hill` (bare slug, none).
  It checks the single H1, `<title>`, meta description, primary CTA and its
  href, presence/absence of the empty-inventory notice and of the host
  inventory section, section order (inventory → "Own a pool in …?" → body),
  the body's `+`-spelled search link rendering in the one form, no host
  JSON-LD on RENTER pages, no `pool-pros?city=` link, no earnings projection,
  and that every number in the renter intro and the inventory section is a
  fixture count, price, capacity, radius or distance.
