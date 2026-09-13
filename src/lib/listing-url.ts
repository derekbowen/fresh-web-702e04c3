/**
 * Listing URLs — one slug formula, one canonical shape.
 *
 * Pure. No network, no database, no clock.
 *
 * ## What production actually does
 *
 * `/l/{slug}/{id}` is served by the marketplace (WEST), not by this app —
 * nginx proxies `/l/` there. The Sharetribe Web Template registers BOTH
 * `/l/:slug/:id` (ListingPage) and `/l/:id` (ListingPageCanonical), and
 * `canonicalRoutePath()` in the template strips the slug, so **every listing
 * page emits `<link rel="canonical" href=".../l/{id}">`, slug-less**.
 *
 * Verified against production: `/l/katy-staycation-saltwater-getaway/{id}`,
 * `/l/garbage-slug-xyz/{id}` and `/l/katy-staycation-saltwater-getaway-685b3bd3/{id}`
 * all return 200 with the identical canonical `/l/{id}`.
 *
 * That means a wrong slug does not 404 and does not split indexing — which is
 * why the slug divergence the audit found is a consistency and crawl-budget
 * problem, not the SEO emergency it was first written up as. The Phase 1 doc has
 * been corrected.
 *
 * ## What this module fixes
 *
 * 1. Three different slug formulas existed. `createSlug` here is a faithful port
 *    of the marketplace's `src/util/urlHelpers.js`, which is the authority
 *    because it is what the pages themselves use.
 * 2. Sitemaps were advertising non-canonical `/l/{slug}/{id}`. A sitemap entry
 *    is a strong canonical hint, so pointing it at a URL that then canonicalises
 *    elsewhere spends crawl budget to contradict ourselves.
 *    `canonicalListingPath()` is what sitemaps must use.
 */

/** Where listing pages live. Owned by the marketplace, proxied by nginx. */
export const LISTING_PATH_PREFIX = "/l";

// ─────────────────────────────────────────────────────────────────────────────
// Slug
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Transliteration table, ported verbatim from the marketplace's
 * `createSlug` (src/util/urlHelpers.js). Order matters: `Ĳ`→`ij` and `Œ`→`oe`
 * expand to two characters, and the final set folds punctuation to a hyphen.
 */
const TRANSLITERATION: Array<{ to: string; from: string }> = [
  { to: "a", from: "ÀÁÂÃÄÅÆĀĂĄẠẢẤẦẨẪẬẮẰẲẴẶ" },
  { to: "c", from: "ÇĆĈČ" },
  { to: "d", from: "ÐĎĐÞ" },
  { to: "e", from: "ÈÉÊËĒĔĖĘĚẸẺẼẾỀỂỄỆ" },
  { to: "g", from: "ĜĞĢǴ" },
  { to: "h", from: "ĤḦ" },
  { to: "i", from: "ÌÍÎÏĨĪĮİỈỊ" },
  { to: "j", from: "Ĵ" },
  { to: "ij", from: "Ĳ" },
  { to: "k", from: "Ķ" },
  { to: "l", from: "ĹĻĽŁ" },
  { to: "m", from: "Ḿ" },
  { to: "n", from: "ÑŃŅŇ" },
  { to: "o", from: "ÒÓÔÕÖØŌŎŐỌỎỐỒỔỖỘỚỜỞỠỢǪǬƠ" },
  { to: "oe", from: "Œ" },
  { to: "p", from: "ṕ" },
  { to: "r", from: "ŔŖŘ" },
  { to: "s", from: "ßŚŜŞŠ" },
  { to: "t", from: "ŢŤ" },
  { to: "u", from: "ÙÚÛÜŨŪŬŮŰŲỤỦỨỪỬỮỰƯ" },
  { to: "w", from: "ẂŴẀẄ" },
  { to: "x", from: "ẍ" },
  { to: "y", from: "ÝŶŸỲỴỶỸ" },
  { to: "z", from: "ŹŻŽ" },
  { to: "-", from: "·/_,:;'" },
];

