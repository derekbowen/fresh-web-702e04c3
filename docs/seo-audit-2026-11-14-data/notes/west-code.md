# WEST (marketplace) code + front-door routing — working notes

Investigator scope: audit questions 1, 2, 7, 8 (code side). READ-ONLY. Nothing changed in either
repo, no DB access used, no deploys. All live requests: `curl -A "Mozilla/5.0 (compatible; site-audit/1.0)"`,
GET only, <= ~2 req/s, between 2026-11-14 23:32Z and 23:46Z. Repo: `/home/user/poolrentalnearme-web`
(branch `claude/marketplace-repo-verify-v8h67k`, `git status` clean before and after).

Labels: **[V]** verified (file / response seen), **[I]** inference, **[U]** unknown.

---

## 0. Measurement that DISAGREES with the brief: the marketplace is NOT in maintenance mode

Brief said `/s`, `/login`, `/l/...` answer 200 with a "Maintenance mode" page. Measured:

| time (UTC) | URL | status | bytes | "Maintenance mode" hits | title |
|---|---|---|---|---|---|
| 23:34:33 | `/s` | 200 | 313,297 | 0 | "Pool Rentals Near You — Book a Private Pool by the Hour \| Pool Rental Near Me" — SSR body says "129 pools found", 25 `/l/` links, `searchListingsError":null` |
| 23:34 | `/login` | 200 | 81,136 | 0 | "Log in \| Pool Rental Near Me" |
| 23:34 | 3 listing URLs from sitemap-listings.xml (1st/63rd/126th) | 200 | 199,833 / 145,941 / 160,176 | 0 | real listing titles |
| 23:34:49 | 7 more listing URLs (10th,30th,50th,70th,90th,110th,120th) | 200 | 113,619–247,252 | 0 | real listing titles |
| 23:43:12 | `/s`, `/login`, one listing | 200 | 313,310 / 81,149 / 167,767 | 0 | same |
| 23:45:51 | `/s`, `/login`, one listing | 200 | — / — / 190,059 | 0 | listing has "Book now" |

Supporting: [V] Sharetribe asset CDN answered 200 at 23:37:20Z
(`GET https://cdn.st-api.com/v1/assets/pub/<clientId>/a/latest/general/access-control.json` →
`{"data":{...,"marketplace":{"private":false}},"meta":{"version":"M5jCaCxdm7fYg9coe0nJYg"}}`).
[V] WEST's own `/sitemap-recent-listings.xml` (built from a live `sdk.listings` query, cached in memory
only on success, `server/resources/sitemap.js:213-231`) carried `age: 4590` at ~23:35Z → generated
≈22:19Z today with 130 listings. So Sharetribe answered listing queries at ≈22:19Z, 23:34Z, 23:43Z, 23:45Z.

So for the 12 marketplace URLs I sampled: all 200, all different bytes/md5, all `index, follow`,
all self-canonical. The "126 byte-identical maintenance pages" scenario does **not** exist at
measurement time. [U] whether it existed earlier today / is intermittent / is browser-only (see §4.3).

---

## 1. Front door: who answers what

### 1.1 What the repo documents (the WEST nginx site config is NOT in git)

