/**
 * Centralized internal-link rewriting.
 *
 * The Lovable frontend hosts marketing/SEO routes (/, /p/*, /pool-rental/*,
 * /help-center/*, /host-tools/*, /blog/*). Everything else — search, listings,
 * auth, dashboards, transactions — lives on the Sharetribe marketplace and
 * MUST always resolve to the production origin, even from preview hosts.
 *
 * Use `rewriteHref(href)` for any user-facing link. It returns:
 *   { href, external }
 *
 * - If `href` points to a Sharetribe-owned path → absolute production URL,
 *   external = true (open in new tab, rel=noopener).
 * - Otherwise → unchanged, external = false.
 */

export const MARKETPLACE_ORIGIN = "https://www.poolrentalnearme.com";

// Path prefixes owned by the Sharetribe marketplace template.
// Order matters only for readability; matching is by prefix.
const SHARETRIBE_PREFIXES = [
  "/s",            // search
  "/l/",           // listing detail + draft
  "/signup",
  "/login",
  "/logout",
  "/profile",
  "/account",
  "/inbox",
  "/listings",
  "/checkout",
  "/transactions",
  "/order",
  "/sale",
  "/reset-password",
  "/verify-email",
  "/preferences",
  "/notifications",
  "/payment-methods",
  "/payout",
  "/edit-listing",
];

// Marketing pages that live on the marketplace site (NOT in this Lovable
// content layer). If a /p/* slug is NOT a known local route, we still treat
// it as local (the SSR catch-all handles unknown slugs); but a few specific
// slugs are authored on the Sharetribe site and should always go there.
const MARKETPLACE_P_SLUGS = new Set<string>([
  "become-a-pool-host",
  "learningacademy",
  "learning-academy-new-courses",
  "aprende-a-rentar-tu-piscina",
  "terms-of-service",
  "privacy-policy",
]);

export function isSharetribePath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  // Exact /s or /s?... or /s/...
  if (path === "/s" || path.startsWith("/s?") || path.startsWith("/s/")) {
    return true;
  }
  for (const p of SHARETRIBE_PREFIXES) {
    if (p === "/s") continue; // handled above
    if (path === p || path.startsWith(p)) return true;
  }
  if (path.startsWith("/p/")) {
    const slug = path.slice(3).split(/[/?#]/)[0];
    if (MARKETPLACE_P_SLUGS.has(slug)) return true;
  }
  return false;
}

export type RewrittenHref = {
  href: string;
  external: boolean;
};

export function rewriteHref(href: string): RewrittenHref {
  if (!href) return { href, external: false };
  // Already absolute / non-http schemes → leave alone, mark external if http(s).
  if (/^([a-z]+:|\/\/)/i.test(href)) {
    const external = /^https?:/i.test(href) || href.startsWith("//");
    return { href, external };
  }
  if (href.startsWith("#")) return { href, external: false };
  if (!href.startsWith("/")) return { href, external: false };

  if (isSharetribePath(href)) {
    return { href: `${MARKETPLACE_ORIGIN}${href}`, external: true };
  }
  return { href, external: false };
}
