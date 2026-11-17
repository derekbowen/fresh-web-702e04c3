import { createStart, createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { unavailableResponse, UNAVAILABLE_RETRY_AFTER_SECONDS } from "@/lib/failed-read";
import { watchRequestUnavailable } from "@/server/request-unavailable.server";
import { comparisonDuplicateSlashRedirect } from "@/lib/comparison-duplicates";

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

// A failed database read must be answered 503, never 404/301/200-empty: the
// edge caches /p/* for 600 s whatever the status. Server code that cannot
// answer because a read failed flags the request (markRequestUnavailable, see
// src/server/request-unavailable.server.ts for why this has to be a
// middleware). For a page request the 503 is sent the moment the flag is set,
// without waiting for the rest of the render: the other loaders may be waiting
// on the same database. The abandoned render's outcome is discarded.
const failedReadMiddleware = createMiddleware().server(async ({ next, request }) => {
  const watch = watchRequestUnavailable();
  const isServerFn =
    request.headers.get("x-tsr-serverFn") === "true" ||
    new URL(request.url).pathname.startsWith("/_serverFn/");
  if (!watch || isServerFn) {
    // Server-function RPC: the body is the serialized result the client needs
    // ({ kind: "unavailable" } or the error), and TanStack has already applied
    // the flagged 503 status. Only make sure nobody stores it.
    const result = await next();
    const response = (result as { response?: Response }).response;
    if (watch?.marked && response && typeof response.headers?.set === "function") {
      response.headers.set("Cache-Control", "no-store");
      response.headers.set("Retry-After", String(UNAVAILABLE_RETRY_AFTER_SECONDS));
    }
    return result;
  }
  const rendering = Promise.resolve(next());
  const result = await Promise.race([rendering, watch.signal]);
  if (!watch.marked) return result as Awaited<typeof rendering>;
  rendering.catch(() => {});
  return unavailableResponse("html");
});

// /p and /p/ are not pages. Production showed a redirect loop on them:
// WEST nginx answered /p with a 301 to /p/, and the router answered /p/ with a
// 307 back to /p (SEO audit 2026-11-14, F11). Answer both with a plain 404
// here, before routing, so this app never adds a hop. The nginx hop on bare
// /p remains until WEST adds `location = /p { return 404; }`.
const BARE_P_PATHS = new Set(["/p", "/p/"]);
const BARE_P_404_HTML =
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Page not found | Pool Rental Near Me</title></head><body><h1>Page not found</h1><p><a href="/">Pool Rental Near Me home</a> · <a href="/p/all-locations">All locations</a></p></body></html>';
const bareP404Middleware = createMiddleware().server(async ({ next, request }) => {
  if (BARE_P_PATHS.has(new URL(request.url).pathname)) {
    return new Response(BARE_P_404_HTML, {
      status: 404,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Robots-Tag": "noindex",
        "Cache-Control": "public, max-age=300",
      },
    });
  }
  return next();
});

// A listed comparison duplicate (src/lib/comparison-duplicates.ts) asked for
// with a trailing slash: one 301 straight to its state-suffixed twin. The
// router strips a trailing slash with a 307 before any route's beforeLoad
// runs, so "/p/...-in-boston/" used to take two hops (307 to the bare URL, then
// its 301). Only the listed bare URLs are matched; every other URL, the twins
// included, keeps the router's own trailing-slash handling. Like the route's
// 301, the query string is not carried over.
const comparisonDuplicateSlashMiddleware = createMiddleware().server(async ({ next, request }) => {
  if (request.method === "GET" || request.method === "HEAD") {
    const target = comparisonDuplicateSlashRedirect(new URL(request.url).pathname);
    if (target) return new Response(null, { status: 301, headers: { Location: target } });
  }
  return next();
});

export const startInstance = createStart(() => ({
  // Order matters: security headers wrap the 503, the bare-/p 404 and the
  // duplicate 301 as well.
  requestMiddleware: [
    securityHeadersMiddleware,
    bareP404Middleware,
    comparisonDuplicateSlashMiddleware,
    failedReadMiddleware,
  ],
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
