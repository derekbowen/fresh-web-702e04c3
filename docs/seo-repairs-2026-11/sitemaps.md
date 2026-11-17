# Sitemap integrity (audit fix F4, sitemap part of F2) — 2026-11-15

Branch `seo/03-sitemaps`, on top of `seo/01-failed-read-503` (every sitemap still answers
503, `Retry-After`, `no-store` on a failed read; one failed window of a paged read fails
the whole list).

**How the numbers were measured.** "Before" is the live crawl of every sitemap URL on
2026-11-14 (`crawl.jsonl`: 10,181 entries, 10,074 distinct). The same counts were
reproduced on 2026-11-15 with read-only SQL that applies the old route filters to
production data. Every per-sitemap "before" figure matched the crawl exactly. "After" is
the same SQL with the new rules, plus the constant lists in the code. Nothing was
written to the database. No deploy.

## Summary

| Sitemap (www) | Before | After | Change |
|---|---:|---:|---|
| `sitemap-static.xml` | 75 | 77 | −8 content-row duplicates, +2 moved from articles, +8 new (incl. `/s`) |
| `sitemap-pages-comparisons.xml` | 1,091 | 1,091 | reads are paged; no URL change today |
| `sitemap-pages-host-acquisition.xml` (4 files) | 3,933 | 3,931 | −`/p/hosting` (static owns it), −`/p/become-a-swimming-pool-host--ofallon-mo` (malformed twin) |
| `sitemap-pages-event-guides.xml` | 787 | 787 | — |
| `sitemap-pages-articles.xml` | 443 | 382 | −64, +3 |
| `sitemap-pages-academy.xml` | 207 (WEST file) / 70 (app) | 202 (app) | see `academy-sitemap.md` |
| `sitemap-pages-advocacy.xml` | 52 | 52 | — |
| `sitemap-pages-spanish.xml` | 446 | 446 | — |
| `sitemap-pages-swim-instructor.xml` | 349 | 349 | — |
| `sitemap-pages-blog.xml` | 143 | 51 | −92 |
| `sitemap-listings.xml` | 126 | 125 | −config listing |
| `public-pools.xml` (WEST pp-ssr, not this app) | 2,529 | 2,529 | — |
| **entries** | **10,181** | **10,022** | |
| **distinct URLs** | **10,074** | **10,022** | −63 removed, +11 added |
| URLs listed in two sitemaps | 107 | 0 | (5 remain on www until WEST proxies the academy path) |
| Listed URLs that redirect | 2 | 0 | |
| Listed URLs with a malformed slug (stray copies) | 2 | 0 | |
| Listed URLs that are noindex | 1 | 0 | |
| Listed URLs canonical on another host | 57 | 0 | |
| `sitemap-directory.xml` (reachable, not in the index) | 200, 1,357 noindex URLs | 410 Gone | |

"After" for academy assumes WEST proxies the path to the app (server step in
`academy-sitemap.md`). Until then www keeps serving its 207-URL file, and 5 URLs stay
duplicated between it and articles. Every other row is what this app emits.

## Owner rule: one URL, one sitemap

A URL belongs to whatever actually serves it (`src/lib/sitemap-rules.ts`, header):

- A dedicated route file `src/routes/p.<name>.tsx` wins over the `/p/$slug` dispatcher.
  So a `content_pages` row with that slug is not what visitors get. That URL belongs to
  `sitemap-static.xml` (or to comparisons for the three pillars), or to no sitemap when
  the route is noindex. The list is `DEDICATED_P_ROUTE_SLUGS` / `..._PREFIXES`. A unit
  test keeps it equal to the route files, so a new route file fails the test until it is
  listed.
