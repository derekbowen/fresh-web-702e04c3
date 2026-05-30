/**
 * Brand-level AggregateRating sourced from PRNM Corp's verified
 * Google Business Profile. This is intentionally separate from
 * listing-level reviews per our September 2025 announcement:
 * brand-level credibility signals (PRNM as a company) are
 * distinct from listing-level reviews (individual hosts), which
 * we de-emphasize in favor of education-based credentials.
 *
 * Refresh manually each quarter (or whenever the count crosses a
 * round number worth bragging about). One source of truth.
 *
 * Why hardcoded vs. API sync: GBP API requires OAuth + business
 * owner verification + a fully-built sync job for two numbers
 * that change slowly. Manual refresh is the right cost/benefit.
 *
 * When count === 0 the helper omits AggregateRating entirely — no
 * empty/fake schema is shipped.
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
  /** Human-readable source label for our own audit trail; not shipped */
  source: string;
}

export const BRAND_RATING: BrandRating = {
  ratingValue: 5.0,
  reviewCount: 10,
  asOf: "2026-05-30",
  source: "Google Business Profile — PRNM Corp",
};

export function brandRatingActive(r: BrandRating = BRAND_RATING): boolean {
  return r.ratingValue > 0 && r.reviewCount > 0;
}
