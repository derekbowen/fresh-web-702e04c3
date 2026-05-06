import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}
const sb = () => supabaseAdmin as any;

// ============================================================================
// COMPETITOR RADAR — sitemap diff + auto-scrape new pages
// ============================================================================

export type CompetitorSiteRow = {
  id: string;
  domain: string;
  sitemap_url: string;
  label: string | null;
  is_active: boolean;
  last_checked_at: string | null;
  last_url_count: number;
};

export type CompetitorUrlRow = {
  id: string;
  site_id: string;
  url: string;
  first_seen_at: string;
  last_seen_at: string;
  scraped_at: string | null;
  title: string | null;
  word_count: number | null;
  acknowledged: boolean;
  domain?: string | null;
};

export const listCompetitorSites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ rows: CompetitorSiteRow[] }> => {
    await assertAdmin((context as any).userId);
    const { data } = await sb()
      .from("competitor_sites")
      .select("*")
      .order("created_at", { ascending: false });
    return { rows: (data || []) as CompetitorSiteRow[] };
  });

export const addCompetitorSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      domain: z.string().min(2).max(200),
      sitemap_url: z.string().url(),
      label: z.string().max(120).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    const domain = data.domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
    const { error } = await sb().from("competitor_sites").insert({
      domain,
      sitemap_url: data.sitemap_url,
      label: data.label ?? null,
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  });

export const deleteCompetitorSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    const { error } = await sb().from("competitor_sites").delete().eq("id", data.id);
    return error ? { ok: false, error: error.message } : { ok: true };
  });

/** Fetch sitemap (and nested sitemap indexes) and return all <loc> URLs. */
async function fetchSitemapUrls(sitemapUrl: string, depth = 0): Promise<string[]> {
  if (depth > 2) return [];
  const res = await fetch(sitemapUrl, { headers: { "User-Agent": "Mozilla/5.0 (compatible; PoolRentalNearMeBot/1.0; +https://www.poolrentalnearme.com)" } });
  if (!res.ok) throw new Error(`Sitemap fetch ${res.status}`);
  const xml = await res.text();
  const locs = Array.from(xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)).map((m) => m[1]);
  // If this is a sitemap index, recurse
  if (/<sitemapindex/i.test(xml)) {
    const out: string[] = [];
    for (const child of locs.slice(0, 25)) {
      try {
        const sub = await fetchSitemapUrls(child, depth + 1);
        out.push(...sub);
      } catch { /* skip */ }
    }
    return out;
  }
  return locs;
}

/** Run sitemap diff for one (or all) competitor sites. Returns count of new URLs found. */
export const runCompetitorScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ site_id: z.string().uuid().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    let q = sb().from("competitor_sites").select("*").eq("is_active", true);
    if (data.site_id) q = q.eq("id", data.site_id);
    const { data: sites } = await q;
    const results: { domain: string; new_count: number; total: number; error?: string }[] = [];

    for (const site of (sites || []) as CompetitorSiteRow[]) {
      try {
        const urls = await fetchSitemapUrls(site.sitemap_url);
        const unique = Array.from(new Set(urls)).slice(0, 10000);
        const now = new Date().toISOString();

        // Get existing URLs for this site
        const { data: existing } = await sb()
          .from("competitor_urls")
          .select("url")
          .eq("site_id", site.id);
        const existingSet = new Set(((existing || []) as { url: string }[]).map((r) => r.url));

        const newOnes = unique.filter((u) => !existingSet.has(u));
        const allRows = unique.map((url) => ({
          site_id: site.id,
          url,
          first_seen_at: existingSet.has(url) ? undefined : now,
          last_seen_at: now,
        })).filter((r) => r.first_seen_at !== undefined ? true : true);

        // Upsert (set last_seen_at) + insert new
        if (newOnes.length) {
          await sb().from("competitor_urls").insert(
            newOnes.map((url) => ({ site_id: site.id, url, first_seen_at: now, last_seen_at: now })),
          );
        }
        // Touch last_seen_at for existing ones we still saw
        const stillSeen = unique.filter((u) => existingSet.has(u));
        if (stillSeen.length) {
          // Chunk to avoid huge IN clauses
          for (let i = 0; i < stillSeen.length; i += 500) {
            const chunk = stillSeen.slice(i, i + 500);
            await sb().from("competitor_urls")
              .update({ last_seen_at: now })
              .eq("site_id", site.id)
              .in("url", chunk);
          }
        }

        await sb().from("competitor_sites").update({
          last_checked_at: now,
          last_url_count: unique.length,
        }).eq("id", site.id);

        results.push({ domain: site.domain, new_count: newOnes.length, total: unique.length });
      } catch (e: any) {
        results.push({ domain: site.domain, new_count: 0, total: 0, error: e?.message || "scan failed" });
      }
    }
    return { ok: true, results };
  });