- The dispatcher serves a `content_pages` row (or its `legacy_slugs` alias 301) before
  it looks at `blog_posts`. A blog post with such a slug therefore belongs to the
  content row's group, never to the blog sitemap. The blog sitemap decides this by
  running the dispatcher's own decision, `resolveContentPageLookup`, over batched
  reads (`loadContentServedSlugs` / `blogPostIsServedAsBlog`): a blog post is listed
  exactly when `/p/<slug>` would answer with that post. A `status='redirect'` row whose
  `url_path` is not `/p/<slug>`, or that has no `redirect_to`, is skipped by the
  dispatcher, so it does not hide the post; a published row at any `url_path` does; the
  bare-city 301 (`pool-rental-<city>` → `pool-rental-<city>-<st>`) is checked too. On
  2026-11-15 this gives the same 92 shadowed posts as before (0 posts change).
- Any other content row belongs to its template group. The groups are defined once, in
  `src/lib/sitemap-groups.ts`. The index (`TEMPLATE_GROUPS`) and every sub-sitemap route
  read that single definition, so a template type can no longer be in one list and
  missing from the other.

The index now counts each child by loading the exact list the child emits (all rules
applied), instead of a raw `count: "exact"` over `content_pages`. It cannot advertise a
`?page=N` with no entries or miss one that has entries.

## Defects, rules and the URLs that move

### 1. 107 URLs in two child sitemaps → 0

| Pair (before) | URLs | Rule | Where the URL is now |
|---|---:|---|---|
| articles + blog | 91 | blog post served by a content row → not in blog (`blogPostExclusion: served_by_content_page`) | articles |
| static + articles | 8 | content rows are owned by their group → removed from `STATIC_URLS` | articles: `/p/about`, `/p/become-a-host`, `/p/become-a-swimming-pool-host`, `/p/howitworksforguests`, `/p/investors`, `/p/make-money`, `/p/privacy-policy`; static: `/p/all-locations` (dedicated route, so it leaves articles instead) |
| academy (WEST file) + articles | 5 | typed `resource` rows → articles. The app academy route never listed them; they leave www's academy file once WEST proxies the path | articles |
| static + host-acquisition | 1 | `/p/hosting` is a dedicated route (`dedicated_route`) | static |
| static + academy | 1 | `/p/host-training-academy` is a typed `elearning` row | academy |
| comparisons + articles | 1 | `/p/swimply-alternative-vs-pool-rental-near-me` is a dedicated route | comparisons |

The 91 blog posts that leave the blog sitemap (each stays listed once, in articles,
because the content row is what `/p/<slug>` serves):

<details><summary>91 slugs</summary>

