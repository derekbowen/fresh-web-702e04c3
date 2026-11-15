# ccTLD exposure (audit question 9) — live checks + code intent

Investigator notes. READ-ONLY. Measured 2026-11-14 23:53Z to 2026-11-15 ~00:05Z (UTC, from response Date headers and the sandbox clock).
All live requests: `curl -sS -A "Mozilla/5.0 (compatible; site-audit/1.0)" --max-time 40 -D - <url>`,
GET only (HEAD for 3 asset URLs), 0.35–0.5 s sleep between requests, ~330 requests in total.
Parsing was done by inline `python3 - <<EOF` scripts (no files written other than this one).
Status labels: **verified** = seen in a response / file / query; **inference**; **unknown**.

Hosts tested: `www.poolrentalnearme.com`, `poolrentalnearme.com`, and bare + www of `.ca`, `.co.uk`, `.com.au`.

Code read: `/home/user/fresh-web-702e04c3` at `7702845` (branch `claude/seo-audit-2026-11-14`,
`git rev-parse HEAD origin/ops/deploy-sha-enforcement` → both `77028454655e7b272d8c23987b54f445f9eba9f7`).

---

## 0. Plain answers

| Question | Answer | Status |
|---|---|---|
| On which hosts is the whole site crawlable? | Only `www.poolrentalnearme.com` (bare `.com` 301s to it). All six ccTLD hosts send `Disallow: /` plus four `Allow:` patterns for their own country. | verified |
| Is the whole site *served* on the ccTLDs? | Yes. Every `/p/...` page sampled returns 200 on all six ccTLD hosts with no `noindex` meta and no `X-Robots-Tag`. robots.txt is the only barrier. | verified (samples) |
| Do ccTLD copies of US pages self-canonicalise to the ccTLD? | Yes for every family rendered by `p.$slug.tsx` (host-acquisition, event guides, Spanish, swim-instructor, academy, advocacy, articles, blog): canonical = the requesting ccTLD host (bare→bare, www→www). No for hard-coded routes (comparisons, `/p/hosting`, `/p/how-it-works`, `/p/pool-rentals-ohio`, `/p/all-locations`, `/phoenix`): canonical = `.com`. | verified (samples) |
| Are ccTLD hosts listed in any sitemap? | Not in any `.com` sitemap (10,074 URLs, all `www.poolrentalnearme.com`). Only in each ccTLD's own `/sitemap-country.xml` (20 / 19 / 20 URLs; the www and bare variants each list their own host). 57 `.com` sitemap URLs do *declare a canonical* on a ccTLD. | verified |
| Anything on the ccTLDs returning errors? | `/public-pools/` → 307 → `/public-pools` → 404 on all six hosts; `/public-pools.xml` → 404. No 5xx seen. All 118 URLs listed in the six country sitemaps return 200. Unknown slugs return a real 404. | verified |
| Can ccTLD copies explain part of the 2,987 "Duplicate, Google chose different canonical than user"? | Only a sliver. Upper bound from what is measurable: 66 `.com` URLs (9 country-launch pages that exist as three self-canonical copies + 57 `.com` twins whose declared canonical is a ccTLD URL). ccTLD URLs themselves cannot be in a `.com` GSC property. US pages are robots-blocked on the ccTLDs, so Google cannot have read their self-canonicals unless production once served an open robots.txt there (no evidence of that). | inference |

---

## 1. robots.txt per host (full text)

Command: loop over the eight hosts, `curl -sS -A "$UA" --max-time 25 -D - https://$h/robots.txt`.

### www.poolrentalnearme.com — HTTP/2 200
Headers: `content-type: text/plain` (no charset), `last-modified: Sat, 08 Aug 2026 09:52:08 GMT`,
`etag: W/"6a76fc48-68e"`, `cf-cache-status: HIT`, **no** `x-robots-tag`, **no** CSP header.
→ a static file, not the fresh-web route (WEST serves `/var/www/html/robots.txt`, per
`/home/user/poolrentalnearme-web/docs/seo/patches-2026-09-01.md:149-151`).

```
# Block aggressive scrapers and AI crawlers
User-agent: MJ12bot
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Allow: /

User-agent: GPTBot
Allow: /

# AI search crawlers — explicit allow for citation visibility
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Perplexity-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-User
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Applebot-Extended
Allow: /

# Aggressive scrapers and low-value crawlers — block
User-agent: Bytespider
Disallow: /
User-agent: Baiduspider
Disallow: /
User-agent: Yandex
Disallow: /

User-agent: *
Allow: /

# Sharetribe authenticated routes
Disallow: /profile-settings
Disallow: /l/new
Disallow: /l/*/checkout
Disallow: /l/*/draft
Disallow: /l/*/pending-approval
Disallow: /l/*/new
Disallow: /l/*/edit
Disallow: /inbox
Disallow: /order
Disallow: /sale
Disallow: /listings
Disallow: /account
Disallow: /reset-password
Disallow: /verify-email
Disallow: /preview

# Fresh-web app routes
Disallow: /admin
Disallow: /auth
Disallow: /api/

# Block double-prefix junk
Disallow: /p/p/

# Block hybrid listing+search URLs
Disallow: /l/*/p/

Crawl-Delay: 5

# Faceted search pagination: keep deep /s? page facets out of the crawl.
# Bare /s and first-page facet URLs stay crawlable so they can be seen
# and dropped via their noindex,follow X-Robots-Tag.
Disallow: /s?*&page=

Sitemap: https://www.poolrentalnearme.com/sitemap.xml
Sitemap: https://www.poolrentalnearme.com/public-pools.xml

User-agent: Claude-SearchBot
Allow: /

User-agent: CCBot
Allow: /
Disallow: /host/preview/
```
(blank lines between the single-agent groups collapsed here for length; text otherwise as served)

