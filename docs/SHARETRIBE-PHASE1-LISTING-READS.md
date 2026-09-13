# Phase 1 — listing reads off Sharetribe

Strangler slice. Reads only. Reversible with one env var.

Nothing here writes to Sharetribe or Supabase, and no Sharetribe code was
deleted — both paths stay live and are selected at runtime.

---

## The flag

```
PRNM_LISTING_READ_SOURCE = sharetribe | mirror | shadow      # default: sharetribe
```

| Value | Behaviour |
|---|---|
| `sharetribe` | **Default, and exactly today's production path.** Delegates to the untouched `searchListings`, including its pre-existing implicit mirror use for city/state queries. An unset, empty, or misspelled value resolves here — a typo must never silently move production onto the mirror. |
| `mirror` | Supabase answers every listing read. A query the mirror cannot express (`origin`, `bounds`, `keywords`) falls back to Sharetribe and logs why, rather than quietly returning a different result set. |
| `shadow` | Sharetribe stays authoritative and its answer is what callers get. The mirror is computed alongside and structurally diffed. Divergence is measured against real traffic at zero risk. |

Resolution is case-insensitive and trims whitespace, because this gets
hand-edited into pm2 env files. To roll back: unset it (or set `sharetribe`) and
restart — `sudo -u ubuntu PM2_HOME=/home/ubuntu/.pm2 pm2 restart fresh-web`.

## Files

| File | Role |
|---|---|
| `src/lib/listing-read-source.ts` | Flag resolution + which query options the mirror can express. Pure. |
| `src/lib/listing-parity.ts` | Structural diff engine. Pure — no network, no DB, no clock. |
| `src/lib/listing-parity.test.ts` | 75 deterministic tests. `bun test` |
| `src/server/listing-read.server.ts` | The facade. Picks a source, logs, diffs in shadow mode. |
| `src/server/sharetribe.server.ts` | Split the two paths into `searchListingsFromSharetribe` / `searchListingsFromMirror`, added `fetchListingFromMirror`. `searchListings` behaviour unchanged. |
| `src/server/sharetribe.functions.ts` | `getListing` / `queryListings` now go through the facade. |
| `src/server/home-data.functions.ts` | Homepage featured + nearby go through the facade. |
| `scripts/listing-parity-report.ts` | Runnable harness. `bun run parity:listings` |

`fetchShareListing` is **not** migrated. It reads `publicData` keys
(`guestallowed`, `pool_type`, `water_type`, `poolsize`, `pool_depth`,
`advantagesSelection`, `houseRules`, `poolAmenities`) plus per-amenity prices and
a different image variant set than the mirror's summary shape carries. It stays
on Sharetribe until Phase 2 widens the mirror read.

---

## Which mirror

There are **two** listing mirror tables. The audit named `st_listings`; the one
that matters for public reads is `synced_listings`.

| | `st_listings` | `synced_listings` |
|---|---|---|
| Written by | `src/server/sharetribe-mirror.server.ts` | `src/server/listing-sync.server.ts` |
| Refresh | every 15 min, `/api/public/hooks/sync-sharetribe-mirror` | `runListingSync()` |
| Cursor | `createdAtStart` from `st_sync_state` | none — full re-page every run |
| **Picks up edits to existing listings** | **No** | **Yes** |
| Image URLs | **none** — only `photos_count` | `image_urls[]`, `primary_image_url` |
| `slug` | no | yes |
| `address`, `city_slug`, `state_code` | `city`/`region`/`country` only | yes |
| `amenities`, `capacity`, `category` | inside `public_data` only | promoted to columns |
| `metadata` | no column | yes |
| `is_deleted` tombstones | no | yes |
| Already used for public reads | no | yes, for city/state queries |

### Verdict on the audit's question

**`st_listings` cannot reproduce the public listing search/detail responses.**
Two independent blockers:

1. **No image data at all.** `syncListings()` calls `/listings/query` without
   `include=images`, so `raw` holds image *reference ids* and nothing else. There
   is no URL to render. `photos_count` is an integer.
2. **It never sees edits.** The cursor is `createdAtStart`, so the query only
   returns listings *created* after the cursor. A title, price or description
   change on an existing listing is never re-pulled. `updated_at_st` is also set
   to `a.createdAt`, so the `st_listings_updated_idx` ordering is really creation
   order.

`synced_listings` **can** reproduce them, with the field-level exceptions below.
Phase 1 therefore builds on `synced_listings`. `st_listings` remains useful as
the admin/security-scanning mirror it was built for.

---

## Parity report — field by field

Derived from reading both code paths. **Row-level counts are not in here**: the
live Supabase project (`ptfjspcphskifoseidut`) is not reachable from the audit
environment — the network policy denies `*.supabase.co`, and the Supabase account
attached to this session is a different org. Run
`bun run parity:listings` on EAST to fill in the counts.

Severities: **blocking** = cutting over changes what a visitor sees ·
**degraded** = answers, with worse data · **cosmetic** = representation only ·
**unsupported** = the mirror cannot express the query.

### Blocking