100-niche-ideas-for-branding-your-pool-rental-business, above-ground-pools-the-best-choices-for-summer,
accessibility-features-inclusive-pools, age-by-age-guide-to-kids-swim-classes, american-cities-with-pools,
arizonasmostfamouspoolinphoenix, attracting-influencers-pool-rental, backyard-pool-trends-2026,
balancing-and-maintaining-perfect-water-quality, benefits-of-baby-swim-classes, best-pool-floats-loungers-2026,
best-poolside-beers, blood-in-pool-cleaning-and-safety-guide,
branding-your-pool-adding-a-niche-like-foam-parties-to-boost-revenue,
bubble-covers-for-swimming-pools-the-ultimate-guide-to-protecting-and-enhancing-your-pool,
building-your-concrete-swimming-pool-everything-you-need-to-know,
building-your-in-ground-pool-everything-you-need-to-know, building-your-swimming-pool-the-complete-guide,
building-your-wooden-swimming-pool-everything-you-need-to-know, can-rain-ruin-your-pool,
check-inside-the-pool-safety-maintenance-and-tech-tips, choosing-the-ideal-pool-depth-guide,
choosing-the-right-pool-rental-service, comprehensive-how-to-guide-birthday-parties-for-kids-14-and-under,
dive-into-the-2000s-the-new-millennium-of-pool-party-innovation,
dive-into-the-nineties-epic-pool-parties-iconic-vibes-and-the-legacy-of-90s-style,
dive-into-the-seventies-the-legendary-era-of-1970s-pool-parties,
dive-into-the-sixties-iconic-pool-parties-and-their-cultural-impact, earthquakes-and-inground-pools-guide,
eco-friendly-pool-rental-practices, enhancing-pool-safety-with-new-innovations, find-best-private-pool-rentals,
handle-pool-emergencies-rental-host, hosting-nighttime-pool-events, hosting-your-first-pool-guest-2026,
how-long-does-it-take-to-build-a-pool, how-much-can-your-pool-earn-2026,
how-personal-trainers-make-swim-lessons-safer, how-to-open-your-pool-for-summer,
how-to-remove-sand-from-your-pool, how-to-set-fun-and-effective-pool-rules-for-renters,
howtoturnyourbackyardpoolintoabusinessasset, inspect-your-pools-core-safety-upkeep-and-tech-insights,
insurance-guide-for-pool-owners, limescale-and-tartar-in-your-swimming-pool-how-to-get-rid-of-them,
make-money-renting-out-your-pool, making-a-splash-world-records-and-record-breaking-feats-in-pools,
natural-swimming-pools-eco-friendly-backyard-alternatives, navigating-pool-care-before-during-and-after-a-freeze,
photograph-pool-for-rental-appeal, pool-cleaning-guide-everything-you-need-to-know-about-pool-robots,
pool-etiquette-and-post-swim-care-guide,
pool-heating-everything-you-need-to-know-to-choose-the-best-device-in-2024, pool-party-ideas-summer-2026,
pool-rental-near-me-the-airbnb-of-pools, pool-rental-tax-write-offs-your-missing-out-on,
pool-safety-tech-guide-2026, pool-side-hustle-starter-guide-2026, pool-tech-gadgets-summer-2026,
poolside-games-for-all-ages-beyond-marco-polo, poolside-snacks-and-drinks, poolside-yoga-and-fitness-classes,
rainy-day-how-to-salvage-your-pool-rental-experience, rent-a-pool-for-kids-birthday-party,
retaining-walls-and-freestanding-walls-adding-beauty-and-function-to-your-outdoor-design,
seasonal-pool-decor-ideas, secrets-of-the-playboy-mansion-pool, steps-to-get-permits-for-building-a-pool,
swimply-vs-pool-rental-near-me-2026,
teaching-children-to-swim-during-winter-safety-age-guidelines-and-the-role-of-personal-trainers,
the-3-best-swimming-pool-chlorines-how-to-choose-the-right-chlorine-for-your-pool,
the-cost-breakdown-of-building-a-pool-in-2025-everything-you-need-to-know,
the-evolution-and-rise-of-pool-toys-a-journey-through-summer-fun,
the-latest-trends-in-pool-lighting-illuminate-your-oasis-in-style,
the-solar-pool-cover-the-ultimate-solution-for-maintaining-optimal-water-temperature,
the-ultimate-guide-to-poolside-photo-booths, themed-pool-parties-for-adults-from-tiki-to-casino-nights,
too-many-pool-chemicals-risks-and-fixes, top-20-pool-problems-and-how-to-fix-them-fast,
top-20-romantic-us-retreats-with-pools, top-pool-maintenance-apps-and-smart-tech-2024, top-pool-rental-platforms,
top-water-safety-tips-for-babies-and-toddlers,
ultimate-guide-to-maintaining-your-swimming-pool-and-hosting-unforgettable-pool-parties-in-the-usa,
what-to-bring-to-a-pool-rental-2026, what-to-include-in-a-welcome-kit-for-pool-renters,
why-consistency-matters-in-swim-lessons,
why-pool-owners-are-such-fans-of-pool-rental-services-testimonials-and-real-life-cases,
why-renting-a-private-pool-is-better, why-renting-your-swimming-pool-in-riverside-ca-is-an-excellent-idea,
winter-swimming-for-babies

</details>

Note: the articles copy of each of these carries the content row's lastmod
(`content_refreshed_at` or `created_at`, often 2026-05-03), not the blog post's
`updated_at` (mostly 2026-07-16). That is the date of the page that is actually served.

