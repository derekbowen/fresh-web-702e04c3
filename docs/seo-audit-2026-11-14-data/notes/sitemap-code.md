# Sitemap code audit — fresh-web (EAST) — working notes

Investigator scope: audit questions 1 and 2, code side. READ-ONLY. 2026-11-14, live requests ~23:10–23:30 UTC.
Repo: `/home/user/fresh-web-702e04c3` @ `7702845` (branch `claude/host-membership` == `origin/ops/deploy-sha-enforcement`).
All live requests: `curl -A "Mozilla/5.0 (compatible; site-audit/1.0)"`, GET only, <= ~2.5 req/s.
Status labels: **V** = verified (file, or response seen), **I** = inference, **U** = unknown.
No database access was used (not granted for this task); anything that needs a row count is marked U.

---

## 0. Is the repo what production runs? (V)

```
curl https://www.poolrentalnearme.com/fw-assets/__build.json
{ "sha": "77028454655e7b272d8c23987b54f445f9eba9f7", "branch": "ops/deploy-sha-enforcement",
  "dirty": 5, "dirtyFiles": ["src/components/home-page.tsx","src/routes/__root.tsx",
  "src/server/listing-sync.server.ts","src/server/sharetribe.server.ts","src/lib/listing-slug.ts"],
  "builtAt": "2026-11-04T07:38:03.938Z" }
git rev-parse HEAD -> 77028454655e7b272d8c23987b54f445f9eba9f7
```

- EAST runs the same commit as the checkout, **plus 5 uncommitted files**. None of the sitemap
  route files or `src/lib/sitemap.ts` is dirty, so the sitemap code below is the code that runs on EAST. (V)
- `src/lib/listing-slug.ts` does not exist in the repo (`ls` -> No such file). A copy is vendored in the
  WEST repo at `/home/user/poolrentalnearme-web/ops/east/fresh-web/src/lib/listing-slug.ts`. (V)
- What `www.poolrentalnearme.com` actually answers differs from EAST for several sitemap paths because
  WEST nginx overrides them (section 2). The ccTLD hosts reach the EAST app without those overrides, so
  `https://www.poolrentalnearme.co.uk/<path>` was used as the "what EAST itself emits" probe. (V, by matching
  responses to the route code)

WEST nginx only proxies these sitemap paths to EAST (source: WEST repo
`docs/OPS_RECORD_2026-09-25_sitemap-listings-404.md`, config itself is not in git):
`location ~ ^/(sitemap\.xml|sitemap-(static|directory|recent-pages|listings|pages-[a-z-]+)\.xml)$`
Anything else (`sitemap-hub`, `sitemap-country`, `sitemap-default`, `sitemap-index`) falls through to the
marketplace container. Matches every live result below. (V for behaviour, doc-sourced for the regex)

---

## 1. TEMPLATE_GROUPS (Q1)

`src/routes/sitemap[.]xml.ts` L26-36 (V). Every group's list is identical to the list in its route file (V, compared one by one).

| # | index basePath | template_type values | route file (line with the list) | live today |
|---|---|---|---|---|
| 1 | /sitemap-pages-money.xml | money_page | sitemap-pages-money[.]xml.ts L10 | not in index; route 200, 0 URLs |
| 2 | /sitemap-pages-cities.xml | city_main | sitemap-pages-cities[.]xml.ts L12 | not in index; route 200, 0 URLs |
| 3 | /sitemap-pages-host-acquisition.xml | host_acq_city, host_acq_hub | sitemap-pages-host-acquisition[.]xml.ts L14 | 1000+1000+1000+933 = 3,933 |
| 4 | /sitemap-pages-event-guides.xml | event_guide | sitemap-pages-event-guides[.]xml.ts L11 | 787 |
| 5 | /sitemap-pages-articles.xml | resource, other, pool_maintenance, pool_maintenance_hub, country_launch | sitemap-pages-articles[.]xml.ts L11 | 443 |
| 6 | /sitemap-pages-academy.xml | elearning (+ minBodyChars 800) | sitemap-pages-academy[.]xml.ts L11-13 | EAST emits 70; www serves a WEST static file with 207 (section 3) |
| 7 | /sitemap-pages-advocacy.xml | host_advocacy_hub, host_advocacy_state | sitemap-pages-advocacy[.]xml.ts L13 | 52 |
| 8 | /sitemap-pages-spanish.xml | spanish_host_acq, spanish_resource, host_acq_city_es | sitemap-pages-spanish[.]xml.ts L13 | 446 |
| 9 | /sitemap-pages-swim-instructor.xml | swim_instructor_city, swim_instructor_hub | sitemap-pages-swim-instructor[.]xml.ts L12 | 349 |

