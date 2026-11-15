/**
 * Which URLs a sitemap may list. Pure (relative imports only, no framework),
 * so `node --test` can import it directly.
 *
 * The owner's rules (SEO repairs, 2026-11): remove duplicate entries,
 * redirecting URLs, noindexed URLs, test/config listings and URLs canonicalized
 * elsewhere; a published database row alone does not establish eligibility.
 * Every rule below answers one of those, and each exclusion has a name so the
 * tests (and docs/seo-repairs-2026-11/sitemaps.md) can say which rule fired.
 *
 * One URL, one sitemap. The owner of a URL is whatever actually SERVES it:
 *   - a dedicated route file (src/routes/p.<name>.tsx) wins over the /p/$slug
 *     content dispatcher, so a content_pages row with that slug is not what a
 *     visitor gets; those URLs belong to sitemap-static.xml (or the
 *     comparisons sitemap for the competitor pillars), or to no sitemap when
 *     the route is noindex (/p/pool-pros);
 *   - a content_pages row is served before any blog post with the same slug
 *     (src/lib/content-page-lookup.ts: own row, then legacy_slugs alias, then
 *     blog_posts), so a blog post shadowed by a content row or alias belongs to
 *     the content row's template group, never to sitemap-pages-blog.xml;
 *   - every other content row belongs to its template group
 *     (src/lib/sitemap-groups.ts).
 */

export const SITE_ORIGIN = "https://www.poolrentalnearme.com";

/**
 * /p/<slug> paths answered by a dedicated route file, not by the content
 * dispatcher. Kept equal to the static `src/routes/p.<name>.tsx|ts` files by
 * tests/sitemap-rules.test.mjs (a new route file fails the test until it is
 * listed here). Nested files map dots to slashes (p.author.derek-bowen.tsx ->
 * author/derek-bowen).
 */
export const DEDICATED_P_ROUTE_SLUGS: readonly string[] = [
  "about-our-company",
  "affiliate",
  "affiliate-dashboard",
  "affiliate-program",
  "ai-listing-generator",
  "all-locations",
  "author/derek-bowen",
  "blog",
  "corpus-christi-pool-rental-laws",
  "dog",
  "earnings-calculator",
  "free-host-tools",
  "giggster-vs-pool-rental-near-me",
  "host-marketing-playbook",
  "hosting",
  "how-it-works",
  "jan",
  "la-saltwater-featured",
  "lukes-lounge",
  "neighbors",
  "peerspace-vs-pool-rental-near-me",
  "pool-heating-cost-calculator",
  "pool-party-rentals",
  "pool-pros",
  "pool-rental-app",
  "pool-rental-host-fees-compared",
  "pool-rental-permits-by-state",
  "pool-rentals",
  "pool-rules-generator",
  "pool-wifi-guide",
  "privacy-request",
  "private-pool-rental",
  "sharetribe",
  "start-hosting",
  "swimply-alternative-vs-pool-rental-near-me",
  "waiver-generator",
  "waitlist-signup",
];

/**
 * Slug prefixes answered by a dedicated dynamic route:
 * /p/pool-pros/* (noindex tree), /p/course/* (301 to the academy pages),
 * /p/pool-rentals-{state} (state hubs, listed in sitemap-static.xml) and the two
 * comparison city routes (listed in sitemap-pages-comparisons.xml).
 */
export const DEDICATED_P_ROUTE_PREFIXES: readonly string[] = [
  "pool-pros/",
  "course/",
  "pool-rentals-",
  "giggster-vs-pool-rental-near-me-in-",
  "peerspace-vs-pool-rental-near-me-in-",
];

const DEDICATED_SET = new Set(DEDICATED_P_ROUTE_SLUGS);

export function isDedicatedRouteSlug(slug: string): boolean {
  return DEDICATED_SET.has(slug) || DEDICATED_P_ROUTE_PREFIXES.some((p) => slug.startsWith(p));
}

