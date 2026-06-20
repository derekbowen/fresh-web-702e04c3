/**
 * AI SEO Critic — one-click structured page critique.
 * Analyzes 4 dimensions:
 *  1. Title & meta (length, keyword, CTR appeal)
 *  2. Search intent match (vs top GSC queries)
 *  3. Internal-link gaps (pages we should link from/to)
 *  4. Voice-rule violations (banned words/phrases, em dashes, Title Case headings)
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const sb = () => supabaseAdmin as any;

const BANNED_WORDS = [
  "leverage","utilize","seamlessly","robust","dive into","elevate","game-changer",
  "unlock","journey","landscape","bustling","thriving","vibrant","state-of-the-art","cutting-edge",
];
const BANNED_PHRASES = [
  "in this article","in conclusion","it's worth noting","thousands of hosts",
  "proven track record","pool rental near me is the leading",
];

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}

function normalizePath(p: string): string {
  let s = (p || "").trim().replace(/^https?:\/\/[^/]+/i, "").replace(/[?#].*$/, "");
  if (s.length > 1) s = s.replace(/\/+$/, "");
  if (!s.startsWith("/")) s = "/" + s;
  return s;
}

function tokenize(s: string): string[] {
  return (s || "").toLowerCase().match(/[a-z0-9]{4,}/g) ?? [];
}

function detectVoiceIssues(page: { title: string | null; seo_description: string | null; body_markdown: string | null }) {
  const out: { kind: string; example: string; where: string }[] = [];
  const sources: Array<[string, string]> = [
    ["title", page.title || ""],
    ["meta", page.seo_description || ""],
    ["body", page.body_markdown || ""],
  ];
  for (const [where, txt] of sources) {
    const lower = txt.toLowerCase();
    for (const w of BANNED_WORDS) {
      const re = new RegExp(`\\b${w.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
      const m = txt.match(re);
      if (m) out.push({ kind: `Banned word "${w}"`, example: m[0], where });
    }
    for (const p of BANNED_PHRASES) {
      if (lower.includes(p)) out.push({ kind: `Banned phrase "${p}"`, example: p, where });
    }
    if (where !== "body" && txt.includes("—")) out.push({ kind: "Em dash in user-facing copy", example: "—", where });
  }
  // Em dashes in body (limit examples)
  const bodyEm = (page.body_markdown || "").match(/[^\n]{0,40}—[^\n]{0,40}/g);
  if (bodyEm) bodyEm.slice(0, 3).forEach((e) => out.push({ kind: "Em dash", example: e.trim(), where: "body" }));
  // Title Case headings
  const headings = (page.body_markdown || "").match(/^#{1,3}\s+.+$/gm) ?? [];
  for (const h of headings.slice(0, 50)) {
    const text = h.replace(/^#{1,3}\s+/, "");
    const words = text.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w));
    if (words.length < 4) continue;
    const titleCased = words.filter((w) => /^[A-Z][a-z]/.test(w)).length;
    if (titleCased / words.length > 0.6) out.push({ kind: "Title Case heading (use sentence case)", example: text.slice(0, 80), where: "body" });
  }
  return out;
}

export type SeoCritique = {
  url_path: string;
  title: string | null;
  meta: string | null;
  meta_review: { score: number; issues: string[]; rewrites: { title: string; meta: string }[] };
  intent: { score: number; verdict: string; missing_topics: string[]; top_queries: { query: string; impressions: number; position: number | null }[] };
  internal_links: { incoming_count: number; suggest_link_to: { url_path: string; title: string; reason: string }[]; suggest_link_from: { url_path: string; title: string; anchor: string }[] };
  voice: { score: number; issues: { kind: string; example: string; where: string }[]; ai_notes: string[] };
  overall: { score: number; one_liner: string; top_actions: string[] };
};

const empty: SeoCritique = {
  url_path: "",
  title: null,
  meta: null,
  meta_review: { score: 0, issues: [], rewrites: [] },
  intent: { score: 0, verdict: "", missing_topics: [], top_queries: [] },
  internal_links: { incoming_count: 0, suggest_link_to: [], suggest_link_from: [] },
  voice: { score: 0, issues: [], ai_notes: [] },
  overall: { score: 0, one_liner: "", top_actions: [] },
};

export const critiquePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ url_path: z.string().min(1).max(300) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean; critique?: SeoCritique; error?: string; suggestions?: { url_path: string; title: string }[] }> => {
    await assertAdmin((context as any).userId);
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { ok: false, error: "LOVABLE_API_KEY not configured" };

    const path = normalizePath(data.url_path);
    const slug = path.replace(/^\/p\//, "");

    let { data: page } = await sb().from("content_pages")
      .select("url_path, title, seo_description, body_markdown, focus_keyword")
      .eq("url_path", path).maybeSingle();
    if (!page && slug) {
      const r = await sb().from("content_pages")
        .select("url_path, title, seo_description, body_markdown, focus_keyword")
        .eq("slug", slug).maybeSingle();
      page = r.data;
    }
    if (!page) {
      const needle = slug || path.replace(/^\//, "");
      const { data: similar } = await sb().from("content_pages")
        .select("url_path, title").or(`url_path.ilike.%${needle}%,title.ilike.%${needle}%`).limit(8);
      return { ok: false, error: `Page not found for "${path}".`, suggestions: similar ?? [] };
    }

    // GSC queries (90 days)
    const since = new Date(Date.now() - 90 * 86400_000).toISOString();
    const { data: q } = await sb().from("gsc_query_data")
      .select("query, clicks, impressions, position")
      .eq("url_path", page.url_path).gte("captured_at", since)
      .order("impressions", { ascending: false }).limit(40);
    const byQ = new Map<string, { query: string; impressions: number; clicks: number; position: number | null }>();
    for (const r of q ?? []) {
      const k = (r.query as string).toLowerCase().trim();
      const cur = byQ.get(k);
      if (!cur || r.impressions > cur.impressions) byQ.set(k, { query: r.query, impressions: r.impressions ?? 0, clicks: r.clicks ?? 0, position: r.position });
    }
    const topQueries = Array.from(byQ.values()).sort((a, b) => b.impressions - a.impressions).slice(0, 12);

    // Internal-link inputs
    const tokens = Array.from(new Set([
      ...tokenize(page.title || ""),
      ...tokenize(page.focus_keyword || ""),
      ...(slug ? slug.split(/-/).filter((t) => t.length >= 4) : []),
    ])).slice(0, 6);

    let candidates: any[] = [];
    if (tokens.length) {
      const orFilter = tokens.map((t) => `title.ilike.%${t}%,url_path.ilike.%${t}%`).join(",");
      const { data: cand } = await sb().from("content_pages")
        .select("url_path, title").eq("status", "published").neq("url_path", page.url_path)
        .or(orFilter).limit(30);
      candidates = cand ?? [];
    }

    // Pages already linking TO this page (count via simple LIKE on body_markdown)
    const { count: incoming } = await sb().from("content_pages")
      .select("id", { count: "exact", head: true })
      .ilike("body_markdown", `%${page.url_path}%`).neq("url_path", page.url_path);

    // Pages we already link to from this page
    const linkedSet = new Set<string>();
    const linkRe = /\]\((\/p\/[^)\s]+)\)/g;
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(page.body_markdown || "")) !== null) linkedSet.add(m[1]);

    const voiceIssues = detectVoiceIssues(page);

    // Build AI prompt for the four-dimension critique
    const prompt = `You are an SEO + brand-voice critic for Pool Rental Near Me (Swimply alternative, 10% flat host fee, $2M insurance).

Voice rules: sentence case headings, second person, no em dashes, no hype words. Banned: ${BANNED_WORDS.join(", ")}.

PAGE
URL: ${page.url_path}
Title: ${page.title || "(none)"}
Meta: ${page.seo_description || "(none)"}
Focus keyword: ${page.focus_keyword || "(none)"}
Body (first 6000 chars):
${(page.body_markdown || "").slice(0, 6000)}

TOP GSC QUERIES (90d):
${topQueries.map((t) => `- "${t.query}" — ${t.impressions} impr, pos ${t.position ?? "?"}`).join("\n") || "(no GSC data)"}

INTERNAL LINK CANDIDATES (already published, not yet linked):
${candidates.filter((c) => !linkedSet.has(c.url_path)).slice(0, 20).map((c) => `- ${c.url_path} — ${c.title}`).join("\n") || "(none)"}

DETECTED VOICE ISSUES:
${voiceIssues.slice(0, 20).map((v) => `- ${v.kind} (${v.where}): "${v.example}"`).join("\n") || "(none detected by regex)"}

Return STRICT JSON, no markdown:
{
  "meta_review": { "score": 0-100, "issues": ["..."], "rewrites": [{"title":"...","meta":"..."}, {"title":"...","meta":"..."}] },
  "intent": { "score": 0-100, "verdict": "one sentence", "missing_topics": ["topic users search but page doesn't cover"] },
  "internal_links": {
    "suggest_link_to": [{"url_path":"/p/...","title":"...","reason":"..."}],
    "suggest_link_from": [{"url_path":"/p/...","title":"...","anchor":"natural anchor text"}]
  },
  "voice": { "score": 0-100, "ai_notes": ["voice/style notes beyond the regex hits"] },
  "overall": { "score": 0-100, "one_liner": "...", "top_actions": ["3-5 prioritized fixes"] }
}

Rules: titles ≤60 chars, metas ≤155 chars. Suggested links MUST come from the candidate list. Sentence case for any rewrite.`;

    let aiResp: Response;
    try {
      aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });
    } catch (e: any) {
      return { ok: false, error: `AI request failed: ${e?.message || e}` };
    }
    if (!aiResp.ok) {
      const t = await aiResp.text().catch(() => "");
      if (aiResp.status === 429) return { ok: false, error: "Rate limited — try again in a minute." };
      if (aiResp.status === 402) return { ok: false, error: "AI credits exhausted — top up in Settings → Workspace → Usage." };
      return { ok: false, error: `AI ${aiResp.status}: ${t.slice(0, 200)}` };
    }
    const aiJson = await aiResp.json();
    const content = aiJson?.choices?.[0]?.message?.content || "";
    let parsed: any;
    try { parsed = JSON.parse(content); }
    catch { return { ok: false, error: "AI returned non-JSON" }; }

    const critique: SeoCritique = {
      ...empty,
      url_path: page.url_path,
      title: page.title,
      meta: page.seo_description,
      meta_review: {
        score: Math.max(0, Math.min(100, Number(parsed.meta_review?.score) || 0)),
        issues: Array.isArray(parsed.meta_review?.issues) ? parsed.meta_review.issues.slice(0, 10) : [],
        rewrites: Array.isArray(parsed.meta_review?.rewrites) ? parsed.meta_review.rewrites.slice(0, 4) : [],
      },
      intent: {
        score: Math.max(0, Math.min(100, Number(parsed.intent?.score) || 0)),
        verdict: String(parsed.intent?.verdict || "").slice(0, 400),
        missing_topics: Array.isArray(parsed.intent?.missing_topics) ? parsed.intent.missing_topics.slice(0, 10) : [],
        top_queries: topQueries,
      },
      internal_links: {
        incoming_count: incoming ?? 0,
        suggest_link_to: Array.isArray(parsed.internal_links?.suggest_link_to) ? parsed.internal_links.suggest_link_to.slice(0, 10) : [],
        suggest_link_from: Array.isArray(parsed.internal_links?.suggest_link_from) ? parsed.internal_links.suggest_link_from.slice(0, 10) : [],
      },
      voice: {
        score: Math.max(0, Math.min(100, Number(parsed.voice?.score) || 0)),
        issues: voiceIssues.slice(0, 30),
        ai_notes: Array.isArray(parsed.voice?.ai_notes) ? parsed.voice.ai_notes.slice(0, 10) : [],
      },
      overall: {
        score: Math.max(0, Math.min(100, Number(parsed.overall?.score) || 0)),
        one_liner: String(parsed.overall?.one_liner || "").slice(0, 300),
        top_actions: Array.isArray(parsed.overall?.top_actions) ? parsed.overall.top_actions.slice(0, 8) : [],
      },
    };

    return { ok: true, critique };
  });
