#!/usr/bin/env node
/**
 * Bulk scan + auto-fix broken legacy /p/ links across all content_pages.
 *
 * Mirrors the logic of src/server/link-checker.functions.ts (scanBrokenLinks +
 * bulkFixBrokenLinks) but runs directly against Supabase using the service
 * role key so it can be executed from a script context.
 *
 * Usage:
 *   node scripts/bulk-fix-broken-links.mjs                # dry-run
 *   node scripts/bulk-fix-broken-links.mjs --apply        # apply replacements
 *   node scripts/bulk-fix-broken-links.mjs --apply --unlink-unmatched
 *
 * Flags:
 *   --apply               write changes (default: dry-run)
 *   --unlink-unmatched    for broken links with no high-confidence suggestion,
 *                         unlink (keep label, drop href). Default: leave alone.
 *   --min-score=0.5       suggestion confidence threshold (default 0.5)
 *   --batch=200           page batch size
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const UNLINK_UNMATCHED = process.argv.includes("--unlink-unmatched");
const MIN_SCORE = Number(
  (process.argv.find((a) => a.startsWith("--min-score=")) || "").split("=")[1] || 0.5,
);
const BATCH = Number(
  (process.argv.find((a) => a.startsWith("--batch=")) || "").split("=")[1] || 200,
);

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const INTERNAL_ALLOWED_PREFIXES = [
  "/s", "/l/", "/signup", "/login", "/inbox", "/auth/", "/account/",
  "/profile/", "/messages/", "/listings/", "/saved-listings",
  "/amenity/", "/amenities", "/public-pools/", "/referral", "/admin",
  "/sitemap.xml", "/pools-directory-sitemap.xml", "/landing-page",
  "/fw-assets/", "/api/",
];

// Dedicated /p/* routes that exist as React routes (not as content_pages rows)
// Discovered from src/routes/p.*.tsx
const ROUTE_BACKED_P_PATHS = new Set([
  "/p/all-locations",
  "/p/earnings-calculator",
  "/p/free-host-tools",
  "/p/hosting",
  "/p/how-it-works",
  "/p/pool-pros",
  "/p/privacy-request",
  "/p/giggster-vs-pool-rental-near-me",
  "/p/peerspace-vs-pool-rental-near-me",
  "/p/swimply-alternative-vs-pool-rental-near-me",
]);
const STOP = new Set([
  "the","a","an","and","or","of","in","at","to","for","by","on","near","me","you","your",
  "is","are","with","best","top","find","how","what","pool","pools","rental","rentals",
]);
const MD_LINK_RE = /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

const slugify = (s) =>
  (s || "").toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
const tokenize = (s) =>
  slugify(s).split("-").filter((t) => t && !STOP.has(t) && t.length > 1);

function classifyHref(href) {
  const h = (href || "").trim();
  if (!h) return { kind: "malformed" };
  if (h.startsWith("#")) return { kind: "anchor" };
  if (h.startsWith("mailto:")) return { kind: "mail" };
  if (h.startsWith("tel:")) return { kind: "tel" };
  if (/^https?:\/\//i.test(h)) {
    try {
      const u = new URL(h);
      if (/(^|\.)poolrentalnearme\.com$/i.test(u.hostname) || /lovable\.app$/i.test(u.hostname)) {
        return { kind: "internal", path: u.pathname };
      }
      return { kind: "external" };
    } catch { return { kind: "malformed" }; }
  }
  if (h.startsWith("/")) return { kind: "internal", path: h.split(/[?#]/)[0] };
  return { kind: "malformed" };
}
const isAllowedInternal = (p) =>
  p === "/" || INTERNAL_ALLOWED_PREFIXES.some((x) => p === x || p.startsWith(x));

async function fetchAllPages() {
  const all = [];
  let from = 0;
  const size = 1000;
  while (true) {
    const { data, error } = await sb
      .from("content_pages")
      .select("id, url_path, title, body_markdown")
      .eq("status", "published")
      .like("url_path", "/p/%")
      .order("url_path", { ascending: true })
      .range(from, from + size - 1);
    if (error) throw error;
    if (!data || !data.length) break;
    all.push(...data);
    if (data.length < size) break;
    from += size;
  }
  return all;
}

async function main() {
  console.log(`Scanning all published /p/* pages [${APPLY ? "APPLY" : "DRY-RUN"}]…`);
  const pages = await fetchAllPages();
  console.log(`  loaded ${pages.length} pages`);

  // Pass 1: collect referenced /p/ paths
  const referenced = new Set();
  const perPage = [];
  for (const p of pages) {
    const body = p.body_markdown || "";
    if (!body) { perPage.push({ page: p, links: [] }); continue; }
    const links = [];
    MD_LINK_RE.lastIndex = 0;
    let m;
    while ((m = MD_LINK_RE.exec(body)) !== null) {
      links.push({ label: m[1], href: m[2] });
      const c = classifyHref(m[2]);
      if (c.kind === "internal" && c.path && c.path.startsWith("/p/")) referenced.add(c.path);
    }
    perPage.push({ page: p, links });
  }
  console.log(`  found ${referenced.size} distinct /p/ link targets`);

  // Existence check (chunked)
  const existing = new Set();
  const refArr = Array.from(referenced);
  for (let i = 0; i < refArr.length; i += 500) {
    const chunk = refArr.slice(i, i + 500);
    const { data } = await sb.from("content_pages").select("url_path")
      .in("url_path", chunk).eq("status", "published");
    for (const r of data || []) existing.add(r.url_path);
  }
  console.log(`  ${existing.size} resolve, ${referenced.size - existing.size} missing`);

  // Build broken list (with route-backed awareness + auto rewrites)
  // Maps legacy non-/p paths AND legacy /p underscore-style paths to their
  // canonical targets when known. Anything not listed and unmatched will be
  // unlinked when --unlink-unmatched is passed.
  const AUTO_REWRITES = new Map([
    // missing top-level → /p/ canonical
    ["/hosting", "/p/hosting"],
    ["/earnings-calculator", "/p/earnings-calculator"],
    ["/how-it-works", "/p/how-it-works"],
    ["/all-locations", "/p/all-locations"],
    ["/free-host-tools", "/p/free-host-tools"],
    ["/pool-pros", "/p/pool-pros"],
    ["/privacy-request", "/p/privacy-request"],
    ["/host-signup", "/p/hosting"],
    ["/help-center", "/p/faq"],
    ["/academy", "/p/learningacademy"],
    ["/auth", "/login"],
    ["/app", "/s"],
    ["/host-protection", "/p/insurance-guide-for-pool-owners"],
    // legacy /p/* slugs that 404
    ["/p/sign-a-waiver", "/p/waivers"],
    ["/p/howithostsworks", "/p/how-it-works"],
    ["/p/become-a-pool-host", "/p/hosting"],
    ["/p/learning-academy", "/p/learningacademy"],
    ["/p/host-training-academy", "/p/learningacademy"],
    // legacy underscore boilerplate → existing canonical pages
    ["/faq", "/p/faq"],
    ["/insurance_guide_for_pool_owners", "/p/insurance-guide-for-pool-owners"],
    ["/make_money_renting_out_your_pool", "/p/hosting"],
    ["/host_help", "/p/faq"],
  ]);
  const broken = [];
  for (const { page, links } of perPage) {
    for (const { href, label } of links) {
      const c = classifyHref(href);
      if (["external","anchor","mail","tel"].includes(c.kind)) continue;
      if (c.kind === "malformed") {
        broken.push({ pageId: page.id, page_url: page.url_path, href, label, reason: "malformed" });
        continue;
      }
      const path = c.path;
      if (AUTO_REWRITES.has(path)) {
        const target = AUTO_REWRITES.get(path);
        broken.push({ pageId: page.id, page_url: page.url_path, href, label, reason: "auto_rewrite", autoTarget: target });
      } else if (path.startsWith("/p/")) {
        if (!existing.has(path) && !ROUTE_BACKED_P_PATHS.has(path)) {
          broken.push({ pageId: page.id, page_url: page.url_path, href, label, reason: "missing_p_page" });
        }
      } else if (!isAllowedInternal(path)) {
        broken.push({ pageId: page.id, page_url: page.url_path, href, label, reason: "unknown_internal_path" });
      }
    }
  }
  console.log(`  total broken links: ${broken.length}`);
  const byReason = broken.reduce((acc, b) => ((acc[b.reason] = (acc[b.reason] || 0) + 1), acc), {});
  console.log(`  by reason:`, byReason);

  // Suggestions for missing_p_page only
  const brokenSlugOf = (b) => {
    const c = classifyHref(b.href);
    return c.path ? c.path.replace(/^\/p\//, "").replace(/\/$/, "") : "";
  };
  const pairs = new Map();
  for (const b of broken) {
    if (b.reason !== "missing_p_page") continue;
    const slug = brokenSlugOf(b);
    if (!slug) continue;
    const labelSlug = slugify(b.label);
    pairs.set(`${slug}::${labelSlug}`, { slug, label: b.label, labelSlug });
  }
  console.log(`  scoring ${pairs.size} unique (slug,label) pairs…`);

  const suggestions = new Map();
  let i = 0;
  for (const pair of pairs.values()) {
    i++;
    if (i % 50 === 0) console.log(`    …${i}/${pairs.size}`);
    const { slug, labelSlug } = pair;
    const slugTokens = tokenize(slug);
    const labelTokens = tokenize(labelSlug);
    const queryTokens = Array.from(new Set([...slugTokens, ...labelTokens]));
    if (!queryTokens.length) continue;

    // legacy_slugs hit
    let legacyHit = null;
    for (const s of [slug, labelSlug]) {
      if (!s) continue;
      const { data } = await sb.from("content_pages")
        .select("url_path").contains("legacy_slugs", [s])
        .eq("status", "published").limit(1);
      if (data && data.length) { legacyHit = data[0].url_path; break; }
    }
    if (legacyHit) {
      suggestions.set(`${slug}::${labelSlug}`, { href: legacyHit, reason: "legacy slug match", score: 1.0 });
      continue;
    }

    const ranked = [...queryTokens].sort((a, b) => b.length - a.length).slice(0, 3);
    const candidates = new Map();
    for (const tok of ranked) {
      const safe = tok.replace(/[%_]/g, "");
      if (safe.length < 3) continue;
      const [{ data: bySlug }, { data: byTitle }] = await Promise.all([
        sb.from("content_pages").select("url_path, slug, title")
          .ilike("slug", `%${safe}%`).eq("status", "published").like("url_path", "/p/%").limit(15),
        sb.from("content_pages").select("url_path, slug, title")
          .ilike("title", `%${safe}%`).eq("status", "published").like("url_path", "/p/%").limit(15),
      ]);
      for (const r of [...(bySlug || []), ...(byTitle || [])]) {
        if (r?.url_path) candidates.set(r.url_path, r);
      }
      if (candidates.size >= 40) break;
    }
    if (!candidates.size) continue;

    const querySet = new Set(queryTokens);
    let best = null;
    for (const c of candidates.values()) {
      const cTokens = new Set([...tokenize(c.slug || ""), ...tokenize(c.title || "")]);
      if (!cTokens.size) continue;
      let inter = 0;
      for (const t of querySet) if (cTokens.has(t)) inter++;
      const union = new Set([...querySet, ...cTokens]).size;
      const jaccard = union ? inter / union : 0;
      const exactSlug = c.slug === slug ? 0.4 : 0;
      const labelExact = labelSlug && c.slug === labelSlug ? 0.35 : 0;
      const prefix = c.slug && (c.slug.startsWith(slug) || slug.startsWith(c.slug)) ? 0.1 : 0;
      const lenPenalty = Math.min(0.15, Math.abs((c.slug || "").length - slug.length) / 200);
      const score = jaccard + exactSlug + labelExact + prefix - lenPenalty;
      if (score > 0.25 && (!best || score > best.score)) {
        best = { href: c.url_path, reason: exactSlug ? "exact slug" : labelExact ? "label matches slug" : `${inter} shared terms`, score: Math.round(score * 100) / 100 };
      }
    }
    if (best) suggestions.set(`${slug}::${labelSlug}`, best);
  }
  console.log(`  generated ${suggestions.size} suggestions`);

  // Attach + classify actions
  const replaceItems = [];
  const unlinkItems = [];
  const unmatched = [];
  for (const b of broken) {
    if (b.reason === "auto_rewrite") {
      replaceItems.push({ pageId: b.pageId, href: b.href, newHref: b.autoTarget, score: 1.0, reason: "auto rewrite" });
    } else if (b.reason === "missing_p_page") {
      const k = `${brokenSlugOf(b)}::${slugify(b.label)}`;
      const s = suggestions.get(k);
      if (s && s.score >= MIN_SCORE) {
        replaceItems.push({ pageId: b.pageId, href: b.href, newHref: s.href, score: s.score, reason: s.reason });
      } else if (UNLINK_UNMATCHED) {
        unlinkItems.push({ pageId: b.pageId, href: b.href });
      } else {
        unmatched.push(b);
      }
    } else if (b.reason === "unknown_internal_path" && UNLINK_UNMATCHED) {
      unlinkItems.push({ pageId: b.pageId, href: b.href });
    } else {
      unmatched.push(b);
    }
  }
  console.log(`\nPlanned actions:`);
  console.log(`  replace (score≥${MIN_SCORE}): ${replaceItems.length}`);
  console.log(`  unlink:                       ${unlinkItems.length}`);
  console.log(`  unmatched (no action):        ${unmatched.length}`);

  // Sample output
  console.log(`\nSample replacements:`);
  for (const it of replaceItems.slice(0, 10)) {
    console.log(`  ${it.href}  →  ${it.newHref}   [${it.reason} • ${it.score}]`);
  }
  if (unmatched.length) {
    console.log(`\nSample unmatched broken links:`);
    for (const b of unmatched.slice(0, 10)) {
      console.log(`  on ${b.page_url}  href=${b.href}  (${b.reason})`);
    }
  }

  if (!APPLY) {
    console.log(`\n[dry-run] no changes written. Re-run with --apply to commit.`);
    return;
  }

  // Apply: group by page
  const work = new Map(); // pageId -> { replace: [...], unlink: [...] }
  const push = (pageId, kind, item) => {
    const e = work.get(pageId) || { replace: [], unlink: [] };
    e[kind].push(item);
    work.set(pageId, e);
  };
  for (const it of replaceItems) push(it.pageId, "replace", it);
  for (const it of unlinkItems) push(it.pageId, "unlink", it);

  const pageIds = Array.from(work.keys());
  let pagesUpdated = 0, linksFixed = 0, errors = 0;
  for (let off = 0; off < pageIds.length; off += 100) {
    const chunk = pageIds.slice(off, off + 100);
    const { data: pgs } = await sb.from("content_pages").select("id, body_markdown").in("id", chunk);
    for (const p of pgs || []) {
      const e = work.get(p.id);
      let body = p.body_markdown || "";
      if (!body) continue;
      let pageHits = 0;
      for (const it of e.replace) {
        const esc = it.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`\\[([^\\]]+)\\]\\(${esc}(?:\\s+"[^"]*")?\\)`, "g");
        body = body.replace(re, (_, label) => { pageHits++; return `[${label}](${it.newHref})`; });
      }
      for (const it of e.unlink) {
        const esc = it.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`\\[([^\\]]+)\\]\\(${esc}(?:\\s+"[^"]*")?\\)`, "g");
        body = body.replace(re, (_, label) => { pageHits++; return label; });
      }
      if (pageHits > 0) {
        const { error } = await sb.from("content_pages").update({
          body_markdown: body, updated_at: new Date().toISOString(),
        }).eq("id", p.id);
        if (error) { errors++; console.error(`  ✗ ${p.id}: ${error.message}`); }
        else { pagesUpdated++; linksFixed += pageHits; }
      }
    }
    console.log(`  applied through page ${Math.min(off + 100, pageIds.length)}/${pageIds.length}`);
  }

  console.log(`\nDone. pagesUpdated=${pagesUpdated} linksFixed=${linksFixed} errors=${errors}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
