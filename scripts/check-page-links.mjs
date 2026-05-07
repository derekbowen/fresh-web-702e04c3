#!/usr/bin/env node
/**
 * Generic link audit: render one or more TARGET paths against BASE_URL,
 * extract every <a href>, and fail if any link points to a known-404
 * prefix or an unregistered top-level route. Live-checks a sample of
 * /p/* links to catch DB rows that produce broken URLs.
 *
 * Env:
 *   BASE_URL          default fresh-web dev URL
 *   TARGETS           comma-separated paths (default "/p/all-locations")
 *   SAMPLE_PER_GROUP  number of links per group to live-check (default 10)
 *   TIMEOUT_MS        per-request timeout (default 15000)
 */

const BASE = (process.env.BASE_URL || "https://project--4831238c-ae4b-468a-bfd8-41cba26ba0b1-dev.lovable.app").replace(/\/$/, "");
const SAMPLE = Number(process.env.SAMPLE_PER_GROUP || 10);
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 15000);
const TARGETS = (process.env.TARGETS || "/p/all-locations").split(",").map((s) => s.trim()).filter(Boolean);

const ALLOWED_PREFIXES = [
  "/p/", "/l/", "/s", "/landing-page", "/sitemap", "/robots.txt", "/fw-assets/",
  "/privacy-policy", "/terms-of-service",
  "/login", "/signup", "/inbox", "/auth/", "/account/", "/profile/",
  "/messages/", "/listings/", "/saved-listings",
  "/amenity/", "/amenities", "/public-pools", "/referral",
];

const FORBIDDEN_PREFIXES = [
  "/pool-rental/", "/pool-rental-laws/", "/pool-builders/",
  "/directory", "/blog", "/academy", "/help-center",
  "/providers", "/host-tools", "/category/",
];

const isAllowed = (p) => p === "/" || ALLOWED_PREFIXES.some((x) => p === x || p.startsWith(x));
const isForbidden = (p) => FORBIDDEN_PREFIXES.some((x) => p === x || p.startsWith(x + "/") || p === x.replace(/\/$/, ""));

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

let hadFailure = false;

for (const TARGET of TARGETS) {
  console.log(`\n=== check-page-links: BASE=${BASE} target=${TARGET} ===`);
  const res = await fetchWithTimeout(BASE + TARGET);
  if (res.status !== 200) {
    console.error(`✗ ${TARGET} returned HTTP ${res.status}`);
    hadFailure = true;
    continue;
  }
  const html = await res.text();
  const hrefs = extractHrefs(html);
  console.log(`Extracted ${hrefs.length} <a href> values`);

  const paths = [...new Set(hrefs.map(classify).filter(Boolean))];
  console.log(`Normalized to ${paths.length} unique internal paths`);

  const forbidden = paths.filter(isForbidden);
  const unregistered = paths.filter((p) => !isForbidden(p) && !isAllowed(p));

  const failures = [];
  if (forbidden.length) failures.push({ kind: "forbidden-prefix", paths: forbidden });
  if (unregistered.length) failures.push({ kind: "unregistered-route", paths: unregistered });

  const buckets = new Map();
  for (const p of paths) {
    if (!isAllowed(p) || isForbidden(p)) continue;
    if (!p.startsWith("/p/") && p !== "/" && !p.startsWith("/landing-page")) continue;
    const key = p.startsWith("/p/") ? "/p/" : "other";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(p);
  }
  const sampled = [];
  for (const [, list] of buckets) {
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
        const r = await fetchWithTimeout(BASE + p, { method: "GET", headers: { "user-agent": "check-page-links" } });
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
    console.error(`\n✗ ${TARGET} link audit FAILED`);
    for (const f of failures) {
      console.error(`\n  [${f.kind}] ${f.paths.length} issue(s):`);
      for (const p of f.paths.slice(0, 50)) {
        console.error("   - " + (typeof p === "string" ? p : JSON.stringify(p)));
      }
      if (f.paths.length > 50) console.error(`   …and ${f.paths.length - 50} more`);
    }
    hadFailure = true;
  } else {
    console.log(`✓ ${TARGET} OK (${paths.length} links, ${sampled.length} live-checked)`);
  }
}

process.exit(hadFailure ? 1 : 0);