18 template types, 9 groups. Groups 1 and 2 are absent from the live index because their count is 0
(`if (!count) return;` L228) — consistent with the routes answering an empty urlset (111 bytes). (V)

Index entries that are NOT template groups: `/sitemap-static.xml` (L143, unconditional), `/sitemap-pages-comparisons.xml`
(L146, unconditional, one entry, never paginated), `/sitemap-pages-blog.xml` (L242-253, from `blog_posts`),
`/sitemap-listings.xml` (L262-273, from `synced_listings`). `public-pools.xml` is not in the code at all (section 2).

Shared eligibility for all nine groups — `buildContentPagesSitemap`, `src/lib/sitemap.ts` L167-196 (V):
`content_pages` WHERE template_type IN (...) AND in_sitemap = true AND status = 'published' AND redirect_to IS NULL
AND slug IS NOT NULL AND slug NOT LIKE 'pool-rentals-%' ORDER BY slug RANGE(offset, offset+999);
then in JS: drop rows whose `url_path` is set and does not start with `/p/`; for academy also drop rows whose
`body_markdown` (trimmed) is < 800 chars. `loc` = SITE_URL + `url_path` if set, else SITE_URL + `/p/` + slug (L199-201).
Note: the header comment in `sitemap[.]xml.ts` L15-18 says status is not filtered; the code does filter it (L157). Stale comment. (V)

### template_type values that no route emits

Known to the code but in no group (V, by grep of `src/` and `supabase/migrations/`):
- `activity_city` — has a generator, a template and a dispatcher case (`p.$slug.tsx` L671), and its publish action sets
  `status:'published', in_sitemap:true` (`src/server/activity-city-generator.functions.ts` L281-286). Any published row is live,
  flagged for the sitemap and emitted by nothing — the same failure as the 9 `country_launch` pages in CLAUDE.md.
  Whether any such row exists: **U** (needs SELECT).
- `account_legal`, `listing`, `homepage` (in the `ContentPageTemplateType` union, `src/server/content-pages.functions.ts` L46-63).
- `city` (inserted as draft by `src/server/admin-weapons.functions.ts` L891), `redirect` (`content-404-log.functions.ts` L211),
  `guide`, `resource_article` (`p.$slug.tsx` L338).
- Legacy names from the first schema: `host_acquisition_city, event_city_guide, spanish_host_acquisition, host_advocacy,
  state_advocacy_guide, academy_article` (`supabase/migrations/20260502233000_...sql` L35-46) and from the importer comment:
  `public_pool_city, public_pool_state, amenity, hub` (`20260503050446_...sql` L12).
- **NULL** template_type: `.in("template_type", [...])` never matches NULL; the page still renders through `GenericPageTemplate`
  (`p.$slug.tsx` L635-637). WEST doc `docs/seo/gsc-recovery-2026-09-01.md` records "70 typed + 139 untyped academy rows in the DB"
  (doc-sourced, as of 2026-09-01). Today's live diff is 137 (section 3). Current DB counts: **U**.

No script checks coverage: `grep -rl TEMPLATE_GROUPS scripts` -> nothing. (V)

---

## 2. Every sitemap route (Q2)

Legend for "www" column: what `https://www.poolrentalnearme.com/<path>` answered today. "EAST" = same path on `www.poolrentalnearme.co.uk`.