### 2. Two listed URLs redirect → 0

| URL | Sitemap | Why it was emitted | Rule |
|---|---|---|---|
| `/p/ultimate_pool_party_music_and_sound_system_guide` | articles | A published `resource` row with an underscore slug. The edge rewrites `_` to `-` before the app sees the request: `/p/pool_rental_guarantees` → 301 `/p/pool-rental-guarantees` on `.com` and on `.co.uk`, and no app code does this. 100 published content rows have underscore slugs; this was the only one with `in_sitemap = true`. | `isServableSlug`: no `_`, no upper case (`slug_redirects`). The hyphenated URL is a blog post and stays in the blog sitemap. |
| `/p/opening-pool-for-summer` | blog | A published blog post whose slug is a `legacy_slugs` alias of the content row `opening-a-pool`. The dispatcher 301s the alias before it looks at `blog_posts`. | `loadContentServedSlugs`: the dispatcher's decision is run for each blog slug; a slug it serves from a content row or 301s (exact redirect row, alias, bare-city fallback) is not a blog URL. |

### 2b. Malformed slugs (stray copies) → 0

Not in the task's list, found while re-checking: two published, `in_sitemap` rows have
slugs no real page has. Both answer 200 and are self-canonical, so each is a near copy
of a listed page at a junk URL.

| URL | Sitemap | Twin that stays listed |
|---|---|---|
| `/p/learningacademy)` | articles | `/p/learningacademy` ("Pool Host Learning Academy"; the stray row is titled "Learning Academy", created the same day) |
| `/p/become-a-swimming-pool-host--ofallon-mo` | host-acquisition | `/p/become-a-swimming-pool-host-ofallon-mo` |

Rule (`isWellFormedSlug`, exclusion `malformed_slug`): a slug must be lower-case words
of `[a-z0-9]` joined by single hyphens, optionally nested with `/` (`es/<slug>`). Applied
to content rows and blog posts. On 2026-11-15 only these two rows (plus the underscore
slug above) fail it; no published blog post and no listing slug does. The rows
themselves are unchanged (they still answer 200); whether to 301 them to their twins is
left open.

Also guarded, with 0 rows today: a published row shadowed by a `status='redirect'` row
with the same slug and `url_path` (`shadowed_by_redirect_row`), and a `url_path` other
than `/p/<slug>` (`url_path_mismatch`; it drops `learning-academy` → `/learning-academy`,
which was already dropped by the old prefix check).

### 3. `/p/pool-pros` (noindex, nofollow) in articles → removed

A `resource` row has the slug `pool-pros`, but `src/routes/p.pool-pros.tsx` answers that
path with `noindex, nofollow`. Rule: `dedicated_route`. The whole `/p/pool-pros/*` tree is
covered by the prefix `pool-pros/`.

### 4. 57 canonicals on another host → 0

Rule (`canonicalIsElsewhere`): a row with a non-empty `canonical_override` that does not
normalise to its own `https://www.poolrentalnearme.com/p/<slug>` is not listed. Blank
overrides are ignored, as `p.$slug.tsx` ignores them. A self-pointing override is kept
(none today). All 57 were in articles: 19 each to `poolrentalnearme.co.uk`,
`poolrentalnearme.ca` and `poolrentalnearme.com.au`. Three more rows with overrides
(`pool-rental-insurance-explained-{canada,australia,uk}`) have `in_sitemap = false` and
were never listed.

<details><summary>57 slugs that leave the articles sitemap</summary>