export const listNewCompetitorUrls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      onlyUnacknowledged: z.boolean().default(true),
      limit: z.number().int().min(10).max(500).default(100),
      site_id: z.string().uuid().optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<{ rows: CompetitorUrlRow[] }> => {
    await assertAdmin((context as any).userId);
    let q = sb()
      .from("competitor_urls")
      .select("id, site_id, url, first_seen_at, last_seen_at, scraped_at, title, word_count, acknowledged, competitor_sites(domain)")
      .order("first_seen_at", { ascending: false })
      .limit(data.limit);
    if (data.onlyUnacknowledged) q = q.eq("acknowledged", false);
    if (data.site_id) q = q.eq("site_id", data.site_id);
    const { data: rows } = await q;
    const flat = (rows || []).map((r: any) => ({
      ...r,
      domain: r.competitor_sites?.domain ?? null,
    }));
    return { rows: flat as CompetitorUrlRow[] };
  });

export const acknowledgeCompetitorUrls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).min(1).max(500) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    const { error } = await sb()
      .from("competitor_urls")
      .update({ acknowledged: true })
      .in("id", data.ids);
    return error ? { ok: false, error: error.message } : { ok: true };
  });

/** Scrape a discovered URL with Firecrawl to populate title + word_count. */
export const scrapeCompetitorUrlRow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    const { data: row } = await sb()
      .from("competitor_urls")
      .select("id, url")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) return { ok: false, error: "Not found" };
    const fcKey = process.env.FIRECRAWL_API_KEY;
    if (!fcKey) return { ok: false, error: "FIRECRAWL_API_KEY not configured" };
    const resp = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${fcKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url: row.url, formats: ["markdown"], onlyMainContent: true }),
    });
    if (!resp.ok) return { ok: false, error: `Firecrawl ${resp.status}` };
    const json = await resp.json();
    const doc = json?.data || json;
    const md = doc?.markdown || "";
    const meta = doc?.metadata || {};
    const word_count = md.split(/\s+/).filter(Boolean).length;
    await sb().from("competitor_urls").update({
      title: meta.title || meta.ogTitle || null,
      word_count,
      scraped_at: new Date().toISOString(),
    }).eq("id", data.id);
    return { ok: true, word_count };
  });

// ============================================================================
// SERP RANK TRACKER
// ============================================================================

export type TrackedKeywordRow = {
  id: string;
  keyword: string;
  target_url_path: string | null;
  market: string;
  is_active: boolean;
  last_position: number | null;
  previous_position: number | null;
  last_checked_at: string | null;
};

export const listTrackedKeywords = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ rows: TrackedKeywordRow[] }> => {
    await assertAdmin((context as any).userId);
    const { data } = await sb()
      .from("tracked_keywords")
      .select("*")
      .order("last_position", { ascending: true, nullsFirst: false });
    return { rows: (data || []) as TrackedKeywordRow[] };
  });

export const addTrackedKeyword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      keyword: z.string().min(1).max(200),
      target_url_path: z.string().max(300).optional(),
      market: z.string().max(10).default("us"),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    const { error } = await sb().from("tracked_keywords").insert({
      keyword: data.keyword.trim(),
      target_url_path: data.target_url_path || null,
      market: data.market,
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  });

export const deleteTrackedKeyword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    const { error } = await sb().from("tracked_keywords").delete().eq("id", data.id);
    return error ? { ok: false, error: error.message } : { ok: true };
  });

/**
 * Check current position of tracked keywords by scraping Google SERP via Firecrawl.
 * Returns the position where poolrentalnearme.com appears (1-100) or null.
 */