| Route file | URL | Query | Emits | In index? | www today | EAST today |
|---|---|---|---|---|---|---|
| sitemap[.]xml.ts | /sitemap.xml | 9 x `content_pages` count (head, exact) in series; `blog_posts` count + max(updated_at); `synced_listings` count + max(updated_at). Memo: fresh 5 min, stale-while-revalidate 24 h, warmed at module load (L61-65, L293-307) | sitemapindex | — | 200, 15 children (14 from EAST + `public-pools.xml` appended by WEST) | 200, 14 children, 1,665 bytes |
| sitemap-static[.]xml.ts | /sitemap-static.xml | constant `STATIC_URLS` (24 paths, L11-37) + `getAllStateHubs()` (pages `content_pages` in 1000s, `src/server/state-hub.functions.ts` L58-82) | 24 + 51 state hubs, no lastmod | yes | 200, 75 | — |
| sitemap-pages-comparisons[.]xml.ts | /sitemap-pages-comparisons.xml | `content_pages` slug WHERE redirect_to NOT NULL AND slug LIKE '%-vs-pool-rental-near-me-in-%' `.limit(5000)`; `cities` slug, updated_at WHERE is_published ORDER BY slug `.limit(5000)`. No range, ignores ?page | 3 pillars (lastmod = now) + 2 URLs per city (lastmod = cities.updated_at) | yes, 1 entry | 200, 1,091 | — |
| sitemap-pages-host-acquisition / event-guides / articles / advocacy / spanish / swim-instructor | /sitemap-pages-<x>.xml[?page=N] | shared query above, 1000 per page | /p/{slug} or url_path, lastmod = content_refreshed_at ?? created_at, image = hero_image_url | yes (paginated by count) | 200; counts in section 1 | — |
| sitemap-pages-academy[.]xml.ts | /sitemap-pages-academy.xml | shared query, `elearning`, minBodyChars 800 | as above | yes | **200 `text/xml`, static file, Last-Modified 20 Jul 2026, 207 URLs** | 200, 70 URLs |
| sitemap-pages-blog[.]xml.ts | /sitemap-pages-blog.xml[?page=N] | `blog_posts` WHERE is_published ORDER BY updated_at DESC RANGE 1000 | /p/{slug}, lastmod = updated_at ?? published_at, image = cover | yes | 200, 143 | — |
| sitemap-listings[.]xml.ts | /sitemap-listings.xml[?page=N] | `synced_listings` WHERE state='published' AND is_deleted=false AND slug, sharetribe_id NOT NULL ORDER BY updated_at DESC RANGE 1000 | /l/{slug}/{sharetribe_id}, lastmod = updated_at, image | yes | 200, 126 | 200, 126 |
| sitemap-pages-money[.]xml.ts | /sitemap-pages-money.xml | shared query, `money_page` | — | no (count 0) | 200, 0 URLs | 200, 0 |
| sitemap-pages-cities[.]xml.ts | /sitemap-pages-cities.xml | shared query, `city_main` | — | no (count 0) | 200, 0 URLs | 200, 0 |
| sitemap-pages-courses[.]xml.ts | /sitemap-pages-courses.xml | none (retired 2026-09-02) | empty urlset | no | 200, 0 URLs | 200, 0 |
| sitemap-directory[.]xml.ts | /sitemap-directory.xml | `service_categories` WHERE is_published (no limit); `listCategoryGeoCoverage` per category; `providers` WHERE is_published `.limit(5000)` | /p/pool-pros tree | **no** (removed 2026-07-06, comment L148-149) | **200, 1,357 URLs** | 200, 1,357 |
| sitemap-country[.]xml.ts | /sitemap-country.xml | `content_pages` slug, updated_at WHERE in_sitemap AND slug NOT NULL AND slug ILIKE any country pattern `.limit(5000)`. No status filter, no redirect_to filter. Host-switched (L36-39) | https://{request host}/p/{slug}, lastmod = updated_at or now | no (declared by each ccTLD robots.txt) | **404** (marketplace 404 page) | 200: .co.uk 19, .ca 20, .com.au 20 |
| sitemap-hub[.]xml.ts | /sitemap-hub.xml | none | 301 -> /sitemap.xml | no | **404** (marketplace) | 301 -> .com/sitemap.xml |
| sitemap-default[.]xml.ts | /sitemap-default.xml | none | 301 -> /sitemap.xml | no | **200 from the marketplace: 7 URLs** | 301 |
| sitemap-index[.]xml.ts | /sitemap-index.xml | none | 301 -> /sitemap.xml | no | **200 from the marketplace: index of 3** | 301 |
| sitemap-recent-pages[.]xml.ts | /sitemap-recent-pages.xml | none | 301 -> /sitemap.xml | no | 301 -> /sitemap.xml | 301 |
| pools-directory-sitemap[.]xml.ts | /pools-directory-sitemap.xml | none | 301 -> /sitemap.xml | no | 301 -> **/public-pools.xml** (nginx) | 301 -> .com/sitemap.xml |
| sm-74buq58v[.]xml.ts + -ad/-cn/-cr/-ev/-ho/-ls | /sm-74buq58v*.xml | none | 301 -> /sitemap.xml | no | 301 -> /sitemap.xml (nginx, text/html) | 301 |
| robots[.]txt.ts | /robots.txt | none; host-switched | .com: `Sitemap: /sitemap.xml` only; ccTLD: `Disallow: /` + country Allow lines + `Sitemap: https://{host}/sitemap-country.xml` | — | **static WEST file** (Last-Modified 8 Aug 2026, etag 6a76fc48-68e), declares /sitemap.xml and /public-pools.xml | fresh-web output, matches code |
| jobs[.]xml.ts | /jobs.xml | `content_pages` host_acq_city published `.limit(5000)` | Indeed-format job feed, not a sitemap | no | 200, 937 jobs | — |

