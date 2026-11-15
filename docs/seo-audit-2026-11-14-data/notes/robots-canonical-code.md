# Robots / canonical / noindex / redirect logic — fresh-web code vs live .com

Investigator scope: audit questions 3, 7, 9 (code side). READ-ONLY. No DB access was used
(this task did not grant it), so every "how many rows" question is listed as open.
Measured 2026-11-14 23:10–23:25 UTC. Live requests: curl, UA `Mozilla/5.0 (compatible; site-audit/1.0)`,
GET only, ~2.5 req/s max, about 135 requests in total (88 page probes, 7 robots.txt, 23 sitemap XML files, a dozen follow-ups).

Code read at `/home/user/fresh-web-702e04c3` (branch `claude/host-membership`, HEAD `7702845`, 2026-09-22).
History is grafted (one commit on this branch), so "what changed when" comes from diffing
snapshot branches, not from `git log`.

Legend: **[V]** verified (seen in a file or a response) · **[I]** inference · **[U]** unknown.

---

## 0. Things that disagree with the brief

1. **[V] robots.txt on www.poolrentalnearme.com is NOT produced by `src/routes/robots[.]txt.ts`.**
   It is a static file. Response headers: `content-type: text/plain` (no charset; the route sends
   `text/plain; charset=utf-8`), `last-modified: Sat, 08 Aug 2026 09:52:08 GMT`,
   `etag: W/"6a76fc48-68e"` (nginx static etag = hex mtime `0x6a76fc48` = 2026-08-08 09:52:08 UTC,
   hex size `0x68e` = 1678 bytes = the body I downloaded), no `X-Robots-Tag` (the route sends `all`).
   WEST's own doc says the same: `poolrentalnearme-web/docs/seo/patches-2026-09-01.md:147-153`
   ("WEST serves `/var/www/html/robots.txt` … The EAST version is reached only on non-www origins").
   The live text is in neither repo (grep for "Block aggressive scrapers", "Faceted search pagination",
   "Block double-prefix junk" over both repos: no hits). `poolrentalnearme-web/server/resources/robots.txt`
   is a third, different file (Sharetribe template: `Disallow: /s`, sitemap-index.xml) and is not what is served.
2. **[V] The marketplace was not showing "Maintenance mode" in the HTML I fetched.**
   23:14Z and 23:23Z: `/s` 200, title "Pool Rentals Near You — Book a Private Pool by the Hour",
   25 distinct `/l/` links in the server HTML; `/login` 200 "Log in | Pool Rental Near Me";
   a `/l/<slug>/<uuid>` from sitemap-listings.xml 200 with its real title and price in the meta description.
   `grep -ci 'maintenance'` on all of those bodies = 0. I did not execute JavaScript, so a
   client-rendered maintenance screen cannot be ruled out. [U] what Googlebot's renderer sees.

---

## 1. When is a content page noindex? When is it redirected? Which columns?

### 1a. noindex

**[V] No `content_pages` column can make a `/p/{slug}` page noindex. The dispatcher never emits a robots meta.**

- `src/integrations/supabase/types.ts:1343-1389` — `content_pages.Row` has 46 columns; none is `noindex`/`robots`.
- `src/routes/p.$slug.tsx:321-333` — the only `buildMeta()` call for content pages passes
  `title, description, path, canonicalPath, canonicalUrl, ogTitle, ogDescription, image, type, origin, hreflang`.
  `noindex` is not passed. `src/lib/seo.ts:128-130` only pushes `robots: noindex, nofollow` when `noindex` is truthy.
- `seo_overrides.noindex` exists (`types.ts:4370-4382`) but `grep -rn seo_overrides src` returns only `types.ts`: dead table, never read.
- `X-Robots-Tag: noindex, nofollow` is added by middleware only when `x-forwarded-host`/`host` ends in
  `.lovable.app`, `.lovable.dev`, `.lovableproject.com`, `.gptengineer.app` (`src/start.ts:44-57, 72-76`).
  Unknown/missing host = indexable (deliberate, comment at `start.ts:37-43`).
- Live: all 34 content-page responses that came back 200 with a canonical (the 12 sitemap samples in §6 plus 22 others on .com and the ccTLDs): 0 carried a noindex meta or an `X-Robots-Tag: noindex`.

**[V] What IS noindex in fresh-web (route-level, hard-coded):**

| Route | Evidence | Live |
|---|---|---|
| `/p/pool-pros` (+ any `?city=`) | `src/routes/p.pool-pros.tsx:19` | 200, `noindex, nofollow`, no canonical, 808,282 bytes |
| `/p/pool-pros/{slug}` | `p.pool-pros.$slug.tsx:26` | — |
| `/p/pool-pros/c/{cat}` | `p.pool-pros.c.$category.tsx:19` | 200, `noindex, nofollow` |
| `/p/pool-pros/c/{cat}/{st}` | `p.pool-pros.c.$category.$state.tsx:21` | — |
| `/p/pool-pros/c/{cat}/{st}/{city}` | `p.pool-pros.c.$category.$state.$city.tsx:22` | — |
| `/p/dog`, `/p/sharetribe`, `/p/affiliate-dashboard`, `/unsubscribe`, `/admin/*`, `/?preview=classic` | `p.dog.tsx:8`, `p.sharetribe.tsx:12`, `p.affiliate-dashboard.tsx:25`, `unsubscribe.tsx:15`, `index.tsx:93` | — |
| every sitemap XML | `src/lib/sitemap.ts:120` (`X-Robots-Tag: noindex`, correct for XML) | seen |

