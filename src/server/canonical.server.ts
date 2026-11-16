/**
 * Request origin helper.
 *
 * getCanonicalOrigin(request) is the origin the request was made to
 * (X-Forwarded-Host, never request.url or *.lovable.app), with these fallbacks:
 *   1. X-Forwarded-Host header (production proxy)
 *   2. PUBLIC_SITE_ORIGIN env var
 *   3. https://www.poolrentalnearme.com in production
 *   4. http://localhost:3000 in development
 *
 * It is NOT the canonical host. Every host serves the whole site, so building
 * canonicals from it made every page self-canonicalise to whichever ccTLD it
 * was fetched on (audit 2026-11-14, F10). Canonical URLs come from the
 * explicit country mapping in src/lib/country-sites.ts: getCanonicalUrl below,
 * buildMeta() in src/lib/seo.ts, robots.txt and sitemap-country.xml all use it.
 */
import { canonicalUrlForPath } from "@/lib/country-sites";

const PROD_ORIGIN = "https://www.poolrentalnearme.com";
const DEV_ORIGIN = "http://localhost:3000";

function isLovableHost(host: string): boolean {
  return host.includes("lovable.app");
}

function readHeader(request: Request | undefined, name: string): string | null {
  if (!request) return null;
  try {
    const value = request.headers.get(name);
    return value && value.trim().length > 0 ? value.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Returns the canonical origin (e.g. "https://www.poolrentalnearme.com").
 * Pass the incoming server Request when available; falls back safely otherwise.
 */
export function getCanonicalOrigin(request?: Request): string {
  const fwdHost = readHeader(request, "x-forwarded-host");
  if (fwdHost && !isLovableHost(fwdHost)) {
    // The public site is https-only. The prod proxy chain (WEST nginx :443 ->
    // EAST nginx :80) rewrites X-Forwarded-Proto to "http", so the header is
    // unreliable here — derive the scheme from the host. localhost stays http
    // for local dev proxies.
    const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(fwdHost);
    const proto = isLocal ? "http" : "https";
    return `${proto}://${fwdHost}`;
  }

  const envOrigin = (() => {
    try {
      return process.env.PUBLIC_SITE_ORIGIN ?? null;
    } catch {
      return null;
    }
  })();
  if (envOrigin && !isLovableHost(envOrigin)) {
    return envOrigin.replace(/\/+$/, "");
  }

  const isDev = (() => {
    try {
      return process.env.NODE_ENV === "development";
    } catch {
      return false;
    }
  })();
  return isDev ? DEV_ORIGIN : PROD_ORIGIN;
}

/**
 * Returns the canonical URL for the given path: on the country's canonical
 * host for a country page, on www for everything else (src/lib/country-sites.ts).
 * The request is accepted for compatibility and deliberately not consulted.
 */
export function getCanonicalUrl(_request: Request | undefined, path: string): string {
  return canonicalUrlForPath(path);
}