Live evidence for the orphan routes (one command, output trimmed):
```
/sitemap-pages-cities.xml   200 application/xml; charset=utf-8  111 bytes  <url>=0
/sitemap-pages-courses.xml  200 application/xml; charset=utf-8  111 bytes  <url>=0
/sitemap-pages-money.xml    200 application/xml; charset=utf-8  111 bytes  <url>=0
/sitemap-hub.xml            404 text/html (x-frame-options SAMEORIGIN, x-robots-tag noindex, follow -> marketplace 404)
/sitemap-directory.xml      200 application/xml; charset=utf-8  193,277 bytes  <url>=1357
/pools-directory-sitemap.xml 301 text/html  Location: https://www.poolrentalnearme.com/public-pools.xml
/sitemap-recent-pages.xml   301 Location: https://www.poolrentalnearme.com/sitemap.xml
/sitemap-default.xml        200 application/xml  775 bytes  <url>=7
/sitemap-country.xml        404 text/html (marketplace 404)
/sitemap-index.xml          200 application/xml  378 bytes  <sitemap>=3
```

### 2a. A second, parallel sitemap tree is live on www from the marketplace container (V)

`/sitemap-index.xml` and `/sitemap-default.xml` carry Express/helmet headers (`x-dns-prefetch-control`, `origin-agent-cluster`,
`cache-control: public, max-age=86400`), i.e. `server/resources/sitemap.js` in the WEST repo, not fresh-web.
```
/sitemap-index.xml -> <sitemapindex> sitemap-default.xml, sitemap-recent-listings.xml, sitemap-recent-pages.xml
/sitemap-default.xml -> /, /terms-of-service, /host-standards, /privacy-policy, /signup, /login, /s
/sitemap-recent-listings.xml -> 200, 12,424 bytes, 130 URLs, all of the form /l/<uuid> (no slug, no lastmod)
GET /l/6aea7357-63f7-4e8b-8b9f-de101a8601ad -> 301 -> /l/fish-grill-and-chill-pondside-oasis-in-walker/6aea7357-...
```
So 130 URLs in a reachable sitemap are redirects by construction (`server/resources/sitemap.js` L216: `l/${l.id?.uuid}`).
Whether Google has this index registered (it was the Sharetribe default before the July cutover): **U**, check GSC > Sitemaps.

### 2b. sitemap-directory.xml advertises 1,357 noindex URLs (V)

Breakdown of the live file: 891 `/p/pool-pros/{provider}`, 394 + 64 + 7 `/p/pool-pros/c/...`, 1 hub.
Every route in that tree sets `noindex: true` (`p.pool-pros.tsx` L19, `p.pool-pros.$slug.tsx` L26, `p.pool-pros.c.*.tsx`).
Live: `/p/pool-pros`, `/p/pool-pros/c/pool-builders/az`, `/p/pool-pros/4m-specialties-...-las-vegas` -> 200, `<meta name="robots" content="noindex, nofollow">`.
The index stopped listing it on 2026-07-06 but the route and the nginx regex alternative (`directory`) are still there.
Whether it is still a submitted sitemap in GSC: **U**.

### 2c. ccTLD sitemaps (V)

- Each ccTLD robots.txt comes from fresh-web and matches `robots[.]txt.ts` L94-102.
- `sitemap-country.xml`: .co.uk 19, .ca 20, .com.au 20 = 59 URLs. `loc` uses the request host (L50), and the bare host does not
  redirect to www: `https://poolrentalnearme.co.uk/sitemap-country.xml` -> 200, 19 URLs on the bare origin.
- All 59 country slugs are ALSO in the .com `sitemap-pages-articles.xml` (they are `content_pages` rows with in_sitemap=true).
- `/p/rent-out-your-pool-uk` -> 200 and self-canonical on `www.poolrentalnearme.com`, `www.poolrentalnearme.co.uk` and
  `poolrentalnearme.co.uk`; no hreflang on any of them. Three self-canonical copies, each advertised by a sitemap on its own origin.
- Each ccTLD also serves `/sitemap.xml` (the full .com index, 14 children). Harmless: robots there is `Disallow: /`.
- `/p/hosting` on .co.uk canonicalises to .com (static route uses SITE_URL), so "self-canonicalises" applies to dispatcher pages
  that thread `getRouteOrigin()` (`p.$slug.tsx` L304, L331), not to every page.

---

## 3. Academy sitemap on www is a frozen file (V)

