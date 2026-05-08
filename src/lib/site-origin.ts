/**
 * Single source of truth for the production origin used in JSON-LD,
 * og:url, sitemap entries, and other URLs that must be absolute.
 *
 * For request-scoped URL building (which prefers X-Forwarded-Host) use
 * `getCanonicalOrigin(request)` from `src/server/canonical.server.ts`.
 * This module is the client-safe constant used inside route `head()`
 * scripts where the server Request is not available.
 */

export const PROD_ORIGIN = "https://www.poolrentalnearme.com";

export function absUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${PROD_ORIGIN}${normalized}`;
}
