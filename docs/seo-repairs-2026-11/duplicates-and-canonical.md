# Comparison duplicates and canonical host (audit F6(a), F10), 2026-11-16

Branch `seo/04-dupes-canonical`, stacked on `seo/03-sitemaps`, which is on
`seo/01-failed-read-503`. Every sitemap still answers 503 with `Retry-After`
and `no-store` on a failed read, and so does the new `sitemap-country.xml` read.

**What this changes.** One explicit 301 per confirmed duplicate comparison URL.
One explicit country/host mapping (`src/lib/country-sites.ts`) that now decides
every canonical, og:url, hreflang href, the ccTLD `robots.txt` and
`sitemap-country.xml`. Nothing changes what a host serves, and no host is
redirected. No database write. No deploy.

**Snapshot dates of every number below.**

| source | date | what |
|---|---|---|
| audit crawl `crawl.jsonl` / `texts.jsonl` | 2026-11-14 | 10,074 sitemap URLs with status, canonical, main-text sha1 and every internal link |
| `comparison-duplicates/refetch-2026-11-15.json` | 2026-11-15 23:30 UTC | both URLs of the 78 pairs re-fetched from production |
| `comparison-duplicates/refetch-2026-11-16.json` | 2026-11-16 19:29 UTC | the same, again (this run) |
| `comparison-duplicates/cities-2026-11-15.psv` | 2026-11-15 | read-only `cities` rows behind both slugs of every pair (96 rows) |
| `country-mapping/content-pages-2026-11-15.psv` | 2026-11-15 | read-only `content_pages` rows matched by any country test (69 rows) |
| `country-mapping/live-before-2026-11-15.json` and `live-before-2026-11-16.json` | 2026-11-15 23:50 UTC and 2026-11-16 19:34 UTC | per host: robots.txt, sitemap-country.xml, canonical and hreflang of 5 pages. The two runs are identical |

Production's database tool was unavailable on 2026-11-16, so four facts are
not yet confirmed by a fresh read. They are in `PENDING-READS.md` (R1 to R4),
each with the result it should return.

---

## A. Exact duplicate comparison pages (F6(a))

### Outcome: 78 of 78 pairs confirmed, 0 left alone

The evidence lists 78 pairs of `/p/{giggster|peerspace}-vs-pool-rental-near-me-in-<city>`
URLs whose main text had the same sha1 in the 2026-11-14 crawl. Each pair is a
bare-city slug and its state-suffixed slug. A pair is confirmed only when **all**
of these hold (`ops/seo-repairs-2026-11/comparison-duplicates/generate.mjs`):

- the suffixed URL is exactly the bare URL plus `-` and a two-letter state code;
- in **every** re-fetch (2026-11-15 and 2026-11-16), both URLs answer 200 with
  no `Location`, each canonical is itself, and the main text has the same sha1
  and the same H1. The extraction is the audit's, so the sha1s are comparable;
- both `cities` rows exist and are published, with the same `name`, `state` and
  `state_code`. The suffix equals that `state_code`, and the coordinates are
  within 40 km.

All 78 pass. The two re-fetches agree with each other and with the audit crawl
(0 sha1 changes). The coordinates differ because one row of each pair carries a
city-centre point and the other a ZIP centroid. The largest gaps are Houston
(34.2 km), Phoenix (25.5 km) and Mesa (22.7 km), all in the same city. The
bare slug `glendale` is Glendale, **AZ**. It pairs with `glendale-az`, while
`glendale-ca` is a different city. This is why the redirect is an explicit list
and not a "strip or append the state" rule.

No pair failed, so none is listed as left alone. Comparison URLs that are not
among the 78 are untouched. Examples: the 13 that a content row already
redirects, `giggster-...-in-los-angeles` (hub tier, text differs from `-ca`)
and `peerspace-...-in-akron`. Nothing is redirected to a national page.

