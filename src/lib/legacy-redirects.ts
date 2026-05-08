/**
 * 301 redirects for legacy help-center URLs surfaced in GSC's "Crawled —
 * currently not indexed" report (2026-05-06).
 *
 * Source paths are flat under top-level prefixes that 404 in production
 * today. Targets are the closest live equivalent under /p/* (fresh-web's
 * only owned content prefix), or to home / Sharetribe-owned routes for
 * marketplace concerns.
 *
 * NOTE: For these redirects to actually fire in production, the nginx
 * config on EC2 must forward the eight legacy prefixes below to fresh-web.
 * Until that's wired up, fresh-web emits the 301 but real visitors still
 * hit the old marketplace 404. The route handlers are still worth shipping
 * so Lovable preview, the link checker, and any future proxy update all
 * work without a code change.
 */
export const LEGACY_REDIRECTS: Record<string, string> = {
  // /for-guests/*
  "/for-guests/understanding-reviews-and-ratings": "/p/how-it-works",
  "/for-guests/what-to-bring-to-a-pool-rental": "/p/how-it-works",

  // /for-hosts/*
  "/for-hosts/collecting-and-responding-to-reviews": "/p/hosting",
  "/for-hosts/revenue-optimization-for-hosts": "/p/hosting",
  "/for-hosts/what-to-include-in-your-pool-listing": "/p/hosting",

  // /guest-information/*
  "/guest-information/accessibility-and-special-requests": "/p/how-it-works",
  "/guest-information/cancellation-and-refund-policy-for-guests": "/p/how-it-works",
  "/guest-information/how-to-search-and-book-a-pool": "/p/how-it-works",
  "/guest-information/understanding-reviews-and-ratings": "/p/how-it-works",

  // /host-information/*
  "/host-information/preparing-your-pool-for-guests": "/p/hosting",

  // /legal-and-compliance/*
  "/legal-and-compliance/host-insurance-requirements-poolrentalnearme-com":
    "/p/insurance-guide-for-pool-owners",
  "/legal-and-compliance/liability-guide-for-hosts-and-guests-poolrentalnearme-com":
    "/p/insurance-guide-for-pool-owners",
  "/legal-and-compliance/privacy-policy-pool-rental-near-me": "/p/privacy-policy",
  "/legal-and-compliance/terms-of-service-pool-rental-near-me": "/p/terms-of-service",

  // /marketing-and-growth/*
  "/marketing-and-growth/local-seo-for-pool-hosts-poolrentalnearme-com": "/p/hosting",
  "/marketing-and-growth/partnerships-and-local-promotions-poolrentalnearme-com": "/p/hosting",
  "/marketing-and-growth/seasonal-marketing-strategies-poolrentalnearme-com": "/p/hosting",

  // /pool-management/*
  "/pool-management/cleaning-between-guests": "/p/hosting",
  "/pool-management/water-testing-and-chemical-balance-poolrentalnearme-com": "/p/hosting",
  "/pool-management/weather-and-storm-preparations-poolrentalnearme-com": "/p/hosting",

  // /technical-support/*
  "/technical-support/account-creation-and-verification-poolrentalnearme-com": "/",
  "/technical-support/password-and-login-help-poolrentalnearme-com": "/",
  "/technical-support/troubleshooting-booking-issues-poolrentalnearme-com": "/",
  "/technical-support/updating-your-profile-and-settings-poolrentalnearme-com": "/",
};

/** Prefix → fallback target if a specific path under that prefix isn't mapped. */
export const LEGACY_PREFIX_FALLBACKS: Record<string, string> = {
  "for-guests": "/p/how-it-works",
  "for-hosts": "/p/hosting",
  "guest-information": "/p/how-it-works",
  "host-information": "/p/hosting",
  "legal-and-compliance": "/privacy-policy",
  "marketing-and-growth": "/p/hosting",
  "pool-management": "/p/hosting",
  "technical-support": "/",
};

export function resolveLegacyRedirect(prefix: string, splat: string): string {
  const path = `/${prefix}/${splat}`.replace(/\/+$/, "");
  return LEGACY_REDIRECTS[path] ?? LEGACY_PREFIX_FALLBACKS[prefix] ?? "/";
}

export function legacyRedirectResponse(target: string, origin: string): Response {
  return new Response(null, {
    status: 301,
    headers: {
      Location: target.startsWith("http") ? target : `${origin}${target}`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