**[V] fresh-web manufactures noindex URLs and links to them from indexable pages:**

- `src/components/templates/host-acq-city.tsx:647` links every host_acq_city page to
  `/p/pool-pros?city=${encodeURIComponent(cityName)}` — a distinct URL per city name, each `noindex, nofollow`.
  Live: present on 10/10 sampled host-acq pages (`/p/pool-pros?city=Avon`, `…=Bonney%20Lake`, `…=Espa%20Ola`, …);
  `/p/pool-pros?city=Avon` → 200, `noindex, nofollow`, 808,282 bytes (byte-identical size to the unfiltered hub).
- City pages link to `/s?address=<City>%2C%20<ST>`: 5/10 sampled host-acq pages (link sits in the stored body:
  `<a href="/s?address=Avon%2C%20IN">Find private pools to rent by the hour near Avon →</a>`) and 3/3 sampled
  comparison city pages (`p.peerspace-…-in-{$city}.tsx:172`, `p.giggster-…-in-{$city}.tsx:410`). Also
  `templates/activity-city.tsx:49`, `templates/advocacy.tsx:91,364`.
  Live (WEST): `/s?address=Avon%2C%20IN` → 200, `X-Robots-Tag: noindex, follow` + meta `noindex, follow`,
  self-canonical. `/s?page=2` → same noindex. Bare `/s` → `index, follow`.
- `https://www.poolrentalnearme.com/sitemap-directory.xml` is still live (200, 1,357 `<loc>`), though it was dropped
  from the index on 2026-07-06 (`sitemap[.]xml.ts:148-149`). Every URL in it is in the noindex pool-pros tree:
  1 hub + 7 + 64 + 394 category/state/city pages + 891 pro pages. Route: `src/routes/sitemap-directory[.]xml.ts`.
  [U] whether it is still submitted in Search Console.

**[I] These three families are about the right size to be the 7,847 "Excluded by noindex tag":**
1,357 (pool-pros tree, measured) + up to 3,933 `/p/pool-pros?city=` (one per host-acq page, fewer after de-duplicating
city names) + `/s?address=` (one per city with the link) + WEST's own `/s?…` facets and paginations. Needs the GSC
example list to confirm; the families are verified, the split is not.

### 1b. Redirected instead of served (`/p/{slug}`), in evaluation order

All in `src/routes/p.$slug.tsx` `beforeLoad` and `src/server/content-pages.functions.ts::lookupContentPage`.

