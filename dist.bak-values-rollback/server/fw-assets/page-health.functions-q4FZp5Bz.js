import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
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
function wordCount(s) {
  if (!s) return 0;
  const cleaned = s.replace(/<[^>]+>/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[[^\]]*\]\([^)]*\)/g, " ").replace(/[#*_`~>|-]+/g, " ");
  return cleaned.split(/\s+/).filter(Boolean).length;
}
function daysBetween(a, b) {
  return Math.floor((a.getTime() - b.getTime()) / 864e5);
}
const getPageHealthReport_createServerFn_handler = createServerRpc({
  id: "c18a39484f43ede3060f6d09ae1e903aa32aa236b3330d6d931416e2019d4c81",
  name: "getPageHealthReport",
  filename: "src/lib/page-health.functions.ts"
}, (opts) => getPageHealthReport.__executeServer(opts));
const getPageHealthReport = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  limit: z.number().int().min(1).max(5e3).optional()
}).parse(data ?? {})).handler(getPageHealthReport_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const limit = data.limit ?? 2e3;
  const now = /* @__PURE__ */ new Date();
  const start28 = new Date(now.getTime() - 28 * 864e5);
  const start56 = new Date(now.getTime() - 56 * 864e5);
  try {
    const {
      data: pages,
      error: pagesErr
    } = await supabaseAdmin.from("content_pages").select("url_path, slug, template_type, locale, status, in_sitemap, body_markdown, raw_html, hero_image_url, seo_title, seo_description, updated_at, content_refreshed_at").eq("status", "published").not("url_path", "is", null).order("updated_at", {
      ascending: false
    }).limit(limit);
    if (pagesErr) throw pagesErr;
    const pageRows = pages ?? [];
    const {
      data: gsc,
      error: gscErr
    } = await supabaseAdmin.from("gsc_daily_pages").select("url_path, date, clicks, impressions, position").gte("date", start56.toISOString().slice(0, 10));
    if (gscErr) throw gscErr;
    const cutoffStr = start28.toISOString().slice(0, 10);
    const agg = /* @__PURE__ */ new Map();
    for (const r of gsc ?? []) {
      const cur = agg.get(r.url_path) ?? {
        c28: 0,
        i28: 0,
        pos28Sum: 0,
        pos28N: 0,
        c56: 0
      };
      const inRecent = r.date >= cutoffStr;
      if (inRecent) {
        cur.c28 += r.clicks ?? 0;
        cur.i28 += r.impressions ?? 0;
        if (r.position != null) {
          cur.pos28Sum += Number(r.position) * (r.impressions ?? 0);
          cur.pos28N += r.impressions ?? 0;
        }
      } else {
        cur.c56 += r.clicks ?? 0;
      }
      agg.set(r.url_path, cur);
    }
    const rows = pageRows.map((p) => {
      const wc = wordCount(p.body_markdown ?? p.raw_html ?? "");
      const refreshedAt = p.content_refreshed_at ? new Date(p.content_refreshed_at) : new Date(p.updated_at);
      const daysSince = daysBetween(now, refreshedAt);
      const g = agg.get(p.url_path) ?? {
        c28: 0,
        i28: 0,
        pos28Sum: 0,
        pos28N: 0,
        c56: 0
      };
      const ctr = g.i28 > 0 ? g.c28 / g.i28 : null;
      const pos = g.pos28N > 0 ? g.pos28Sum / g.pos28N : null;
      const deltaPct = g.c56 > 0 ? (g.c28 - g.c56) / g.c56 * 100 : g.c28 > 0 ? 100 : null;
      const badges = [];
      if (g.c28 === 0 && g.i28 > 50) badges.push("zero-click");
      if (pos != null && pos >= 8 && pos <= 20 && g.i28 > 100) badges.push("striking-distance");
      if (deltaPct != null && deltaPct <= -20 && g.c56 >= 5) badges.push("decaying");
      if (daysSince >= 90) badges.push("stale");
      if (wc < 500) badges.push("thin");
      if (!p.hero_image_url) badges.push("no-hero");
      if (!p.seo_title || !p.seo_description) badges.push("missing-meta");
      if (!p.in_sitemap) badges.push("not-in-sitemap");
      let score = 100;
      if (wc < 500) score -= 20;
      else if (wc < 1e3) score -= 8;
      if (!p.hero_image_url) score -= 8;
      if (!p.seo_title) score -= 8;
      if (!p.seo_description) score -= 8;
      if (!p.in_sitemap) score -= 10;
      if (daysSince >= 180) score -= 15;
      else if (daysSince >= 90) score -= 7;
      if (badges.includes("decaying")) score -= 15;
      if (badges.includes("zero-click")) score -= 5;
      if (g.c28 >= 50) score += 5;
      score = Math.max(0, Math.min(100, score));
      return {
        url_path: p.url_path,
        slug: p.slug,
        template_type: p.template_type,
        locale: p.locale ?? "en",
        status: p.status,
        in_sitemap: !!p.in_sitemap,
        word_count: wc,
        has_hero: !!p.hero_image_url,
        has_seo_title: !!p.seo_title,
        has_seo_description: !!p.seo_description,
        updated_at: p.updated_at,
        content_refreshed_at: p.content_refreshed_at,
        days_since_refresh: daysSince,
        clicks_28d: g.c28,
        impressions_28d: g.i28,
        ctr_28d: ctr,
        position_28d: pos,
        clicks_prev_28d: g.c56,
        clicks_delta_pct: deltaPct,
        health_score: score,
        badges
      };
    });
    return {
      rows,
      generated_at: now.toISOString(),
      total_pages: rows.length,
      error: null
    };
  } catch (e) {
    console.error("[page-health] failed", e);
    return {
      rows: [],
      generated_at: (/* @__PURE__ */ new Date()).toISOString(),
      total_pages: 0,
      error: e instanceof Error ? e.message : "Failed to load page health"
    };
  }
});
const getCannibalizationReport_createServerFn_handler = createServerRpc({
  id: "1a21d16d9e7fc1fed1e381906178ff4a366fb21764bfd1c871ca0673330d2dcc",
  name: "getCannibalizationReport",
  filename: "src/lib/page-health.functions.ts"
}, (opts) => getCannibalizationReport.__executeServer(opts));
const getCannibalizationReport = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  minImpressions: z.number().int().min(1).max(1e5).optional(),
  minPagesPerQuery: z.number().int().min(2).max(10).optional(),
  limit: z.number().int().min(1).max(500).optional()
}).parse(data ?? {})).handler(getCannibalizationReport_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const minImp = data.minImpressions ?? 50;
  const minPages = data.minPagesPerQuery ?? 2;
  const limit = data.limit ?? 100;
  const now = /* @__PURE__ */ new Date();
  const cutoff = new Date(now.getTime() - 28 * 864e5).toISOString().slice(0, 10);
  try {
    const {
      data: rows,
      error
    } = await supabaseAdmin.from("gsc_query_data").select("query, url_path, clicks, impressions, position, captured_at").gte("captured_at", cutoff).limit(5e4);
    if (error) throw error;
    const byQuery = /* @__PURE__ */ new Map();
    for (const r of rows ?? []) {
      if (!r.query || !r.url_path) continue;
      let pages = byQuery.get(r.query);
      if (!pages) {
        pages = /* @__PURE__ */ new Map();
        byQuery.set(r.query, pages);
      }
      const cur = pages.get(r.url_path) ?? {
        clicks: 0,
        impressions: 0,
        posSum: 0,
        posN: 0
      };
      cur.clicks += r.clicks ?? 0;
      cur.impressions += r.impressions ?? 0;
      if (r.position != null) {
        cur.posSum += Number(r.position) * (r.impressions ?? 0);
        cur.posN += r.impressions ?? 0;
      }
      pages.set(r.url_path, cur);
    }
    const groups = [];
    for (const [query, pages] of byQuery.entries()) {
      const list = Array.from(pages.entries()).map(([url_path, a]) => ({
        url_path,
        clicks: a.clicks,
        impressions: a.impressions,
        position: a.posN > 0 ? a.posSum / a.posN : null
      })).filter((p) => p.impressions >= 5);
      if (list.length < minPages) continue;
      const totalImp = list.reduce((s, p) => s + p.impressions, 0);
      if (totalImp < minImp) continue;
      const totalClicks = list.reduce((s, p) => s + p.clicks, 0);
      list.sort((a, b) => b.impressions - a.impressions);
      groups.push({
        query,
        total_clicks: totalClicks,
        total_impressions: totalImp,
        pages: list
      });
    }
    groups.sort((a, b) => b.total_impressions - a.total_impressions);
    return {
      groups: groups.slice(0, limit),
      generated_at: now.toISOString(),
      error: null
    };
  } catch (e) {
    console.error("[cannibalization] failed", e);
    return {
      groups: [],
      generated_at: (/* @__PURE__ */ new Date()).toISOString(),
      error: e instanceof Error ? e.message : "Failed to load cannibalization report"
    };
  }
});
export {
  getCannibalizationReport_createServerFn_handler,
  getPageHealthReport_createServerFn_handler
};
