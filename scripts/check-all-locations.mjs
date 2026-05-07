#!/usr/bin/env node
/**
 * Renders /p/all-locations against a deployed BASE_URL, extracts every
 * <a href> in the rendered HTML, and fails if any link points to a
 * known-404 prefix or an unregistered top-level route.
 *
 * This is the safety net for the all-locations directory page. It runs in
 * CI alongside check-internal-links and additionally HEAD-checks a sample
 * of generated links to catch DB rows that produce broken URLs.
 *
 * Env:
 *   BASE_URL          default https://project--<id>-dev.lovable.app
 *   SAMPLE_PER_GROUP  number of links per group to live-check (default 10)
 *   TIMEOUT_MS        per-request timeout (default 15000)
 */

const BASE = (process.env.BASE_URL || "https://project--4831238c-ae4b-468a-bfd8-41cba26ba0b1-dev.lovable.app").replace(/\/$/, "");
const SAMPLE = Number(process.env.SAMPLE_PER_GROUP || 10);
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 15000);
const TARGET = "/p/all-locations";

// Top-level path prefixes that resolve in production (nginx forwards them
// to fresh-web or to one of the sibling Lovable apps / Sharetribe).
const ALLOWED_PREFIXES = [
  "/p/", "/l/", "/s", "/landing-page", "/sitemap", "/robots.txt", "/fw-assets/",
  "/privacy-policy", "/terms-of-service",
  // Sharetribe
  "/login", "/signup", "/inbox", "/auth/", "/account/", "/profile/",
  "/messages/", "/listings/", "/saved-listings",
  // Sibling Lovable apps
  "/amenity/", "/amenities", "/public-pools", "/referral",
];

// Paths that look like routes inside this codebase but 404 in production
// because nginx does not forward them. Linking to any of these from
// /p/all-locations is a hard failure.
const FORBIDDEN_PREFIXES = [
  "/pool-rental/", "/pool-rental-laws/", "/pool-builders/",
  "/directory", "/blog", "/academy", "/help-center",
  "/providers", "/host-tools", "/category/",
];

const isAllowed = (p) =>
  p === "/" || ALLOWED_PREFIXES.some((x) => p === x || p.startsWith(x));
const isForbidden = (p) =>
  FORBIDDEN_PREFIXES.some((x) => p === x || p.startsWith(x + "/") || p === x.replace(/\/$/, ""));

async function fetchWithTimeout(url, init = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctl.signal, redirect: "manual" });
  } finally {
    clearTimeout(t);
  }
}

function extractHrefs(html) {
  const out = new Set();
  const re = /<a\b[^>]*\bhref=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) out.add(m[1]);
  return [...out];
}

function classify(href) {
  const h = href.split("#")[0].trim();
  if (!h || h.startsWith("mailto:") || h.startsWith("tel:")) return null;
  let path;
  if (/^https?:\/\//i.test(h)) {
    try {
      const u = new URL(h);
      if (u.origin !== BASE && !/poolrentalnearme\.com$/i.test(u.hostname)) return null;
      path = u.pathname + (u.search || "");
    } catch { return null; }
  } else if (h.startsWith("/")) {
    path = h;
  } else return null;
  return path;
}

console.log(`check-all-locations: BASE=${BASE} target=${TARGET}`);
const res = await fetchWithTimeout(BASE + TARGET);
if (res.status !== 200) {
  console.error(`✗ ${TARGET} returned HTTP ${res.status}`);
  process.exit(1);
}
const html = await res.text();
const hrefs = extractHrefs(html);
console.log(`Extracted ${hrefs.length} <a href> values from ${TARGET}`);

const paths = [...new Set(hrefs.map(classify).filter(Boolean))];
console.log(`Normalized to ${paths.length} unique internal paths`);

const forbidden = paths.filter(isForbidden);
const unregistered = paths.filter((p) => !isForbidden(p) && !isAllowed(p));

const failures = [];
if (forbidden.length) failures.push({ kind: "forbidden-prefix", paths: forbidden });
if (unregistered.length) failures.push({ kind: "unregistered-route", paths: unregistered });

// Live-check a random sample of links per prefix bucket to catch
// DB-generated /p/<slug> URLs that 404 (typo in slug, deleted page, etc).
const buckets = new Map();
for (const p of paths) {
  if (!isAllowed(p) || isForbidden(p)) continue;
  // Only live-check fresh-web-owned paths. /s and /l/ resolve through the
  // prod nginx proxy to Sharetribe and 404 on the bare lovable.app host.
  if (!p.startsWith("/p/") && p !== "/" && !p.startsWith("/landing-page")) continue;
  const key = p.startsWith("/p/") ? "/p/" : "other";
  if (!buckets.has(key)) buckets.set(key, []);
  buckets.get(key).push(p);
}
const sampled = [];
for (const [, list] of buckets) {
  // shuffle then take SAMPLE
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  sampled.push(...list.slice(0, SAMPLE));
}
console.log(`Live-checking ${sampled.length} sampled links...`);

const broken = [];
await Promise.all(
  sampled.map(async (p) => {
    try {
      const r = await fetchWithTimeout(BASE + p, { method: "GET", headers: { "user-agent": "all-locations-check" } });
      if (r.status === 200) return;
      if ((r.status === 301 || r.status === 308) && r.headers.get("location")) {
        const loc = r.headers.get("location");
        const t = loc.startsWith("http") ? loc : BASE + (loc.startsWith("/") ? loc : "/" + loc);
        const r2 = await fetchWithTimeout(t);
        if (r2.status === 200) return;
        broken.push({ path: p, status: `${r.status}->${r2.status}`, loc });
        return;
      }
      broken.push({ path: p, status: r.status });
    } catch (e) {
      broken.push({ path: p, status: 0, error: e.message });
    }
  }),
);
if (broken.length) failures.push({ kind: "live-404", paths: broken });

if (failures.length) {
  console.error("\n✗ /p/all-locations link audit FAILED");
  for (const f of failures) {
    console.error(`\n  [${f.kind}] ${f.paths.length} issue(s):`);
    for (const p of f.paths.slice(0, 50)) {
      console.error("   - " + (typeof p === "string" ? p : JSON.stringify(p)));
    }
    if (f.paths.length > 50) console.error(`   …and ${f.paths.length - 50} more`);
  }
  process.exit(1);
}

console.log(`\n✓ all-locations link audit OK (${paths.length} links, ${sampled.length} live-checked)`);