/**
 * The marketplace's slug formula, ported exactly.
 *
 * Differs from the three ad-hoc `slugify()` copies this replaces in ways that
 * actually change output:
 *   • accents are transliterated, not stripped — "Café" is `cafe`, not `caf`
 *   • `· / _ , : ; '` fold to a hyphen instead of vanishing
 *   • `[^\w-]` keeps underscores (\w includes `_`)
 *   • no 80-character truncation
 *   • the empty-input fallback is `no-slug`, not `pool` or `listing`
 *
 * Do not "improve" this. Its only job is to agree with the pages the
 * marketplace renders; divergence here is the bug, not the formatting.
 */
export function createSlug(str: string | null | undefined): string {
  if (str === null || str === undefined) return "no-slug";

  let text = String(str).toLowerCase().trim();

  for (const set of TRANSLITERATION) {
    text = text.replace(new RegExp(`[${set.from}]`, "gi"), set.to);
  }

  const slug = encodeURIComponent(
    text
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, ""),
  );

  return slug.length > 0 ? slug : "no-slug";
}

// ─────────────────────────────────────────────────────────────────────────────
// Paths
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The canonical listing path: `/l/{id}`, no slug.
 *
 * This is what the marketplace puts in `rel="canonical"`, so it is what
 * sitemaps must advertise. Anything else asks Google to crawl a URL only to be
 * told the canonical is elsewhere.
 */
export function canonicalListingPath(listingId: string): string {
  return `${LISTING_PATH_PREFIX}/${listingId}`;
}

/** Absolute canonical URL. `siteUrl` may carry a trailing slash; it is trimmed. */
export function canonicalListingUrl(listingId: string, siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, "")}${canonicalListingPath(listingId)}`;
}

/**
 * The human-facing path, `/l/{slug}/{id}`.
 *
 * Safe for internal links and share targets: the marketplace serves it and
 * canonicalises it to the slug-less form, so the keyword-bearing URL costs
 * nothing. Not for sitemaps — use `canonicalListingPath` there.
 *
 * Pass a title and it is slugged; pass an already-slugged value and it is used
 * as-is, so callers holding `synced_listings.slug` do not double-slug it.
 */
export function listingPathWithSlug(
  slugOrTitle: string | null | undefined,
  listingId: string,
): string {
  const slug = slugOrTitle && slugOrTitle.trim() !== "" ? slugOrTitle : "no-slug";
  return `${LISTING_PATH_PREFIX}/${slug}/${listingId}`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ParsedListingPath {
  listingId: string;
  slug: string | null;
  /** True when the path is already `/l/{id}` with no slug segment. */
  isCanonical: boolean;
}

/**
 * Parse `/l/{id}` or `/l/{slug}/{id}`.
 *
 * Returns null for anything else — including `/l/new`, `/l/draft/...` and the
 * template's deeper `/l/{slug}/{id}/checkout` style paths, which are the
 * marketplace's to route and must never be rewritten by us. The id has to look
 * like a UUID for exactly that reason: `/l/draft/00000000-…/new/details` must
 * not parse as a listing.
 */
export function parseListingPath(path: string | null | undefined): ParsedListingPath | null {
  if (!path) return null;
  const [clean] = path.split(/[?#]/);
  const segments = (clean ?? "").replace(/\/+$/, "").split("/").filter(Boolean);

  if (segments[0] !== "l") return null;

  if (segments.length === 2 && UUID_RE.test(segments[1]!)) {
    return { listingId: segments[1]!, slug: null, isCanonical: true };
  }
  if (segments.length === 3 && UUID_RE.test(segments[2]!)) {
    return { listingId: segments[2]!, slug: segments[1]!, isCanonical: false };
  }
  return null;
}

/**
 * The slug this listing *should* carry, for a consistency check.
 * Returns null when they already agree.
 */
export function slugDrift(
  title: string | null | undefined,
  storedSlug: string | null | undefined,
): { expected: string; stored: string | null } | null {
  const expected = createSlug(title);
  const stored = storedSlug ?? null;
  return expected === stored ? null : { expected, stored };
}