allowing-nudity-at-your-pool-{australia,canada,uk}, australian-cities-with-pools,
bubble-covers-for-swimming-pools-the-ultimate-guide-to-protecting-and-enhancing-your-pool-{australia,canada,uk},
canadian-cities-with-pools, green-pool-recovery-{australia,canada,uk}, hosting-{australia,canada,uk},
how-it-works-{australia,canada,uk}, pool-heating-guide-{australia,canada,uk},
pool-hire-tax-deductions-{australia,uk}, pool-maintenance-{australia,canada,uk}, pool-pros-{australia,canada,uk},
pool-pump-troubleshooting-{australia,canada,uk}, pool-rental-london, pool-rental-manchester,
pool-rental-melbourne, pool-rental-sydney, pool-rental-tax-write-offs-canada, pool-rental-toronto,
pool-rental-vancouver, pool-stains-removal-{australia,canada,uk}, romantic-pool-escapes-{australia,canada,uk},
swimply-alternative-vs-pool-rental-near-me-{australia,canada,uk},
the-evolution-and-rise-of-pool-toys-a-journey-through-summer-fun-{australia,canada,uk},
top-pool-rental-platforms-{australia,canada,uk}, uk-cities-with-pools, why-hosts-are-leaving-swimply-{australia,canada,uk}

</details>

Where the 57 go after this change: 50 match a `sitemap-country.xml` pattern on their
ccTLD (`%-uk`, `%-australia`, `%-canada`, `australian-%`, `canadian-%`), so that ccTLD
sitemap still lists them. The other 7 match no pattern, so after deploy **neither the www
URL nor its canonical target is in any sitemap**: `pool-rental-london`,
`pool-rental-manchester`, `uk-cities-with-pools` (→ `poolrentalnearme.co.uk`),
`pool-rental-melbourne`, `pool-rental-sydney` (→ `.com.au`), `pool-rental-toronto`,
`pool-rental-vancouver` (→ `.ca`). Excluding them from www is still right (a sitemap must
not list a URL canonicalised elsewhere); giving them a home is part of F10 (add them to
`COUNTRY_MATCH`, or drop the override). Listed under decisions left open.

The 9 `country_launch` pages have no override, are self-canonical on www and stay
listed. Their one-home question belongs to F10.

### 5. Configuration listing → removed