| bare city slug | canonical (suffixed) slug | redirected | cities rows apart |
|---|---|---|---:|
| `boston` | `boston-ma` | giggster + peerspace | 0.3 km |
| `carlsbad` | `carlsbad-ca` | peerspace | 3.9 km |
| `carrollton` | `carrollton-tx` | giggster + peerspace | 4.8 km |
| `charlotte` | `charlotte-nc` | giggster + peerspace | 19.4 km |
| `cincinnati` | `cincinnati-oh` | giggster + peerspace | 7.7 km |
| `dallas` | `dallas-tx` | giggster + peerspace | 15.9 km |
| `denver` | `denver-co` | giggster + peerspace | 10.5 km |
| `el-paso` | `el-paso-tx` | giggster + peerspace | 0.2 km |
| `escondido` | `escondido-ca` | giggster | 2 km |
| `fort-worth` | `fort-worth-tx` | giggster + peerspace | 10.2 km |
| `franklin` | `franklin-tn` | giggster + peerspace | 0 km |
| `fresno` | `fresno-ca` | giggster + peerspace | 9.1 km |
| `frisco` | `frisco-tx` | giggster + peerspace | 5.1 km |
| `glendale` | `glendale-az` | giggster + peerspace | 2 km |
| `hayward` | `hayward-ca` | giggster | 5.5 km |
| `houston` | `houston-tx` | giggster + peerspace | 34.2 km |
| `huntington-beach` | `huntington-beach-ca` | giggster + peerspace | 2.7 km |
| `indianapolis` | `indianapolis-in` | giggster + peerspace | 9.8 km |
| `lakewood` | `lakewood-co` | giggster + peerspace | 3.1 km |
| `littleton` | `littleton-co` | giggster + peerspace | 9.6 km |
| `los-angeles` | `los-angeles-ca` | peerspace | 13 km |
| `louisville` | `louisville-ky` | giggster + peerspace | 19.3 km |
| `memphis` | `memphis-tn` | giggster | 13.7 km |
| `mesa` | `mesa-az` | giggster | 22.7 km |
| `murfreesboro` | `murfreesboro-tn` | giggster + peerspace | 7 km |
| `murrieta` | `murrieta-ca` | giggster | 7.2 km |
| `nashville` | `nashville-tn` | giggster + peerspace | 9.9 km |
| `new-york` | `new-york-ny` | peerspace | 0.6 km |
| `norfolk` | `norfolk-va` | giggster + peerspace | 0 km |
| `north-las-vegas` | `north-las-vegas-nv` | giggster + peerspace | 5.4 km |
| `phoenix` | `phoenix-az` | giggster + peerspace | 25.5 km |
| `plano` | `plano-tx` | giggster + peerspace | 12.7 km |
| `portland` | `portland-or` | giggster + peerspace | 11.4 km |
| `raleigh` | `raleigh-nc` | giggster | 10.7 km |
| `richmond` | `richmond-va` | giggster | 6.3 km |
| `rockville` | `rockville-md` | giggster + peerspace | 5.4 km |
| `roseville` | `roseville-ca` | giggster | 0 km |
| `round-rock` | `round-rock-tx` | peerspace | 0.4 km |
| `san-diego` | `san-diego-ca` | giggster + peerspace | 12.2 km |
| `santa-clara` | `santa-clara-ca` | giggster + peerspace | 1.9 km |
| `scottsdale` | `scottsdale-az` | giggster + peerspace | 15.5 km |
| `sunnyvale` | `sunnyvale-ca` | giggster + peerspace | 0 km |
| `tampa` | `tampa-fl` | peerspace | 9.9 km |
| `tempe` | `tempe-az` | giggster + peerspace | 5.4 km |
| `the-woodlands` | `the-woodlands-tx` | giggster + peerspace | 3 km |
| `tulsa` | `tulsa-ok` | giggster | 15.4 km |

32 cities have both competitors' pages redirected and 14 have one (the other
competitor's pair was not in the identical-text evidence).

### Implementation

- `src/lib/comparison-duplicates.ts` is **generated** by
  `ops/seo-repairs-2026-11/comparison-duplicates/generate.mjs`. Its inputs are
  checked in beside it: the evidence, both re-fetches, the cities snapshot,
  `refetch_pairs.py`, and `decisions.json`, which records the result per pair.
  `generate.mjs --check` and a unit test fail if the list is stale.
- The two comparison city routes answer **one 301** to the suffixed URL in
  `beforeLoad`, before any loader or database read. The 301 lookup matches the
  exact path only.
- `sitemap-pages-comparisons.xml` skips the 78 bare URLs and keeps listing
  their twins.

### Internal links to the bare URLs