### poolrentalnearme.com — HTTP/2 301 → `https://www.poolrentalnearme.com/robots.txt`

### poolrentalnearme.ca — HTTP/2 200, `content-type: text/plain; charset=utf-8`, `cache-control: public, max-age=3600`, `x-robots-tag: all`
```
# Canada domain for Pool Rental Near Me.
# Only this country's pages are crawlable here; everything else lives on
# https://www.poolrentalnearme.com and must not be duplicated across origins.
User-agent: *
Disallow: /
Allow: /p/*-canada$
Allow: /p/canadian-*
Allow: /p/rent-out-your-pool-toronto$
Allow: /p/rent-out-your-pool-vancouver$

Sitemap: https://poolrentalnearme.ca/sitemap-country.xml
```
### www.poolrentalnearme.ca — HTTP/2 200, identical except last line
`Sitemap: https://www.poolrentalnearme.ca/sitemap-country.xml`

### poolrentalnearme.co.uk — HTTP/2 200
```
# United Kingdom domain for Pool Rental Near Me.
# Only this country's pages are crawlable here; everything else lives on
# https://www.poolrentalnearme.com and must not be duplicated across origins.
User-agent: *
Disallow: /
Allow: /p/*-uk$
Allow: /p/*-united-kingdom$
Allow: /p/rent-out-your-pool-london$
Allow: /p/rent-out-your-pool-manchester$

Sitemap: https://poolrentalnearme.co.uk/sitemap-country.xml
```
### www.poolrentalnearme.co.uk — HTTP/2 200, identical except `Sitemap: https://www.poolrentalnearme.co.uk/sitemap-country.xml`

### poolrentalnearme.com.au — HTTP/2 200
```
# Australia domain for Pool Rental Near Me.
# Only this country's pages are crawlable here; everything else lives on
# https://www.poolrentalnearme.com and must not be duplicated across origins.
User-agent: *
Disallow: /
Allow: /p/*-australia$
Allow: /p/australian-*
Allow: /p/rent-out-your-pool-sydney$
Allow: /p/rent-out-your-pool-melbourne$

Sitemap: https://poolrentalnearme.com.au/sitemap-country.xml
```
### www.poolrentalnearme.com.au — HTTP/2 200, identical except `Sitemap: https://www.poolrentalnearme.com.au/sitemap-country.xml`

### robots verdicts (Google semantics: longest match wins, tie → allow; Googlebot uses the `*` group on every host)
A = allowed, D = disallowed. Computed from the live robots text above.

| path | www.com | .ca | www.ca | .co.uk | www.co.uk | .com.au | www.com.au |
|---|---|---|---|---|---|---|---|
| `/` | A | D | D | D | D | D | D |
| `/sitemap.xml` | A | D | D | D | D | D | D |
| `/sitemap-country.xml` | A | **D** | **D** | **D** | **D** | **D** | **D** |
| `/p/all-locations` | A | D | D | D | D | D | D |
| `/p/austin-tx` | A | D | D | D | D | D | D |
| `/p/become-a-swimming-pool-host-abbeville-la` | A | D | D | D | D | D | D |
| `/p/rent-out-your-pool-canada` | A | A | A | D | D | D | D |
| `/p/rent-out-your-pool-uk` | A | D | D | A | A | D | D |
| `/p/rent-out-your-pool-australia` | A | D | D | D | D | A | A |
| `/p/pool-maintenance-canada` | A | A | A | D | D | D | D |
| `/p/canadian-cities-with-pools` | A | A | A | D | D | D | D |
| `/p/rent-out-your-pool-canada?utm=1` | A | D | D | D | D | D | D |
| `/public-pools/` | A | D | D | D | D | D | D |
| `/s` | A | D | D | D | D | D | D |
| `/s?bounds=1&page=2` | D | D | D | D | D | D | D |
| `/l/terrific-backyard-oasis-pool-hot-tub/69cecdca-…` | A | D | D | D | D | D | D |
| `/phoenix` | A | D | D | D | D | D | D |
| `/fw-assets/x.js` (CSS/JS bundle path) | A | **D** | **D** | **D** | **D** | **D** | **D** |

---

## 2. Root `/` — where it goes

Command: `curl -sS -A "$UA" -o /dev/null -D - {https,http}://$h/`