export const runSerpCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    const fcKey = process.env.FIRECRAWL_API_KEY;
    if (!fcKey) return { ok: false, error: "FIRECRAWL_API_KEY not configured" };

    let q = sb().from("tracked_keywords").select("*").eq("is_active", true);
    if (data.id) q = q.eq("id", data.id);
    else q = q.order("last_checked_at", { ascending: true, nullsFirst: true }).limit(data.limit);
    const { data: kws } = await q;

    const results: { keyword: string; position: number | null; delta: number | null }[] = [];

    for (const kw of (kws || []) as TrackedKeywordRow[]) {
      try {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(kw.keyword)}&gl=${kw.market || "us"}&num=100`;
        const resp = await fetch("https://api.firecrawl.dev/v2/scrape", {
          method: "POST",
          headers: { Authorization: `Bearer ${fcKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url: searchUrl, formats: ["html"], onlyMainContent: false }),
        });
        if (!resp.ok) {
          results.push({ keyword: kw.keyword, position: null, delta: null });
          continue;
        }
        const json = await resp.json();
        const html: string = json?.data?.html || json?.html || "";
        // Extract result URLs in order. Google wraps each in /url?q= or direct hrefs.
        const urlMatches = Array.from(html.matchAll(/href="(https?:\/\/[^"]+)"/g)).map((m) => m[1]);
        const seen = new Set<string>();
        const ordered: string[] = [];
        for (const u of urlMatches) {
          if (u.includes("google.com") || u.includes("/search?") || u.includes("webcache.")) continue;
          if (seen.has(u)) continue;
          seen.add(u);
          ordered.push(u);
        }
        let position: number | null = null;
        let urlFound: string | null = null;
        for (let i = 0; i < ordered.length; i++) {
          if (ordered[i].includes("poolrentalnearme.com")) {
            position = i + 1;
            urlFound = ordered[i];
            break;
          }
        }
        const now = new Date().toISOString();
        await sb().from("serp_rankings").insert({
          keyword_id: kw.id,
          position,
          url_found: urlFound,
          checked_at: now,
        });
        await sb().from("tracked_keywords").update({
          previous_position: kw.last_position,
          last_position: position,
          last_checked_at: now,
        }).eq("id", kw.id);
        const delta = (kw.last_position != null && position != null) ? kw.last_position - position : null;
        results.push({ keyword: kw.keyword, position, delta });
      } catch (e: any) {
        results.push({ keyword: kw.keyword, position: null, delta: null });
      }
    }
    return { ok: true, results };
  });

// ============================================================================
// AI PAGE AUDITOR — score 0-100 vs top competitors
// ============================================================================

export type PageAuditRow = {
  id: string;
  url_path: string;
  score: number | null;
  summary: string | null;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  audited_at: string;
};

export const auditPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ url_path: z.string().min(1).max(300) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    const lovKey = process.env.LOVABLE_API_KEY;
    if (!lovKey) return { ok: false, error: "LOVABLE_API_KEY not configured" };

    const { data: page } = await sb()
      .from("content_pages")
      .select("url_path, title, seo_description, body_markdown")
      .eq("url_path", data.url_path)
      .maybeSingle();
    if (!page) return { ok: false, error: "Page not found" };

    // Get competitor pages on same topic for context
    const { data: comps } = await sb()
      .from("competitor_pages")
      .select("url, title, word_count, headings")
      .order("word_count", { ascending: false })
      .limit(3);

    const ourBody = (page.body_markdown || "").slice(0, 8000);
    const compSummary = (comps || []).map((c: any) =>
      `- ${c.url} (${c.word_count} words): ${(c.headings || []).slice(0, 8).map((h: any) => h.text).join(" | ")}`,
    ).join("\n") || "No competitor data yet.";

    const prompt = `You are an SEO auditor. Score this page 0-100 vs top-ranking competitors and return STRICT JSON:
{"score": <0-100>, "summary": "<one sentence>", "strengths": ["..."], "weaknesses": ["..."], "recommendations": ["..."]}

Page URL: ${page.url_path}
Title: ${page.title || "(none)"}
Description: ${page.seo_description || "(none)"}
Body (truncated):
${ourBody}

Competitor pages on similar topics:
${compSummary}

Return ONLY JSON, no markdown fences.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!aiResp.ok) return { ok: false, error: `AI ${aiResp.status}: ${(await aiResp.text()).slice(0, 200)}` };
    const aiJson = await aiResp.json();
    const content: string = aiJson?.choices?.[0]?.message?.content || "";
    const cleaned = content.replace(/```json\s*/i, "").replace(/```\s*$/i, "").trim();
    let parsed: any;
    try { parsed = JSON.parse(cleaned); } catch {
      return { ok: false, error: "AI returned non-JSON", raw: content.slice(0, 300) };
    }

    const { data: row, error } = await sb().from("page_audits").insert({
      url_path: data.url_path,
      score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
      summary: String(parsed.summary || "").slice(0, 1000),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 20) : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 20) : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 20) : [],
    }).select("*").maybeSingle();
    if (error) return { ok: false, error: error.message };
    return { ok: true, audit: row as PageAuditRow };
  });

export const listRecentAudits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      limit: z.number().int().min(10).max(200).default(50),
      url_path: z.string().max(300).optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<{ rows: PageAuditRow[] }> => {
    await assertAdmin((context as any).userId);
    let q = sb().from("page_audits").select("*").order("audited_at", { ascending: false }).limit(data.limit);
    if (data.url_path) q = q.eq("url_path", data.url_path);
    const { data: rows } = await q;
    return { rows: (rows || []) as PageAuditRow[] };
  });