```
curl -sI https://www.poolrentalnearme.com/sitemap-pages-academy.xml
content-type: text/xml
last-modified: Mon, 20 Jul 2026 04:20:36 GMT
etag: W/"6a5da214-77e2"
(no cache-control / x-robots-tag, unlike every fresh-web sitemap)
```
www: 207 URLs. EAST route (via .co.uk): 70 URLs. Intersection 70, www-only 137, EAST-only 0.
www-only = 131 `elearning-academy-*` + `/p/academy-catalog`, `/p/taxesforpoolhosts`, `/p/fivestarguestcheckin`,
`/p/insuranceandlegalessentialsforpoolhostscourse`, `/p/cleanwatermanagementforpoolrentals`, `/p/pool-rental-signage`.
12 of the 137 sampled live: all 200, self-canonical, no noindex, 1,788-2,358 words of rendered text (whole page, chrome included).
So the 137 are real pages that the app's own sitemap does not emit. WEST doc (2026-09-01) names the file
`/var/www/prnm-tools/sitemap-academy-full.xml` and gives the cause as untyped rows ("70 typed + 139 untyped academy rows").
Cause today: **I** (untyped template_type, or body under 800 chars in `body_markdown` while the text sits in `content`; needs SELECT).
`/p/all-locations` links 69 `elearning-academy-*` pages, so the other ~131 are not linked from that hub either. (V)

---

## 4. Why comparisons is one file of 1,091 and host-acquisition is paged (Q3)

- Host-acquisition goes through `buildContentPagesSitemap`: explicit `.range(offset, offset + 999)` (`sitemap.ts` L181) and the
  index emits `?page=N` from an exact count (`sitemap[.]xml.ts` L233-238). 3,933 rows -> 4 pages.
- Comparisons does not use that helper. It reads `cities` once and emits **two URLs per city row** plus 3 hard-coded pillars
  (`sitemap-pages-comparisons[.]xml.ts` L15-24, L60-71). 1,091 = 3 + 2 x 544. The row count (544 if nothing is excluded)
  is under 1,000, so nothing is cut off. The index has one fixed entry for it (L146) and the route ignores `?page`.
- `.limit(5000)` does not raise the cap. `src/lib/sitemap.ts` L13-17 documents the PostgREST default max-rows of 1,000, and
  `/jobs.xml` (same `.limit(5000)` on `host_acq_city`, `jobs[.]xml.ts` L27-32) returns 937 jobs live although at least
  ~3,900 published host_acq rows exist (3,933 are in the sitemap). So the cap is in force in production. (I, strong)
- Therefore: when published `cities` passes 1,000 the comparisons sitemap will silently stop at 1,000 cities (2,003 URLs), and the
  redirect-exclusion query (L41-46) will silently stop at 1,000 redirect rows and start advertising redirects again.

Is any group truncated at 1,000 today? **No** (V for the live counts):
host-acq paged 3,933; event-guides 787; articles 443; academy 70/207; advocacy 52; spanish 446; swim 349; blog 143; listings 126;
comparisons 544 rows; directory providers 891 (closest to the cap); country 19-20; state hubs paged in code.

Latent failure modes in the index (V in code, occurrence U):
- `countOnce` returns `{count: null, error: null}` when PostgREST gives no count; `if (!count) return;` (L228) then drops the whole
  group with no log line, and `lastGoodCount` is only consulted on error (L112-119). A null count is a silent disappearance.
- A count that errors twice in a process that has never counted the group advertises page 1 only (L220-227).
- A sub-sitemap whose query errors answers **HTTP 200 with an empty urlset** (`sitemap.ts` L183-186; blog L32-35; listings L38-41),
  cacheable for 300 s with `stale-while-revalidate=86400` (L119) behind Cloudflare.
- Index count has no `slug NOT LIKE 'pool-rentals-%'`, no url_path filter and no minBody filter, the sub-sitemap has; the index can
  list one more page than has rows. `?page=5` of host-acquisition answers 200 (headers only fetched).
- `ORDER BY slug` has no tie-breaker while slugs are not unique (`lookupContentPage` comment L129-131); listings/blog order by
  `updated_at` only and all 126 listings share one timestamp. Paging is not deterministic once a family passes 1,000.

---

## 5. lastmod (Q4)

- content_pages families: `content_refreshed_at ?? created_at` (`sitemap.ts` L204). Live: host-acq dates 2026-05-03..2026-07-09
  (mode 2026-05-20), event guides 05-03..06-06, articles 05-03..08-06, spanish 05-03..05-14, swim all 05-05, advocacy 05-03..08-04.
  Nothing in any content family is dated after 2026-08-06.