| host | https `/` | http `/` |
|---|---|---|
| www.poolrentalnearme.com | 200 (`cf-cache-status: HIT`) | 301 → https://www.poolrentalnearme.com/ |
| poolrentalnearme.com | 301 → https://www.poolrentalnearme.com/ | 301 → https://poolrentalnearme.com/ |
| poolrentalnearme.ca | **302** → https://poolrentalnearme.ca/p/rent-out-your-pool-canada | 301 → https://poolrentalnearme.ca/ |
| www.poolrentalnearme.ca | **302** → https://www.poolrentalnearme.ca/p/rent-out-your-pool-canada | 301 → https://www.poolrentalnearme.ca/ |
| poolrentalnearme.co.uk | **302** → https://poolrentalnearme.co.uk/p/rent-out-your-pool-uk | 301 → https://poolrentalnearme.co.uk/ |
| www.poolrentalnearme.co.uk | **302** → https://www.poolrentalnearme.co.uk/p/rent-out-your-pool-uk | 301 → https://www.poolrentalnearme.co.uk/ |
| poolrentalnearme.com.au | **302** → https://poolrentalnearme.com.au/p/rent-out-your-pool-australia | 301 → https://poolrentalnearme.com.au/ |
| www.poolrentalnearme.com.au | **302** → https://www.poolrentalnearme.com.au/p/rent-out-your-pool-australia | 301 → https://www.poolrentalnearme.com.au/ |

Notes (verified): no ccTLD redirects www↔bare — both variants answer for everything. `/` on a ccTLD is
`Disallow`ed by its own robots.txt, so Googlebot cannot follow the 302 from the bare domain to the hub.

---

## 3. /sitemap.xml and /sitemap-country.xml per host

| URL | status | content |
|---|---|---|
| www.poolrentalnearme.com/sitemap.xml | 200, `x-robots-tag: noindex` | sitemapindex, **15** children, all `www.poolrentalnearme.com` (incl. `public-pools.xml`) |
| {bare,www}.{ca,co.uk,com.au}/sitemap.xml (6) | 200, `x-robots-tag: noindex` | sitemapindex, **14** children, all on `www.poolrentalnearme.com` (no `public-pools.xml` — that entry is added by WEST only) |
| www.poolrentalnearme.com/sitemap-country.xml | **404**, `x-robots-tag: noindex, follow`, 61,745-byte Sharetribe "Page not found" HTML | route is not proxied to EAST on `.com` |
| poolrentalnearme.ca/sitemap-country.xml | 200 | urlset, **20** URLs, all `https://poolrentalnearme.ca/p/…` |
| www.poolrentalnearme.ca/sitemap-country.xml | 200 | urlset, **20** URLs, all `https://www.poolrentalnearme.ca/p/…` |
| poolrentalnearme.co.uk/sitemap-country.xml | 200 | urlset, **19** URLs, all `https://poolrentalnearme.co.uk/p/…` |
| www.poolrentalnearme.co.uk/sitemap-country.xml | 200 | urlset, **19** URLs, all `https://www.poolrentalnearme.co.uk/p/…` |
| poolrentalnearme.com.au/sitemap-country.xml | 200 | urlset, **20** URLs, all `https://poolrentalnearme.com.au/p/…` |
| www.poolrentalnearme.com.au/sitemap-country.xml | 200 | urlset, **20** URLs, all `https://www.poolrentalnearme.com.au/p/…` |

lastmod range in the country sitemaps: 2026-08-06 … 2026-09-16.

.ca list (20): rent-out-your-pool-canada, rent-out-your-pool-toronto, rent-out-your-pool-vancouver,
allowing-nudity-at-your-pool-canada, canadian-cities-with-pools, bubble-covers-…-canada,
green-pool-recovery-canada, hosting-canada, how-it-works-canada, pool-heating-guide-canada,
pool-maintenance-canada, pool-pros-canada, pool-pump-troubleshooting-canada,
pool-rental-tax-write-offs-canada, pool-stains-removal-canada,
swimply-alternative-vs-pool-rental-near-me-canada, the-evolution-and-rise-of-pool-toys-…-canada,
romantic-pool-escapes-canada, top-pool-rental-platforms-canada, why-hosts-are-leaving-swimply-canada.
.co.uk (19) and .com.au (20) are the same set with `-uk` / `-australia`, `pool-hire-tax-deductions-*`,
`australian-cities-with-pools`; the UK list has no `*-cities-with-pools` entry (see §7.3).

Sub-sitemaps requested on a ccTLD host (verified):
```
https://poolrentalnearme.ca/sitemap-static.xml            200  75 locs  hosts {www.poolrentalnearme.com: 75}
https://poolrentalnearme.ca/sitemap-pages-articles.xml    200 443 locs  hosts {www.poolrentalnearme.com: 443}
https://www.poolrentalnearme.co.uk/sitemap-pages-advocacy.xml 200 52 locs hosts {www.poolrentalnearme.com: 52}
https://poolrentalnearme.com.au/sitemap-listings.xml      200 126 locs  hosts {www.poolrentalnearme.com: 126}
https://poolrentalnearme.ca/public-pools.xml              404 (fresh-web 404 page)
https://poolrentalnearme.ca/sitemap-index.xml             301 → https://www.poolrentalnearme.com/sitemap.xml
```
Code agrees: every sitemap route except `sitemap-country` builds `loc` from the constant `SITE_URL`
(`grep -n SITE_URL src/routes/sitemap*.ts`; `src/lib/seo.ts:6`).

