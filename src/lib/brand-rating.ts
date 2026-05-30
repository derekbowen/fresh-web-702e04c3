/**
 * Brand-level rating snapshot for Organization JSON-LD.
 *
 * Source: Google Business Profile aggregate. Refresh manually each
 * quarter (or whenever the count crosses a round number worth bragging
 * about). One source of truth — referenced by src/lib/seo.ts to enrich
 * organizationJsonLd() with an AggregateRating block.
 *
 * Why hardcoded vs. API sync: GBP API requires OAuth + business owner
 * verification + a fully-built sync job for two numbers that change
 * slowly. Manual refresh is the right cost/benefit.
 *
 * When count === 0 the helper omits AggregateRating entirely — no
 * empty/fake schema is shipped. Fill in real numbers from GBP to
 * activate.
 *
 * Schema.org rules:
 *  - ratingValue: 1–5, one decimal place
 *  - reviewCount: integer, only count published reviews
 *  - Must be honest, verifiable, and about the entity it's attached to
 *    (here: Organization, i.e. the Pool Rental Near Me brand).
 */
export interface BrandRating {
  /** Average star rating from GBP, 1.0–5.0 */
  ratingValue: number;
  /** Total published GBP review count at the time of snapshot */
  reviewCount: number;
  /** ISO date the snapshot was taken (for our audit trail; not shipped) */
  asOf: string;
}

// TODO: replace with actual GBP numbers (see docstring above).
// Until ratingValue > 0 AND reviewCount > 0, no AggregateRating is emitted.
export const BRAND_RATING: BrandRating = {
  ratingValue: 0,
  reviewCount: 0,
  asOf: "2026-05-30",
};

export function brandRatingActive(r: BrandRating = BRAND_RATING): boolean {
  return r.ratingValue > 0 && r.reviewCount > 0;
}