[V] `find . -name "*.conf"` → only `ops/cloudflare/west-nginx/00-default-server.conf`,
`ops/cloudflare/west-nginx/cloudflare-real-ip.conf`, `ops/monitors/west/nginx/prnm-timing.conf`.
`/etc/nginx/sites-enabled/default` (644 lines after 2026-09-18, "roughly 30 `proxy_pass` directives
target EAST" — `docs/PLAN_2026-09-18_origin-lockdown.md:80-86`), `snippets/s-noindex-map.conf`,
`snippets/course-301-map.conf`, the `feature-interim-301` block and `/var/www/html/robots.txt`
exist in no repository. `docs/OPS_RECORD_2026-09-25_sitemap-listings-404.md:28`: "This WEST site
config is not in git."

Documented fragments:

| Path | Goes to | Source |
|---|---|---|
| `= /` | EAST fresh-web | `HOMEPAGE_AUDIT.md:8` ("nginx `location = /` proxies to the EAST marketing server"); CLAUDE.md "The public `/` is proxied to EAST" |
| `/p/*` (case-sensitive) | EAST | `docs/seo/changes-2026-09-02.md:67,115` |
| `/fw-assets/*` | EAST | CLAUDE.md "WEST proxies `/` and `/fw-assets` to EAST over HTTP/1.0" |
| `^/(sitemap\.xml\|sitemap-(static\|directory\|recent-pages\|listings\|pages-[a-z-]+)\.xml)$` | EAST | `docs/OPS_RECORD_2026-09-25_sitemap-listings-404.md:10-17` (`listings` added 2026-09-25) |
| `/sitemap-pages-academy.xml` | WEST static file `/var/www/prnm-tools/sitemap-academy-full.xml` (shadows EAST) | `docs/seo/patches-2026-09-01.md:137-144` (S9, still open) |
| `^~ /api/public/hooks` | EAST | `docs/AUDIT_2026-09-16_outbound-comms.md:156` |
| `/_serverFn/`, `/blog` | EAST | fresh-web `docs/INFRASTRUCTURE.md:41` (2026-07-06) |
| `/public-pools/*` | WEST container `pp-ssr` on :3100 (was a Lovable app until summer) | `docs/seo/gsc-recovery-2026-09-01.md:120-121`, `ops/monitors/west/nginx-smoke-test.sh:81`, `docs/OPS_RECORD_2026-09-25_seo-phase2-evidence.md:152-175` |
| `/public-pools/<st>/<city>/feature/<x>/` | nginx 301 → city hub (`feature-interim-301`) | `docs/OPS_RECORD_2026-09-25_seo-traffic-investigation.md:36` |
| `/p/course/*` | nginx 301 map, 193 rules (`snippets/course-301-map.conf`) | `docs/seo/patches-2026-09-01.md:25-27` |
| `/amenity/*` | "Lovable apps" | fresh-web `docs/INFRASTRUCTURE.md:42` |
| `^~ /tools/` | WEST static, `alias /var/www/prnm-tools/` | `ops/east/README.md:8-13`, CLAUDE.md:72 |
| `/robots.txt` | WEST static `/var/www/html/robots.txt` | `docs/seo/patches-2026-09-01.md:148-150` |
| `/api/` and everything else (`/s`, `/l/*`, `/u/*`, `/login`, `/signup`, account…) | marketplace container via `upstream web` (7 `proxy_pass http://web`) | CLAUDE.md deploy ritual; `docs/OPS_RECORD_2026-09-18_...:115-116` |
| `sub_filter` | injects `<script async src="/tools/cta.js">` into `/p/*`, `/l/*`, `/u/<uuid>`, `/` | `ops/east/README.md:9-11` |
| nginx proxy cache in front of EAST (adds `X-Cache`) | — | fresh-web `serve.mjs:31-35` comment; live `x-cache: HIT/EXPIRED/MISS` on EAST responses |
| unmatched Host/SNI | 404 (:80) / 444 (:443) since 2026-09-18 02:39Z; before that returned the EAST homepage with 200 | `ops/cloudflare/west-nginx/00-default-server.conf`, `docs/OPS_RECORD_2026-09-18_retire-...:90,146` |

### 1.2 Live confirmation (2026-11-14 23:32–23:46Z)

Signatures used: EAST = `content-security-policy: … frame-ancestors 'self' https://lovable.dev …` +
HSTS; WEST marketplace = `x-frame-options: SAMEORIGIN`, `content-security-policy-report-only: report-uri /csp-report`,
`set-cookie: st-<clientId>-token`; pp-ssr = `cache-control: public, max-age=600, s-maxage=3600`;
WEST nginx static = nginx-style `etag: W/"<hex mtime>-<hex size>"` + `last-modified`.

| Path | Status | Answered by | Notes |
|---|---|---|---|
| `/` | 200 | **EAST** | CSP lovable; `cf-cache-status: EXPIRED` |
| `/p/all-locations` | 200 | **EAST** | `x-cache: EXPIRED` (nginx proxy cache) |
| `/s` | 200 | **WEST marketplace** | sets `st-…-token` cookie; `cf-cache-status: DYNAMIC` |
| `/l/x` | 200 | **WEST marketplace** | soft 404 — see §3.3 |
| `/public-pools/` | 200 | **pp-ssr (WEST :3100)** | `cache-control: public, max-age=600, s-maxage=3600`, meta `index, follow`, self-canonical |
| `/tools/` | 403 | **WEST nginx static** | directory index forbidden; `/tools/cta.js` 200 `last-modified: Wed, 09 Sep 2026 21:50:13 GMT`, `/tools/home.js` 200 `last-modified: Tue, 21 Jul 2026 01:20:51 GMT` |
| `/sitemap.xml` | 200 | **EAST** | `application/xml`, `x-robots-tag: noindex`, `cache-control: public, max-age=300, stale-while-revalidate=86400`, 15 children |
| `/robots.txt` | 200 | **WEST nginx static file** | `last-modified: Sat, 08 Aug 2026 09:52:08 GMT`, `etag: W/"6a76fc48-68e"` (0x6a76fc48 = 2026-08-08 09:52:08Z, 0x68e = 1,678 bytes) |

Other paths probed: `/phoenix`, `/riverside`, `/jobs.xml`, `/sitemap-directory.xml`,
`/sitemap-pages-courses.xml`, `/sitemap-listings.xml`, `/fw-assets/__build.json` → EAST.
`/terms-of-service`, `/privacy-policy`, `/host-standards`, `/lessons`, `/operating-ceo`, `/signup`,
`/login`, `/confirm`, `/recover-password`, `/dashboard`, `/account`, `/inbox`, `/listings`,
`/profile-settings`, `/u/<uuid>`, `/wishlist`, `/sitemap-index.xml`, `/sitemap-default.xml`,
`/sitemap-recent-listings.xml`, `/sitemap-country.xml` (404), `/index.html`, `/robots.txt/` → WEST marketplace.
`/public-pools.xml`, `/public-pools/<state>/…` → pp-ssr. `/sitemap-pages-academy.xml` → WEST static
(`content-type: text/xml`, `last-modified: Mon, 20 Jul 2026 04:20:36 GMT`, 207 `<loc>`, 207 `<lastmod>`).
`/wizard/` → an Express app (`x-powered-by: Express`, 1,569-byte SPA shell, no robots meta, no canonical).
`/amenity/*` → Lovable app (`x-deployment-id`, 2,322-byte SPA shell) — see §3.4.
Apex `https://poolrentalnearme.com/<path>` → single 301 to www, query kept. `http://www` → 301 https.

### 1.3 The live robots.txt for www is in no repository, and three different robots definitions exist

[V] `grep -rIl -e "Block hybrid listing+search URLs" -e "Faceted search pagination" -e "Block aggressive scrapers and AI crawlers" poolrentalnearme-web fresh-web-702e04c3` → no file.

1. **Live www** (nginx static, mtime 2026-08-08): `User-agent: *` / `Allow: /` / Disallow
   `/profile-settings`, `/l/new`, `/l/*/checkout`, `/l/*/draft`, `/l/*/pending-approval`, `/l/*/new`,
   `/l/*/edit`, `/inbox`, `/order`, `/sale`, `/listings`, `/account`, `/reset-password`, `/verify-email`,
   `/preview`, `/admin`, `/auth`, `/api/`, `/p/p/`, `/l/*/p/`, `Crawl-Delay: 5`, `Disallow: /s?*&page=`;
   `Sitemap: …/sitemap.xml` and `Sitemap: …/public-pools.xml`. `Disallow: /host/preview/` sits at the very
   end under `User-agent: CCBot`, so it applies to CCBot only, not to `*`. Does **not** disallow `/u/` or `/s?`.
2. **WEST repo** `server/resources/robots.txt:5-31` (`Allow: /p/`, `Disallow: /s`, …, `Sitemap: https://my.marketplace.com/sitemap-index.xml`).
   The production container serves exactly this at `GET /robots.txt/` (trailing slash escapes nginx's
   exact match): 200, 636 bytes, `Sitemap: https://www.poolrentalnearme.com/sitemap-index.xml`, `Disallow: /s`.
   `Disallow: /s` is a prefix rule: it would also block `/sitemap.xml`, `/signup`, `/s/...`. It is not what
   Google reads today, but it is what www would serve if the nginx static rule were ever lost.
3. **EAST** `fresh-web/src/routes/robots[.]txt.ts` — served only on non-www origins (ccTLDs). Its .com
   branch disallows `/u/`, `/s?`, `/api/sharetribe/`, … — none of which is live on www.

Consequence for "Blocked by robots.txt 3,399": [V] the www robots file has not changed since
2026-08-08 (Last-Modified/etag), so that bucket was not produced by a www robots edit inside the
Aug 16–Nov 8 window. [U] which URLs are in it (needs the GSC example list). From marketplace-side
pages the only robots-blocked link I found is the host CTA `/l/draft/00000000-…/new/details`
(matches `Disallow: /l/*/new`; it 302s to `/wizard/`).

---

## 2. Sitemaps WEST can generate

Code: `server/resources/sitemap.js`; mounted `server/index-prod.js:37` `app.get('/sitemap-:resource', sitemapResourceRoute)`
and `:36` `app.get('/robots.txt', robotsTxtRoute)`.

- `sitemap-index.xml` → lists `/sitemap-default.xml`, `/sitemap-recent-listings.xml`, `/sitemap-recent-pages.xml` (`sitemap.js:118-120`).
- `sitemap-default.xml` → `defaultPublicPaths` `/`, `/terms-of-service`, `/host-standards`, `/privacy-policy`, `/signup`, `/login`, `/s` (`sitemap.js:47-55`).
- `sitemap-recent-listings.xml` → `l/${l.id?.uuid}` for every published listing (`sitemap.js:213-216`) — the **id-only** form.
- `sitemap-recent-pages.xml` → `p/<assetName>` for Console CMS pages (`sitemap.js:275-296`).
- 1-day in-memory cache (`ttl = 86400`, `sitemap.js:58`); `SITEMAP_DISABLED=true` → 503 (`sitemap.js:354-358`).

Live today:

| URL | Status | Served by | Content |
|---|---|---|---|
| `/sitemap-index.xml` | **200** | WEST marketplace (`x-frame-options: SAMEORIGIN`, `cache-control: public, max-age=86400`, `age: 61063`) | 3 children as above |
| `/sitemap-default.xml` | **200** | WEST marketplace | 7 URLs incl. `/login` (which is `noindex, follow`) |
| `/sitemap-recent-listings.xml` | **200** | WEST marketplace (`age: 4590`) | **130** URLs, all `https://www.poolrentalnearme.com/l/<uuid>` |
| `/sitemap-recent-pages.xml` | **301 → `/sitemap.xml`** | EAST (nginx regex sends `recent-pages` to EAST; `cache-control: public, max-age=86400`) | — |

[V] `/l/<uuid>` is a redirect, not a page: `GET /l/6aea7357-63f7-4e8b-8b9f-de101a8601ad` → 301
`location: /l/fish-grill-and-chill-pondside-oasis-in-walker/6aea7357-…`; `GET /l/6ac7a2f9-…` → 301
`/l/cypress-oasis-resort-pool-outdoor-bar-casa-luxe-htx/6ac7a2f9-…` (c204, live since 2026-09-25 04:50Z —
`docs/OPS_RECORD_2026-09-25_seo-traffic-investigation.md:25-28,86-88`). So WEST publicly serves a sitemap
whose 130 entries are all 301s.

[V] Referenced by live `/sitemap.xml`? No — `grep -cE 'sitemap-(index|default|recent-listings|recent-pages|directory)'` on the index body = 0.
Referenced by live `/robots.txt`? No (only `/sitemap.xml`, `/public-pools.xml`).
[U] Whether `sitemap-index.xml` / `sitemap-recent-listings.xml` are still submitted in GSC or remembered by
Google from the pre-cutover robots.txt (the marketplace robots template points at `/sitemap-index.xml`).

Listing-ID comparison [V]: EAST `/sitemap-listings.xml` = 126 ids, every `<lastmod>` 2026-09-25T05:05:01.754Z (64)
or 05:05:03.564Z (62) — i.e. the last `synced_listings` sync. WEST `/sitemap-recent-listings.xml` = 130 ids.
In both: 126. Only in WEST (published now, missing from the sitemap Google is given): `6abaf08c-…`,
`6ac7a2f9-…`, `6ac7a3c3-…`, `6aea7357-…`. Only in EAST: none. `docs/OPS_RECORD_2026-09-18_pseo-live-inventory.md:147-151,254-267`:
no cron runs the sync ("Automatic refresh running? No.").

Other sitemap-shaped endpoints reachable on www but not in the index [V]:
- `/sitemap-directory.xml` → 200 (EAST), **1,357** URLs `/p/pool-pros…` (898 lastmods, all 2026-07). 4 of 4
  sampled are `<meta name="robots" content="noindex, nofollow"/>` (`/p/pool-pros`, `/p/pool-pros/c/pool-builders`,
  `/p/pool-pros/c/pool-builders/az/phoenix-az`, `/p/pool-pros/zier-pools-san-marcos`). Reachable only because the
  WEST nginx regex keeps `directory` in its alternation. [U] whether Google still fetches it.
- `/sitemap-pages-courses.xml` → 200, empty urlset (retired 2026-09-02 on purpose).
- `/pools-directory-sitemap.xml` → 301 → `/public-pools.xml`.
- `/sitemap-country.xml` on .com → 404 from the marketplace (61,751-byte "Page not found", `x-robots-tag: noindex, follow`).

---

## 3. Public URL families of the marketplace and their index signals

Route table: `src/routing/routeConfiguration.js:35-464`. Robots meta: `src/components/Page/Page.js:57-68`
(`shouldIndex`/`shouldFollow`, default `index, follow, max-snippet:-1, …`), emitted at `Page.js:321`;
canonical at `Page.js:148-151,298` (`canonicalPathOverride || canonicalRoutePath(...)`, i.e. the request path
incl. query unless the page passes its own).

| Family | Pattern (routeConfiguration.js line) | Code signal | Live (2026-11-14) |
|---|---|---|---|
| Search hub | `/s` (55) | `shouldIndex={!location.search}` — `SearchPageWithMap.js:565`, `SearchPageWithGrid.js:373` | 200, meta `index, follow`, canonical `/s`, 1 H1, no X-Robots-Tag |
| Search with any query | `/s?…` | same prop → `noindex, follow` | 200, **header `x-robots-tag: noindex, follow` + meta `noindex, follow`**, canonical = self incl. query (`/s?address=Lancaster%2C+PA`); `/s?utm_source=x` → noindex + canonical `/s` |
| Search by listing type | `/s/:listingType` (67) | none (query-less → index) | `/s/hourly-pool` 200 index,follow, canonical `/s/hourly-pool`, same title as `/s`, "125 pools found"; **`/s/zzz-audit-probe` 200 index,follow, self-canonical, "0 pools found"** |
| Listing | `/l/:slug/:id` (84) | canonical override `listingCanonicalPath` (`ListingPageCarousel.js:294-296,532`), index | 200, index,follow, self-canonical, **3 H1**; wrong slug → 301; `?ref=x` → 200 canonical w/o query |
| Listing id-only | `/l/:id` (161) | 301 via `ssrStatus.resolveListingRedirect` (`server/api-util/ssrStatus.js:186-205`, `server/renderer.js:117-126`) | 301 → `/l/<slug>/<id>` |
| Listing dead id | — | NotFoundPage → 404 + header (`renderer.js:128-130`) | `/l/some-pool/00000000-…` 404, `x-robots-tag: noindex, follow`, meta `noindex, nofollow` |
| Listing malformed id | — | `ssrStatus.isMalformedEntityPath` (`ssrStatus.js:223-244`) | `/l/some-pool/abc` 404 + `x-robots-tag: noindex, follow` |
| Listing variants / edit / checkout | `/l/:slug/:id/:variant` (106), `/:type/:tab` (139), `/checkout` (97), `/l/new` (120) | `auth: true`; robots.txt Disallow | `/l/new` 200 shell (no title/robots/canonical); robots-disallowed |
| Profile | `/u/:id` (180) | **none** | `/u/<real uuid>` 200, `index, follow`, self-canonical, 2 H1, 95 KB; `/u/<nil uuid>` 404; `/u/x` → 400 "bad link" (nginx); `/u` 200 shell |
| Console CMS pages | `/p/:pageId` (45) | `shouldIndex={isNotInvestorsPage}` (`CMSPage.js:24`) | never reached on www — nginx sends all `/p/*` to EAST |
| Landing | `/` (38) | — | never reached on www — `= /` goes to EAST |
| Static/legal | `/terms-of-service` (384), `/privacy-policy` (406), `/host-standards` (399), `/lessons` (132) | index | all 200 index,follow self-canonical |
| `/operating-ceo` (392) | `shouldIndex={false}` (`OperatingCeoPage.js:250`) | 200 `noindex, follow` |
| Auth | `/login` (212), `/signup/:userType?` (222), `/confirm` (231) | `shouldIndex={!isLogin}` (`AuthenticationPage.js:631`) | `/login` 200 `noindex, follow`; `/signup` 200 index,follow; **`/confirm` 200 index,follow, self-canonical, same title as `/signup`** |
| Password | `/recover-password` (240), `/reset-password` (425) | `shouldIndex={false}` (`PasswordRecoveryPage.js:176`) | `/recover-password` 200 `noindex, follow` |
| Account/inbox/orders/dashboard/listings/wishlist | 248–382, extension `/wishlist` | `auth: true` | `/dashboard`, `/listings`, `/wishlist` 200 `noindex, nofollow`; `/account`, `/inbox`, `/profile-settings` 200 bare shell |
| Not found | `*` (458) | `shouldIndex={false} shouldFollow={false}` (`NotFoundPage.js:60-61`) + 404 + `X-Robots-Tag` | `/no-such-route-audit-probe` 404, `x-robots-tag: noindex, follow` |
| Alternate spellings | — | one 301 (`ssrStatus.resolveCanonicalRedirect`, `ssrStatus.js:138-162`) | `/Login` → 301 `/login`; `/terms-of-service/` → 301; `/s/` → 301 `/s` |

### 3.1 Where `X-Robots-Tag: noindex, follow` for `/s` is set

- **App code sets the header only on 404s** — `server/renderer.js:127-131`:
  ```js
  res.set({ 'Content-Type': 'text/html' });
  if (status === 404) {
    res.set('X-Robots-Tag', 'noindex, follow');
  }
  res.status(status);
  ```
  (the only other `X-Robots-Tag` in server code is `server/api/health-booking.js:91`).
- **For `/s?…` the header comes from WEST nginx**, a file not in git — `docs/seo/gsc-recovery-2026-09-01.md:179-181`:
  > "Today every `/s?…` is `noindex, follow` twice over: nginx `snippets/s-noindex-map.conf` (`~^/s\?` → `X-Robots-Tag`) **and** `Page.js` (`shouldIndex={!location.search}` in both `SearchPageWithMap.js:565` and `SearchPageWithGrid.js:373`)."
- Live proof it is nginx, not the app [V]: `GET /s?` (empty query) → header `x-robots-tag: noindex, follow`
  while the app's own meta says `index, follow` and canonical `/s` (the app sees an empty `location.search`; the
  nginx map matches the raw `/s?`). Bare `/s` → no header.