| # | Condition | Result | Evidence | Live |
|---|---|---|---|---|
| 1 | slug is `null`, `details`, or starts `mailto:` | 301 → `/` | `p.$slug.tsx:91-97` | `/p/null` 301 → `/`; `/p/details` 301 → `/` |
| 2 | slug has an uppercase letter | 301 → lowercase slug (no DB hit, target may 404) | `p.$slug.tsx:101-109` | `/p/Some-Slug` 301 → `/p/some-slug`; `/p/Become-A-…-Avon-IN` 301 → lowercase |
| 3 | a row with this `slug`, `url_path = /p/{slug}`, `status='redirect'` and non-empty `redirect_to` exists | 301 → `redirect_to` (**checked before the published row**) | `content-pages.functions.ts:142-151` | `/p/houston-tx` 301 → `/p/become-a-swimming-pool-host-houston-tx` |
| 4 | the chosen published row has `redirect_to` set and ≠ own slug | 301 → `redirect_to` | `:158-166` | — |
| 5 | no row; another published/redirect row lists the slug in `legacy_slugs[]` | 301 → that row's slug | `:172-181` | — |
| 6 | no row; slug = known prefix + bare city, and `cities.slug = city` has a `state_code`, and `{prefix}{city}-{st}` exists | 301 → state-suffixed slug | `:187-218` | did not fire for `…-host-avon` (went to #8) |
| 7 | no row; a published `blog_posts.slug` matches | served (synthetic `resource` page) | `:224-288` | — |
| 8 | still nothing, and slug starts `become-a-swimming-pool-host-` / `become-a-pool-host-` or is `host`/`hosts`/`become-a-pool-host` | **301 → `/p/become-a-host`** | `p.$slug.tsx:129-143` | `/p/become-a-swimming-pool-host-zzyzxville-qq` 301 → `/p/become-a-host`; `…-host-avon` same |
| 9 | still nothing | 404 | `p.$slug.tsx:144-145` | see §4 |

Other redirect producers: `/p/$` splat — any multi-segment `/p/a/b/...` → 301 `/p/{last segment}` without checking it
exists (`src/routes/p.$.tsx:15-31`); `/blog`, `/blog/*` → 301 `/p/…` (`blog.ts`, `blog.$.ts`); eight legacy help-centre
prefixes → 301 (`src/lib/legacy-redirects.ts:17-76`); comparison city routes → 301 when a redirect row exists
(`p.peerspace-…tsx:30-33`). Outside fresh-web (nginx, not in either repo): trailing slash → 301, `/p/course/*` → 301,
`/p/become-a-pool-host` → 301 `/p/become-a-swimming-pool-host`, apex → www, http → https.

### 1c. Columns that drive it (code + `types.ts:1343-1389`)

- **Serve / 404:** `slug` (lookup key), `status` (only `published` and `redirect` are looked up — `:137`;
  any other value, e.g. `pending`/`scraped`/`drafted`/`migrated`, means 404 or rule 8's 301), `priority` (tie-break among
  rows sharing a slug, `:138`), `url_path` (prefers the row whose `url_path = /p/{slug}`, `:153-155`).
- **Redirect:** `status='redirect'` + `redirect_to` + `url_path`; `redirect_to` on a published row; `legacy_slugs`.
- **Canonical:** `url_path`, `slug`, `canonical_override`.
- **hreflang:** `hreflang_group`, `locale`.
- **Sitemap only (never affects serving):** `in_sitemap`, `template_type`, `content_refreshed_at`, `created_at`, `hero_image_url`.
- **Not used for indexability at all:** `sitemap_source`, `schema_type`, `focus_keyword`, `gsc_*`.
- `types.ts` is behind the database: WEST's `docs/OPS_RECORD_2026-09-18_pseo-live-inventory.md:172` reports an
  `is_published` column that is false on all 4,008 host-acq rows; it is not in `types.ts` and the loader ignores it.

### 1d. **[V] code / [U] impact — a failed database read is answered as 404 or 301, never 5xx**

`content-pages.functions.ts:133-141`:
```ts
const { data: rows } = await (supabaseAdmin as any).from("content_pages").select("*")
  .eq("slug", slug).in("status", ["published", "redirect"]).order("priority", { ascending: false }).limit(5);
const list = (rows ?? []) as ContentPage[];
```
`error` is never read (same at `:172-177`, `:198-203`, `:207-212`, `:224-231`). supabase-js returns `{data:null, error}`
on a timeout/5xx/network failure rather than throwing (client built with defaults, `client.server.ts:22-28`). So any
transient Supabase failure falls through to `not_found` → rule 9 (HTTP 404) or, for the 3,678 URLs whose slug starts
`become-a-swimming-pool-host-`, rule 8 (HTTP **301 → /p/become-a-host**). Cloudflare then caches that answer for 600 s
(cache rule in `poolrentalnearme-web/docs/OPS_RECORD_2026-09-16_edge-cache-db-protection.md:5-16`: `/p/*`, edge TTL
override 600 s). **[V]** the edge does cache these answers: two requests 1.2 s apart to a fresh made-up slug gave
`404 cf-cache-status: MISS` then `404 age: 1 cf-cache-status: HIT`; the same for a made-up
`/p/become-a-swimming-pool-host-…` slug: `301 location: /p/become-a-host MISS` then `301 … age: 1 HIT`.
Transient Supabase failures are documented in this codebase: `sitemap[.]xml.ts:93-103` ("6 of ~3,600 counts in the 28h
after 2026-09-15 failed twice in a row"), `content-404-log.functions.ts:26` and `home-data.functions.ts:400-402`
("the 2026-09-16 Supabase freeze"). [U] how many Googlebot fetches hit this; the 2026-09-25 WEST log review counted 5xx
and 404 for Googlebot but not 301s to `/p/become-a-host`. **[V]** it was not happening during the separate full crawl
(23:08–23:28Z): 0 of 3,933 host-acq sitemap URLs returned 301 or 404.

---

## 2. How the canonical is built

`p.$slug.tsx:282`: `canonicalPath = p.url_path || "/p/" + (p.slug ?? params.slug)`.
`p.$slug.tsx:326`: `canonicalUrl: canonical_override?.trim() || undefined`.
`seo.ts:96-97`: `canonicalUrl = canonicalUrlOverride ?? siteOrigin + (canonicalPath ?? path)`, `siteOrigin = origin ?? SITE_URL`.
`origin` = `getRouteOrigin()` → `getCanonicalOrigin(request)` (`src/server/canonical.server.ts:39-72`):
`https://` + `X-Forwarded-Host` (unless it contains `lovable.app`) → else `PUBLIC_SITE_ORIGIN` → else `https://www.poolrentalnearme.com`.
The root route strips its own canonical so there is exactly one per page (`__root.tsx:89-93`).

### Host used — measured

| Request | Canonical |
|---|---|
| `https://www.poolrentalnearme.com/p/rent-out-your-pool-uk` | `https://www.poolrentalnearme.com/p/rent-out-your-pool-uk` |
| `https://www.poolrentalnearme.co.uk/p/rent-out-your-pool-uk` | `https://www.poolrentalnearme.co.uk/p/rent-out-your-pool-uk` |
| `https://poolrentalnearme.co.uk/p/rent-out-your-pool-uk` (no www) | `https://poolrentalnearme.co.uk/p/rent-out-your-pool-uk` |
| `https://www.poolrentalnearme.ca/p/rent-out-your-pool-canada` | `https://www.poolrentalnearme.ca/…` |
| `https://www.poolrentalnearme.com.au/p/rent-out-your-pool-australia` | `https://www.poolrentalnearme.com.au/…` |
| `https://www.poolrentalnearme.com/p/hosting-uk` | **`https://poolrentalnearme.co.uk/p/hosting-uk`** (cross-domain, bare host) |
| `https://www.poolrentalnearme.co.uk/p/hosting-uk` and `https://poolrentalnearme.co.uk/p/hosting-uk` | `https://poolrentalnearme.co.uk/p/hosting-uk` on both |
| `https://www.poolrentalnearme.com/p/pool-rental-manchester` | `https://poolrentalnearme.co.uk/p/pool-rental-manchester` |
| `https://www.poolrentalnearme.co.uk/p/become-a-swimming-pool-host-avon-in` (a US page) | `https://www.poolrentalnearme.co.uk/p/become-a-swimming-pool-host-avon-in` (self, on the ccTLD) |
| `https://www.poolrentalnearme.co.uk/p/peerspace-vs-pool-rental-near-me-in-chesapeake` | `https://www.poolrentalnearme.com/…` (comparison pages hard-code `SITE_URL`, `comparison-page.tsx:178,199`) |
| `.com` request with a forged `X-Forwarded-Host: www.poolrentalnearme.co.uk` (cache-busted URL) | `https://www.poolrentalnearme.com/p/hosting` — the client header is not honoured |

So: **[V]** by default content pages self-canonicalise on whatever host served them; www and bare ccTLD are two
different canonical origins (both answer 200, neither redirects to the other); comparison/state-hub/course pages always
canonicalise to .com; and a row with an absolute `canonical_override` emits that URL on every host (the only code
path that can produce a cross-host canonical for a content page — `p.$slug.tsx:326`, `seo.ts:97`).

### Can the canonical point at a different page than the one requested?

| Case | Status | Evidence |
|---|---|---|
| Query string stripped | [V] | `/p/…-avon-in?utm_source=x&page=2` → canonical without query |
| `canonical_override` (absolute URL, wins over everything) | [V] code + live: **57 URLs in the .com sitemap** canonicalise to the bare ccTLD (19 each to `poolrentalnearme.co.uk`, `.ca`, `.com.au`, same path) | `p.$slug.tsx:319,326`; `seo.ts:97`; full-crawl output `scratchpad/seo/crawl.jsonl` (rows with `canonical != url`: 57, all from `sitemap-pages-articles.xml`); 2 of them re-fetched by me |
| Row's `url_path` ≠ `/p/{slug}` (nested legacy path, or the fallback row at `content-pages.functions.ts:154-155`) → canonical = that `url_path`; if it is `/p/a/b` the canonical target itself 301s back to `/p/b` | [V] code, [U] rows | `p.$slug.tsx:279-282`; `p.$.tsx:15-31` |
| Comparison city page reached by an alternate city spelling | [V] live | `/p/peerspace-vs-pool-rental-near-me-in-chesapeake-va` → 200, canonical `…-in-chesapeake` (`resolveCityRow` accepts `{slug}-{st}` and name+state, `cities.functions.ts:52-98`; canonical built from `city.slug`, route line 41) |
| State hub reached with other casing | [V] live | `/p/pool-rentals-Texas` → 200, canonical `/p/pool-rentals-texas` (no 301; `p.pool-rentals-{$state}.tsx:39-44`) |
| Parent page / city hub / "primary" variant | [V] none | no code path canonicalises a content page to a parent or hub |
| Spanish/English pair | [V] | hreflang only, each self-canonical; reciprocal tags present on the Austin EN/ES pair |

### Can the sitemap list a URL that canonicalises elsewhere, redirects, or is noindex?

Sitemap filter (`src/lib/sitemap.ts:167-181`): `template_type IN (…)`, `in_sitemap = true`, `status = 'published'`,
`redirect_to IS NULL`, `slug IS NOT NULL`, `slug NOT LIKE 'pool-rentals-%'`; then keeps rows whose `url_path` starts
`/p/` (`:188-192`) and emits `SITE_URL + url_path` (`:198-201`).

- **[V] code + measured** It never looks at `canonical_override` → a page with an override is still listed.
  The separate full crawl of all 10,074 sitemap URLs (`scratchpad/seo/crawl.jsonl`, finished 23:28Z; I only read it)
  has 57 URLs that answer 200 with a canonical on another domain, all in `sitemap-pages-articles.xml`.
  **7 of those 57 canonical targets are disallowed by the ccTLD's own robots.txt**, so the page points Google at a URL
  Google may not fetch: `poolrentalnearme.co.uk/p/pool-rental-manchester`, `…/pool-rental-london`,
  `…/uk-cities-with-pools`, `poolrentalnearme.com.au/p/pool-rental-melbourne`, `…/pool-rental-sydney`,
  `poolrentalnearme.ca/p/pool-rental-toronto`, `…/pool-rental-vancouver` (none matches an `Allow:` line in §3).
  The same crawl: 10,072 × 200, 2 × 301 (`/p/ultimate_pool_party_music_and_sound_system_guide` in the articles sitemap
  → hyphenated slug; `/p/opening-pool-for-summer` in the blog sitemap → `/p/opening-a-pool`), 1 noindex (next bullet).
- **[V] code** It emits `url_path`, the page is looked up by `slug`. A nested `url_path` would be listed and 301.
  **[V] measured:** 0 multi-segment, 0 uppercase, 0 trailing-slash URLs among the 5,467 URLs (5,466 distinct) in the six
  sitemap files I downloaded (host-acquisition ×4, comparisons, articles).
- **[V] code** A published row is listed even when a separate `status='redirect'` row with the same slug shadows it
  (rule 3 above wins at request time). [U] row count; the 2026-09-01 crawl found 14 sitemap URLs that redirected
  (`sitemap.ts:173`).
- **[V] measured** No content page can be noindex through a column, but a hard-coded route can shadow a row:
  `https://www.poolrentalnearme.com/p/pool-pros` is listed in `sitemap-pages-articles.xml` (a `content_pages` row with
  that slug is `in_sitemap`) while the request is answered by `src/routes/p.pool-pros.tsx` with `noindex, nofollow`.
  It is the only noindex URL among the 10,074. Separately the orphaned `/sitemap-directory.xml` (§1a) lists 1,357
  URLs, all noindex.
- **[V] measured** `sitemap-country.xml` has no `status`/`redirect_to` filter (`sitemap-country[.]xml.ts:41-47`).
- **[V] measured** Country pages are advertised on two domains: `.com/sitemap-pages-articles.xml` (59 of its 443 URLs
  match the country patterns, plus 7 that do not) and the three ccTLD `sitemap-country.xml` files (19 + 20 + 20 = 59).
  Two different behaviours: the 9 `country_launch` pages (3 hubs + 6 cities, `rent-out-your-pool-*`) are
  self-canonical on every host — three indexable copies each (.com, www.ccTLD, bare ccTLD), no hreflang; the other 57
  carry an override to the bare ccTLD on every host. The ccTLD sitemap fetched on the `www.` host lists `www.` URLs
  whose canonical is the bare host.

### Duplicate-by-design pages that each self-canonicalise (feeds "Duplicate, Google chose different canonical")

Measured on the live host-acquisition sitemap (all 4 pages, 3,933 URLs, 3,933 distinct):

| Family | Count |
|---|---|
| `become-a-swimming-pool-host-{city}-{st}` | 3,655 |
| `become-a-swimming-pool-host-{bare city}` | 23 |
| `{city}-{st}` with no prefix (e.g. `/p/austin-tx`) | 168 |
| other | 87 |

- **[V]** 139 of the 168 un-prefixed `/p/{city}-{st}` pages have a `become-a-swimming-pool-host-{city}-{st}` twin in the
  same sitemap. Both 200, both self-canonical, same template, same H1. Example: `/p/cedar-park-tx` (title "Pool Rental
  Cedar Park, TX | Private Backyard Pools by Hour") and `/p/become-a-swimming-pool-host-cedar-park-tx` both have
  H1 "Rent your Cedar Park pool by the hour. 0% host fees. Keep 100%."; 5-word-shingle Jaccard 0.25.
  Meanwhile `/p/houston-tx` and `/p/dallas-tx` 301 to their host page — the family is half-consolidated.
- **[V]** 14 of the 23 bare-city slugs have a state-suffixed twin also listed (`…-host-plano` + `…-host-plano-tx`,
  also new-haven, lawrence, mesquite, montgomery, springfield, buffalo, hartford, lewisville, independence, cambridge,
  erie, pasadena, huntsville).
- **[V]** Comparison city pages are templated near-duplicates: four sampled Peerspace city pages each have exactly 882
  words in `<main>`, pairwise 5-shingle Jaccard 0.66 (79% of one page's shingles are in the other); two Giggster city
  pages have 1,829 words each, Jaccard 0.73 (84%). The sitemap lists 1,088 of them (544 cities × 2) plus 3 pillars.
  Host-acq city pages by contrast: Jaccard 0.19–0.25 between cities.
- **[V]** Malformed slugs in the sitemap: `become-a-swimming-pool-host--ofallon-mo` (double hyphen, H1 "Rent your
  Ofallon pool"), `become-a-swimming-pool-host-espa-ola-nm` (Española, H1 "Rent your Espa Ola pool").

**[I]** 1,088 near-identical comparison pages + 153 twin city pages + 9 triple-hosted launch pages are the code-side
candidates for the 2,987 "Duplicate, Google chose different canonical than user" and part of the 2,856 "Crawled —
currently not indexed". Mapping to GSC needs the example lists.

---

## 3. robots.txt

### What the code returns (`src/routes/robots[.]txt.ts`)

Host = `new URL(request.url).hostname` (line 53), i.e. the Host header EAST receives (`serve.mjs:52`).

| Host | Body | `X-Robots-Tag` | Lines |
|---|---|---|---|
| `poolrentalnearme.com`, `www.` | `User-agent: * / Allow: /`; Disallow `/admin/ /account/ /auth/ /inbox/ /listings /profile-settings /verify/ /u/ /api/sharetribe/ /api/public/track-city-click`; `Allow: /s$`, `Allow: /s`, `Disallow: /s?`; `Sitemap: https://www.poolrentalnearme.com/sitemap.xml` | `all` | 59, 63-92 |
| `.com.au` (± www) | `Disallow: /` + Allow `/p/*-australia$`, `/p/australian-*`, `/p/rent-out-your-pool-sydney$`, `…-melbourne$`; `Sitemap: https://{host}/sitemap-country.xml` | `all` | 18-26, 93-102 |
| `.co.uk` (± www) | `Disallow: /` + Allow `/p/*-uk$`, `/p/*-united-kingdom$`, `…-london$`, `…-manchester$` | `all` | 27-35 |
| `.ca` (± www) | `Disallow: /` + Allow `/p/*-canada$`, `/p/canadian-*`, `…-toronto$`, `…-vancouver$` | `all` | 36-44 |
| anything else | `Disallow: /` | `noindex, nofollow` | 103-106, 113 |

No AI-bot groups, no `CCBot`, no `/host/preview/`, no `/s?*&page=`, no `Crawl-Delay`, no `/public-pools.xml` anywhere in this file.

### Live

- **ccTLDs match the code exactly** [V] — six hosts fetched (www + bare × 3), body identical to the template,
  `content-type: text/plain; charset=utf-8`, `x-robots-tag: all`, `cache-control: public, max-age=3600`.
- **.com does not match the code** [V] — see §0.1. Live `.com` body (1,678 bytes), `*` group:
  `Allow: /`; Disallow `/profile-settings /l/new /l/*/checkout /l/*/draft /l/*/pending-approval /l/*/new /l/*/edit /inbox
  /order /sale /listings /account /reset-password /verify-email /preview /admin /auth /api/ /p/p/ /l/*/p/`;
  `Crawl-Delay: 5`; `Disallow: /s?*&page=`; two `Sitemap:` lines (`/sitemap.xml`, `/public-pools.xml`).
  Before it: MJ12bot, AhrefsBot, Bytespider, Baiduspider, Yandex `Disallow: /`; SemrushBot, GPTBot, OAI-SearchBot,
  ChatGPT-User, PerplexityBot, Perplexity-User, ClaudeBot, Claude-User, Google-Extended, Applebot-Extended `Allow: /`.
  After the Sitemap lines: `User-agent: Claude-SearchBot / Allow: /` and `User-agent: CCBot / Allow: / / Disallow: /host/preview/`.
- `https://poolrentalnearme.com/robots.txt` → 301 → www.

### Differences that matter

| Path | Code (if it ever served .com) | Live .com | Consequence |
|---|---|---|---|
| `/s?…` | `Disallow: /s?` — all blocked | only `/s?*&page=` blocked | Live lets Google fetch `/s?address=…` and see its noindex. If the static file is ever removed, the code version blocks all of them → they can no longer be seen as noindex ("Indexed though blocked by robots.txt"). |
| `/s?page=N` | blocked | **not** blocked (pattern needs `&page=`, i.e. page as a 2nd+ parameter) | `/s` links to `/s?page=2`, `/s?page=6`; live `/s?page=2` is 200 noindex. Harmless but the rule does not do what its comment says for un-faceted pagination. |
| `/u/` | blocked | not blocked | — |
| `/p/p/` | not blocked | blocked | Live: `/p/p/anything` 301s to `/p/anything`; Google cannot see that 301, so these stay "Blocked by robots.txt". |
| `/l/*/p/`, `/order`, `/sale`, `/preview`, `/reset-password`, `/verify-email` | not blocked | blocked | — |
| `/api/` | only two sub-paths | all | — |
| `/host/preview/` | absent | present but **inside the `CCBot` group** → applies to CCBot only | Not blocked for Googlebot. `/host/preview/start` → 200, empty `<title>`, no robots meta, no `X-Robots-Tag` in the server HTML (`poolrentalnearme-web/src/routing/routeConfiguration.js:311-321` says it is meant to be disallowed and noindex). Linked from nowhere per that comment; low impact. |
| `Crawl-Delay: 5` | absent | present | Google ignores it; Bing honours it. |
| Second sitemap `/public-pools.xml` | absent | present | — |

`Disallow: /s?*&page=` sits after `Crawl-Delay` and a comment block but before any new `User-agent` line, so it belongs to
the `*` group (blank lines do not end a group for Google). The `Disallow: /host/preview/` is the only rule in the file
that is in the wrong group.

---

## 4. Unknown slugs and URL variants (live)

| URL | Status | Location / served by | Robots | Canonical | Body |
|---|---|---|---|---|---|
| `/p/zz-audit-nonexistent-slug-7f3a91` | **404** | EAST | none (no meta, no header) | none | 34,966 B, H1 "Page not found", `<title>` is the site default "Pool Rental Near Me - Starting at $25 hour - Rent a pool now" |
| `/p/qx-no-such-page-20261114` | **404** | EAST | none | none | 34,950 B, same |
| `/p/become-a-swimming-pool-host-zzyzxville-qq` | **301** | → `/p/become-a-host` (200) | — | — | rule 8: any made-up slug with this prefix redirects |
| `/p/p/anything` | 301 | → `/p/anything` (then 404) | — | — | robots-blocked on .com |
| `/p/p/become-a-swimming-pool-host-avon-in` | 301 | → `/p/become-a-swimming-pool-host-avon-in` | — | — | robots-blocked on .com |
| `/P/Some-Slug` (capital P) | **404** | WEST marketplace, not EAST | `X-Robots-Tag: noindex, follow` + meta `noindex, nofollow` | self (`/P/Some-Slug`) | 62,019 B, "Sorry, we couldn't find that page." |
| `/P/become-a-swimming-pool-host-avon-in` | 404 | WEST marketplace | same | self | a real page is unreachable under `/P/` |
| `/p/Some-Slug` | 301 | → `/p/some-slug` (then 404) | — | — | 2 hops to a 404 |
| `/p/Become-A-Swimming-Pool-Host-Avon-IN` | 301 | → lowercase (200) | — | — | 1 hop |
| `/p/become-a-swimming-pool-host-avon-in/` | 301 | → same without slash, absolute URL, nginx body "301 Moved Permanently" | — | — | 1 hop |
| `/p/giggster-vs-pool-rental-near-me/` | 301 | → without slash | — | — | 1 hop |
| `/p/foo/become-a-swimming-pool-host-avon-in` | 301 | → `/p/become-a-swimming-pool-host-avon-in` | — | — | splat |
| `/p/foo/zz-audit-nonexistent-slug-7f3a91` | 301 | → `/p/zz-…` (then 404) | — | — | redirect to a 404 |
| `/p/` | 307 | → `/p` | — | — | **loop**: `/p` → 301 → `/p/` (nginx) → 307 → `/p` …; `curl -L --max-redirs 6` ends "Maximum (6) redirects followed" |
| `/p/peerspace-vs-pool-rental-near-me-in-zzyzxville` | 404 | EAST | none | none | "City not found" |
| `/p/peerspace-vs-pool-rental-near-me-in-Chesapeake` | 404 | EAST | none | none | no lowercase rule on this route |
| `/p/pool-rentals-tx` | 404 | EAST | none | none | "State not found" |
| `/p/course/zz-audit-nonexistent` | 404 | EAST | none | none | "Course not found" |
| `/p/es/zz-audit-nonexistent` | 404 | EAST | none | none | "Página no encontrada" |
| `http://poolrentalnearme.com/p/hosting/` | 301 | → `https://poolrentalnearme.com/p/hosting/` → `https://www…/p/hosting/` → `https://www…/p/hosting` | — | — | 3 hops (first hop measured, the next two measured separately) |

404s are real 404s (not soft). All of these responses were `cf-cache-status: MISS`/`EXPIRED` on `/p/*`, i.e. cacheable at the edge.

---

## 5. Code paths that produce redirects in bulk (GSC: 3,432 "Page with redirect")

| # | Path | Size | Status |
|---|---|---|---|
| 1 | Rule 8: any missing `become-a-swimming-pool-host-*` / `become-a-pool-host-*` slug → 301 `/p/become-a-host` (`p.$slug.tsx:129-143`). Unbounded: it also catches every host-acq page that is unpublished, renamed, or whose DB read fails (§1d). | 501 distinct URLs logged by 2026-08-19 (code comment); 3,678 live slugs carry the prefix | [V] code + live; [U] current count |
| 2 | `status='redirect'` rows / `redirect_to` (`content-pages.functions.ts:142-166`), incl. `/p/{city}-{st}` → host page | WEST doc 2026-09-25: 93 city redirects (77 to host-acq pages) | [V] code + live sample; [U] row count |
| 3 | `legacy_slugs[]` aliases, bulk-appended by the alias backfill from the 404 log, up to 2,000 per run (`src/server/alias-backfill.server.ts:163-178`) | [U] | [V] code |
| 4 | `/p/$` splat for every nested `/p/a/b` (`p.$.tsx`) | [U] — depends on how many old nested Sharetribe URLs Google holds; `/p/p/*` variants are robots-blocked instead | [V] code + live |
| 5 | Uppercase → lowercase (`p.$slug.tsx:101-109`) | [U] | [V] |
| 6 | `/p/course/{slug}` → nginx 301 → `/p/elearning-academy-*` | 193 (`poolrentalnearme-web/docs/seo/sitemap-redirect-sources-2026-09-01.txt`); live sample 301 in one hop | [V] |
| 7 | Trailing slash, apex → www, http → https (nginx/Cloudflare) | one variant per indexed URL if Google knows it; a Domain property counts all of them | [V] live; [U] count |
| 8 | Bare-city → state-suffixed (`content-pages.functions.ts:187-218`) | [U]; did not fire in my one test | [V] code |
| 9 | `/blog/*`, eight legacy help-centre prefixes (`legacy-redirects.ts`) | 25 mapped paths + prefix fallbacks | [V] code + live (`/blog/some-post` 301, `/for-hosts/…` 301) |
| 10 | Comparison city slugs with a redirect row (`p.peerspace-…tsx:30-33`) | [U] | [V] code |
| 11 | ccTLD roots 302 → country hub; ccTLD `/s` 302 → .com | 6 hosts | [V] live |

No language-prefix redirect exists (`/p/es/{slug}` is a real route). No city-rename table exists other than #2/#3.
Diff `origin/ops/east-production-snapshot-2026-09-11..HEAD` on `p.$slug.tsx`, `content-pages.functions.ts`, `seo.ts`,
`robots[.]txt.ts`, `start.ts`, `canonical.server.ts`: the only redirect change is rule 8's target
(`https://www.poolrentalnearme.com/become-a-host`, a 404, → `/p/become-a-host`). No canonical/noindex logic changed in
that window, so the Sep 21 drop was not caused by a canonical or robots code change in this repo. [U] what was deployed
around Oct 19 — the repo has no snapshot between 2026-09-22 and `main` (2026-10-17, declared not production).

---

## 6. The 12 sitemap URLs

Six from `sitemap-pages-host-acquisition.xml` (positions 0, 166, 333, 500, 666, 999 of 1,000) and six from
`sitemap-pages-comparisons.xml` (positions 0, 181, 363, 545, 727, 1090 of 1,091).

| # | Path | Status | Canonical | Robots meta | X-Robots-Tag |
|---|---|---|---|---|---|
| 1 | `/p/austin-tx` | 200 | self | none | none |
| 2 | `/p/become-a-swimming-pool-host-avon-in` | 200 | self | none | none |
| 3 | `/p/become-a-swimming-pool-host-bonney-lake-wa` | 200 | self | none | none |
| 4 | `/p/become-a-swimming-pool-host-carpentersville-il` | 200 | self | none | none |
| 5 | `/p/become-a-swimming-pool-host-colonial-heights-va` | 200 | self | none | none |
| 6 | `/p/become-a-swimming-pool-host-espa-ola-nm` | 200 | self | none | none |
| 7 | `/p/giggster-vs-pool-rental-near-me` | 200 | self | `index,follow` | none |
| 8 | `/p/peerspace-vs-pool-rental-near-me-in-chesapeake` | 200 | self | `index,follow` | none |
| 9 | `/p/peerspace-vs-pool-rental-near-me-in-fresno-ca` | 200 | self | `index,follow` | none |
| 10 | `/p/giggster-vs-pool-rental-near-me-in-lancaster-tx` | 200 | self | `index,follow` | none |
| 11 | `/p/peerspace-vs-pool-rental-near-me-in-newark` | 200 | self | `index,follow` | none |
| 12 | `/p/peerspace-vs-pool-rental-near-me-in-york-pa` | 200 | self | `index,follow` | none |

"self" = `https://www.poolrentalnearme.com` + the path, exactly one `<link rel="canonical">` per page. All 12 are
indexable as far as status, canonical and robots signals go. Notes: #1's title is renter-intent ("Pool Rental Austin,
TX | Private Backyard Pools by the Hour") over a host-recruiting H1; #6's H1 reads "Espa Ola"; both sitemaps answered
with `x-robots-tag: noindex` (correct for XML) and 0 duplicates.

---

## 7. Commands (representative)

```
UA="Mozilla/5.0 (compatible; site-audit/1.0)"
curl -sS -A "$UA" -D robots.com.hdr -o robots.com.txt https://www.poolrentalnearme.com/robots.txt
curl -sS -A "$UA" -D - -o robots.$h.txt https://$h/robots.txt          # six ccTLD hosts + apex
curl -sS -A "$UA" -o sm-ha.xml  https://www.poolrentalnearme.com/sitemap-pages-host-acquisition.xml   (+ ?page=2,3,4)
curl -sS -A "$UA" -o sm-cmp.xml https://www.poolrentalnearme.com/sitemap-pages-comparisons.xml
python3 -I rc-tools/probe.py <outdir>   # per URL: curl -sS -A "$UA" -m 40 --compressed -D hdr -o body; prints status,
                                        # Location, X-Robots-Tag, canonical(s), robots meta, title, h1, size; sleeps 0.4 s
curl -sS -A "$UA" -o /dev/null -L --max-redirs 6 -w "%{http_code} %{num_redirects}" https://www.poolrentalnearme.com/p/
curl -sS -A "$UA" -H "X-Forwarded-Host: www.poolrentalnearme.co.uk" "https://www.poolrentalnearme.com/p/hosting?auditcb=rc20261114a"
```
Raw headers/bodies and the probe script were temporary and were deleted after the numbers above were re-checked
(this notes file is the only file kept). Every figure here can be reproduced with the commands above.

---

## 8. Open questions (need the database, GSC exports or the servers)

1. Rows where `canonical_override IS NOT NULL` — the crawl shows 57 in sitemaps; are there others outside the sitemaps, and was the override to the bare ccTLD deliberate (7 targets are robots-blocked there)?
2. Rows where `url_path <> '/p/' || slug` among published + in_sitemap rows.
3. Slugs that have both a `published` row and a `status='redirect'` row with `url_path = '/p/'||slug` (live page shadowed by a redirect).
4. `updated_at` histogram of `content_pages.status` / `in_sitemap` / `redirect_to` changes around 2026-09-18…21 and 2026-10-16…19.
5. (answered) Full crawl 23:08–23:28Z: 0 of the 3,933 host-acq sitemap URLs answered 301 or 404, so the failed-read path in §1d was not firing during that window. Still open: how often it fired for Googlebot historically (needs WEST/EAST access logs: count of 301s to `/p/become-a-host` and of 404s on slugs that exist).
6. GSC example lists for "Excluded by noindex" and "Page with redirect": share that is `/s?…`, `/p/pool-pros…`, `/public-pools/…`, `/l/…`.
7. Is `/sitemap-directory.xml` (or any `sm-74buq58v*`, `sitemap-index.xml`) still submitted in Search Console?
8. Which box and path serve the static `.com` robots.txt today, and who edits it (it is in no repo).
9. Does the rendered (JavaScript) version of `/s` and `/l/…` show "Maintenance mode" to Googlebot?
10. Is the GSC property a Domain property (then http/apex/ccTLD variants all count toward "Page with redirect")?
