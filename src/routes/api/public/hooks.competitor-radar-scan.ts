import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Daily competitor radar scan — called by pg_cron.
 * Fetches each active competitor's sitemap, diffs against stored URLs,
 * and inserts new ones. No auth required; this is a /api/public/* route
 * but only does internal sitemap polling.
 */

async function fetchSitemapUrls(sitemapUrl: string, depth = 0): Promise<string[]> {
  if (depth > 2) return [];
  const res = await fetch(sitemapUrl, { headers: { "User-Agent": "Mozilla/5.0 (compatible; PoolRentalNearMeBot/1.0; +https://www.poolrentalnearme.com)" } });
  if (!res.ok) throw new Error(`Sitemap fetch ${res.status}`);
  const xml = await res.text();
  const locs = Array.from(xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)).map((m) => m[1]);
  if (/<sitemapindex/i.test(xml)) {
    const out: string[] = [];
    for (const child of locs.slice(0, 25)) {
      try { out.push(...(await fetchSitemapUrls(child, depth + 1))); } catch { /* skip */ }
    }
    return out;
  }
  return locs;
}

async function runScan() {
  const sb = supabaseAdmin as any;
  const { data: sites } = await sb.from("competitor_sites").select("*").eq("is_active", true);
  const results: any[] = [];
  const newlyInsertedIds: string[] = [];
  for (const site of sites || []) {
    try {
      const urls = await fetchSitemapUrls(site.sitemap_url);
      const unique = Array.from(new Set(urls)).slice(0, 10000);
      const now = new Date().toISOString();
      const { data: existing } = await sb.from("competitor_urls").select("url").eq("site_id", site.id);
      const existingSet = new Set((existing || []).map((r: any) => r.url));
      const newOnes = unique.filter((u) => !existingSet.has(u));
      if (newOnes.length) {
        const { data: inserted } = await sb.from("competitor_urls").insert(
          newOnes.map((url) => ({ site_id: site.id, url, first_seen_at: now, last_seen_at: now })),
        ).select("id");
        for (const r of inserted || []) newlyInsertedIds.push(r.id);
      }
      await sb.from("competitor_sites").update({
        last_checked_at: now,
        last_url_count: unique.length,
      }).eq("id", site.id);
      results.push({ domain: site.domain, new_count: newOnes.length, total: unique.length });
    } catch (e: any) {
      results.push({ domain: site.domain, error: e?.message || "scan failed" });
    }
  }

  // Auto-run host matcher on newly discovered URLs (cap at 25 per scan to control cost)
  let matcherResult: { processed: number; matched: number } | null = null;
  if (newlyInsertedIds.length > 0) {
    try {
      const { matchManyCompetitorUrls } = await import("@/server/host-matcher.server");
      matcherResult = await matchManyCompetitorUrls(newlyInsertedIds.slice(0, 25), 2);
    } catch (e: any) {
      console.error("[radar-scan] matcher failed", e);
    }
  }

  return { ok: true, results, matcher: matcherResult, ran_at: new Date().toISOString() };
}

export const Route = createFileRoute("/api/public/hooks/competitor-radar-scan")({
  server: {
    handlers: {
      GET: async () => Response.json(await runScan()),
      POST: async () => Response.json(await runScan()),
    },
  },
});