- App-side meta: `src/containers/SearchPage/SearchPageWithMap.js:565` and `SearchPageWithGrid.js:373`: `shouldIndex={!location.search}`.

### 3.2 Internal links that feed the noindex bucket
[V] Homepage (EAST) HTML has 18 `href="/s?…"` links (`/s?pub_poolAmenities=hot_tub`, `/s?pub_poolAmenities=heated`,
`/s?pub_categoryLevel1=pool&pub_categoryLevel2=indoorpools`, `/s?keywords=party`, …); `/s` links `/s?page=1|2|6`
(`Disallow: /s?*&page=` does not match `/s?page=2`). Every one of those targets is `noindex, follow`.

### 3.3 Soft 404s on the marketplace (200 + indexable + self-canonical)
- [V] `/l/x` → 200, title "Error in loading the listing", meta `index, follow`, canonical `https://www.poolrentalnearme.com/l/x`,
  body "Could not load the listing. Please try again."; preloaded state `showListingError … status":400`.
- [V] **In the live sitemap**: `/l/config-listing-do-not-delete/6768ea36-b435-40df-b331-43be74aa882f` → 200,
  58,996 bytes, title "Error in loading the listing", `index, follow`, self-canonical, body "The listing contained
  invalid data. Please contact the marketplace operator." (flagged 2026-09-25 as P2, still there:
  `docs/OPS_RECORD_2026-09-25_seo-traffic-investigation.md:121`).
