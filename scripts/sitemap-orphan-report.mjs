#!/usr/bin/env node
/**
 * Sitemap → link-graph sanity check.
 *
 * 1. Pulls every <loc> from /sitemap.xml + every nested sitemap.
 * 2. Verifies each URL resolves to 200.
 * 3. BFS-crawls from "/" up to MAX_DEPTH (default 3) to find which sitemap
 *    URLs are reachable from internal navigation. Anything unreachable is
 *    an orphan candidate.
 *
 * Output: /mnt/documents/link-graph-report.csv
 *
 * Usage:
 *   BASE_URL=https://www.poolrentalnearme.com node scripts/sitemap-orphan-report.mjs
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const BASE = (process.env.BASE_URL || "https://www.poolrentalnearme.com").replace(/\/$/, "");
const MAX_DEPTH = Number(process.env.MAX_DEPTH || 3);
const MAX_CRAWL = Number(process.env.MAX_CRAWL || 800);
const SAMPLE = Number(process.env.SAMPLE || 0); // 0 = check all
const OUT = process.env.OUT || "/mnt/documents/link-graph-report.csv";
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 15000);

async function fetchT(url, opts = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try { return await fetch(url, { ...opts, signal: ctl.signal }); }
  finally { clearTimeout(t); }
}

async function fetchSitemapUrls(sitemapUrl, acc = new Set(), seen = new Set()) {
  if (seen.has(sitemapUrl)) return acc;
  seen.add(sitemapUrl);
  let body = "";
  try { body = await (await fetchT(sitemapUrl)).text(); } catch { return acc; }
  const locs = Array.from(body.matchAll(/<loc>([^<]+)<\/loc>/gi)).map((m) => m[1].trim());
  // If this is a sitemap-index, recurse; otherwise collect URLs.
  if (/<sitemapindex/i.test(body)) {
    for (const l of locs) await fetchSitemapUrls(l, acc, seen);
  } else {
    for (const l of locs) acc.add(l);
  }
  return acc;
}

function pathOf(u) {
  try { return new URL(u).pathname; } catch { return null; }
}

async function bfsReachable(startPath, baseHost) {
  const reach = new Set([startPath]);
  const queue = [{ p: startPath, d: 0 }];
  let crawled = 0;
  while (queue.length && crawled < MAX_CRAWL) {
    const { p, d } = queue.shift();
    if (d >= MAX_DEPTH) continue;
    crawled++;
    let html = "";
    try {
      const r = await fetchT(BASE + p);
      if (!r.ok) continue;
      const ct = r.headers.get("content-type") || "";
      if (!/html/i.test(ct)) continue;
      html = await r.text();
    } catch { continue; }
    for (const m of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
      let href = m[1].split("#")[0].trim();
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
      let np = null;
      if (href.startsWith("/")) np = href;
      else if (/^https?:\/\//i.test(href)) {
        try { const u = new URL(href); if (u.host === baseHost) np = u.pathname; } catch {}
      }
      if (!np) continue;
      if (!reach.has(np)) {
        reach.add(np);
        queue.push({ p: np, d: d + 1 });
      }
    }
  }
  return reach;
}

console.log(`Pulling sitemap URLs from ${BASE}/sitemap.xml ...`);
const all = Array.from(await fetchSitemapUrls(`${BASE}/sitemap.xml`));
console.log(`Found ${all.length} URLs in sitemaps.`);

let urls = all;
if (SAMPLE > 0 && SAMPLE < all.length) {
  urls = [];
  for (let i = 0; i < SAMPLE; i++) urls.push(all[Math.floor((i / SAMPLE) * all.length)]);
  console.log(`Sampling ${urls.length} URLs.`);
}

const baseHost = new URL(BASE).host;
console.log(`BFS-crawling from / depth ${MAX_DEPTH} (max ${MAX_CRAWL} pages)...`);
const reachable = await bfsReachable("/", baseHost);
console.log(`Reachable internal paths: ${reachable.size}`);

console.log(`Verifying ${urls.length} sitemap URLs return 200...`);
const rows = [["url", "path", "status", "reachable_within_depth"]];
let ok = 0, broken = 0, orphan = 0;
let i = 0;
const CONCURRENCY = 8;
async function worker() {
  while (true) {
    const idx = i++;
    if (idx >= urls.length) return;
    const u = urls[idx];
    const p = pathOf(u);
    let status = 0;
    try { status = (await fetchT(u, { redirect: "manual" })).status; } catch { status = 0; }
    const reach = p && reachable.has(p);
    rows.push([u, p ?? "", String(status), reach ? "yes" : "no"]);
    if (status === 200) ok++; else broken++;
    if (status === 200 && !reach) orphan++;
    if (idx % 100 === 0) console.log(`  …${idx}/${urls.length}`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

await mkdir(dirname(OUT), { recursive: true });
const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
await writeFile(OUT, csv, "utf8");

console.log(`\nWrote ${OUT}`);
console.log(`  total=${urls.length}  200=${ok}  broken=${broken}  orphans(200 but unreachable in ${MAX_DEPTH} hops)=${orphan}`);
