/**
 * getRouteOrigin — request-scoped origin helper for use inside route loaders.
 *
 * Workspace rule #6: user-facing URLs (canonical, og:url, og:image) must be
 * built from X-Forwarded-Host via getCanonicalOrigin(request), not from
 * hardcoded *.poolrentalnearme.com or *.lovable.app literals.
 *
 * Loaders run on BOTH the server (SSR) and the client (navigation). This
 * helper does the right thing in both contexts:
 *   - Server: dynamic-import canonical.server.ts so client bundles stay clean
 *     and resolve the origin from X-Forwarded-Host.
 *   - Client: derive from window.location, but never return a *.lovable.app
 *     origin (the editor preview host) — fall back to PROD_ORIGIN there.
 *   - Anything else: PROD_ORIGIN as a typed safety net.
 */
import { PROD_ORIGIN } from "./site-origin";
import { getRouteOriginFromRequest } from "./route-origin.functions";

const LOVABLE_HOST_MARKER = "lovable.app";

export async function getRouteOrigin(): Promise<string> {
  if (typeof window !== "undefined") {
    try {
      const host = window.location.host;
      if (!host) return PROD_ORIGIN;
      if (host.includes(LOVABLE_HOST_MARKER)) return PROD_ORIGIN;
      const proto = window.location.protocol.replace(/:$/, "") || "https";
      return `${proto}://${host}`;
    } catch {
      return PROD_ORIGIN;
    }
  }
  return getRouteOriginFromRequest();
}
