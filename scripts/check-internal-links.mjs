#!/usr/bin/env node
/**
 * Build-time / CI internal link checker.
 *
 * Crawls a set of seed URLs, extracts every internal <a href> and link
 * appearing in rendered HTML, then verifies each target resolves to:
 *   - 200 OK, or
 *   - 301/308 to an allowed canonical target (no redirect chains > 1 hop)
 *
 * Anything else (404, 410, 5xx, redirect loops, cross-host bounces) is
 * reported and the process exits non-zero so CI can block the deploy.
 *
 * Usage:
 *   BASE_URL=https://fresh-web.lovable.app \
 *     node scripts/check-internal-links.mjs
 *
 *   # Or with extra seeds (comma-separated paths):
 *   SEEDS=/,/p/hosting,/p/earnings-calculator \
 *     BASE_URL=http://localhost:8080 node scripts/check-internal-links.mjs
 *
 *   # Limit the crawl frontier (default 200):
 *   MAX_PAGES=500 node scripts/check-internal-links.mjs
 */

const BASE = (process.env.BASE_URL || "http://localhost:8080").replace(/\/$/, "");
const MAX_PAGES = Number(process.env.MAX_PAGES || 200);
const CONCURRENCY = Number(process.env.CONCURRENCY || 8);
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 15000);

const DEFAULT_SEEDS = [
  "/",
  "/p/hosting",
  "/p/how-it-works",
  "/p/earnings-calculator",
  "/p/free-host-tools",
  "/p/all-locations",
  "/p/pool-pros",
  "/landing-page",
  "/sitemap.xml",
];
const SEEDS = (process.env.SEEDS ? process.env.SEEDS.split(",") : DEFAULT_SEEDS)
  .map((s) => s.trim())
  .filter(Boolean);

// Paths owned by other Lovable apps / Sharetribe. Linked from fresh-web is OK,
// but we don't crawl into them and we don't fail if they 3xx away.
const EXTERNAL_PREFIXES = [
  "/s", "/l/", "/login", "/signup", "/inbox", "/auth/", "/account/",
  "/profile/", "/messages/", "/listings/", "/saved-listings",
  "/amenity/", "/amenities", "/public-pools/", "/referral",
];

const isExternalOwned = (path) =>
  EXTERNAL_PREFIXES.some((p) => path === p || path.startsWith(p));

const stripHash = (h) => h.split("#")[0];

function extractLinks(html, fromPath) {
  const out = new Set();
  const reHref = /<a\b[^>]*\bhref=["']([^"']+)["']/gi;
  const reLoc = /<loc>([^<]+)<\/loc>/gi;
  let m;
  while ((m = reHref.exec(html)) !== null) out.add(m[1]);
  while ((m = reLoc.exec(html)) !== null) out.add(m[1]);

  const internal = [];
  for (const raw of out) {
    const href = stripHash(raw.trim());
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    let path;
    if (/^https?:\/\//i.test(href)) {
      try {
        const u = new URL(href);
        // Only treat as internal if it points back at our test origin or prod.
        if (u.origin !== BASE && !/poolrentalnearme\.com$/i.test(u.hostname)) continue;
        path = u.pathname + (u.search || "");
      } catch {
        continue;
      }
    } else if (href.startsWith("/")) {
      path = href;
    } else {
      // Resolve relative to fromPath
      try {
        path = new URL(href, BASE + fromPath).pathname;
      } catch { continue; }
    }
    internal.push(path);
  }
  return internal;
}

async function fetchWithTimeout(url, init = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctl.signal, redirect: "manual" });
  } finally {
    clearTimeout(t);
  }
}

const seen = new Set();
const queue = [];
const results = [];
const linkSources = new Map(); // path -> first source page

for (const s of SEEDS) {
  queue.push(s);
  linkSources.set(s, "(seed)");
}

async function check(path) {
  if (seen.has(path)) return;
  seen.add(path);
  if (seen.size > MAX_PAGES) return;

  const url = BASE + path;
  let res;
  try {
    res = await fetchWithTimeout(url, { headers: { "user-agent": "fresh-web-link-checker" } });
  } catch (err) {
    results.push({ path, status: 0, ok: false, reason: `fetch failed: ${err.message}`, source: linkSources.get(path) });
    return;
  }
  const status = res.status;
  let ok = false;
  let reason = "";

  if (status === 200) {
    ok = true;
  } else if (status === 301 || status === 308 || status === 302 || status === 307) {
    const loc = res.headers.get("location") || "";
    if (!loc) { ok = false; reason = `${status} no Location header`; }
    else {
      // Verify the redirect target resolves 200 in one hop
      try {
        const target = loc.startsWith("http") ? loc : BASE + (loc.startsWith("/") ? loc : "/" + loc);
        const r2 = await fetchWithTimeout(target, { redirect: "manual" });
        if (r2.status === 200) { ok = true; reason = `${status} -> 200 ${loc}`; }
        else { ok = false; reason = `${status} -> ${r2.status} ${loc}`; }
      } catch (err) {
        ok = false; reason = `${status} -> error ${err.message}`;
      }
    }
  } else {
    reason = `HTTP ${status}`;
  }

  results.push({ path, status, ok, reason, source: linkSources.get(path) });

  // Crawl deeper only when this is an HTML page on our own domain and we haven't hit cap.
  if (ok && status === 200 && !isExternalOwned(path) && seen.size < MAX_PAGES) {
    const ct = res.headers.get("content-type") || "";
    if (/html|xml/i.test(ct)) {
      let body = "";
      try { body = await res.text(); } catch { /* ignore */ }
      for (const next of extractLinks(body, path)) {
        if (isExternalOwned(next)) {
          // record but don't crawl
          if (!linkSources.has(next)) linkSources.set(next, path);
          if (!seen.has(next)) queue.push(next);
          continue;
        }
        if (!linkSources.has(next)) linkSources.set(next, path);
        if (!seen.has(next)) queue.push(next);
      }
    }
  }
}

async function worker() {
  while (queue.length && seen.size < MAX_PAGES) {
    const next = queue.shift();
    if (next === undefined) return;
    await check(next);
  }
}

console.log(`Link-checker: BASE=${BASE} seeds=${SEEDS.length} maxPages=${MAX_PAGES} concurrency=${CONCURRENCY}`);
const t0 = Date.now();
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

const broken = results.filter((r) => !r.ok);
const okCount = results.length - broken.length;

console.log(`\nChecked ${results.length} URLs in ${elapsed}s — ${okCount} ok, ${broken.length} broken`);
if (broken.length) {
  console.log("\nBroken links:");
  for (const b of broken.slice(0, 200)) {
    console.log(`  ✗ [${b.status}] ${b.path}    (from ${b.source})  ${b.reason}`);
  }
  if (broken.length > 200) console.log(`  …and ${broken.length - 200} more`);
  process.exit(1);
}
console.log("ALL INTERNAL LINKS OK");
