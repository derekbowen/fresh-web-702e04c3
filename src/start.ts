import { createStart, createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

// Baseline security headers applied to every response (HTML, server fns, server routes).
// CSP is intentionally permissive enough to allow Supabase, Lovable assets, embedded
// course iframes, and inline styles used by the design system — but blocks unknown
// script origins so any future XSS cannot exfiltrate to attacker-controlled hosts.
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'self' https://lovable.dev https://*.lovable.dev https://gptengineer.app https://*.gptengineer.app https://*.lovableproject.com https://*.lovable.app",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https:",
    // 'unsafe-inline' + 'unsafe-eval' required by Vite/React runtime hydration
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https:",
    "media-src 'self' https: blob:",
  ].join("; "),
};

// Production is served through the EC2 nginx reverse proxy on
// poolrentalnearme.com. The Lovable preview / published mirrors
// (*.lovable.app, *.lovable.dev, *.lovableproject.com, *.gptengineer.app) are
// internal-only and must NEVER be indexed — otherwise Google sees duplicate
// content competing with prod. We send X-Robots-Tag: noindex, nofollow on
// every response whose request host is one of those known preview hosts.
//
// IMPORTANT: this is an allowlist of hosts to NOINDEX, not a denylist of
// non-production hosts. nginx in front of www.poolrentalnearme.com has
// historically not always set X-Forwarded-Host reliably, which under the
// previous (denylist) logic caused production to receive a noindex header
// and get deindexed from Google. Defaulting unknown hosts to indexable is
// the safe direction here — at worst a future preview host gets indexed
// once and we add it below; the prior failure mode silently killed prod SEO.
const PREVIEW_HOST_SUFFIXES = [
  ".lovable.app",
  ".lovable.dev",
  ".lovableproject.com",
  ".gptengineer.app",
];

function isPreviewHost(hostHeader: string | null): boolean {
  if (!hostHeader) return false; // unknown -> assume prod, allow indexing
  const host = hostHeader.split(":")[0]!.toLowerCase();
  return PREVIEW_HOST_SUFFIXES.some(
    (suffix) => host === suffix.slice(1) || host.endsWith(suffix),
  );
}

const securityHeadersMiddleware = createMiddleware().server(async ({ next, request }) => {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/lovable/") || url.pathname === "/email/unsubscribe") {
    return next();
  }
  const result = await next();
  // The Worker runtime returns a Response — attach headers if available.
  const response = (result as { response?: Response }).response;
  if (response && typeof response.headers?.set === "function") {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
      if (!response.headers.has(k)) response.headers.set(k, v);
    }
    // Forwarded host wins (set by EC2 nginx); fall back to direct Host header.
    const forwardedHost = request.headers.get("x-forwarded-host");
    const host = forwardedHost ?? request.headers.get("host");
    if (isPreviewHost(host)) {
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
    }
  }
  return result;
});

export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeadersMiddleware],
  functionMiddleware: [attachSupabaseAuth],
  serverFns: {
    fetch: async (url, requestInit) => {
      const init = requestInit ?? {};
      const headers = new Headers(init.headers);
      if (!headers.has("authorization")) {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) headers.set("authorization", `Bearer ${token}`);
      }
      return fetch(url, { ...init, headers });
    },
  },
}));
