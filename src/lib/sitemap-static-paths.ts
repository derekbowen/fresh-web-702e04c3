/**
 * Static sub-sitemap: pages answered by a dedicated route (a src/routes file,
 * or the WEST marketplace for `/s`), whose URLs are known at build time.
 *
 * A /p/ URL that the content dispatcher serves from a content_pages row is
 * NOT listed here: its template group's sitemap owns it (one URL, one
 * sitemap). That is why /p/about, /p/become-a-host,
 * /p/become-a-swimming-pool-host, /p/howitworksforguests, /p/investors,
 * /p/make-money, /p/privacy-policy and /p/host-training-academy left this list
 * on 2026-11-15: each was also in the articles or academy sitemap.
 *
 * Every path here was checked live (the audit crawl of 2026-11-14 for the
 * entries already listed, a probe on 2026-11-15 for the ones added): 200,
 * indexable (no noindex meta or X-Robots-Tag), one self-referencing canonical,
 * a real page (not a form, not a duplicate). Evidence: docs/seo-repairs-2026-11/sitemaps.md.
 *
 * Pure (no imports) so tests/sitemap-rules.test.mjs can check every /p/ entry
 * against DEDICATED_P_ROUTE_SLUGS.
 */

export const STATIC_URLS: Array<{ path: string; lastmod?: Date }> = [
  { path: "/" },
  { path: "/p/hosting" },
  { path: "/p/all-locations" },
  { path: "/p/pool-rentals" },
  { path: "/phoenix" },
  { path: "/riverside" },
  { path: "/p/pool-rental-host-fees-compared" },
  { path: "/p/pool-rental-permits-by-state" },
  { path: "/p/corpus-christi-pool-rental-laws" },
  // Phase 1 subdomain consolidation — six new keyword-targeted tool routes.
  { path: "/p/start-hosting" },
  { path: "/p/pool-heating-cost-calculator" },
  { path: "/p/ai-listing-generator" },
  { path: "/p/waiver-generator" },
  { path: "/p/host-marketing-playbook" },
  { path: "/p/pool-rules-generator" },
  { path: "/p/pool-wifi-guide" },
  // Dedicated routes that used to be listed only through a content_pages row
  // of the same slug in the articles sitemap (the row is not what is served).
  { path: "/p/how-it-works" },
  { path: "/p/blog" },
  // Dedicated routes that were in no sitemap (audit 2026-11-14, section 2.8).
  { path: "/p/about-our-company" },
  { path: "/p/author/derek-bowen" },
  { path: "/p/earnings-calculator" },
  { path: "/p/neighbors" },
  { path: "/p/pool-party-rentals" },
  { path: "/p/pool-rental-app" },
  { path: "/p/private-pool-rental" },
  // Bare /s: the marketplace search page (served by WEST), indexable and
  // self-canonical. Every /s?... variant stays noindex,follow (audit section 8).
  { path: "/s" },
];
