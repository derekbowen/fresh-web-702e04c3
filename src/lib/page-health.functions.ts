/**
 * Page Health Dashboard — server functions.
 *
 * Read-only aggregations over content_pages + gsc_daily_pages + gsc_query_data.
 * All access goes through supabaseAdmin (content_pages is server-only; see
 * mem://security/content-pages-access). Both functions return typed empty
 * shapes on error so the UI always renders.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export interface PageHealthRow {
  url_path: string;
  slug: string | null;
  template_type: string | null;
  locale: string;
  status: string;
  in_sitemap: boolean;
  word_count: number;
  has_hero: boolean;
  has_seo_title: boolean;
  has_seo_description: boolean;
  updated_at: string;
  content_refreshed_at: string | null;
  days_since_refresh: number | null;
  // GSC last 28d
  clicks_28d: number;
  impressions_28d: number;
  ctr_28d: number | null;
  position_28d: number | null;
  // GSC prior 28d (days 29..56) for trend
  clicks_prev_28d: number;
  clicks_delta_pct: number | null;
  // Derived
  health_score: number; // 0-100
  badges: string[];
}

export interface PageHealthReport {
  rows: PageHealthRow[];
  generated_at: string;
  total_pages: number;
  error: string | null;
}

function wordCount(s: string | null | undefined): number {
  if (!s) return 0;
  // strip HTML tags + markdown image/link syntax noise, then split.
  const cleaned = s
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#*_`~>|-]+/g, " ");
  return cleaned.split(/\s+/).filter(Boolean).length;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86400000);
}

export const getPageHealthReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        limit: z.number().int().min(1).max(5000).optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }): Promise<PageHealthReport> => {
    await assertAdmin((context as any).userId);
    const limit = data.limit ?? 2000;
    const now = new Date();
    const start28 = new Date(now.getTime() - 28 * 86400000);
    const start56 = new Date(now.getTime() - 56 * 86400000);

    try {
      // Pull published content pages we care about.
      const { data: pages, error: pagesErr } = await (supabaseAdmin as any)
        .from("content_pages")
        .select(
          "url_path, slug, template_type, locale, status, in_sitemap, body_markdown, raw_html, hero_image_url, seo_title, seo_description, updated_at, content_refreshed_at",
        )
        .eq("status", "published")
        .not("url_path", "is", null)
        .order("updated_at", { ascending: false })
        .limit(limit);

      if (pagesErr) throw pagesErr;
      const pageRows = (pages ?? []) as Array<{
        url_path: string;
        slug: string | null;
        template_type: string | null;
        locale: string | null;
        status: string;
        in_sitemap: boolean;
        body_markdown: string | null;
        raw_html: string | null;
        hero_image_url: string | null;
        seo_title: string | null;
        seo_description: string | null;
        updated_at: string;
        content_refreshed_at: string | null;
      }>;

      // GSC last 56d, aggregated in JS by url_path into two windows.
      const { data: gsc, error: gscErr } = await (supabaseAdmin as any)
        .from("gsc_daily_pages")
        .select("url_path, date, clicks, impressions, position")
        .gte("date", start56.toISOString().slice(0, 10));
      if (gscErr) throw gscErr;

      const cutoffStr = start28.toISOString().slice(0, 10);
      const agg = new Map<
        string,
        { c28: number; i28: number; pos28Sum: number; pos28N: number; c56: number }
      >();
      for (const r of (gsc ?? []) as Array<{
        url_path: string;
        date: string;
        clicks: number;
        impressions: number;
        position: number | null;
      }>) {
        const cur = agg.get(r.url_path) ?? {
          c28: 0,
          i28: 0,
          pos28Sum: 0,
          pos28N: 0,
          c56: 0,
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

      const rows: PageHealthRow[] = pageRows.map((p) => {
        const wc = wordCount(p.body_markdown ?? p.raw_html ?? "");
        const refreshedAt = p.content_refreshed_at
          ? new Date(p.content_refreshed_at)
          : new Date(p.updated_at);
        const daysSince = daysBetween(now, refreshedAt);
        const g = agg.get(p.url_path) ?? {
          c28: 0,
          i28: 0,
          pos28Sum: 0,
          pos28N: 0,
          c56: 0,
        };
        const ctr = g.i28 > 0 ? g.c28 / g.i28 : null;
        const pos = g.pos28N > 0 ? g.pos28Sum / g.pos28N : null;
        const deltaPct =
          g.c56 > 0 ? ((g.c28 - g.c56) / g.c56) * 100 : g.c28 > 0 ? 100 : null;

        const badges: string[] = [];
        if (g.c28 === 0 && g.i28 > 50) badges.push("zero-click");
        if (pos != null && pos >= 8 && pos <= 20 && g.i28 > 100)
          badges.push("striking-distance");
        if (deltaPct != null && deltaPct <= -20 && g.c56 >= 5)
          badges.push("decaying");
        if (daysSince >= 90) badges.push("stale");
        if (wc < 500) badges.push("thin");
        if (!p.hero_image_url) badges.push("no-hero");
        if (!p.seo_title || !p.seo_description) badges.push("missing-meta");
        if (!p.in_sitemap) badges.push("not-in-sitemap");

        // Health score: start at 100, subtract per issue, weight GSC perf.
        let score = 100;
        if (wc < 500) score -= 20;
        else if (wc < 1000) score -= 8;
        if (!p.hero_image_url) score -= 8;
        if (!p.seo_title) score -= 8;
        if (!p.seo_description) score -= 8;
        if (!p.in_sitemap) score -= 10;
        if (daysSince >= 180) score -= 15;
        else if (daysSince >= 90) score -= 7;
        if (badges.includes("decaying")) score -= 15;
        if (badges.includes("zero-click")) score -= 5;
        // Bonus for traffic
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
          badges,
        };
      });

      return {
        rows,
        generated_at: now.toISOString(),
        total_pages: rows.length,
        error: null,
      };
    } catch (e: unknown) {
      console.error("[page-health] failed", e);
      return {
        rows: [],
        generated_at: new Date().toISOString(),
        total_pages: 0,
        error: e instanceof Error ? e.message : "Failed to load page health",
      };
    }
  });

export interface CannibalGroup {
  query: string;
  total_clicks: number;
  total_impressions: number;
  pages: Array<{
    url_path: string;
    clicks: number;
    impressions: number;
    position: number | null;
  }>;
}

export interface CannibalReport {
  groups: CannibalGroup[];
  generated_at: string;
  error: string | null;
}

export const getCannibalizationReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        minImpressions: z.number().int().min(1).max(100000).optional(),
        minPagesPerQuery: z.number().int().min(2).max(10).optional(),
        limit: z.number().int().min(1).max(500).optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }): Promise<CannibalReport> => {
    await assertAdmin((context as any).userId);
    const minImp = data.minImpressions ?? 50;
    const minPages = data.minPagesPerQuery ?? 2;
    const limit = data.limit ?? 100;
    const now = new Date();
    const cutoff = new Date(now.getTime() - 28 * 86400000)
      .toISOString()
      .slice(0, 10);

    try {
      // gsc_query_data has captured_at, not date. Filter by captured_at.
      const { data: rows, error } = await (supabaseAdmin as any)
        .from("gsc_query_data")
        .select("query, url_path, clicks, impressions, position, captured_at")
        .gte("captured_at", cutoff)
        .limit(50000);
      if (error) throw error;

      type Agg = {
        clicks: number;
        impressions: number;
        posSum: number;
        posN: number;
      };
      const byQuery = new Map<string, Map<string, Agg>>();
      for (const r of (rows ?? []) as Array<{
        query: string;
        url_path: string;
        clicks: number;
        impressions: number;
        position: number | null;
      }>) {
        if (!r.query || !r.url_path) continue;
        let pages = byQuery.get(r.query);
        if (!pages) {
          pages = new Map();
          byQuery.set(r.query, pages);
        }
        const cur = pages.get(r.url_path) ?? {
          clicks: 0,
          impressions: 0,
          posSum: 0,
          posN: 0,
        };
        cur.clicks += r.clicks ?? 0;
        cur.impressions += r.impressions ?? 0;
        if (r.position != null) {
          cur.posSum += Number(r.position) * (r.impressions ?? 0);
          cur.posN += r.impressions ?? 0;
        }
        pages.set(r.url_path, cur);
      }

      const groups: CannibalGroup[] = [];
      for (const [query, pages] of byQuery.entries()) {
        const list = Array.from(pages.entries())
          .map(([url_path, a]) => ({
            url_path,
            clicks: a.clicks,
            impressions: a.impressions,
            position: a.posN > 0 ? a.posSum / a.posN : null,
          }))
          .filter((p) => p.impressions >= 5);
        if (list.length < minPages) continue;
        const totalImp = list.reduce((s, p) => s + p.impressions, 0);
        if (totalImp < minImp) continue;
        const totalClicks = list.reduce((s, p) => s + p.clicks, 0);
        list.sort((a, b) => b.impressions - a.impressions);
        groups.push({
          query,
          total_clicks: totalClicks,
          total_impressions: totalImp,
          pages: list,
        });
      }

      groups.sort((a, b) => b.total_impressions - a.total_impressions);
      return {
        groups: groups.slice(0, limit),
        generated_at: now.toISOString(),
        error: null,
      };
    } catch (e: unknown) {
      console.error("[cannibalization] failed", e);
      return {
        groups: [],
        generated_at: new Date().toISOString(),
        error: e instanceof Error ? e.message : "Failed to load cannibalization report",
      };
    }
  });