`/l/config-listing-do-not-delete/6768ea36-b435-40df-b331-43be74aa882f` ("CONFIG LISTING -
DO NOT DELETE"). Rule (`listingExclusion`): the Sharetribe id is in
`NON_PUBLIC_LISTING_IDS` (one constant, documented). As a backstop, a title matching
`config listing` / `configuration listing` / `do not delete` (or a slug containing
`config-listing` / `do-not-delete`) is also excluded, so a second configuration listing
created the same way is caught. All 126 published mirror titles were checked on
2026-11-15: no other test or config entry. Some titles repeat ("A Little Piece of
Heaven", "Huge pool, Mediterranean / Caribbean", "Swim & Relax in Style...") but they
are separate host listings, not test data.

### 6. Comparisons read stopped at PostgREST's 1,000-row cap → paged

`cities` and the redirect lookup were read with `.limit(5000)`, which PostgREST caps at
1,000 rows. Both now go through `readAllRows`: `.range()` windows ordered by
`slug, id` (cities) and `id` (redirects), advancing by the rows actually returned and
stopping on an empty window. A server cap below the window size therefore cannot
truncate them either. The `redirect_to` exclusion is kept. Today: 592 published cities,
96 redirected city pages → 3 + 2 × 592 − 96 = 1,091 URLs, the same as before. The 78
exact-duplicate city pairs are untouched (later step, F6a). Every other database list
(content groups, blog, listings, the redirect-row and blog-shadow lookups) is read the
same way. The blog and listings sitemaps also used to page on `updated_at` alone, which
is not unique: all 126 listings share one timestamp. They now add a unique tie-breaker.

### 7. 302 untyped published rows → reviewed, 134 included

Full classification: `untyped-pages.md`. Included: 131 `elearning-academy-*` and
`academy-catalog` (academy group, already listed on www through the WEST file), and
`pool-host-tools` and `qr-code-generator` (articles group). These are named in
`src/lib/sitemap-groups.ts` and are only matched while `template_type IS NULL`. Excluded:
163 redirect rows, 3 thin city twins, `how-hosting-works`, and `prnm-facts` (wrong fee
copy).

The one typed row no group read, `resource_article`
(`/p/choosing-the-best-vacuum-cleaner-for-your-swim-spa-top-recommendations-and-tips`:
200, self-canonical, 646 words), joins articles. Two other typed rows stay out:
`account_legal` `/p/terms-of-service` (WEST 301s it to `/terms-of-service`) and
`city_guide` `/p/phoenix-az-private-pool-rentals-guide` (184 words, thin).

### 8. Indexable pages in no sitemap

The audit listed 29 indexable `/p/` pages and 12 static routes. The 12 static routes are
the audit's "static p.* routes in NO sitemap, 200 and indexable live"
(`notes/sitemap-code.md`, section 7): `/p/about-our-company`, `/p/affiliate`,
`/p/affiliate-program`, `/p/author/derek-bowen`, `/p/earnings-calculator`, `/p/jan`,
`/p/neighbors`, `/p/la-saltwater-featured`, `/p/pool-party-rentals`, `/p/pool-rental-app`,
`/p/private-pool-rental`, `/p/privacy-request`. Each has a decision in the two tables
below (7 added, 5 not added). Each was probed on 2026-11-15: status, robots meta,
`X-Robots-Tag`, canonical, words in `<main>`, and forms.

Added to `sitemap-static.xml` (dedicated routes; all 200, no noindex, one self canonical):

| URL | Words |
|---|---:|
| `/p/about-our-company` | 370 |
| `/p/author/derek-bowen` | 484 |
| `/p/earnings-calculator` | 360 |
| `/p/neighbors` | 367 |
| `/p/pool-party-rentals` | 1,319 |
| `/p/pool-rental-app` | 1,282 |
| `/p/private-pool-rental` | 1,169 |
| `/s` (WEST marketplace, audit section 8: bare `/s` belongs here; every `/s?…` stays noindex,follow) | 581 |

Also in static now, moved from articles (dedicated routes that articles listed through a
same-slug content row): `/p/how-it-works`, `/p/blog`. Added to articles: `/p/pool-host-tools`
(untyped, above) and the `resource_article` page.

Not added:

| URL | Why |
|---|---|
| `/p/affiliate-program` | sign-up form, 72 words |
| `/p/privacy-request` | form, 169 words, no canonical |
| `/p/affiliate` | states a "10% platform fee" twice (the host fee is 0%); list after F14 |
| `/p/jan`, `/p/la-saltwater-featured` | single-host showcase pages for listings that have their own `/l/` page; open |
| 16 `/p/become-a-swimming-pool-host-*` + `/p/new-hampton-ny`, `/p/rio-medina-tx` | typed `host_acq_city` rows with `in_sitemap = false` (65 such published rows in total). The flag is a deliberate data setting; changing it is a database decision, not a code one |

Marketplace (WEST) pages in no sitemap. These are not among the audit's 12 and the audit
recommends only bare `/s` for `sitemap-static.xml` (section 8), so none was added. They
were listed only by WEST's own `/sitemap-default.xml`, which is not in the www index.
Probed live on 2026-11-15:

| URL | Live | Decision |
|---|---|---|
| `/privacy-policy` | 200, `index, follow`, self canonical, 6,199 words | open: candidate for `sitemap-static.xml` |
| `/terms-of-service` | 200, `index, follow`, self canonical, 7,692 words (`/p/terms-of-service` 301s here) | open: candidate for `sitemap-static.xml` |
| `/host-standards` | 200, `index, follow`, self canonical, 2,445 words | open: candidate for `sitemap-static.xml` |
| `/amenities` | 200, no robots meta, self canonical, 1,774 words | open: candidate; note `/amenity/<anything>` answers 200 for any path (audit F9) |
| `/signup` | 200, `index, follow`, self canonical, 121 words | not a candidate: a sign-up form |
| `/u/<uuid>` (12 linked) | 200, indexable, 34–164 words | not a candidate: thin profiles, audit F9 says noindex them |

A duplicate this change leaves listed: `/p/privacy-policy` (articles) is a scraped copy of
the policy, titled and headed "privacy-policy | Pool Rental Near Me", self-canonical,
while the real policy is `/privacy-policy` (above). It was in static and articles; it is
now in articles only, because static lists dedicated routes only. It passes every rule
(published, `in_sitemap`, no override), so removing it is a content decision: 301
`/p/privacy-policy` to `/privacy-policy` (as `/p/terms-of-service` already is), or set
`in_sitemap = false`. Listed under decisions left open.

### 9. `sitemap-directory.xml` (1,357 noindex URLs) → 410 Gone

Every URL in it was in the noindex `/p/pool-pros` tree, and no indexable URL exists
there today. The route now answers `410` with a one-line text body,
`Cache-Control: public, max-age=3600` (re-readable, so a crawler sees it is still gone)
and `X-Robots-Tag: noindex`. It reads nothing, so it is 410 in every database state.
References checked: not in the sitemap index (since 2026-07-06), not in
`src/routes/robots[.]txt.ts`, and not in the live www `robots.txt` (which declares
`/sitemap.xml` and `/public-pools.xml`). It was in the admin indexing page's sitemap list,
which has been updated. WEST nginx's sitemap regex still proxies the path to EAST, which
is what serves the 410. Whether it is still submitted in Search Console is unknown from
here.

### 10. Academy

See `academy-sitemap.md`. App route 70 → 202. The WEST file (207) equals the new app
list plus the 5 articles duplicates. The server step for WEST is to proxy the path to
this app. That step is not done here.

### 11. Sitemap index

- Lists `sitemap-static.xml` and `sitemap-pages-comparisons.xml` (never empty), each
  content group with `ceil(n / 1000)` files where `n` is the group's final entry count,
  and blog and listings the same way. A group with no entries is not listed (money and
  cities today).
- Children that are not listed hold no indexable URL: `sitemap-pages-money.xml` and
  `sitemap-pages-cities.xml` (0 rows), `sitemap-pages-courses.xml` (retired, empty
  urlset), `sitemap-directory.xml` (410), `sitemap-country.xml` (ccTLD hosts only,
  declared by their own robots.txt), and the 301 aliases.
- Blog and listing index entries keep a `lastmod`, now the newest `lastmod` in the list
  itself (it was `max(updated_at)` over the same rows).
- Cost: each content group is read in full, in 1,000-row windows plus one empty window,
  and the redirect-row lookup is added. A cold index build issues about 40 small
  sequential reads, behind the existing stale-while-revalidate memo, which is warmed at
  boot. Each sub-sitemap request reads its whole group (host-acquisition: 1 + 1
  redirect-lookup windows and 4 + 1 group windows, 7 reads, where the old route made 1),
  and each `?page=N` file repeats that walk; responses are cached 300 s.
- Reliability: because one request is now several reads, `readAllRows` retries a window
  once, immediately, after a returned or thrown error (the index already retried its
  counts after intermittent empty-message errors). A timeout is not retried, so a hung
  database still answers 503 within one read timeout. A failure that persists through
  the retry still fails the whole list: 503, never a truncated sitemap. Not done:
  memoising each group's list in-process and sharing it between `?page=N` files and the
  index; the retry addresses the 503 rate, and the cost is 7 small reads per uncached
  request.

## Tests

- `tests/sitemap-rules.test.mjs` (new, 25 tests). Every exclusion rule (including `malformed_slug`); the
  dedicated-route list against the `src/routes` files; `STATIC_URLS` against that list;
  group ownership (no type in two groups, untyped rows owned once); the PostgREST
  or-tree; paging with a server cap below the window; comparisons with 1,234 cities
  (more than 1,000, with no `.limit()`); a failed window or failed lookup fails the
  list; a window is retried once after an error but not after a timeout; blog shadow and
  alias rules with the quoted array literal, and the dispatcher mirror (a redirect row at
  another `url_path` or with no target does not hide a post, a published row at any
  `url_path` does, the bare-city 301 does); the config listing.
- `tests/sitemap.test.mjs` (updated, 15 tests). The builder reads the whole group in
  windows; `?page=N` is cut from the final list; a failure in a second window or in the
  redirect-row lookup is a 503; 410 response helper.
- `npm run test:failed-reads`. The stub now applies PostgREST's 1,000-row cap and
  evaluates nested `and()`/`or()` trees and `ov`. Fixtures add one row per exclusion
  rule (including two malformed slugs, and a blog post behind a redirect row the
  dispatcher skips, which the blog sitemap must list) and 1,200 extra published cities. In healthy mode the harness asserts: every index
  child is 200 and non-empty; no unlisted child has entries; no URL appears twice across
  children; none of the excluded fixtures is listed; each owner fixture is listed exactly
  once, by its owner; comparisons lists 2,404 entries for 1,201 cities (3 pillars + 2 per city − 1 redirected); every listed URL
  this app serves answers 200, is not noindex, and is its own canonical. In every mode,
  `sitemap-directory.xml` is 410. Result: 323 passed, 0 failed. Run against a build of
  `b3e2ace` (this branch's base), before the malformed-slug and redirect-row fixtures were
  added, the same harness failed 30 checks: six of the nine excluded
  fixtures listed, two duplicates, comparisons 2,002 entries for 1,201 cities (cut at
  1,000), the academy course missing, and directory 503 instead of 410.

## Decisions left open

1. WEST: proxy `/sitemap-pages-academy.xml` to EAST after this ships
   (`academy-sitemap.md`).
2. F14 first, then list `/p/affiliate` and `/p/prnm-facts`.
3. `/p/jan`, `/p/la-saltwater-featured`: list them or not.
4. The 65 published `host_acq_city` rows with `in_sitemap = false` (18 of them are linked
   from indexable pages): keep them unlisted or flip the flag (a database change).
5. `sitemap-country.xml` (ccTLDs) still has no status or `redirect_to` filter, and lists
   the `www.` ccTLD URL of pages whose canonical is the bare ccTLD host. That is part of
   F10 and was not changed here.
6. Seven pages canonicalised to a ccTLD are now in no sitemap on any host (section 4):
   `pool-rental-london`, `pool-rental-manchester`, `uk-cities-with-pools`,
   `pool-rental-melbourne`, `pool-rental-sydney`, `pool-rental-toronto`,
   `pool-rental-vancouver`. F10: add them to `COUNTRY_MATCH`, or drop the override so
   www lists them again. The audit (section 9) notes 7 canonical targets are
   robots-blocked on their ccTLD.
7. WEST marketplace sitemaps (`/sitemap-index.xml`, `/sitemap-default.xml`,
   `/sitemap-recent-listings.xml`, 130 `/l/<uuid>` URLs that all 301) are served by the
   marketplace container, not this app. Unchanged.
8. Marketplace pages `/privacy-policy`, `/terms-of-service`, `/host-standards` and
   `/amenities` are indexable, self-canonical and in no www sitemap (section 8). Adding
   them to `sitemap-static.xml` is the owner's call, as `/s` was; then decide
   `/p/privacy-policy` (a scraped duplicate of `/privacy-policy`, still in articles):
   301 it to `/privacy-policy` or set `in_sitemap = false`.
9. The two malformed-slug rows (`learningacademy)`,
   `become-a-swimming-pool-host--ofallon-mo`) are out of the sitemaps but still answer
   200: 301 them to their twins or unpublish them (a database change).
10. Search Console: resubmit `/sitemap.xml`, and remove `/sitemap-directory.xml` if it is
   still submitted (owner action).