- static: none (L55-62).
- comparisons: pillars `new Date()` on every request (L30-34) — 3 URLs show 2026-11-14; cities `updated_at` — 1,084 x 2026-07-06, 4 x 2026-08-10.
- blog: `blog_posts.updated_at ?? published_at` — 129 x 2026-07-16, 12 x 07-06, 1 x 08-10, 1 x 10-17. Index entry lastmod 2026-10-17T15:39:27Z.
- public-pools.xml: none (2,529 URLs, served by WEST :3100 pp-ssr, not fresh-web).
- index: only blog and listings entries carry lastmod (L250, L270).

### Why every listing says 2026-09-25

`sitemap-listings[.]xml.ts` L50: `lastmod: r.updated_at`. `synced_listings.updated_at` is stamped by a BEFORE UPDATE trigger
(`supabase/migrations/20260503181858_...sql` L52-54). `runListingSync` upserts every listing on every run with a new
`last_synced_at` (`src/server/listing-sync.server.ts` L185, L252-254), so `updated_at` of every row = time of the last sync that
reached the table. It does not mean the listing changed.
Live: all 126 `<lastmod>` = `2026-09-25T05:05:03.564Z`; index entry the same.
WEST doc `docs/OPS_RECORD_2026-09-25_seo-traffic-investigation.md` ("Fixes shipped", item 3): on 2026-09-25 EAST was patched so
`slug: listingSlug(a.title)` and "listing sync re-run via /api/public/hooks/sync-listings: 200 processed, 0 failed"
(backup dir stamped 20260925T050228Z). That run is the timestamp. (V: code + live value + doc)
No sync has written to those rows since (I, strong): the marketplace's own `/sitemap-recent-listings.xml` lists 130 listing ids,
the mirror 126; all 126 are among the 130; 4 are missing from the mirror.
Scheduler in the repo: pg_cron `sync-sharetribe-listings-hourly`, `15 * * * *`, POST to
`https://fresh-web.lovable.app/api/public/hooks/sync-listings` (`supabase/migrations/20260531043228_...sql`) — a Lovable host,
not EAST. Whether that job still exists / where it points / why it stopped: **U** (check `cron.job` and `listing_sync_log`).
The tombstone sweep only runs when the API returned rows (L279), so a failing sync leaves all rows published forever.

Repo drift that matters here (V): the committed `listing-sync.server.ts` L163 still builds
`slugify(`${a.title}-${listing.id.slice(0, 8)}`)`. Live sitemap slugs carry no id suffix (0 of 126). A deploy from the branch
as committed would, on the next sync, rewrite all slugs to the suffixed form and every listing URL in the sitemap would 301.

Disagreement with the brief: at ~23:25 UTC `/s`, `/login` and two `/l/...` URLs returned 200, `cf-cache-status: DYNAMIC`, real
H1/title, `index, follow`, self-canonical, and no "Maintenance mode" text in the HTML. Not reproduced from here (no JS executed).

---

## 6. /phoenix, /riverside and the 107 duplicates (Q5)

`/phoenix` and `/riverside` are hard-coded in `STATIC_URLS` (`sitemap-static[.]xml.ts` L24-25) and served by
`src/routes/phoenix.tsx` / `riverside.tsx` (static city landing pages built from `listingsNear()`); both 200 and self-canonical live.
`/p/riverside` is a separate `content_pages` page in the articles sitemap (200, self-canonical); `/p/phoenix` 301s to the host page.

Re-measured: 10,181 entries, 10,074 distinct, 107 in two files (matches the brief). No URL is repeated inside one file.