`.com` sitemaps vs ccTLD hosts (from the audit's own URL list
`…/scratchpad/seo/urls.tsv`, 10,074 rows): hosts = `{'www.poolrentalnearme.com': 10074}`.
**59** of those `.com` URLs match the country patterns (20 Canada + 19 UK + 20 Australia) — i.e. every
URL in the country sitemaps is *also* advertised on `.com`, all in `sitemap-pages-articles.xml`.

---

## 4. Page matrix

Command per cell: `curl -sS -A "$UA" --max-time 40 -D - https://<host><path>`, redirects followed by hand.
`canon` = `<link rel="canonical">`; `mr` = meta robots; `XRT` = X-Robots-Tag header; `hl` = hreflang count.

### 4.1 www.poolrentalnearme.com
| path | status | canon | mr | XRT | hl | robots |
|---|---|---|---|---|---|---|
| /p/austin-tx | 200 | self (.com) | none | none | 0 | A |
| /p/become-a-swimming-pool-host-abbeville-la | 200 | self (.com) | none | none | 0 | A |
| /p/rent-out-your-pool-canada | 200 | **self (.com)** | none | none | 0 | A |
| /p/rent-out-your-pool-uk | 200 | **self (.com)** | none | none | 0 | A |
| /p/rent-out-your-pool-australia | 200 | **self (.com)** | none | none | 0 | A |
| /p/pool-maintenance-canada | 200 | **https://poolrentalnearme.ca/p/pool-maintenance-canada** | none | none | 3 (all `.com` hrefs) | A |
| /p/pool-maintenance-uk | 200 | **https://poolrentalnearme.co.uk/p/pool-maintenance-uk** | none | none | 3 (all `.com` hrefs) | A |
| /p/canadian-cities-with-pools | 200 | **https://poolrentalnearme.ca/p/canadian-cities-with-pools** | none | none | 3 | A |
| /p/all-locations | 200 (3,086,391 bytes) | self (.com) | none | none | 0 | A |
| /public-pools/ | 200 | self (.com) | `index, follow` | none | 0 | A |
| /s | 200 | self (.com) | `index, follow, max-snippet:-1, …` | none | 0 | A |
| /l/terrific-backyard-oasis-pool-hot-tub/69cecdca-… | 200 | self (.com) | `index, follow, …` | none | 0 | A |
| /login | 200 | self (.com) | `noindex, follow` | none | 0 | A |
| /phoenix | 200 | self (.com) | none | none | 0 | A |
| /p/zz-audit-nonexistent-slug-20261114 | 404 | none | none | none | 0 | A |

