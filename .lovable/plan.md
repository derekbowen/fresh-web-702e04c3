# Ship: Honest Review schema (small surface)

Phase 1 found **6 total reviews** in the marketplace. The original "5,800+ pages" scope is not viable without manufacturing schema. This plan ships only what's honestly supported by data.

## Surface A — Organization AggregateRating (GBP-backed)

Where it renders:
- `/` (homepage)
- `/p/about-our-company`

Schema shape (JSON-LD `Organization` with embedded `aggregateRating`):
```text
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Pool Rental Near Me",
  "url": "https://www.poolrentalnearme.com",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "<from GBP>",
    "reviewCount": "<from GBP>",
    "bestRating": "5",
    "worstRating": "1"
  }
}
```

Implementation:
- New file `src/lib/brand-rating.ts` exports a typed const `{ ratingValue, reviewCount, asOf }`. **You provide the numbers** — single source of truth, refresh manually each quarter. (Building a GBP API sync for two numbers is overkill; revisit if/when we add per-page review surfacing.)
- New helper `organizationJsonLd()` in `src/lib/seo.ts` (or extend existing schema helpers).
- Inject via `head()` on the two routes only. Do NOT add to `__root.tsx` (root concatenates into every match — would put GBP rating schema on every page, which IS the misleading-schema risk we just avoided).

## Surface B — Per-listing Review JSON-LD on /l/$slug/$id

Where it renders:
- Only the 6 `/l/*` pages that have Sharetribe reviews. Other listing pages stay unchanged.

Schema shape (extend the existing `Product` JSON-LD on `src/routes/l.$slug.$id.tsx`):
```text
{
  "@type": "Product",
  ...existing fields...,
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": <avg of listing's reviews>,
    "reviewCount": <count>
  },
  "review": [
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "<reviewer display name>" },
      "datePublished": "<ISO>",
      "reviewBody": "<content>",
      "reviewRating": { "@type": "Rating", "ratingValue": <1-5>, "bestRating": "5" }
    }
  ]
}
```

Implementation:
1. Add `fetchListingReviews(listingId: string): Promise<ListingReview[]>` in `src/server/sharetribe.server.ts`. Approach: query `/transactions/query?perPage=100&include=reviews,reviews.author` filtered to the listing, dedupe reviews, return `ofProvider` only. Wrap in try/catch, return `[]` on error (defensive-rendering rule).
2. Extend `fetchListing(id)` to also call `fetchListingReviews(id)` in parallel and attach to the returned shape, OR add a separate `getListingReviews` server function. **Recommend parallel inside fetchListing** — same render, no extra round trip to client.
3. Extend `ListingSummary` type with `reviews?: ListingReview[]` and `aggregateRating?: { value: number; count: number }`.
4. In `src/routes/l.$slug.$id.tsx`, when `listing.reviews?.length`, append `aggregateRating` + `review[]` to the existing Product schema. No visual changes — schema only. (The FTW frontend handles the visible review UI; we don't touch it.)

## Out of scope (explicit)

- No changes to any /p/* page schema.
- No new DB tables. No cache. No sync job. No cron.
- No visual review UI anywhere (FTW frontend owns visible reviews on /l/*).
- No GBP API integration — manual quarterly refresh of two numbers in a config file.
- No backups needed (no DB writes).
- Per-city Review/AggregateRating revisits when marketplace has ≥100 reviews and ≥20 cities with reviews.

## Validation

After implementation:
1. Run Google Rich Results Test on `/`, `/p/about-our-company`, and 2 of the 6 reviewed `/l/*` URLs. All must show valid `Organization`/`Product` with `AggregateRating`.
2. Spot-check schema on the 5 unreviewed listings — confirm they render Product schema WITHOUT aggregateRating (no n=0 schema).
3. Confirm canonical URLs in the schema use `getCanonicalUrl(request, path)` (workspace rule #6), not hardcoded `lovable.app`.

## What I need from you before build mode

1. **GBP rating + count.** Two numbers. e.g., `ratingValue: 4.8, reviewCount: 47`.
2. **Date label** for the GBP snapshot (used in `asOf` for our own audit trail; not shipped to schema).
3. Confirmation that `/p/about-our-company` is the right second surface (vs. `/p/about` or homepage only).

Halt-on-failure discipline applies. No log-and-continue. Honest report at the end of what shipped (homepage + about + N of 6 listings actually rendering Review schema after Sharetribe round-trip).