| count | pair | cause |
|---|---|---|
| 91 | articles + blog | same slug exists as a `content_pages` row (resource/other) and as a `blog_posts` row; each sitemap reads its own table. 81 of the 91 carry different lastmod days (e.g. articles 2026-05-03 vs blog 2026-07-16) |
| 8 | articles + static | `/p/about, /p/all-locations, /p/become-a-host, /p/become-a-swimming-pool-host, /p/howitworksforguests, /p/investors, /p/make-money, /p/privacy-policy` are in `STATIC_URLS` and are also content rows |
| 5 | academy + articles | only because of the frozen WEST academy file: `/p/cleanwatermanagementforpoolrentals, /p/fivestarguestcheckin, /p/insuranceandlegalessentialsforpoolhostscourse, /p/pool-rental-signage, /p/taxesforpoolhosts` |
| 1 | host-acquisition p4 + static | `/p/hosting` (host_acq_hub row + STATIC_URLS) |
| 1 | academy + static | `/p/host-training-academy` (also emitted by EAST's academy route) |
| 1 | articles + comparisons | `/p/swimply-alternative-vs-pool-rental-near-me` (PILLARS constant + content row) |

Other checks on the 7,416 `/p/` sitemap URLs (V): 0 contain `/p/p/`, 0 contain an upper-case letter, 0 end in `/`, all on
`https://www.poolrentalnearme.com`, 1 multi-segment (`/p/es/texas-leyes-alquiler-albercas`, valid route).
`public-pools.xml` is advertised twice: appended to the index by WEST and declared again in the static robots.txt.

Sitemap size over time (WEST docs + today): 10,152 distinct on 2026-09-01, 9,947 on 2026-09-02 (193 course redirects and 12
others removed), 10,074 today (+126 listings on 09-25). The sitemap did not shrink while the index fell 12,457 -> 8,228.

---

## 7. URL families fresh-web can generate beyond the sitemaps (Q6)

Route files under `src/routes` (111 non-admin/api paths counting the swimply pillar whose `createFileRoute(` call spans two
lines; 66 admin, 27 api). Public page routes:

| Route file | Pattern | Notes / live |
|---|---|---|
| index.tsx | / | in static sitemap |
| landing-page.tsx | /landing-page | 200, canonical `/` |
| phoenix.tsx, riverside.tsx | /phoenix, /riverside | in static sitemap |
| p.$slug.tsx | /p/{slug} | dispatcher: `content_pages` (status published/redirect, **no in_sitemap check**), then legacy_slugs alias 301, then bare-city -> `-{st}` 301, then `blog_posts`; mixed case 301 -> lower case; `null`/`details`/`mailto:*` 301 -> `/`; unknown `become-a-*-host-*` 301 -> /p/become-a-host; else 404 |
| p.$.tsx | /p/{a}/{b}/... | 301 to `/p/{last segment}`. Live: `/p/p/hosting` -> 301 `/p/hosting`; `/p/foo/hosting` -> 301 `/p/hosting` |
| p.es.$slug.tsx | /p/es/{slug} | content rows with slug `es/{slug}` |
| p.course.$slug.tsx | /p/course/{slug} | live 301 -> `/p/elearning-academy-{slug}` (nginx); still emitted as ItemList URLs in academy-hub JSON-LD (`p.$slug.tsx` L483) |
| p.pool-rentals-{$state}.tsx | /p/pool-rentals-{state} | 51 in static sitemap |
| p.giggster-vs-...-in-{$city}.tsx, p.peerspace-vs-...-in-{$city}.tsx | /p/{competitor}-vs-pool-rental-near-me-in-{city} | any slug in `cities`; 1,088 in sitemap |
| p.pool-pros*.tsx (4 files) | /p/pool-pros, /p/pool-pros/{provider}, /p/pool-pros/c/{cat}[/{st}[/{city}]] | all noindex; 1,357 URLs in orphan sitemap-directory.xml |
| static p.* routes in the static/comparison sitemaps | /p/hosting, /p/all-locations, /p/pool-rentals, /p/start-hosting, /p/pool-heating-cost-calculator, /p/ai-listing-generator, /p/waiver-generator, /p/host-marketing-playbook, /p/pool-rules-generator, /p/pool-wifi-guide, /p/pool-rental-host-fees-compared, /p/pool-rental-permits-by-state, /p/corpus-christi-pool-rental-laws, 3 comparison pillars | |
| static p.* routes in NO sitemap, 200 and indexable live | /p/about-our-company, /p/affiliate, /p/affiliate-program, /p/author/derek-bowen, /p/earnings-calculator, /p/jan, /p/neighbors, /p/la-saltwater-featured, /p/pool-party-rentals, /p/pool-rental-app, /p/private-pool-rental, /p/privacy-request | all self-canonical except privacy-request (no canonical) |
| other static p.* | /p/blog and /p/how-it-works (200; listed in articles sitemap as content rows), /p/free-host-tools (301 -> /p/pool-host-tools), /p/affiliate-dashboard (307), /p/dog (307 -> /admin/dashboard), /p/sharetribe (noindex), /p/lukes-lounge (404 live although the route file exists) | |
| l.$slug.$id.tsx | /l/{slug}/{id} | never reached on www (nginx sends /l/ to the marketplace) |
| blog.ts, blog.$.ts | /blog, /blog/{x} | 301 -> /p/blog, /p/{x} (live) |
| for-hosts.$ etc. (8 files) | /for-hosts/*, /for-guests/*, /guest-information/*, /host-information/*, /legal-and-compliance/*, /marketing-and-growth/*, /pool-management/*, /technical-support/* | 301 to /p/hosting, /p/how-it-works, /p/privacy-policy or `/` (`src/lib/legacy-redirects.ts`); `/for-hosts/x` -> 301 /p/hosting live |
| jobs[.]xml.ts | /jobs.xml | 937 job entries pointing at host_acq_city pages |
| auth*, account.learning, affiliate, unsubscribe*, verify.$uid, email/*, lovable/*, admin.* , api/* | utility | /auth 307s to itself with a query string |

Side observation (V): `/p/all-locations` (in the static sitemap) is 3,086,391 bytes of HTML with 10,041 anchors, 6,303 distinct:
3,679 host pages, 568 event guides, 444 Spanish host pages, 349 swim-instructor, 126 listings, 69 academy, 52 advocacy, 52 state hubs,
930 other `/p/` pages. It is the only hub that links most of the sitemap; it links none of the 1,088 city comparison pages (1 pillar only).

### Where /p/p/... can come from

1. **Relative hrefs in page bodies** (V mechanism, V one live instance). `ReactMarkdown` is used with no `a` override in
   `src/components/templates/generic-page.tsx` L98 and `resource-article.tsx` L132-137 (host-acq-city only overrides `h1`), and
   `rewriteHref` returns non-slash hrefs untouched (`src/lib/link-rewrite.ts` L86-87). A body link written `p/slug` on a page at
   `/p/x` resolves to `/p/p/slug`; `l/...` resolves to `/p/l/...`.
   Live: `/p/make-money` contains `<a href="l/draft/00000000-0000-0000-0000-000000000000/new/details">`, i.e. `/p/l/draft/.../new/details`
   -> splat -> `/p/details` -> 301 `/`. 13 other sampled pages had no relative href. How many bodies contain `](p/` or `href="p/`: **U** (needs SELECT).
2. **`url_path` stored as `/p/p/...`** would pass the sitemap prefix filter (`startsWith("/p/")`, `sitemap.ts` L188-192) and be emitted
   verbatim, and would be the page canonical (`p.$slug.tsx` L282). Not happening today: 0 `/p/p/` URLs in the live sitemaps. (V)
3. The redirect helper strips a leading `p/` (`content-pages.functions.ts` L109-111), so `redirect_to = 'p/foo'` is safe. (V)
4. The static WEST robots.txt has `Disallow: /p/p/` ("Block double-prefix junk") and `Disallow: /l/*/p/`, so Googlebot cannot fetch
   the 301 that `p.$.tsx` would give it; such URLs stay in "Blocked by robots.txt" instead of consolidating. (V for the rule and the 301; effect I)

---

## 8. The two scripts

- `scripts/sitemap-orphan-report.mjs`: reads `/sitemap.xml` recursively, BFS from `/` (depth 3, max 800 pages), then requests every
  sitemap URL with `redirect: "manual"` and writes `/mnt/documents/link-graph-report.csv`. It only knows what the index lists, so it
  cannot see orphan sitemap files, pages with in_sitemap=true that no route emits, or noindex/canonical mismatches. An 800-page BFS
  cannot reach most of 10k URLs, so its "orphan" column over-reports.
- `scripts/check-emitted-urls.mjs`: homepage links + sitemap URLs sampled down to 400 (`MAX_SITEMAP_URLS`, every ~26th URL of
  10,181, public-pools included), follows redirects, fails on 4xx/5xx or an unapproved redirect. Does not look at robots meta,
  canonical, or duplicates. Part of `verify:production`.
- Neither compares the database with the sitemap. Nothing in `scripts/` references `TEMPLATE_GROUPS`.

---

## 9. Commands used (representative)

```
curl -sS -A "$UA" -D - https://www.poolrentalnearme.com/sitemap.xml
curl -sS -A "$UA" https://www.poolrentalnearme.com/robots.txt
for p in sitemap-pages-cities.xml ... sitemap-index.xml; do curl -sS -A "$UA" -o - -w '%{http_code} %{content_type} %{redirect_url} %{size_download}' https://www.poolrentalnearme.com/$p; done
same loop against https://www.poolrentalnearme.co.uk (EAST view), .ca, .com.au, bare .co.uk
python3 (in memory, no files): fetch the 15 index children once each, count <url>/<loc>/<lastmod>, cross-file duplicates, path families
curl -sS -A "$UA" https://www.poolrentalnearme.com/fw-assets/__build.json
curl -sS -A "$UA" https://www.poolrentalnearme.com/jobs.xml | grep -o '<job>' | wc -l   -> 937
```
Total live requests: roughly 200, all GET.