**Disagreement with the task brief:** between 2026-11-14 23:56Z and 2026-11-15 00:03Z `/s`, `/login` and the `/l/…` listing on
`.com` returned full server-rendered pages (titles "Pool Rentals Near You — Book a Private Pool by the
Hour | Pool Rental Near Me", "Log in | Pool Rental Near Me", "Terrific Backyard Oasis Pool & Hot Tub |
Pool Rental Near Me"). The string "Maintenance mode" does not occur in any of the three bodies
(`re.finditer("(?i)maintenance")`: 0, 0, and 2 hits in the listing that are the host's own text
"professional pool service and maintenance weekly"). What the browser shows after hydration was not tested.

### 4.2 ccTLD hosts — identical behaviour on all six unless stated
| path | status | canon | mr | XRT | hl | robots on that host |
|---|---|---|---|---|---|---|
| /p/austin-tx | 200 | **self on the requesting ccTLD host** (e.g. `https://www.poolrentalnearme.co.uk/p/austin-tx`) | none | none | 0 | D |
| /p/become-a-swimming-pool-host-abbeville-la | 200 | **self on the requesting ccTLD host** | none | none | 0 | D |
| own hub (`/p/rent-out-your-pool-{canada,uk,australia}`) | 200 | self on the requesting host (bare→bare, www→www) | none | none | 0 | A |
| /p/all-locations | 200 (3,087,372 bytes) | `https://www.poolrentalnearme.com/p/all-locations` | none | none | 0 | D |
| /public-pools/ | **307 → /public-pools → 404** (fresh-web 404 page, title "Pool Rental Near Me - Starting at $25 hour…", no canonical) | — | none | none | 0 | D |
| /s | **302** → `https://www.poolrentalnearme.com/s` | — | — | none | — | D |
| /l/terrific-…/69cecdca-… | **302** → same path on `https://www.poolrentalnearme.com` | — | — | none | — | D |
| /phoenix | 200 | `https://www.poolrentalnearme.com/phoenix` | none | none | 0 | D |

Extra single-host checks:
```
https://poolrentalnearme.ca/p/rent-out-your-pool-uk     200 canonical https://poolrentalnearme.ca/p/rent-out-your-pool-uk (self, wrong country, robots D)
https://poolrentalnearme.ca/p/pool-maintenance-uk       200 canonical https://poolrentalnearme.co.uk/p/pool-maintenance-uk (override), hreflang en-GB/en-CA/x-default all on poolrentalnearme.ca
https://poolrentalnearme.ca/p/hosting                   200 canonical https://www.poolrentalnearme.com/p/hosting
https://poolrentalnearme.co.uk/p/how-it-works           200 canonical https://www.poolrentalnearme.com/p/how-it-works
https://poolrentalnearme.com.au/p/giggster-vs-pool-rental-near-me 200 canonical https://www.poolrentalnearme.com/p/giggster-vs-pool-rental-near-me, meta robots index,follow
https://poolrentalnearme.ca/p/zz-audit-nonexistent-slug-20261114  404
https://poolrentalnearme.ca/zz-audit-nonexistent-20261114         404
https://poolrentalnearme.com/p/austin-tx                301 → https://www.poolrentalnearme.com/p/austin-tx
http://poolrentalnearme.ca/p/rent-out-your-pool-canada  301 → https://poolrentalnearme.ca/p/rent-out-your-pool-canada
http://www.poolrentalnearme.co.uk/p/austin-tx           301 → https://www.poolrentalnearme.co.uk/p/austin-tx
```

### 4.3 Which families self-canonicalise to the ccTLD (one random US page per `.com` sub-sitemap, host `poolrentalnearme.co.uk`, seed 20261114)
```
[host-acquisition p3] /p/become-a-swimming-pool-host-merced-ca                      200 canonical SELF→ccTLD  hreflang en-US/es-US/x-default all on poolrentalnearme.co.uk
[event-guides]        /p/guide-to-family-reunion-pool-rental-noblesville-in         200 canonical SELF→ccTLD
[spanish]             /p/conviertete-en-anfitrion-de-alberca-north-charleston-sc    200 canonical SELF→ccTLD  hreflang es-US/en-US/x-default all on poolrentalnearme.co.uk
[swim-instructor]     /p/swim-instructor-pool-rental-summerfield-nc                 200 canonical SELF→ccTLD
[academy]             /p/elearning-academy-outdoor-lighting-for-safety-and-ambiance-pool-hosts 200 canonical SELF→ccTLD
[advocacy]            /p/host-advocacy-new-york                                     200 canonical SELF→ccTLD
[articles]            /p/bartlett-tn                                                200 canonical SELF→ccTLD
[blog]                /p/insects-frogs-and-debris-in-pool                           200 canonical SELF→ccTLD
[comparisons]         /p/peerspace-vs-pool-rental-near-me-in-ardmore-pa             200 canonical → www.poolrentalnearme.com  (meta robots index,follow)
[static]              /p/pool-rentals-ohio                                          200 canonical → www.poolrentalnearme.com
summary: {'SELF→ccTLD': 8, '→www.poolrentalnearme.com': 2}
```
None of the ten carried a `noindex` meta or an `X-Robots-Tag` header.

### 4.4 /p/all-locations — links advertised
| host | status | `<a href>` total | relative | resolve to requesting host | distinct URLs | canonical |
|---|---|---|---|---|---|---|
| www.poolrentalnearme.com | 200 | 10,009 | 9,999 | 9,999 on www.poolrentalnearme.com | 6,290 | self |
| each of the six ccTLD hosts | 200 | 10,009 | 9,999 | **9,999 on that ccTLD host** | 6,290 | `https://www.poolrentalnearme.com/p/all-locations` |

Families of the 9,999 same-host links: `/p/…` 9,852; `/l/…` 126; `/s` 5; `/` 4; `/wizard/…` 4; `/signup` 2;
`/login` 2; `/sitemap.xml` 2. The other 10 are social / third-party hosts. The page itself is
robots-blocked on every ccTLD, so those 9,999 ccTLD links are reachable only by a crawler that ignores robots.

### 4.5 Links on the crawlable ccTLD hubs
For each ccTLD hub (both host variants): 62 distinct links; 49 on the same ccTLD host, 2 on
`www.poolrentalnearme.com`, rest social/third-party. Of the 49 same-host links, **41 are disallowed by
that host's robots.txt** and 8 allowed. Sample of the disallowed targets (identical on all six):
`/`, `/login`, `/p/about-our-company`, `/p/affiliate`, `/p/affiliate-program`,
`/p/airbnb-vs-pool-rental-near-me`, `/p/all-locations`, `/p/author/derek-bowen`,
`/p/become-a-swimming-pool-host-katy-tx`, `/p/become-a-swimming-pool-host-los-angeles-ca`,
`/p/become-a-swimming-pool-host-phoenix-az`, `/p/become-a-swimming-pool-host-riverside-ca`.
The same hub on `.com`: 49 same-host links, all allowed.

`.com` → ccTLD links: the audit's link file `…/scratchpad/seo/link_targets.tsv` contains **0** link
targets on a ccTLD host. `.com` references the ccTLDs only through `rel=canonical` (57 pages, §6).

### 4.6 Resources loaded by a crawlable ccTLD hub (`https://poolrentalnearme.ca/p/rent-out-your-pool-canada`)
12 `modulepreload` + 1 `preload` + 1 `stylesheet` + 2 `img` under `https://poolrentalnearme.ca/fw-assets/…`,
`/icon.svg`; images from wikimedia/unsplash; og image on `.com`. The JS/CSS return 200
(`/fw-assets/index-3yfv84Ne.js`, `/fw-assets/generic-page-BgkySKoX.js`, `/fw-assets/breadcrumbs-jsonld-Cn-aqYMj.js`
→ `HTTP/2 200 application/javascript`) but `/fw-assets/` is `Disallow`ed on every ccTLD (§1 table), so
Googlebot may fetch the HTML but not its CSS or JS.

---

## 5. The six country sitemaps, every URL fetched (118 requests)

| host | URLs | status | canonical | meta robots | X-Robots-Tag | hreflang |
|---|---|---|---|---|---|---|
| poolrentalnearme.ca | 20 | 20 × 200 | 20 self | none | none | 3 pages none; 15 `en-CA,en-GB,x-default`; 2 `en-AU,en-CA,x-default` — **all hrefs on poolrentalnearme.ca** |
| www.poolrentalnearme.ca | 20 | 20 × 200 | **3 self (www)**, 17 → `poolrentalnearme.ca` same path | none | none | same sets, all hrefs on www.poolrentalnearme.ca |
| poolrentalnearme.co.uk | 19 | 19 × 200 | 19 self | none | none | 3 none; 14 `en-CA,en-GB,x-default`; 2 `en-AU,en-GB,x-default` — all on poolrentalnearme.co.uk |
| www.poolrentalnearme.co.uk | 19 | 19 × 200 | **3 self (www)**, 16 → `poolrentalnearme.co.uk` | none | none | same, all on www.poolrentalnearme.co.uk |
| poolrentalnearme.com.au | 20 | 20 × 200 | 20 self | none | none | 3 none; 17 `en-AU,en-GB,x-default` — all on poolrentalnearme.com.au |
| www.poolrentalnearme.com.au | 20 | 20 × 200 | **3 self (www)**, 17 → `poolrentalnearme.com.au` | none | none | same, all on www.poolrentalnearme.com.au |

Example rows (verbatim):
```
https://poolrentalnearme.ca/p/pool-maintenance-canada      200 canonical https://poolrentalnearme.ca/p/pool-maintenance-canada
    hreflang en-CA https://poolrentalnearme.ca/p/pool-maintenance-canada | en-GB https://poolrentalnearme.ca/p/pool-maintenance-uk | x-default https://poolrentalnearme.ca/p/pool-maintenance-canada
https://www.poolrentalnearme.ca/p/pool-maintenance-canada  200 canonical https://poolrentalnearme.ca/p/pool-maintenance-canada
    hreflang en-CA https://www.poolrentalnearme.ca/p/pool-maintenance-canada | en-GB https://www.poolrentalnearme.ca/p/pool-maintenance-uk | x-default …
https://www.poolrentalnearme.com/p/pool-maintenance-canada 200 canonical https://poolrentalnearme.ca/p/pool-maintenance-canada
    hreflang en-CA https://www.poolrentalnearme.com/p/pool-maintenance-canada | en-GB https://www.poolrentalnearme.com/p/pool-maintenance-uk | x-default https://www.poolrentalnearme.com/p/pool-maintenance-canada
```
So the hreflang annotations are wrong on every host: the sibling market is pointed at on the *requesting*
host (where it is robots-blocked and canonicalises elsewhere), `.com` annotates `.com` URLs whose own
canonical is a ccTLD, and each page names only two of the three markets.

The 3 self-canonical pages per ccTLD are the `country_launch` rows (hub + two cities): they have no
`canonical_override`, so they self-canonicalise to whichever host asked — bare ccTLD, www ccTLD **and** `.com`.

---

## 6. `.com` pages whose canonical is a ccTLD (from the audit's full crawl, `…/scratchpad/seo/crawl.jsonl`, 10,074 rows)

```
ALL crawl canonical hosts: {'www.poolrentalnearme.com': 10014, 'poolrentalnearme.com.au': 19, 'poolrentalnearme.ca': 19, 'poolrentalnearme.co.uk': 19, 'NONE': 3}
com sitemap URLs whose canonical is on another host: 57   (all in sitemap-pages-articles.xml; path identical; hreflang count 3 on each)
canonical target ALLOWED by that ccTLD's robots: 50
canonical target DISALLOWED by that ccTLD's robots: 7
    /p/pool-rental-manchester -> https://poolrentalnearme.co.uk/p/pool-rental-manchester
    /p/pool-rental-london     -> https://poolrentalnearme.co.uk/p/pool-rental-london
    /p/pool-rental-melbourne  -> https://poolrentalnearme.com.au/p/pool-rental-melbourne
    /p/pool-rental-sydney     -> https://poolrentalnearme.com.au/p/pool-rental-sydney
    /p/pool-rental-toronto    -> https://poolrentalnearme.ca/p/pool-rental-toronto
    /p/pool-rental-vancouver  -> https://poolrentalnearme.ca/p/pool-rental-vancouver
    /p/uk-cities-with-pools   -> https://poolrentalnearme.co.uk/p/uk-cities-with-pools
country-pattern pages on .com: 59 → 50 canonical on a ccTLD, 9 self-canonical on .com (the country_launch pages)
```
Live confirmation of the 7 orphans (4 fetched): `https://poolrentalnearme.co.uk/p/uk-cities-with-pools`,
`…co.uk/p/pool-rental-london`, `…ca/p/pool-rental-toronto`, `…com.au/p/pool-rental-sydney` → all 200,
self-canonical on the ccTLD, no noindex — but disallowed by that host's robots.txt and absent from its
`sitemap-country.xml`. `.com` therefore names a canonical Google is not allowed to fetch.

Prior state: `/home/user/poolrentalnearme-web/docs/seo/gsc-recovery-2026-09-01.md:130,152,165-166` —
"ccTLD twins … canonical → ccTLD (intended); still in www sitemaps", "Canonical elsewhere | 57", and
"Google chose different canonical (2,463) — … the ccTLD twins (57)". Same 57 today.

---

## 7. Code intent vs live

### 7.1 `src/routes/robots[.]txt.ts`
- L9 `PROD_HOST = "poolrentalnearme.com"`; L17-45 `COUNTRY_HOSTS` with the four `allow` patterns per ccTLD;
  L51-57 host = `new URL(request.url).hostname`; L59-61 `isProd` / `bareHost` (strips `www.`) / `country`;
  L93-102 country body (`Disallow: /`, `Allow:` lines, `Sitemap: https://${host}/sitemap-country.xml`);
  L103-106 any other host → `Disallow: /`; L113 `X-Robots-Tag: all` for prod/country, else `noindex, nofollow`.
- **ccTLD live = code, byte for byte** (label, patterns, own-host Sitemap line incl. the www variant,
  `cache-control: public, max-age=3600`, `x-robots-tag: all`). verified.
- **`.com` live ≠ code.** The `isProd` body (L64-92: `Allow: /s$`, `Disallow: /s?`, `Disallow: /u/`, one
  Sitemap line) is never served: `.com` returns WEST's static file (different rules, `Crawl-Delay: 5`,
  two Sitemap lines, `last-modified` 2026-08-08). The EAST prod branch is dead code in production. verified.