- Code: `src/containers/ListingPage/ListingPageCarousel.js:214-221` (only `status === 404` → NotFoundPage; any other
  error → `<ErrorPage>`), `:257-261` (invalid listing → `<ErrorPage invalidListing>`); `ListingPage.shared.js:355-384`
  `PlainPage` renders `<Page title=…>` with no `shouldIndex={false}` and nothing sets the SSR not-found signal.
- [V] `/s/<anything>` (above), `/u` (200 shell), `/index.html` (200, raw template with `<!--!title-->` placeholders).

### 3.4 Redirect loops and other front-door oddities (candidates for "Redirect error 17")
- [V] **`/l` ↔ `/l/`**: `GET /l` → 301 `location: https://www.poolrentalnearme.com/l/` (nginx, body "301 Moved Permanently");
  `GET /l/` → 301 `location: /l` (marketplace, `cache-control: public, max-age=86400`). Infinite loop.
- [V] **`/p` ↔ `/p/`**: `GET /p` → 301 `https://www.poolrentalnearme.com/p/` (nginx); `GET /p/` → 307 `location: /p` (EAST). Infinite loop.
- [V] `/public-pools` → 301 `/public-pools/` (ok). `/wizard` → 301 `/wizard/` (ok). `/tools` → 404 (marketplace). `/u/` → 404.
- [V] `/public-pools/texas/austin/feature/heated/` → 301 → city hub (interim rule still live).
- [V] `/p/course/essential-pool-rental-signage` → 301 `/p/poolrentalsignage` (nginx map still live).
- [V] `/guides/pool-safety-guide-for-homeowners/` → 301 → `/p/pool-safety-guide-for-homeowners/` (trailing slash; chain documented 2026-09-25 as redirect→404).
- [V] `/amenity/heated`, `/amenity/zzz-audit-probe`, `/amenity/` → all 200, 2,322 bytes, identical title
  "Pool rental near me host, amenities, and upgrades guide guid", empty `<div id="root">`, no robots meta, no canonical
  (`x-deployment-id: bb9db866-…`, Lovable). Any path under `/amenity/` is a 200. [U] how many such URLs Google knows.
