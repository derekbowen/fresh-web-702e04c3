/**
 * Guest booking fee — the one place this number lives in fresh-web.
 *
 * Guests pay a mandatory booking fee on top of the host's rate. California
 * SB 478 requires that fee to be INCLUDED in any advertised price, so every
 * surface that shows a price must show the all-in figure, never the host base.
 *
 * Mirrors the marketplace's src/util/currency.js (CUSTOMER_BOOKING_FEE_PCT +
 * priceWithBookingFee) in poolrentalnearme-web. Both must match the Sharetribe
 * Console customer-commission percentage. If the Console value changes, change
 * it here and there.
 *
 * Deliberately client-safe (no server imports) so components, loaders and
 * server functions can all read the same constant.
 */
export const CUSTOMER_BOOKING_FEE_PCT = 15;

/**
 * Host base price (minor units) -> all-in price (minor units), rounded to the
 * cent so a card matches the listing page exactly. Returns null for a missing
 * or non-positive price, so callers render no price rather than a fake $0.
 */
export function allInCents(base: unknown): number | null {
  if (typeof base !== "number" || !Number.isFinite(base) || base <= 0) return null;
  return Math.round(base * (1 + CUSTOMER_BOOKING_FEE_PCT / 100));
}