/**
 * A slug whose /p/ URL answers 200 itself. An underscore is rewritten to a
 * hyphen by the edge before the app sees it (live 2026-11-15:
 * /p/pool_rental_guarantees -> 301 /p/pool-rental-guarantees, on .com and on
 * .co.uk; no app code does this), and an upper-case letter is 301'd to lower
 * case by p.$slug.tsx. Either way the listed URL would redirect.
 */
export function isServableSlug(slug: string | null | undefined): slug is string {
  return typeof slug === "string" && slug.length > 0 && !/[_A-Z]/.test(slug) && !/\s/.test(slug);
}

/** Normalise an absolute URL for comparison: lower-case host, no trailing slash, no query/hash. */
function normaliseUrl(u: string): string | null {
  try {
    const url = new URL(u);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    return `${url.protocol}//${url.host.toLowerCase()}${path}`;
  } catch {
    return null;
  }
}

/**
 * True when `canonicalOverride` names a URL other than `loc`. A sitemap on www
 * must not list a URL whose canonical is elsewhere (57 rows on 2026-11-15
 * canonicalise to a ccTLD host). Empty / whitespace-only overrides are ignored,
 * as p.$slug.tsx ignores them (`canonical_override?.trim() || undefined`). A
 * relative override is resolved against the site origin, as seo.ts would.
 */
export function canonicalIsElsewhere(
  canonicalOverride: string | null | undefined,
  loc: string,
): boolean {
  const raw = (canonicalOverride ?? "").trim();
  if (!raw) return false;
  const target = normaliseUrl(raw.startsWith("/") ? `${SITE_ORIGIN}${raw}` : raw);
  const self = normaliseUrl(loc);
  return target === null || self === null || target !== self;
}

export interface ContentRowForSitemap {
  slug: string | null;
  url_path?: string | null;
  canonical_override?: string | null;
  body_markdown?: string | null;
}

export type ContentExclusion =
  | "no_slug"
  | "slug_redirects"
  | "url_path_mismatch"
  | "dedicated_route"
  | "canonical_elsewhere"
  | "shadowed_by_redirect_row"
  | "thin_body";

export interface ContentRuleContext {
  siteUrl: string;
  /** Slugs that have a status='redirect' row with url_path /p/<slug> and a redirect_to. */
  redirectShadowedSlugs: ReadonlySet<string>;
  minBodyChars?: number;
}

/** The <loc> a content row is served at, when it is the plain /p/<slug>. */
export function contentRowLoc(row: ContentRowForSitemap, siteUrl: string): string | null {
  if (!row.slug) return null;
  const expected = `/p/${row.slug}`;
  // A url_path other than /p/<slug> is the page's canonical, but /p/<slug> is
  // where it is looked up: /p/a/b 301s to /p/b (p.$.tsx), /learning-academy is
  // not a /p/ URL at all. Neither belongs in a /p/ sitemap.
  if (row.url_path && row.url_path !== expected) return null;
  return `${siteUrl}${expected}`;
}

/** Why a content row must not be listed, or null when it may be. Order is fixed so the reason is stable. */
export function contentRowExclusion(
  row: ContentRowForSitemap,
  ctx: ContentRuleContext,
): ContentExclusion | null {
  if (!row.slug) return "no_slug";
  if (!isServableSlug(row.slug)) return "slug_redirects";
  const loc = contentRowLoc(row, ctx.siteUrl);
  if (!loc) return "url_path_mismatch";
  if (isDedicatedRouteSlug(row.slug)) return "dedicated_route";
  if (ctx.redirectShadowedSlugs.has(row.slug)) return "shadowed_by_redirect_row";
  if (canonicalIsElsewhere(row.canonical_override, loc)) return "canonical_elsewhere";
  const min = ctx.minBodyChars ?? 0;
  if (min > 0 && (row.body_markdown ?? "").trim().length < min) return "thin_body";
  return null;
}