- [V] `/blog` → 301 `/p/blog`.

---

## 4. What the marketplace serves while Sharetribe refuses it

### 4.1 Measured (today): see §0 — live pages, not maintenance pages.
Per-URL detail for the five URLs the task named:

| URL | Status | Title | Robots meta | Canonical | X-Robots-Tag |
|---|---|---|---|---|---|
| `/s` | 200 | Pool Rentals Near You — Book a Private Pool by the Hour \| Pool Rental Near Me | `index, follow, max-snippet:-1, max-video-preview:-1, max-image-preview:large` | `https://www.poolrentalnearme.com/s` | none |
| `/login` | 200 | Log in \| Pool Rental Near Me | `noindex, follow` | `…/login` | none |
| `/l/terrific-backyard-oasis-pool-hot-tub/69cecdca-…` | 200 | Terrific Backyard Oasis Pool & Hot Tub \| Pool Rental Near Me | index, follow… | self | none |
| `/l/your-south-scottsdale-desert-oasis-private-resort/6a3ee56f-…` | 200 | Your South Scottsdale Desert Oasis & Private Resort \| … | index, follow… | self | none |
| `/l/texas-country-oasis-in-seguin-sparkling-pool-shaded-patio/6a425a51-…` | 200 | Texas Country Oasis In Seguin — … | index, follow… | self | none |