- Gap: the country body gives no `Allow` for `/sitemap-country.xml`, `/fw-assets/`, `/icon.svg` or `/$`. verified.
- History (`git show <branch>:src/routes/robots[.]txt.ts`): `origin/ops/east-archive/main` (2026-09-09) has no
  `COUNTRY_HOSTS` — every non-.com host got `Disallow: /`; `origin/ops/east-production-snapshot-2026-09-11`
  already has it (file identical to HEAD: `git diff …snapshot-2026-09-11 HEAD --stat` lists only `p.$slug.tsx`).
  So by the repo, ccTLDs went from fully blocked to country-allowlisted around 2026-09-09/11; no version
  that opens a ccTLD wholesale exists on any branch. What production actually served before 09-11: unknown.

### 7.2 `src/routes/sitemap-country[.]xml.ts`
- L11-30 `COUNTRY_MATCH` (ilike patterns mirroring the robots allowlist); L36-39 host from `request.url`,
  unknown host → empty urlset; L41-47 `content_pages` where `in_sitemap = true` and slug matches, limit 5000
  (no `template_type`, `status` or `redirect_to` filter); L49-52 `loc = https://${host}/p/${slug}`.
- **ccTLD live = code** (own-host locs, 20/19/20 rows, lastmod from `updated_at`). verified.
- **`.com` live ≠ code**: code would return an empty `<urlset>`; live is a 404 from the WEST marketplace
  because WEST nginx does not proxy that path to EAST. Harmless. verified.