| Field | Sharetribe | `synced_listings` | Why it blocks |
|---|---|---|---|
| `slug` | `slugify(title)` — `sharetribe.server.ts:330` | `slugify(\`${title}-${id.slice(0,8)}\`)` — `listing-sync.server.ts:106` | **Different formula.** Every listing gets a different slug depending on source. |
| `url` | `/l/${slug}/${id}` | same template, different slug | Canonical URL changes per source. SEO-visible, and `sitemap-listings.xml` publishes the mirror's spelling while `/l/` pages built from a Sharetribe read use the other. |
| `imageUrl` host | `sharetribe.imgix.net`, signed | same string, snapshotted at sync time | **Dies with Sharetribe.** See below. |
| `imageUrl` variant | detail read asks `scaled-large`, `scaled-medium`, `landscape-crop2x` (`sharetribe.server.ts:423`) | sync stored `landscape-crop2x`, `landscape-crop`, `default` (`listing-sync.server.ts:65`) | Same image, different crop and resolution. The detail page renders a visibly different asset. |
| membership | live query | tombstoned on runs that complete | A run that breaks out of pagination early (`listings.length < PER_PAGE` while more pages remain, `listing-sync.server.ts:207`) tombstones every unseen listing. Mass false-delete risk. |

Two more `slugify` implementations exist and disagree on the empty-title
fallback: `"pool"` in `sharetribe.server.ts:274`, `"listing"` in
`listing-sync.server.ts:22`.

### Degraded

| Field | Difference |
|---|---|
| `city` | Sharetribe path falls back to parsing the formatted address (`summarize()` `cityFromAddress`, index `-2`); the mirror does not. A listing with no structured `city` gets one from Sharetribe and `null` from the mirror. |
| `state` | **Opposite fallback directions.** Sharetribe: `location.state \|\| pd.state \|\| pd.state_code`, no address parsing. Mirror: `pd.state ?? pd.stateCode ?? … ?? extractStateCode(address)`, which *does* parse. So each source can populate `state` where the other returns null. |
| `description` | Mirror stores `null` for absent; the summary shape coerces to `""`. Handled, but the two null-vs-empty conventions meet here. |
| `geolocation` | Mirror columns are `NUMERIC`; PostgREST returns strings. Coerced with `Number()` in the read, so values match — reported cosmetic, not dropped. |
| `publicData` / `metadata` | Whole-JSONB copies, so they match when fresh. Staleness shows as `*-key-stale-in-mirror`: a key removed upstream is not cleared. |
| `authorId` | Mirror has `author_id`; the Sharetribe summary shape does not expose it, so it is uncompared unless both are supplied. |

### Unsupported

| Query option | Why |
|---|---|
| `origin` | Distance sort. `synced_listings` has `latitude`/`longitude` but no PostGIS index. |
| `bounds` | Bounding-box filter. Same reason. |
| `keywords` | Full-text relevance. No FTS index. |

These are reported as `unsupported`, never silently downgraded — answering them
from the mirror would return a *different* result set, not the same one cheaper.
Phase 2 adds the indexes.

### Cosmetic

`price.amount` and `geolocation.lat`/`lng` arriving as strings from `NUMERIC`
columns. Reported rather than normalised away: any consumer doing arithmetic
without coercion produces a wrong total, and the displayed all-in price must
equal the checkout total to the penny.

---

## Images — the migration blocker, precisely

What `synced_listings` persists, per `pickImages()` (`listing-sync.server.ts:51`):

```
image_urls        TEXT[]   fully-resolved, signed imgix URLs
primary_image_url TEXT     the first of them
```

Shape:

```
https://sharetribe.imgix.net/{marketplaceId}/{imageId}?auto=format&fit=crop&w=…&s={signature}
                              672444e2-…          6a74ba39-…                      ^ imgix HMAC
```

**No bytes are stored. No PRNM-hosted copy exists. The image UUID is not a
column** — it is only recoverable by parsing the URL path.

So:

- Every one of those URLs 404s the moment Sharetribe's imgix account goes away.
- The `s=` signature is an imgix HMAC over the path and params, keyed on
  Sharetribe's imgix secret. We cannot re-sign, re-crop, or request a different
  variant.
- What *is* recoverable is the **worklist**: `sharetribeImageIds()` extracts
  every distinct `{imageId}` so the originals can be enumerated and downloaded —
  but only while Sharetribe still serves them.

`bun run parity:listings` prints the count of distinct Sharetribe image UUIDs
seen. That number is the size of the Phase 1b download job.

**This is not fixable by any amount of mirror work.** It needs a byte migration:
download every original, re-host on PRNM storage + CDN, add
`synced_listings.prnm_image_urls`, backfill, and serve from PRNM with imgix as
fallback. Until that lands, `mirror` mode is as exposed to a Sharetribe outage as
`sharetribe` mode is.

---

## Running it

```bash
bun test                                   # 75 deterministic parity tests
bun run parity:listings                    # live diff, both sources
bun run parity:listings --cities austin,dallas --states TX,CA --listings 25
bun run parity:listings --json > parity.json
```

The harness exits 1 when any blocking or unsupported finding is present, so it
can gate a cutover. It never depends on `PRNM_LISTING_READ_SOURCE` — it always
compares both sources.

In `shadow` mode the same diff runs on live traffic; grep EAST's pm2 log for
`[listing-parity]`. Clean reads log one line; a non-serveable read logs the full
report.

## Order of operations before `mirror` goes on

1. Run the harness on EAST. Get real counts. Nothing below is decidable without them.
2. Reconcile `slug` — pick one formula, migrate the other, redirect the old
   spelling. This is the one change that alters live URLs, so it goes first and alone.
3. Reconcile the `city` / `state` fallback chains so both sources derive them
   identically.
4. Fix the early-break tombstone in `runListingSync` before trusting mirror
   membership.
5. Re-host images (Phase 1b). Until then the mirror is not a Sharetribe-outage hedge.
6. Add PostGIS + FTS indexes so `origin`/`bounds`/`keywords` stop being unsupported.
7. Only then flip `PRNM_LISTING_READ_SOURCE=mirror`, one route at a time.