Byte-identical? No: md5 `ce629848…` / `2036283d…` / `791d6864…` (199,833 / 145,941 / 160,176 bytes); nonce-stripped md5s also differ. noindex? No.

### 4.2 What the code would serve if Sharetribe refused (inference from code, not observed)
- `src/ducks/hostedAssets.duck.js:138-208`: `Promise.all([translations, footer, configs, getAdminListing()])`;
  any rejection (asset CDN **or** the `sdk.listings.query({pub_listingType: LISTING_TYPE_CONFIG})` call) lands in
  `.catch` → returns `undefined`.
- `src/entry-server.jsx:102-108` → `hostedConfig = {}`; `src/util/configHelpers.js:1435-1445` → `hasMandatoryConfigurations` false.
- `src/app.js:199-208` (ServerApp) → renders `<MaintenanceModeError>` = `IntlProvider > HelmetProvider > MaintenanceMode`
  (`src/components/MaintenanceMode/MaintenanceMode.js:13-52`): an `<h2>Maintenance mode</h2>` and two sentences. It is **not**
  wrapped in `<Page>`, so Helmet emits no `<title>`, no `<meta name="robots">`, no `<link rel="canonical">`.
- `server/renderer.js:81,103-107,127-131`: status stays **200** for every matched route (404 only for a router miss or a
  malformed entity path); no `X-Robots-Tag` on a 200.
- [I] Result in that state: all 126 sitemap listing URLs + `/s` + `/signup` + legal pages = HTTP 200, same visible body,
  no title, no robots meta, no canonical → indexable soft-404 / duplicate cluster. Not byte-identical in the strict sense
  (per-request CSP nonce and `__PRELOADED_STATE__`), but identical rendered content.

### 4.3 The client re-fetches config in the browser on every page load
`src/entry-client.jsx:46-65`: `render()` always dispatches `fetchAppAssets(defaultConfig.appCdnAssets, cdnAssetsVersion)`
from the browser and builds `appConfig` from that result only; `src/app.js:147-155` (ClientApp) shows MaintenanceMode if it
is incomplete. [I] So a browser — and Google's renderer — can replace a good SSR page with "Maintenance mode" if the
browser-side Sharetribe calls fail, while curl still sees the SSR page. [U] whether that is what the brief's author saw; I
could not run a browser, and a POST to Sharetribe's token endpoint is outside this audit's GET/HEAD rule.

---

## 5. /public-pools/, public-pools.xml, /tools/

- **Generator** [V from docs + live signature]: `pp-ssr`, a Docker container on WEST listening on :3100
  (`docs/seo/gsc-recovery-2026-09-01.md:120-121` "Public-pool detail … WEST :3100";
  `ops/monitors/west/nginx-smoke-test.sh:81` "public-pools directory (proxied :3100)";
  `docs/OPS_RECORD_2026-09-25_seo-phase2-evidence.md:152-155,174-176` env `/home/ubuntu/pp-ssr/pp-ssr.env`, health `/pp-ssr/health`,
  "nginx public-pools upstream"). Before that it was a Lovable app backed by a separate Supabase project
  (fresh-web `docs/INFRASTRUCTURE.md:27-28,41-42`, dated 2026-07-06: "`attycbfvijoyqhnppyai` — public-pools backend (SEPARATE) ·
  edge functions for `/public-pools.xml` + directory sitemap").
- **Source code location: [U]** — pp-ssr's source is in neither repo (WEST repo: only docs/monitors/footer links mention
  `public-pools`; fresh-web: only link-checkers, breadcrumbs, footer links). It lives on the WEST box (`/home/ubuntu/pp-ssr/`).
- Live [V]: `/public-pools.xml` 200, `application/xml`, `cache-control: public, max-age=600, s-maxage=3600`,
  **2,529 `<loc>`, 0 `<lastmod>`**: 1 root + 52 two-segment (states + `/near-me/`) + 476 city + **2,000** pool detail, all
  with trailing slash. 2,000 is the same detail count as 2026-09-01 (paced release / cohort gate,
  `docs/OPS_RECORD_2026-09-25_seo-traffic-investigation.md:37`). Pages: 200, `<meta robots "index, follow">`, self-canonical with
  trailing slash; non-slash form `/public-pools/california` returns 200 with canonical to the slash form.
