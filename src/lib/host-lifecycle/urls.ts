/**
 * Marketplace URLs used in host lifecycle emails. Verified 2026-09-16 against
 * WEST's routeConfiguration.js: `/l/:slug/:id/:type/:tab` (type draft|edit; the
 * booking wizard tabs are details → location → pricing → availability → photos,
 * and the Publish button is on the last tab), `/account/payments` (Stripe
 * payout setup: routeConfiguration.js name StripePayoutPage; re-verified
 * 2026-09-17 — `/account/payouts` does NOT exist, the SPA shell merely answers
 * 200 for any path), `/wizard/` (the merlin listing wizard, served by nginx).
 */
export const SITE_ORIGIN_DEFAULT = "https://www.poolrentalnearme.com";

export function slugify(title: string | null | undefined): string {
  const s = (title ?? "listing").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s || "listing";
}

export interface ListingRef { id: string; title: string | null; state: string | null }

export function listingUrls(origin: string, l: ListingRef | null) {
  if (!l) {
    return { listing_url: null, completion_url: null, location_url: null, pricing_url: null, photos_url: null, publish_url: null };
  }
  const base = `${origin}/l/${slugify(l.title)}/${l.id}`;
  const type = l.state === "published" ? "edit" : "draft";
  return {
    listing_url: base,
    completion_url: `${base}/${type}/details`,
    location_url: `${base}/${type}/location`,
    pricing_url: `${base}/${type}/pricing`,
    photos_url: `${base}/${type}/photos`,
    publish_url: `${base}/${type}/photos`,
  };
}

/** Sharetribe StripePayoutPage — the payout onboarding flow for a signed-in host. */
export const STRIPE_PAYOUT_PATH = "/account/payments";
export function stripeUrl(origin: string): string {
  return `${origin}${STRIPE_PAYOUT_PATH}`;
}

export function wizardUrl(origin: string): string {
  return `${origin}/wizard/`;
}

export function unsubscribeUrl(origin: string, token: string): string {
  return `${origin}/unsubscribe?token=${encodeURIComponent(token)}`;
}

export function oneClickUnsubscribeUrl(origin: string, token: string): string {
  return `${origin}/email/unsubscribe?token=${encodeURIComponent(token)}`;
}
