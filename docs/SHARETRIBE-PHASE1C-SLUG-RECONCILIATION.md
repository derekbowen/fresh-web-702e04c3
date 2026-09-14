# Phase 1c — one slug formula, canonical URLs

Small slice, and smaller than it was scoped to be. Worth reading the correction
first, because the audit got this one wrong.

---

## The correction

The Phase 1 audit listed slug divergence as **blocking**, reasoning that two
different slug formulas mean two different canonical URLs for the same listing.

That is not what production does. Probing it first would have caught this:

```
GET /l/katy-staycation-saltwater-getaway/685b3bd3-…    → 200
GET /l/garbage-slug-xyz/685b3bd3-…                     → 200
GET /l/katy-staycation-saltwater-getaway-685b3bd3/…    → 200

all three:  <link rel="canonical" href="https://www.poolrentalnearme.com/l/685b3bd3-1e5d-44b8-9483-5f6452306157">
```

The mechanism is in the marketplace, not here. `routeConfiguration.js` registers
**both** `/l/:slug/:id` (`ListingPage`) and `/l/:id` (`ListingPageCanonical`),
and `canonicalRoutePath()` in `src/util/routes.js` strips the slug segment for
listing routes. So a wrong slug does not 404, does not split indexing, and
Google consolidates every variant onto one URL.

Slug divergence is therefore a **consistency** defect, not an SEO emergency. The
parity engine now scores `slug` and `url` as `degraded` instead of `blocking`,
so a slug mismatch alone no longer makes a read unserveable.

## What was actually broken

**Sitemaps advertised non-canonical URLs.** `sitemap-listings.xml` emitted
`/l/{slug}/{id}`. A sitemap entry is a strong canonical hint, so we were
spending crawl budget asking Google to fetch a URL that then tells it the
canonical is elsewhere. Now it emits `canonicalListingUrl(id)`.

Currently moot in production — that route 404s on the deployed build, so
listings are in no live sitemap at all. It matters when that code ships.

**Three `slugify()` implementations disagreed**, and not only on edge cases:

| Input | marketplace `createSlug` | old fresh-web `slugify` |
|---|---|---|
| `Café Pool` | `cafe-pool` | `caf-pool` |
| `Ñoño's Piscina` | `nono-s-piscina` | `o-o-s-piscina` |
| `under_scores_kept` | `under-scores-kept` | `under-scores-kept` |
| `slash/and,comma` | `slash-and-comma` | `slash-and-comma` |
| *(empty)* | `no-slug` | `pool` / `listing` |
| 100-char title | full length | truncated to 80 |

**`src/routes/l.$slug.$id.tsx` self-canonicalised to whatever slug was in the
URL** — `rel="canonical"`, the Product JSON-LD `url`, both breadcrumb trails and
the "Book this pool" link all echoed `params.slug`. Had that route ever served
traffic, `/l/{anything}/{id}` would have generated unbounded duplicate content.
nginx proxies `/l/` to the marketplace, so it was shadowed — a landmine, not a
live bug. Now defused: every URL it emits is the canonical.

## Files

| File | Role |
|---|---|
| `src/lib/listing-url.ts` | `createSlug` (ported), `canonicalListingPath/Url`, `listingPathWithSlug`, `parseListingPath`, `slugDrift`. Pure. |
| `src/lib/listing-url.test.ts` | 38 deterministic tests |
| `src/server/listing-sync.server.ts` | Mirror slug now `createSlug(title)` |
| `src/server/sharetribe.server.ts` | Local `slugify` deleted; all four `/l/` builders shared |
| `src/routes/sitemap-listings[.]xml.ts` | Canonical URLs; prefers the PRNM-hosted image |
| `src/routes/sitemap[.]xml.ts` | Listing count no longer gated on a non-null slug |
| `src/components/listing-card.tsx`, `src/server/all-locations.functions.ts` | Shared URL builder |
| `src/routes/l.$slug.$id.tsx` | Canonicalises like the marketplace |
| `src/lib/listing-parity.ts` | `slug`/`url` demoted to degraded |

## Why `createSlug` is a verbatim port

`/l/` is served by the marketplace. Its `createSlug` is not *a* formula, it is
*the* formula — whatever it produces is what the page renders. So
`src/lib/listing-url.ts` ports
`poolrentalnearme-web/src/util/urlHelpers.js` exactly, transliteration table
included.

Fidelity is checked differentially rather than by eye: both implementations run
over the same inputs and their output compared. The harness is committed, so this
is a number you can reproduce rather than one you have to take on trust:

```
$ bun scripts/slug-parity-check.ts
marketplace source: /home/user/poolrentalnearme-web/src/util/urlHelpers.js
hand-picked: 15, random: 20000 (seed 1)
20015/20015 identical
null handling — marketplace: throws, port: "no-slug" (deliberate divergence)
```

It loads `createSlug` out of the marketplace's `src/util/urlHelpers.js` at runtime
rather than vendoring a copy, so the two cannot drift apart without the check
noticing. `--marketplace <path>`, `--cases N` and `--seed N` are all overridable;
it exits non-zero on any divergence.

**The one deliberate divergence:** the marketplace's `createSlug` starts with
`str.toString()` and therefore throws on `null`/`undefined`. The port returns
`"no-slug"`, because it is called with mirror rows whose `title` can be null and
a thrown error there would take out a whole sitemap page. Every non-null input
agrees exactly.

The test file locks in the interesting cases. **Do not "improve" `createSlug`.**
Its only job is to agree with the marketplace; divergence is the bug.

One expectation I got wrong on the way, worth recording: `ß` maps to a single
`s` in that table (`Straße` → `strase`), not the German `ss`. The differential
run caught it.

## Two URL shapes, used deliberately

```ts
canonicalListingPath(id)          // /l/{id}          — sitemaps, rel=canonical, JSON-LD
listingPathWithSlug(slug, id)     // /l/{slug}/{id}   — internal links, share targets
```

Internal links keep the slug: the marketplace serves that shape and
canonicalises it, so the keyword-bearing URL costs nothing. Sitemaps must use
the canonical — that is the whole point of the fix.

`parseListingPath()` deliberately refuses `/l/new`, `/l/draft/…/new/details`
(the list-a-pool CTA used in ~15 places) and `/l/{slug}/{id}/checkout`. Those are
the marketplace's routes; rewriting them would break the funnel. The UUID check
on the id segment is what enforces that.

## Migration

**None needed.** `runListingSync()` re-pages every listing on each run and
upserts `slug`, so the next full sync rewrites all of them with the new formula.

Safe because **nothing resolves a listing by slug** — verified by grep across
the repo. `l.$slug.$id.tsx` looks up by `params.id` and ignores the slug, and
every other use just builds an href. Changing a slug changes a URL that already
200s and already canonicalises correctly.

No redirects are required, for the same reason: old slug URLs keep working
exactly as they do today.

## Not done

- **`synced_listings.slug` is not backfilled by a migration.** It updates on the
  next sync run. If you want it immediate, run the listing sync.
- **`city_slug` still uses the local `slugify`** in `listing-sync.server.ts`.
  That is a different namespace (city hub URLs, not listings) with its own
  stored values, and changing it would move real page URLs. Out of scope here.
- **`slugDrift()` is exported but unused.** It is there for a follow-up check
  that reports listings whose stored slug disagrees with their title, once
  someone wants that report.