- `/public-pools.xml` is declared in robots.txt **and** listed in `/sitemap.xml` (advertised twice).
- Cloudflare cache rule (all four zones, 2026-09-16 22:35Z) caches `/`, `/p/*`, `/public-pools/*`, `/sitemap*`, `/robots.txt`
  for 600 s regardless of status (`docs/OPS_RECORD_2026-09-16_edge-cache-db-protection.md:5-17`; "a 404 is being cached at the
  edge" `docs/AUDIT_2026-09-17_cloudflare-impact.md:331-336`).
- **/tools/** [V]: WEST nginx `location ^~ /tools/ { alias /var/www/prnm-tools/; }` (`ops/east/README.md:8-13`, CLAUDE.md:72).
  Files are edited on the box; `ops/east/tools/cta.js` is the vendored copy. `cta.js` (15,236 B) adds Organization JSON-LD
  and click tracking; `home.js` (1,151 B, Jul 21) rewrites an `<h1>` matching "Rent a private pool by the hour" to
  "Support what you love, 0% Host fees" after hydration. The academy sitemap static file also lives in that directory.

---

## 6. Timeline of nginx / robots / canonical / redirect changes, 2026-09-01 → 2026-11-01 (from this repo's records)

| Date (UTC) | Change | Source |
|---|---|---|
| 08-08 09:52 | www `robots.txt` static file last modified (context; unchanged since) | live `Last-Modified` |
| 08-30 | c194: unknown marketplace routes return real 404 | `docs/seo/gsc-recovery-2026-09-01.md:134` |
| 08-31 | EAST comparisons sitemap excludes `redirect_to` rows (96 URLs out) | `gsc-recovery:122,353` |
| 09-02 | EAST: courses sub-sitemap retired (193 redirect URLs out), `redirect_to IS NULL` in all generators, `/p/terms-of-service` out of static sitemap, `lastmod` = `content_refreshed_at ?? created_at`, index-level lastmod removed, Organization AggregateRating removed. Sitemap 10,152 → 9,947 distinct URLs | `docs/seo/changes-2026-09-02.md:19-30,71-86` |
| 09-07 07:04 | WEST c196 live: one 301 for alternate spellings (case, trailing slash, `//`); 404 + `X-Robots-Tag: noindex` for `/l/<slug>/<non-uuid>`, `/l/l/…`, `/u/<non-uuid>`; real 404 for dead listing id / missing CMS asset; H1 on `/s`. nginx: 7 `proxy_pass` lines repointed to `upstream web` | `changes-2026-09-02.md:35-63`, `docs/OPS_RECORD_2026-09-07.md:77-83` |
| 09-07 | nginx server blocks + certs for `help.` and `n.poolrentalnearme.com` removed | `OPS_RECORD_2026-09-07.md:150-155` |
| 09-09 21:49 | WEST `nginx.conf` gzip for proxied EAST content; `cta.js` replaced | `docs/OPS_RECORD_2026-09-09b.md:70-79` |
| 09-11 | EAST: 57 dead `/host-tools/*` links removed, 77 internal redirect pairs repointed, homepage city grid filtered | `docs/OPS_RECORD_2026-09-11.md:14-25,90-93` |
| 09-16 04:02 | nginx timing access log (no routing change) | `docs/OPS_RECORD_2026-09-16_timing-log-cron-stagger.md:3-18` |
| 09-16 | Supabase outage → EAST 5xx (97% of 14-day 5xx fell on Sep 11–17) | `OPS_RECORD_2026-09-25_seo-traffic-investigation.md:18-23` |
| 09-16 19:53–21:19 | `.co.uk`, `.ca`, `.com.au` behind Cloudflare with Bot Fight Mode + 60 req/10 s rate limit | `ops/cloudflare/README.md:50-99` |
| 09-16 20:53 | EAST `intl.conf`: marketplace paths on ccTLDs 302 → `.com` | `docs/OPS_RECORD_2026-09-16_country-launch-pages.md:39-54` |
| 09-16 21:38 | WEST `conf.d/cloudflare-real-ip.conf` | `ops/cloudflare/west-nginx/cloudflare-real-ip.conf:3` |
| 09-16 22:00:56 | `.com` zone active on Cloudflare; `www` proxied 22:03, apex 22:13 | `docs/AUDIT_2026-09-17_cloudflare-impact.md:44,82`, `docs/PLAN_2026-09-16_cloudflare-dotcom.md:145-163` |
| 09-16 22:35 | Cloudflare cache rule, all four zones: `/`, `/p/*`, `/public-pools/*`, `/sitemap*`, `/robots.txt` edge TTL 600 s | `docs/OPS_RECORD_2026-09-16_edge-cache-db-protection.md:5-17` |
| 09-18 02:39 | WEST: explicit rejecting default vhost; `update.` server blocks + `chat-proxy.conf` removed; before this, unmatched SNI returned the EAST homepage with 200 | `docs/OPS_RECORD_2026-09-18_retire-update-and-chat-hosts.md:17-24,90,146` |
| 09-18 | EAST `24d14a99`: live-inventory block on all 4,008 `host_acq_city` pages, moved above the editorial body; cards link `/l/{slug}-{id8}/{id}` | `docs/OPS_RECORD_2026-09-18_pseo-live-inventory.md:3,99-103,121-123,190` |
| 09-21 | EAST `a870a846` / `0afa6c86`: city cards show all-in price; sync tombstone fix | `docs/OPS_RECORD_2026-09-21_...:3`, `pseo-live-inventory.md:209-252` |
| 09-25 04:50 | WEST c204: listing canonical `/l/<id>` → `/l/<slug>/<id>`; every other spelling 301s | `OPS_RECORD_2026-09-25_seo-traffic-investigation.md:25-28,86-88` |
| 09-25 ~05:05 | EAST listing slugs changed (`<title>-<uuid8>` → `<title slug>`), listing sync re-run (the sitemap's lastmod) | same, `:89-98` |
| 09-25 | WEST nginx: `listings` added to the sitemap regex — `/sitemap-listings.xml` had been 404 on www until then | `docs/OPS_RECORD_2026-09-25_sitemap-listings-404.md` |
| 09-26 02:22 | c205 flip (no SEO change recorded) | `docs/OPS_RECORD_2026-09-26_c205-calendar-tiers.md:80` |
| 10-04 02:01–02:12 | WEST outage ~11 min, 53 × 5xx at 02:11–02:12; c206 flipped 02:22:51 (`/operating-ceo` `noindex, follow`) | `docs/OPS_RECORD_2026-10-04_c206-release-and-oom-outage.md:4-9,17,25` |
| 10-15 | EAST hero video deploy | git `90f641d` |
| 10-17 | one editorial link added to `/p/how-to-host-a-pool-party` | git `d92a8f1` |
| (11-04) | c207 on WEST; EAST rebuilt 07:38Z from `7702845` with 5 dirty files; EAST resized | `docs/OPS_RECORD_2026-11-04_remove-intercom.md:60-84`; live `/fw-assets/__build.json` |

**Sep 21 cliff:** preceded by the Cloudflare cutover (Sep 16), the default-vhost change (Sep 18) and the template-wide
inventory block on ~4,000 city pages (Sep 18). **Oct 19 cliff:** this repo records **no** nginx, robots, canonical or
redirect change between 2026-10-05 and 2026-11-03 (git log shows only hero-video and one content link on Oct 14–17). [U] cause.

---

## 7. Cross-cutting facts for other investigators
- [V] EAST production build stamp `GET /fw-assets/__build.json`: sha `77028454655e7b272d8c23987b54f445f9eba9f7`,
  branch `ops/deploy-sha-enforcement`, **`dirty: 5`** (`src/components/home-page.tsx`, `src/routes/__root.tsx`,
  `src/server/listing-sync.server.ts`, `src/server/sharetribe.server.ts`, `src/lib/listing-slug.ts`), builtAt 2026-11-04T07:38:03.938Z.
  Production fresh-web is not byte-equal to any commit.
- [V] `/sitemap-pages-academy.xml` on www is still the WEST static file dated 2026-07-20 (207 URLs with lastmod), not EAST's generator.
- [V] Two cache layers sit in front of EAST HTML: Cloudflare (600 s, any status) and a WEST nginx proxy cache (`X-Cache`).
- [V] Listing pages render 3 `<h1>`; profile pages 2.

## 8. Not done / limits
- No SSH: the nginx config, `/var/www/html/robots.txt` history, pp-ssr source and access logs were not readable.
- No GSC URL-level exports: every "which URLs are in bucket X" statement above is a candidate, not an attribution.
- No headless browser run: the client-side "Maintenance mode" path (§4.3) is code inference.
- Samples only (≈180 GET requests total over ~14 minutes); the full sitemap crawl is running elsewhere.

## 9. Fix candidates (none applied — proposals only)

1. **Listing error states are indexable 200s; one is in the sitemap.** `ListingPage.shared.js` `PlainPage` → `shouldIndex={false}`
   and flag the SSR signal so `renderer.js` answers 404 (invalid/unloadable listing) — and drop the config listing from
   EAST `synced_listings` / `sitemap-listings[.]xml.ts`.
2. **Maintenance state must not be an indexable 200.** In `entry-server.jsx` flag `res.locals` when
   `!hasMandatoryConfigurations`; in `renderer.js` answer 503 + `Retry-After` + `X-Robots-Tag: noindex`. Needed before any
   real Sharetribe closure (Derek: closed until Jan 1) — otherwise 126 sitemap URLs become title-less 200 duplicates.
3. **Legacy WEST sitemaps.** `/sitemap-recent-listings.xml` advertises 130 `/l/<uuid>` 301s. Either emit the canonical
   `/l/<slug>/<id>` in `sitemap.js:216`, or 301/410 the three WEST sitemap URLs in nginx. Check GSC Sitemaps first.
4. **Redirect loops** `/l` ↔ `/l/`, `/p` ↔ `/p/` — exact-match nginx locations.
5. **`/s/<anything>` and `/confirm`** — indexable duplicates of `/s` and `/signup`; canonicalise/noindex or 404 unknown listing types.
6. **`/u/<uuid>` profiles** — still `index, follow` (open since 2026-09-01); add `shouldIndex={false}` in `ProfilePage.js`.
7. **`/sitemap-directory.xml`** — 1,357 noindex URLs still served as a sitemap; empty urlset or drop `directory` from the nginx regex.
8. **`/amenity/*`** — any path is a 200 SPA shell; add `X-Robots-Tag: noindex` in nginx or retire with 410.
9. **Listing sitemap freshness** — schedule the `sync-listings` hook (4 published listings missing; lastmod frozen at 2026-09-25).
10. **Vendor the front door** — copy `/etc/nginx/sites-enabled/default`, `snippets/*.conf`, `/var/www/html/robots.txt` into git;
    make the three robots definitions one.
11. **`/s?…` signals** — noindex twice plus a self-canonical with query; stop linking 18 noindex `/s?` URLs from the homepage or
    decide which shapes are indexable.

## 10. Open questions
- Was the marketplace actually in maintenance mode earlier on 2026-11-14 (and for how long), or is that a browser-only state?
- Does GSC still list `sitemap-index.xml`, `sitemap-recent-listings.xml`, `sitemap-directory.xml`, `sitemap-pages-courses.xml`,
  `pools-directory-sitemap.xml` as submitted sitemaps?
- Which URLs are in "Blocked by robots.txt 3,399"? The www robots file did not change in the window.
- Is the GSC property a Domain property (the 2026-09-01 export contained `heater.poolrentalnearme.com`)? If so, subdomain URLs are in every bucket.
- What changed around 2026-10-19? Nothing in this repo's records.
- What does `snippets/s-noindex-map.conf` contain exactly, and are there other `add_header X-Robots-Tag` rules in the WEST site config?
