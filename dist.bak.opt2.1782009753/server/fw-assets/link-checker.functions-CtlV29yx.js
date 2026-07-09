import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
import { z } from "zod";
import { c as createServerFn } from "../server.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
async function assertAdmin(userId) {
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}
const INTERNAL_ALLOWED_PREFIXES = ["/s", "/l/", "/signup", "/login", "/inbox", "/auth/", "/account/", "/profile/", "/messages/", "/listings/", "/saved-listings", "/amenity/", "/amenities", "/public-pools/", "/referral", "/admin", "/sitemap.xml", "/pools-directory-sitemap.xml", "/landing-page", "/fw-assets/", "/api/"];
const MD_LINK_RE = /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
function classifyHref(href) {
  const h = href.trim();
  if (!h) return {
    kind: "malformed"
  };
  if (h.startsWith("#")) return {
    kind: "anchor"
  };
  if (h.startsWith("mailto:")) return {
    kind: "mail"
  };
  if (h.startsWith("tel:")) return {
    kind: "tel"
  };
  if (/^https?:\/\//i.test(h)) {
    try {
      const u = new URL(h);
      if (/(^|\.)poolrentalnearme\.com$/i.test(u.hostname) || /lovable\.app$/i.test(u.hostname)) {
        return {
          kind: "internal",
          path: u.pathname
        };
      }
      return {
        kind: "external"
      };
    } catch {
      return {
        kind: "malformed"
      };
    }
  }
  if (h.startsWith("/")) return {
    kind: "internal",
    path: h.split(/[?#]/)[0]
  };
  return {
    kind: "malformed"
  };
}
function isAllowedInternal(path) {
  if (path === "/") return true;
  return INTERNAL_ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(p));
}
const scanBrokenLinks_createServerFn_handler = createServerRpc({
  id: "f8bffb0d6856fb8be710642b6569dbbca019484cfcc96ba6b0fb919b00808934",
  name: "scanBrokenLinks",
  filename: "src/server/link-checker.functions.ts"
}, (opts) => scanBrokenLinks.__executeServer(opts));
const scanBrokenLinks = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  offset: z.number().int().min(0).default(0),
  batchSize: z.number().int().min(10).max(500).default(200),
  urlPrefix: z.string().trim().max(200).optional(),
  urlContains: z.string().trim().max(200).optional(),
  pageIds: z.array(z.string().uuid()).max(2e3).optional(),
  onlyMissingPPage: z.boolean().optional(),
  rangeStart: z.string().trim().max(200).optional(),
  rangeEnd: z.string().trim().max(200).optional()
}).parse(d ?? {})).handler(scanBrokenLinks_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const sb = supabaseAdmin;
  let q = sb.from("content_pages").select("id, url_path, title, body_markdown", {
    count: "exact"
  }).eq("status", "published");
  if (data.pageIds && data.pageIds.length) {
    q = q.in("id", data.pageIds);
  } else {
    const prefix = (data.urlPrefix || "/p/").trim();
    const safePrefix = prefix.startsWith("/p/") || prefix === "/p" ? prefix : "/p/";
    q = q.like("url_path", `${safePrefix}${safePrefix.endsWith("%") ? "" : "%"}`);
    if (data.urlContains) {
      const c = data.urlContains.replace(/[%_]/g, "");
      if (c) q = q.ilike("url_path", `%${c}%`);
    }
    if (data.rangeStart) q = q.gte("url_path", data.rangeStart);
    if (data.rangeEnd) q = q.lte("url_path", data.rangeEnd);
  }
  const {
    data: pages,
    count
  } = await q.order("url_path", {
    ascending: true
  }).range(data.offset, data.offset + data.batchSize - 1);
  const list = pages || [];
  const referencedPPaths = /* @__PURE__ */ new Set();
  const perPage = [];
  for (const p of list) {
    const body = p.body_markdown || "";
    const links = [];
    MD_LINK_RE.lastIndex = 0;
    let m;
    while ((m = MD_LINK_RE.exec(body)) !== null) {
      links.push({
        label: m[1],
        href: m[2]
      });
      const c = classifyHref(m[2]);
      if (c.kind === "internal" && c.path && c.path.startsWith("/p/")) {
        referencedPPaths.add(c.path);
      }
    }
    perPage.push({
      page: p,
      links
    });
  }
  const existing = /* @__PURE__ */ new Set();
  if (referencedPPaths.size) {
    const {
      data: rows
    } = await sb.from("content_pages").select("url_path").in("url_path", Array.from(referencedPPaths)).eq("status", "published");
    for (const r of rows || []) existing.add(r.url_path);
  }
  const broken = [];
  for (const {
    page,
    links
  } of perPage) {
    for (const {
      href,
      label
    } of links) {
      const c = classifyHref(href);
      if (c.kind === "external" || c.kind === "anchor" || c.kind === "mail" || c.kind === "tel") continue;
      if (c.kind === "malformed") {
        broken.push({
          page_id: page.id,
          page_url: page.url_path,
          page_title: page.title,
          href,
          label,
          reason: "malformed",
          suggestion: null
        });
        continue;
      }
      const path = c.path;
      if (path.startsWith("/p/")) {
        if (!existing.has(path)) {
          broken.push({
            page_id: page.id,
            page_url: page.url_path,
            page_title: page.title,
            href,
            label,
            reason: "missing_p_page"
          });
        }
      } else if (!isAllowedInternal(path)) {
        broken.push({
          page_id: page.id,
          page_url: page.url_path,
          page_title: page.title,
          href,
          label,
          reason: "unknown_internal_path",
          suggestion: null
        });
      }
    }
  }
  const filteredBroken = data.onlyMissingPPage ? broken.filter((b) => b.reason === "missing_p_page") : broken;
  broken.length = 0;
  broken.push(...filteredBroken);
  const STOP = /* @__PURE__ */ new Set(["the", "a", "an", "and", "or", "of", "in", "at", "to", "for", "by", "on", "near", "me", "you", "your", "is", "are", "with", "best", "top", "find", "how", "what", "pool", "pools", "rental", "rentals"]);
  const slugify = (s) => (s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const tokenize = (s) => slugify(s).split("-").filter((t) => t && !STOP.has(t) && t.length > 1);
  const pairKey = (p) => `${p.slug}::${p.labelSlug}`;
  const pairs = /* @__PURE__ */ new Map();
  const brokenSlugOf = (b) => {
    const c = classifyHref(b.href);
    return c.path ? c.path.replace(/^\/p\//, "").replace(/\/$/, "") : "";
  };
  for (const b of broken) {
    if (b.reason !== "missing_p_page") continue;
    const slug = brokenSlugOf(b);
    if (!slug) continue;
    const labelSlug = slugify(b.label);
    pairs.set(pairKey({
      slug,
      label: b.label,
      labelSlug
    }), {
      slug,
      label: b.label,
      labelSlug
    });
  }
  const suggestions = /* @__PURE__ */ new Map();
  for (const pair of pairs.values()) {
    const {
      slug,
      labelSlug
    } = pair;
    const slugTokens = tokenize(slug);
    const labelTokens = tokenize(labelSlug);
    const queryTokens = Array.from(/* @__PURE__ */ new Set([...slugTokens, ...labelTokens]));
    if (!queryTokens.length) continue;
    const legacyTry = async (s) => {
      if (!s) return null;
      const {
        data: data2
      } = await sb.from("content_pages").select("url_path").contains("legacy_slugs", [s]).eq("status", "published").limit(1);
      return data2 && data2.length ? data2[0].url_path : null;
    };
    const legacyHit = await legacyTry(slug) || await legacyTry(labelSlug);
    if (legacyHit) {
      suggestions.set(pairKey(pair), {
        href: legacyHit,
        reason: "legacy slug match",
        score: 100
      });
      continue;
    }
    const ranked = [...queryTokens].sort((a, b) => b.length - a.length).slice(0, 3);
    const candidates = /* @__PURE__ */ new Map();
    for (const tok of ranked) {
      const safe = tok.replace(/[%_]/g, "");
      if (safe.length < 3) continue;
      const [{
        data: bySlug
      }, {
        data: byTitle
      }] = await Promise.all([sb.from("content_pages").select("url_path, slug, title").ilike("slug", `%${safe}%`).eq("status", "published").like("url_path", "/p/%").limit(15), sb.from("content_pages").select("url_path, slug, title").ilike("title", `%${safe}%`).eq("status", "published").like("url_path", "/p/%").limit(15)]);
      for (const r of [...bySlug || [], ...byTitle || []]) {
        if (r?.url_path) candidates.set(r.url_path, r);
      }
      if (candidates.size >= 40) break;
    }
    if (!candidates.size) continue;
    const querySet = new Set(queryTokens);
    let best = null;
    for (const c of candidates.values()) {
      const cTokens = /* @__PURE__ */ new Set([...tokenize(c.slug || ""), ...tokenize(c.title || "")]);
      if (!cTokens.size) continue;
      let inter = 0;
      for (const t of querySet) if (cTokens.has(t)) inter++;
      const union = (/* @__PURE__ */ new Set([...querySet, ...cTokens])).size;
      const jaccard = union ? inter / union : 0;
      const exactSlug = c.slug === slug ? 0.4 : 0;
      const labelExact = labelSlug && c.slug === labelSlug ? 0.35 : 0;
      const prefix = c.slug && (c.slug.startsWith(slug) || slug.startsWith(c.slug)) ? 0.1 : 0;
      const lenPenalty = Math.min(0.15, Math.abs((c.slug || "").length - slug.length) / 200);
      const score = jaccard + exactSlug + labelExact + prefix - lenPenalty;
      if (score > 0.25 && (!best || score > best.score)) {
        const reason = exactSlug ? "exact slug" : labelExact ? "label matches slug" : inter > 1 ? `${inter} shared terms` : "similar content";
        best = {
          href: c.url_path,
          reason,
          score: Math.round(score * 100) / 100
        };
      }
    }
    if (best) suggestions.set(pairKey(pair), best);
  }
  for (const b of broken) {
    if (b.reason !== "missing_p_page") continue;
    const slug = brokenSlugOf(b);
    const k = `${slug}::${slugify(b.label)}`;
    const s = suggestions.get(k);
    if (s) b.suggestion = {
      href: s.href,
      reason: s.reason
    };
  }
  return {
    broken,
    offset: data.offset,
    batchSize: data.batchSize,
    total: count || 0,
    nextOffset: data.offset + list.length,
    done: data.offset + list.length >= (count || 0)
  };
});
const fixBrokenLink_createServerFn_handler = createServerRpc({
  id: "2d737fa8e538df6edc9c0188c2bbbdaddfbd82e04a912316858a140c0ff3b784",
  name: "fixBrokenLink",
  filename: "src/server/link-checker.functions.ts"
}, (opts) => fixBrokenLink.__executeServer(opts));
const fixBrokenLink = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  pageId: z.string().uuid(),
  href: z.string().min(1).max(2e3),
  action: z.enum(["replace", "unlink", "remove"]),
  newHref: z.string().min(1).max(2e3).optional()
}).parse(d)).handler(fixBrokenLink_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const sb = supabaseAdmin;
  const {
    data: page
  } = await sb.from("content_pages").select("id, body_markdown").eq("id", data.pageId).maybeSingle();
  if (!page || !page.body_markdown) return {
    ok: false,
    error: "Page or body not found"
  };
  const body = page.body_markdown;
  const esc = data.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\[([^\\]]+)\\]\\(${esc}(?:\\s+"[^"]*")?\\)`, "g");
  let replaced = 0;
  let next = body;
  if (data.action === "replace") {
    if (!data.newHref) return {
      ok: false,
      error: "newHref required"
    };
    next = body.replace(re, (_, label) => {
      replaced++;
      return `[${label}](${data.newHref})`;
    });
  } else if (data.action === "unlink") {
    next = body.replace(re, (_, label) => {
      replaced++;
      return label;
    });
  } else if (data.action === "remove") {
    next = body.replace(re, () => {
      replaced++;
      return "";
    });
  }
  if (!replaced) return {
    ok: false,
    error: "Link not found in body"
  };
  const {
    error
  } = await sb.from("content_pages").update({
    body_markdown: next,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", data.pageId);
  if (error) return {
    ok: false,
    error: error.message
  };
  return {
    ok: true,
    replaced
  };
});
const bulkFixBrokenLinks_createServerFn_handler = createServerRpc({
  id: "21a82b9573813de1d2b222dd58ef6921744c7d3b6a377d87dccd99ec34dabfe6",
  name: "bulkFixBrokenLinks",
  filename: "src/server/link-checker.functions.ts"
}, (opts) => bulkFixBrokenLinks.__executeServer(opts));
const bulkFixBrokenLinks = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  action: z.enum(["replace", "unlink", "remove"]),
  items: z.array(z.object({
    pageId: z.string().uuid(),
    href: z.string().min(1).max(2e3),
    newHref: z.string().min(1).max(2e3).optional()
  })).min(1).max(2e3)
}).parse(d)).handler(bulkFixBrokenLinks_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const sb = supabaseAdmin;
  const byPage = /* @__PURE__ */ new Map();
  for (const it of data.items) {
    if (data.action === "replace" && !it.newHref) continue;
    const arr = byPage.get(it.pageId) || [];
    arr.push({
      href: it.href,
      newHref: it.newHref
    });
    byPage.set(it.pageId, arr);
  }
  let pagesUpdated = 0;
  let linksFixed = 0;
  let linksSkipped = 0;
  const errors = [];
  const pageIds = Array.from(byPage.keys());
  for (let i = 0; i < pageIds.length; i += 100) {
    const chunk = pageIds.slice(i, i + 100);
    const {
      data: pages
    } = await sb.from("content_pages").select("id, body_markdown").in("id", chunk);
    for (const p of pages || []) {
      const items = byPage.get(p.id) || [];
      let body = p.body_markdown || "";
      if (!body) {
        linksSkipped += items.length;
        continue;
      }
      let pageReplaced = 0;
      for (const it of items) {
        const esc = it.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`\\[([^\\]]+)\\]\\(${esc}(?:\\s+"[^"]*")?\\)`, "g");
        let hits = 0;
        if (data.action === "replace") {
          body = body.replace(re, (_, label) => {
            hits++;
            return `[${label}](${it.newHref})`;
          });
        } else if (data.action === "unlink") {
          body = body.replace(re, (_, label) => {
            hits++;
            return label;
          });
        } else {
          body = body.replace(re, () => {
            hits++;
            return "";
          });
        }
        if (hits) pageReplaced += hits;
        else linksSkipped++;
      }
      if (pageReplaced > 0) {
        const {
          error
        } = await sb.from("content_pages").update({
          body_markdown: body,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("id", p.id);
        if (error) errors.push({
          pageId: p.id,
          error: error.message
        });
        else {
          pagesUpdated++;
          linksFixed += pageReplaced;
        }
      }
    }
  }
  return {
    ok: true,
    pagesUpdated,
    linksFixed,
    linksSkipped,
    errors
  };
});
export {
  bulkFixBrokenLinks_createServerFn_handler,
  fixBrokenLink_createServerFn_handler,
  scanBrokenLinks_createServerFn_handler
};