- Because `host` keeps the `www.` prefix (L36 vs L37), `www.<ccTLD>` advertises a second full set of URLs.

### 7.3 Where the self-canonical comes from
- `src/server/canonical.server.ts:37-47` — origin = `https://` + `X-Forwarded-Host` (anything that is not
  `*.lovable.app`); no notion of "this host is a ccTLD".
- `src/lib/route-origin.ts:21-34` → `src/routes/p.$slug.tsx:215` (loader) → `:304` `origin` → `:324-332`
  `buildMeta({ canonicalPath, canonicalUrl: canonical_override, origin, hreflang })` →
  `src/lib/seo.ts:96-97` `canonicalUrl = canonicalUrlOverride ?? ${siteOrigin}${canonicalPath}`.
  So: `canonical_override` set (the 57 twins) → that URL on every host; otherwise → whatever host asked.
- `src/routes/p.$slug.tsx:566-594` `buildHreflangLinks` builds both hrefs from `origin` + path, and
  `src/server/content-pages.functions.ts:293-…` `getHreflangSibling` returns one sibling (`.limit(1)`).
- `src/start.ts:44-57,71-76` — `X-Robots-Tag: noindex, nofollow` only for `*.lovable.app`-type preview
  hosts; ccTLDs are not in that list, so nothing but robots.txt protects them.
- Allowlist gaps: no `uk-*` / `pool-rental-<city>` pattern in either file, hence the 7 orphans in §6.

### 7.4 ccTLD nginx (EAST `/etc/nginx/sites-enabled/intl.conf`, not in either repo)
`/home/user/poolrentalnearme-web/docs/OPS_RECORD_2026-09-16_country-launch-pages.md:45-54` records a
`location ~ ^/(wizard|s|l|u|login|signup|account|inbox|listings|profile-settings|order|sale|recover-password|reset-password|verify-email)(/|$) { return 302 https://www.poolrentalnearme.com$request_uri; }`
per ccTLD server block. Live matches (`/s`, `/l/…` → 302 `.com`). `public-pools` is not in that list (→ 404).

---

## 8. "Duplicate, Google chose different canonical than user" (2,987) — can the ccTLDs account for it?

