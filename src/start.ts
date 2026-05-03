import { createStart, createMiddleware } from "@tanstack/react-start";

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

const securityHeadersMiddleware = createMiddleware().server(async ({ next }) => {
  const result = await next();
  // The Worker runtime returns a Response — attach headers if available.
  const response = (result as { response?: Response }).response;
  if (response && typeof response.headers?.set === "function") {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
      if (!response.headers.has(k)) response.headers.set(k, v);
    }
  }
  return result;
});

export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeadersMiddleware],
}));
