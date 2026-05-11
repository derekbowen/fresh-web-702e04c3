/**
 * Auto-refresh queue — server functions.
 *
 * Flags published content_pages whose GSC clicks decayed >=20% over the last
 * 28d (vs prior 28d), or that are stale (>=120 days since refresh) with low
 * traffic, or zero-click despite impressions. One-click AI rewrite uses
 * Lovable AI to rewrite body_markdown + meta and stamps content_refreshed_at.
 *
 * Admin-only. All access via supabaseAdmin (content_pages is server-only).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type RefreshReason = "decaying" | "stale" | "zero-click" | "manual";

export interface RefreshCandidate {
  url_path: string;
  slug: string | null;
  template_type: string | null;
  reason: RefreshReason;
  reason_label: string;
  word_count: number;
  clicks_28d: number;
  clicks_prev_28d: number;
  clicks_delta_pct: number | null;
  impressions_28d: number;
  position_28d: number | null;
  days_since_refresh: number;
  last_refreshed_at: string | null;
  has_recent_job: boolean;
  priority: number; // higher = refresh first
}

export interface RefreshQueueResult {
  candidates: RefreshCandidate[];
  generated_at: string;
  error: string | null;
}

function wordCount(s: string | null | undefined): number {
  if (!s) return 0;
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#*_`~>|-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86400000);
}

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

export const getRefreshQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ limit: z.number().int().min(1).max(500).optional() }).parse(data ?? {}),
  )
  .handler(async ({ data, context }): Promise<RefreshQueueResult> => {
    const { userId } = context as { userId: string };
    if (!(await isAdmin(userId))) {
      return { candidates: [], generated_at: new Date().toISOString(), error: "Forbidden" };
    }
    const limit = data.limit ?? 200;
    const now = new Date();
    const start28 = new Date(now.getTime() - 28 * 86400000);
    const start56 = new Date(now.getTime() - 56 * 86400000);

    try {
      const { data: pages, error: pErr } = await (supabaseAdmin as any)
        .from("content_pages")
        .select(
          "url_path, slug, template_type, body_markdown, raw_html, updated_at, content_refreshed_at",
        )
        .eq("status", "published")
        .not("url_path", "is", null)
        .limit(3000);
      if (pErr) throw pErr;

      const { data: gsc, error: gErr } = await (supabaseAdmin as any)
        .from("gsc_daily_pages")
        .select("url_path, date, clicks, impressions, position")
        .gte("date", start56.toISOString().slice(0, 10));
      if (gErr) throw gErr;

      const cutoff = start28.toISOString().slice(0, 10);
      const agg = new Map<
        string,
        { c28: number; i28: number; pos28S: number; pos28N: number; c56: number }
      >();
      for (const r of (gsc ?? []) as Array<{
        url_path: string;
        date: string;
        clicks: number;
        impressions: number;
        position: number | null;
      }>) {
        const cur =
          agg.get(r.url_path) ?? { c28: 0, i28: 0, pos28S: 0, pos28N: 0, c56: 0 };
        if (r.date >= cutoff) {
          cur.c28 += r.clicks ?? 0;
          cur.i28 += r.impressions ?? 0;
          if (r.position != null) {
            cur.pos28S += Number(r.position) * (r.impressions ?? 0);
            cur.pos28N += r.impressions ?? 0;
          }
        } else {
          cur.c56 += r.clicks ?? 0;
        }
        agg.set(r.url_path, cur);
      }

      // Find pages with a refresh job in the last 14 days to mark them.
      const recentCutoff = new Date(now.getTime() - 14 * 86400000).toISOString();
      const { data: recentJobs } = await supabaseAdmin
        .from("refresh_jobs")
        .select("url_path, status, created_at")
        .gte("created_at", recentCutoff)
        .in("status", ["success", "running", "pending"]);
      const recentSet = new Set((recentJobs ?? []).map((j: any) => j.url_path));

      const candidates: RefreshCandidate[] = [];
      for (const p of (pages ?? []) as Array<{
        url_path: string;
        slug: string | null;
        template_type: string | null;
        body_markdown: string | null;
        raw_html: string | null;
        updated_at: string;
        content_refreshed_at: string | null;
      }>) {
        const wc = wordCount(p.body_markdown ?? p.raw_html ?? "");
        const refreshedAt = p.content_refreshed_at
          ? new Date(p.content_refreshed_at)
          : new Date(p.updated_at);
        const daysSince = daysBetween(now, refreshedAt);
        const g = agg.get(p.url_path) ?? {
          c28: 0,
          i28: 0,
          pos28S: 0,
          pos28N: 0,
          c56: 0,
        };
        const pos = g.pos28N > 0 ? g.pos28S / g.pos28N : null;
        const deltaPct =
          g.c56 > 0 ? ((g.c28 - g.c56) / g.c56) * 100 : null;

        let reason: RefreshReason | null = null;
        let label = "";
        let priority = 0;

        if (deltaPct != null && deltaPct <= -20 && g.c56 >= 5) {
          reason = "decaying";
          label = `Lost ${Math.round(-deltaPct)}% clicks vs prior 28d`;
          priority = 100 + Math.min(50, Math.round(-deltaPct));
        } else if (g.c28 === 0 && g.i28 >= 100 && daysSince >= 30) {
          reason = "zero-click";
          label = `0 clicks on ${g.i28} impressions`;
          priority = 60 + Math.min(30, Math.floor(g.i28 / 50));
        } else if (daysSince >= 120 && g.i28 < 50) {
          reason = "stale";
          label = `Not refreshed in ${daysSince} days`;
          priority = 20 + Math.min(30, Math.floor(daysSince / 30));
        }

        if (!reason) continue;

        candidates.push({
          url_path: p.url_path,
          slug: p.slug,
          template_type: p.template_type,
          reason,
          reason_label: label,
          word_count: wc,
          clicks_28d: g.c28,
          clicks_prev_28d: g.c56,
          clicks_delta_pct: deltaPct,
          impressions_28d: g.i28,
          position_28d: pos,
          days_since_refresh: daysSince,
          last_refreshed_at: p.content_refreshed_at,
          has_recent_job: recentSet.has(p.url_path),
          priority,
        });
      }

      candidates.sort((a, b) => b.priority - a.priority);
      return {
        candidates: candidates.slice(0, limit),
        generated_at: now.toISOString(),
        error: null,
      };
    } catch (e: unknown) {
      console.error("[refresh-queue] failed", e);
      return {
        candidates: [],
        generated_at: new Date().toISOString(),
        error: e instanceof Error ? e.message : "Failed to load queue",
      };
    }
  });

export interface RefreshJobRow {
  id: string;
  url_path: string;
  status: string;
  reason: string | null;
  model: string | null;
  before_word_count: number | null;
  after_word_count: number | null;
  diff_summary: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export const getRefreshHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        url_path: z.string().optional(),
        limit: z.number().int().min(1).max(200).optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }): Promise<{ jobs: RefreshJobRow[]; error: string | null }> => {
    const { userId } = context as { userId: string };
    if (!(await isAdmin(userId))) return { jobs: [], error: "Forbidden" };
    try {
      let q = supabaseAdmin
        .from("refresh_jobs")
        .select(
          "id, url_path, status, reason, model, before_word_count, after_word_count, diff_summary, error_message, created_at, completed_at",
        )
        .order("created_at", { ascending: false })
        .limit(data.limit ?? 50);
      if (data.url_path) q = q.eq("url_path", data.url_path);
      const { data: rows, error } = await q;
      if (error) throw error;
      return { jobs: (rows ?? []) as RefreshJobRow[], error: null };
    } catch (e) {
      console.error("[refresh-history] failed", e);
      return { jobs: [], error: e instanceof Error ? e.message : "Failed" };
    }
  });

const REFRESH_MODEL = "google/gemini-3-flash-preview";

export const runAiRefresh = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        url_path: z.string().min(1),
        reason: z.enum(["decaying", "stale", "zero-click", "manual"]).optional(),
        dry_run: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(
    async ({
      data,
      context,
    }): Promise<{
      success: boolean;
      job_id: string | null;
      diff_summary: string | null;
      before_word_count: number;
      after_word_count: number;
      error: string | null;
    }> => {
      const { userId } = context as { userId: string };
      if (!(await isAdmin(userId))) {
        return {
          success: false,
          job_id: null,
          diff_summary: null,
          before_word_count: 0,
          after_word_count: 0,
          error: "Forbidden",
        };
      }

      const apiKey = process.env.LOVABLE_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          job_id: null,
          diff_summary: null,
          before_word_count: 0,
          after_word_count: 0,
          error: "LOVABLE_API_KEY not configured",
        };
      }

      const { data: page, error: pErr } = await (supabaseAdmin as any)
        .from("content_pages")
        .select(
          "id, url_path, slug, template_type, title, seo_title, seo_description, focus_keyword, body_markdown",
        )
        .eq("url_path", data.url_path)
        .maybeSingle();
      if (pErr || !page) {
        return {
          success: false,
          job_id: null,
          diff_summary: null,
          before_word_count: 0,
          after_word_count: 0,
          error: pErr?.message ?? "Page not found",
        };
      }

      const beforeWc = wordCount(page.body_markdown ?? "");

      // Insert pending job row.
      const { data: jobRow, error: jErr } = await supabaseAdmin
        .from("refresh_jobs")
        .insert({
          url_path: page.url_path,
          triggered_by: userId,
          status: "running",
          reason: data.reason ?? "manual",
          model: REFRESH_MODEL,
          before_word_count: beforeWc,
          before_seo_title: page.seo_title,
          before_seo_description: page.seo_description,
        })
        .select("id")
        .single();
      if (jErr || !jobRow) {
        return {
          success: false,
          job_id: null,
          diff_summary: null,
          before_word_count: beforeWc,
          after_word_count: 0,
          error: jErr?.message ?? "Failed to create job",
        };
      }
      const jobId = jobRow.id as string;

      const sys = `You are an expert SEO content editor for poolrentalnearme.com, a peer-to-peer pool rental marketplace.

Your job: refresh an existing published content page to recover lost search traffic. Keep the page's intent, focus keyword, headings structure, and any city/topic specifics. Make the prose tighter, fresher, and more useful.

Voice rules (strict):
- Sentence case for headings.
- Second person ("you", "your pool").
- No em dashes. Use commas, periods, or restructure.
- Banned words: leverage, utilize, seamlessly, robust, dive into, elevate, game-changer, unlock, journey, landscape, bustling, thriving, vibrant, state-of-the-art, cutting-edge.
- Banned phrases: "in this article", "in conclusion", "it's worth noting", "thousands of hosts", "proven track record".
- Numbers under 10 spelled out, 10+ as numerals.
- Dollar amounts as $X/hour.
- Never invent statistics. Hourly rates $40-150/hr.

Return JSON only via the provided tool. Preserve markdown formatting (## headings, lists, bold). Aim for 1500-3000 words. Refresh meta title (<60 chars) and meta description (<160 chars) to match the new copy.`;

      const userMsg = `Refresh this page. Reason: ${data.reason ?? "manual"}.

URL: ${page.url_path}
Template: ${page.template_type ?? "n/a"}
Focus keyword: ${page.focus_keyword ?? "n/a"}
Current title: ${page.title ?? "n/a"}
Current meta title: ${page.seo_title ?? "n/a"}
Current meta description: ${page.seo_description ?? "n/a"}

Current body markdown:
"""
${(page.body_markdown ?? "").slice(0, 18000)}
"""`;

      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: REFRESH_MODEL,
            messages: [
              { role: "system", content: sys },
              { role: "user", content: userMsg },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "save_refresh",
                  description: "Save the refreshed page content.",
                  parameters: {
                    type: "object",
                    properties: {
                      body_markdown: { type: "string", description: "Full refreshed page body in markdown." },
                      seo_title: { type: "string", description: "New meta title (<60 chars)." },
                      seo_description: { type: "string", description: "New meta description (<160 chars)." },
                      summary_of_changes: { type: "string", description: "1-3 sentence summary of what changed." },
                    },
                    required: ["body_markdown", "seo_title", "seo_description", "summary_of_changes"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "save_refresh" } },
          }),
        });

        if (!aiRes.ok) {
          const txt = await aiRes.text();
          let msg = `AI gateway ${aiRes.status}`;
          if (aiRes.status === 429) msg = "AI rate limited, try again shortly.";
          if (aiRes.status === 402) msg = "AI credits exhausted. Add funds in Workspace settings.";
          throw new Error(`${msg}: ${txt.slice(0, 200)}`);
        }

        const aiJson = await aiRes.json();
        const tc = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
        const argsStr = tc?.function?.arguments;
        if (!argsStr) throw new Error("AI returned no tool call");
        const parsed = JSON.parse(argsStr) as {
          body_markdown: string;
          seo_title: string;
          seo_description: string;
          summary_of_changes: string;
        };

        if (!parsed.body_markdown || parsed.body_markdown.length < 400) {
          throw new Error("AI returned suspiciously short body");
        }

        const afterWc = wordCount(parsed.body_markdown);

        if (!data.dry_run) {
          const { error: upErr } = await supabaseAdmin
            .from("content_pages")
            .update({
              body_markdown: parsed.body_markdown,
              seo_title: parsed.seo_title,
              seo_description: parsed.seo_description,
              content_refreshed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", page.id);
          if (upErr) throw upErr;
        }

        await supabaseAdmin
          .from("refresh_jobs")
          .update({
            status: "success",
            after_word_count: afterWc,
            after_seo_title: parsed.seo_title,
            after_seo_description: parsed.seo_description,
            diff_summary: parsed.summary_of_changes,
            completed_at: new Date().toISOString(),
          })
          .eq("id", jobId);

        return {
          success: true,
          job_id: jobId,
          diff_summary: parsed.summary_of_changes,
          before_word_count: beforeWc,
          after_word_count: afterWc,
          error: null,
        };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Refresh failed";
        await supabaseAdmin
          .from("refresh_jobs")
          .update({
            status: "error",
            error_message: msg,
            completed_at: new Date().toISOString(),
          })
          .eq("id", jobId);
        return {
          success: false,
          job_id: jobId,
          diff_summary: null,
          before_word_count: beforeWc,
          after_word_count: 0,
          error: msg,
        };
      }
    },
  );