What is verified:
1. A `.com` GSC property (domain or URL-prefix) cannot contain ccTLD URLs — they are different registrable
   domains. The 2,987 are `.com` URLs whose Google-selected canonical differs from the declared one.
2. US pages on the ccTLDs are robots-blocked today and, by repo history, were fully blocked before the
   allowlist. Google cannot read a canonical on a page it may not fetch.
3. The pages Google *can* fetch on a ccTLD are the 59 country pages (per host variant).

Inference — the only `.com` URLs that can land in this bucket because of a ccTLD copy:
- the **9** `country_launch` pages: `.com` says "I am canonical", the bare ccTLD says the same, the www
  ccTLD says the same; all three are in a sitemap. Google must pick one; if it picks a ccTLD copy the `.com`
  URL is reported exactly as "Duplicate, Google chose different canonical than user";
- the **57** twins: `.com` declares the bare-ccTLD URL. If Google agrees they are "Alternate page with
  proper canonical tag" (part of the 605). If Google picks a third URL (e.g. the www-ccTLD copy, or for the
  7 orphans where the declared target is blocked) they fall in the 2,987.
Upper bound 66 of 2,987 (2.2%). The ccTLDs cannot be the main cause of that bucket, nor of the drop from
12,457 to 8,228 indexed.

How to confirm (none of this was run — it needs GSC access):
- GSC → Pages → "Duplicate, Google chose different canonical than user" → export; grep for the 66 slugs
  (the 59 in §3 plus the 7 in §6).
- URL Inspection API on those 66 `.com` URLs: compare `googleCanonical` with `userCanonical`; a ccTLD host in
  `googleCanonical` is the proof.
- Add `poolrentalnearme.ca`, `.co.uk`, `.com.au` as domain properties (if not already) and read their Pages
  reports: "Blocked by robots.txt" / "Indexed, though blocked by robots.txt" there counts how many ccTLD
  copies Google has discovered; also the Sitemaps report shows whether `sitemap-country.xml` can be fetched.
- `site:poolrentalnearme.ca inurl:become-a-swimming-pool-host` (and the two other ccTLDs) should return
  nothing; any hit is a ccTLD copy of a US page in the index.
- EAST nginx access log: Googlebot requests with a ccTLD `Host` outside the allowlisted slugs.

---

## 9. Fix candidates (not applied — read-only audit)

1. **Stop non-country pages self-canonicalising on ccTLD hosts.** `src/server/canonical.server.ts`
   `getCanonicalOrigin()` (and the client branch in `src/lib/route-origin.ts`): when the forwarded host is a
   ccTLD and the path is not in that country's allowlist, return `PROD_ORIGIN`. Share one allowlist module
   between `robots[.]txt.ts`, `sitemap-country[.]xml.ts` and this helper. Stronger: 301 those paths to `.com`
   in EAST `intl.conf`.
2. **One host per ccTLD.** 301 `www.<ccTLD>` → bare (EAST `intl.conf` or a Cloudflare redirect rule); the
   `canonical_override` values already use bare.
3. **Give the 9 `country_launch` rows a single canonical** — `content_pages.canonical_override` = bare-ccTLD
   URL (as the other 50 twins have), then add reciprocal hreflang.
4. **Drop ccTLD-canonical rows from the `.com` sitemap** — `src/lib/sitemap.ts` `buildContentPagesSitemap`
   (L139-…, filters at L169-174): skip rows whose `canonical_override` host is not `www.poolrentalnearme.com`.
   (`in_sitemap` cannot be flipped: the country sitemap needs it.)
5. **Cover the 7 orphan twins** — add `uk-*` and `pool-rental-<city>` patterns to `COUNTRY_HOSTS`
   (`robots[.]txt.ts:17-45`) and `COUNTRY_MATCH` (`sitemap-country[.]xml.ts:11-30`).
6. **Let Google fetch what the ccTLD robots.txt points at** — add `Allow: /sitemap-country.xml$`,
   `Allow: /fw-assets/`, `Allow: /icon.svg`, `Allow: /$` to the country body (`robots[.]txt.ts:93-102`).
7. **Repair hreflang for the country twins** — `p.$slug.tsx:566-594` + `content-pages.functions.ts:293-…`:
   use each row's `canonical_override` as its href, return all siblings in the group, not one.
8. Low priority: add `public-pools` to the ccTLD → `.com` redirect list in `intl.conf` (today 307 → 404).

---

## 10. Unknowns
- Whether Google has any ccTLD URL indexed, and whether GSC properties exist for the three ccTLDs.
- What robots.txt production served on the ccTLDs before 2026-09-11 (repo history says `Disallow: /`).
- Whether Cloudflare Bot Fight Mode on the ccTLD zones (`/home/user/poolrentalnearme-web/ops/cloudflare/README.md:88-93`)
  ever challenges Googlebot — only the audit user-agent was used.
- The current contents of EAST `intl.conf` (no SSH); only its recorded 2026-09-16 state and live behaviour.
- How Google treats a `Sitemap:` line whose target the same robots.txt disallows (rule evaluation is
  verified; Google's reaction is inference).
- Whether the marketplace "Maintenance mode" screen appears client-side after hydration; server HTML did not show it.