| where | links to the 78 bare URLs | source |
|---|---:|---|
| code (`src/**`, excluding the generated list and the route files' own patterns) | 0 | grep, 2026-11-16 |
| rendered pages: every one of the 10,074 sitemap pages | 0 (and 0 to the 78 suffixed URLs) | `texts.jsonl` link lists, 2026-11-14 |
| database bodies (`content`, `body_markdown`, `blog_posts.content`, `related_slugs`) | not measured; expected 0 | `PENDING-READS.md` R1 |

No code link needed changing. The F5 link inventory covers database bodies
too, but only for link targets that did not answer 200 on 2026-11-15, and these
78 answered 200 then. So R1 is the only database check. If it returns rows,
the content-repair step applies the md5-guarded template at the end of
`PENDING-READS.md`.

### Before / after (www.poolrentalnearme.com)

| URL | before (2026-11-16) | after |
|---|---|---|
| 78 bare URLs | 200, self-canonical, listed in `sitemap-pages-comparisons.xml` | 301 to the state-suffixed URL, one hop, not listed |
| 78 state-suffixed URLs | 200, self-canonical, listed | unchanged |
| `sitemap-pages-comparisons.xml` | 1,091 entries (step 03 count) | 1,013 |
| every other comparison URL | unchanged | unchanged |

---

## B. Canonical host and country mapping (F10)

### The mapping (`src/lib/country-sites.ts`)

A page belongs to a country only by an explicit **suffix** or an **exact
slug** of a single-segment `/p/<slug>`. Substring and bare-wildcard matching
are never used. On 2026-11-14 the sitemap held 20 live US URLs containing a
country city name (`/p/become-a-swimming-pool-host-london-oh`,
`/p/giggster-...-in-manchester`, the Vancouver WA public pools, ...). None of
them maps to a country.

| country | canonical host | other host that serves it | suffixes | exact slugs |
|---|---|---|---|---|
| GB | `poolrentalnearme.co.uk` | `www.poolrentalnearme.co.uk` | `-uk`, `-united-kingdom` | `rent-out-your-pool-london`, `rent-out-your-pool-manchester`, `pool-rental-london`, `pool-rental-manchester`, `uk-cities-with-pools` |
| CA | `poolrentalnearme.ca` | `www.poolrentalnearme.ca` | `-canada` | `canadian-cities-with-pools`, `rent-out-your-pool-toronto`, `rent-out-your-pool-vancouver`, `pool-rental-toronto`, `pool-rental-vancouver` |
| AU | `poolrentalnearme.com.au` | `www.poolrentalnearme.com.au` | `-australia` | `australian-cities-with-pools`, `rent-out-your-pool-sydney`, `rent-out-your-pool-melbourne`, `pool-rental-sydney`, `pool-rental-melbourne` |
| everything else | `www.poolrentalnearme.com` | the ccTLDs serve it too | — | — |

**Why the bare ccTLD is the canonical host.** On 2026-11-15 all 60 stored
`canonical_override` values pointed at the bare ccTLD with the page's own path.
Every ccTLD sitemap already listed the bare host. `www.<ccTLD>` already
answered with a canonical to the bare host for those rows (live matrix,
2026-11-15 and 2026-11-16).

**Rules.**

1. A country page has exactly one canonical,
   `https://<its canonical host>/p/<slug>`, whichever of the 7 hosts served it.
2. Every other page canonicalises to `https://www.poolrentalnearme.com`,
   whichever host served it.
3. A stored `canonical_override` may change the **path**, never the host. The
   mapping decides the host. On 2026-11-15 every one of the 60 overrides equals
   its own row's mapped canonical, so no stored decision changes. An override
   that names another host is ignored.

**Which rows are country pages** (read-only snapshot, 2026-11-15). There are
69 rows, all published, and all map to the country of their locale:

| | GB | CA | AU |
|---|---:|---:|---:|
| `resource` with an override, in a sitemap | 19 | 19 | 19 |
| `resource` with an override, `in_sitemap=false` (`pool-rental-insurance-explained-*`) | 1 | 1 | 1 |
| `country_launch` (no override) | 3 | 3 | 3 |

Of the 2026-11-14 crawl's 10,074 sitemap URLs, 66 map to a country: the 57
override pages and the 9 launch hubs, all in the snapshot.

### robots.txt

| host | before (live 2026-11-16) | after |
|---|---|---|
| `www.poolrentalnearme.com` | production body | unchanged |
| `poolrentalnearme.co.uk` and `www.` | `Disallow: /`; Allow `/p/*-uk$`, `/p/*-united-kingdom$`, 2 launch hubs; Sitemap on the requesting host | `Disallow: /`; Allow the 2 suffixes + 5 exact slugs (each `$`-anchored), `/sitemap-country.xml$`, `/fw-assets/`; Sitemap `https://poolrentalnearme.co.uk/sitemap-country.xml` on both hosts |
| `poolrentalnearme.ca` and `www.` | Allow `/p/*-canada$`, `/p/canadian-*` (unanchored prefix), 2 hubs | Allow `-canada` + 5 exact slugs, `/sitemap-country.xml$`, `/fw-assets/`; Sitemap on `poolrentalnearme.ca` |
| `poolrentalnearme.com.au` and `www.` | Allow `/p/*-australia$`, `/p/australian-*` (unanchored prefix), 2 hubs | Allow `-australia` + 5 exact slugs, `/sitemap-country.xml$`, `/fw-assets/`; Sitemap on `poolrentalnearme.com.au` |

The robots route now keys on `X-Forwarded-Host`, then `Host`, the same as the
page renderer. Before, it keyed on `request.url`.

**The 7 canonical targets that were robots-blocked** (`.com` pointed Google at a
URL it may not fetch), now allowed: `pool-rental-london`,
`pool-rental-manchester`, `uk-cities-with-pools` (co.uk), `pool-rental-toronto`,
`pool-rental-vancouver` (ca), `pool-rental-sydney`, `pool-rental-melbourne`
(com.au). Two more were blocked on every ccTLD: the ccTLD's own
`/sitemap-country.xml`, and `/fw-assets/`, which the pages need to render. Both
are now allowed.

### sitemap-country.xml

| host | before (live 2026-11-16) | after (2026-11-15 snapshot) |
|---|---|---|
| `www.poolrentalnearme.com` | 404 (WEST does not proxy it) | unchanged at the edge; the app answers an empty urlset for non-country hosts |
| `poolrentalnearme.co.uk` | 19 `<loc>` on co.uk | 22 `<loc>` on co.uk (+`pool-rental-london`, `pool-rental-manchester`, `uk-cities-with-pools`) |
| `www.poolrentalnearme.co.uk` | 19 `<loc>` on **www**.co.uk (canonical is the bare host) | the same 22 `<loc>` on the bare host |
| `poolrentalnearme.ca` | 20 | 22 (+`pool-rental-toronto`, `pool-rental-vancouver`) |
| `www.poolrentalnearme.ca` | 20 on **www**.ca | the same 22 on the bare host |
| `poolrentalnearme.com.au` | 20 | 22 (+`pool-rental-sydney`, `pool-rental-melbourne`) |
| `www.poolrentalnearme.com.au` | 20 on **www**.com.au | the same 22 on the bare host |

Each list is exactly the mapped rows that may be listed: published,
`in_sitemap`, no `redirect_to`, and passing every content rule from step 03.
The 3 `pool-rental-insurance-explained-*` rows stay out (`in_sitemap=false`).
The read is paged and fails closed with a 503. Before, it was a flat
`.limit(5000)` `ilike` read with no status or redirect filter.

**www sitemaps.** Step 03 removed the 57 override pages. The 9 `country_launch`
hubs had no override, so step 03 left them in `sitemap-pages-articles.xml`.
They now leave it (382 → 373). With A, www lists 10,022 − 78 − 9 = **9,935**
distinct URLs (step 03 count minus this step). The harness asserts that no www
sitemap lists a country page.

### Canonical per host (live before 2026-11-16, after from the harness)

| page | served on | before | after |
|---|---|---|---|
| `/p/rent-out-your-pool-uk` (launch hub; the other 8 hubs alike) | www.com | www.com (self) | `https://poolrentalnearme.co.uk/...` |
| | co.uk / www.co.uk | co.uk / **www.co.uk** | co.uk |
| | .ca, www.ca, .com.au, www.com.au | that host (self) | co.uk |
| `/p/pool-maintenance-canada` (override pages) | all 7 hosts | `poolrentalnearme.ca` | `poolrentalnearme.ca` (unchanged) |
| `/p/pool-rental-london` | all 7 hosts | `poolrentalnearme.co.uk` (robots-blocked there) | `poolrentalnearme.co.uk` (now crawlable) |
| any US page, e.g. `/p/become-a-swimming-pool-host-austin-tx` | www.com | www.com | www.com |
| | each of the 6 ccTLD hosts | **that ccTLD host** (self) | www.com |
| comparison pages | all hosts | www.com | www.com (they already used the constant origin) |

`og:url`, `og:image`, JSON-LD `mainEntityOfPage` and the `/p/jan` and
`/p/lukes-lounge` JSON-LD `url` follow the canonical. `getCanonicalUrl()` in
`canonical.server.ts` is now the mapping. `getCanonicalOrigin()` remains a
request-origin helper, and its header says it is not a canonical host.

### hreflang

| page | before (live 2026-11-16, on www.com) | after |
|---|---|---|
| `/p/pool-maintenance-canada` (suffix-localised article) | `en-CA`, `en-GB`, `x-default`, all on the **requesting host** (only one sibling, chosen by an unordered `limit(1)`) | `en-GB` co.uk, `en-CA` .ca, `en-AU` .com.au, each the sibling's canonical URL |
| `/p/pool-rental-london` | `en-GB` London + `en-CA` **Toronto** + `x-default` (the DB grouped London, Toronto and Sydney under `new-york-ny`) | none |
| 9 launch hubs, `*-cities-with-pools`, `pool-rental-<city>` | varies | none (no defined equivalent) |
| US EN↔ES pairs (e.g. `austin-tx`) | `en-US`/`es-US`/`x-default` on the requesting host | the same pair, hrefs on www.com whichever host served it |

The mapping defines equivalents in one way only. The same base slug localised
by its country suffix, in the same `hreflang_group`, is one article. Across the
snapshot, 50 country rows get alternates and 19 get none.
`pool-rental-tax-write-offs-canada` gets none: its UK and AU versions use a
different base slug (`pool-hire-tax-deductions-*`). No en-US or `x-default` is
added. The .com group-key articles (e.g. `/p/pool-maintenance`) carry no
hreflang of their own (none of 19 in the 2026-11-14 crawl), and nothing
establishes they are the same article.

The EN↔ES twin lookup (`getHreflangSibling`) now skips country rows. A US page
in a group that also holds country pages therefore still finds its Spanish
twin (harness fixture `fixture-twin-*`), and never offers a country page as its
equivalent. R4 lists the real groups this touches.

---

## Files

- `src/lib/country-sites.ts` (new): the mapping, canonical rules, robots body, PostgREST filter, hreflang.
- `src/lib/comparison-duplicates.ts` (new, generated): the 78 redirects.
- `src/lib/seo.ts`, `src/server/canonical.server.ts`: canonical from the mapping, not from `X-Forwarded-Host`.
- `src/routes/p.$slug.tsx`, `p.es.$slug.tsx`, `p.jan.tsx`, `p.lukes-lounge.tsx`: canonical, hreflang and JSON-LD URLs from the mapping.
- `src/routes/p.{giggster,peerspace}-vs-pool-rental-near-me-in-{$city}.tsx`: the 301.
- `src/routes/robots[.]txt.ts`, `src/routes/sitemap-country[.]xml.ts`: from the mapping.
- `src/lib/sitemap-rules.ts`, `src/lib/sitemap-sources.ts`: `canonicalIsElsewhere` uses the page's own canonical rule; `loadCountryEntries`; comparisons skip the 78.
- `src/server/content-pages.functions.ts`: sibling lookup skips country rows and returns the group's slugs.
- `ops/seo-repairs-2026-11/comparison-duplicates/`, `ops/seo-repairs-2026-11/country-mapping/`: inputs, generator, measurement scripts, live matrices.
- `tests/comparison-duplicates.test.mjs`, `tests/country-sites.test.mjs` (new), `tests/sitemap-rules.test.mjs`, `scripts/test-failed-reads.mjs` (fixtures and per-host checks).

## Open decisions

- Whether `www.<ccTLD>` should 301 to the bare ccTLD at the edge. This step
  only canonicalises, as instructed. The www variants still serve the whole
  site, and their robots.txt allows the country pages.
- Whether the .com group-key articles are true equivalents of the localised
  versions. If they are, an en-US + x-default alternate could be added by
  listing them in the mapping.
- `jobs.xml` still builds its URLs from the request origin. It is a feed,
  disallowed on the ccTLDs by robots, and out of this step's scope.