/**
 * The redirect rows that win over a published row with the same slug
 * (content-page-lookup.ts checks `status='redirect'` + url_path /p/<slug> +
 * redirect_to before the published row).
 */
export function redirectShadowedSlugs(
  rows: Array<{
    slug: string | null;
    url_path?: string | null;
    redirect_to?: string | null;
    status?: string | null;
  }>,
): Set<string> {
  const out = new Set<string>();
  for (const r of rows) {
    if (!r.slug) continue;
    if (r.status !== undefined && r.status !== "redirect") continue;
    if (r.url_path !== `/p/${r.slug}`) continue;
    if (!(r.redirect_to ?? "").trim()) continue;
    out.add(r.slug);
  }
  return out;
}

export type BlogExclusion =
  | "no_slug"
  | "slug_redirects"
  | "dedicated_route"
  | "served_by_content_page";

/**
 * Why a published blog post must not be listed in sitemap-pages-blog.xml.
 * `contentSlugs` = slugs that have a content_pages row with status published
 * or redirect, plus every legacy_slugs entry of such a row: the dispatcher
 * serves (or 301s) those before it ever looks at blog_posts.
 */
export function blogPostExclusion(
  post: { slug: string | null },
  contentSlugs: ReadonlySet<string>,
): BlogExclusion | null {
  if (!post.slug) return "no_slug";
  if (!isServableSlug(post.slug)) return "slug_redirects";
  if (isDedicatedRouteSlug(post.slug)) return "dedicated_route";
  if (contentSlugs.has(post.slug)) return "served_by_content_page";
  return null;
}

/**
 * Sharetribe listings that exist for marketplace configuration, not for
 * guests. Matched by id first (the one known today), and by a title marker so a
 * second configuration listing created the same way is caught without a code
 * change. Ids are Sharetribe listing UUIDs as mirrored in
 * synced_listings.sharetribe_id. Verified 2026-11-15: of the 126 published
 * mirror rows only this one matches either rule.
 */
export const NON_PUBLIC_LISTING_IDS: readonly string[] = [
  // "CONFIG LISTING - DO NOT DELETE" (/l/config-listing-do-not-delete/<id>)
  "6768ea36-b435-40df-b331-43be74aa882f",
];
export const NON_PUBLIC_LISTING_TITLE = /\b(config(uration)? listing|do not delete)\b/i;

export type ListingExclusion = "incomplete" | "non_public_listing";

export function listingExclusion(listing: {
  slug: string | null;
  sharetribe_id: string | null;
  title?: string | null;
}): ListingExclusion | null {
  if (!listing.slug || !listing.sharetribe_id) return "incomplete";
  if (NON_PUBLIC_LISTING_IDS.includes(listing.sharetribe_id.toLowerCase()))
    return "non_public_listing";
  if (listing.title && NON_PUBLIC_LISTING_TITLE.test(listing.title)) return "non_public_listing";
  if (/config-listing|do-not-delete/.test(listing.slug)) return "non_public_listing";
  return null;
}

/** Keep the first entry per <loc>: no URL twice inside one sitemap. */
export function dedupeByLoc<T extends { loc: string }>(entries: T[]): T[] {
  const seen = new Set<string>();
  return entries.filter((e) => {
    if (seen.has(e.loc)) return false;
    seen.add(e.loc);
    return true;
  });
}

/** 1-based ?page=N, clamped to >= 1; anything unparsable is page 1. */
export function pageParam(url: URL): number {
  const n = Math.floor(Number(url.searchParams.get("page") ?? "1"));
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** Entries of page `page` (1-based) when the list is cut into `size`-entry files. */
export function pageSlice<T>(entries: T[], page: number, size: number): T[] {
  const from = (page - 1) * size;
  return entries.slice(from, from + size);
}

/** Number of `size`-entry files a list needs (0 for an empty list). */
export function pageCount(total: number, size: number): number {
  return total > 0 ? Math.ceil(total / size) : 0;
}
