import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export type SeoIssueRow = {
  id: string;
  url_path: string | null;
  title: string | null;
  template_type: string | null;
  words: number;
  has_meta: boolean;
  updated_at: string;
};

const ISSUE_KINDS = ["thin", "empty", "missing_meta", "title_is_slug"] as const;
type IssueKind = (typeof ISSUE_KINDS)[number];

export const listSeoIssues = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      kind: z.enum(ISSUE_KINDS),
      limit: z.number().int().min(1).max(500).default(100),
    }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ rows: SeoIssueRow[] }> => {
    await assertAdmin((context as any).userId);
    let q = (supabaseAdmin as any)
      .from("content_pages")
      .select("id, url_path, title, template_type, body_markdown, seo_description, updated_at, slug, status")
      .eq("status", "published")
      .like("url_path", "/p/%")
      .order("updated_at", { ascending: false })
      .limit(500);
    const { data: rows } = await q;
    const mapped: SeoIssueRow[] = (rows || []).map((r: any) => {
      const words = (r.body_markdown || "").split(/\s+/).filter(Boolean).length;
      return {
        id: r.id, url_path: r.url_path, title: r.title, template_type: r.template_type,
        words, has_meta: !!r.seo_description, updated_at: r.updated_at,
      };
    });
    let filtered = mapped;
    const slugFromPath = (p: string | null) => (p || "").replace(/^\/p\//, "").replace(/-/g, " ").trim().toLowerCase();
    const titleEqualsSlug = (r: SeoIssueRow) => {
      const t = (r.title || "").trim().toLowerCase();
      return !!t && t === slugFromPath(r.url_path);
    };
    if (data.kind === "thin") filtered = mapped.filter((r) => r.words > 0 && r.words < 500);
    else if (data.kind === "empty") filtered = mapped.filter((r) => r.words === 0);
    else if (data.kind === "missing_meta") filtered = mapped.filter((r) => !r.has_meta);
    else if (data.kind === "title_is_slug") filtered = mapped.filter(titleEqualsSlug);
    return { rows: filtered.slice(0, data.limit) };
  });

export type LeadRow = {
  id: string; name: string; email: string; phone: string | null;
  company: string | null; website: string | null; city: string | null;
  state_code: string | null; message: string | null; source_path: string | null;
  status: string; created_at: string;
};

export const listLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      status: z.enum(["all", "new", "contacted", "closed"]).default("all"),
      limit: z.number().int().min(1).max(500).default(100),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<{ rows: LeadRow[] }> => {
    await assertAdmin((context as any).userId);
    let q = (supabaseAdmin as any).from("provider_leads").select("*").order("created_at", { ascending: false }).limit(data.limit);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows } = await q;
    return { rows: (rows || []) as LeadRow[] };
  });

export const updateLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["new", "contacted", "closed"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    const { error } = await (supabaseAdmin as any).from("provider_leads").update({ status: data.status }).eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

export type ContentPageRow = {
  id: string; url_path: string | null; title: string | null;
  template_type: string | null; status: string; words: number; updated_at: string;
};

export const listContentPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      q: z.string().max(200).default(""),
      status: z.enum(["all", "published", "pending", "draft"]).default("all"),
      template: z.string().max(80).default(""),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(10).max(200).default(50),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<{ rows: ContentPageRow[]; total: number }> => {
    await assertAdmin((context as any).userId);
    let base: any = (supabaseAdmin as any).from("content_pages").select("id, url_path, title, template_type, status, body_markdown, updated_at", { count: "exact" }).like("url_path", "/p/%");
    if (data.status !== "all") base = base.eq("status", data.status);
    if (data.template) base = base.eq("template_type", data.template);
    if (data.q) base = base.or(`url_path.ilike.%${data.q}%,title.ilike.%${data.q}%`);
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    const { data: rows, count } = await base.order("updated_at", { ascending: false }).range(from, to);
    const mapped: ContentPageRow[] = (rows || []).map((r: any) => ({
      id: r.id, url_path: r.url_path, title: r.title, template_type: r.template_type,
      status: r.status, words: (r.body_markdown || "").split(/\s+/).filter(Boolean).length, updated_at: r.updated_at,
    }));
    return { rows: mapped, total: count || 0 };
  });

export const bulkUpdateContentPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      ids: z.array(z.string().uuid()).min(1).max(500),
      action: z.enum(["publish", "unpublish", "delete"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    if (data.action === "delete") {
      const { error } = await (supabaseAdmin as any).from("content_pages").delete().in("id", data.ids);
      return error ? { ok: false, error: error.message } : { ok: true, count: data.ids.length };
    }
    const status = data.action === "publish" ? "published" : "pending";
    const { error } = await (supabaseAdmin as any).from("content_pages").update({ status, updated_at: new Date().toISOString() }).in("id", data.ids);
    return error ? { ok: false, error: error.message } : { ok: true, count: data.ids.length };
  });

export type IndexingStats = {
  totalPublished: number;
  byTemplate: Array<{ template_type: string | null; count: number }>;
  recent404s: Array<{ id: string; url_path: string; hit_count: number; last_seen_at: string }>;
  unresolved404s: number;
  recentlyPublished: number;
};

export const getIndexingStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IndexingStats> => {
    await assertAdmin((context as any).userId);
    const sb = supabaseAdmin as any;
    const day = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [{ count: totalPub }, { data: tpl }, { data: r404 }, { count: unres }, { count: recent }] = await Promise.all([
      sb.from("content_pages").select("*", { count: "exact", head: true }).eq("status", "published").like("url_path", "/p/%"),
      sb.from("content_pages").select("template_type, status").eq("status", "published").like("url_path", "/p/%").limit(5000),
      sb.from("content_404_log").select("id, url_path, hit_count, last_seen_at").is("resolved_at", null).order("hit_count", { ascending: false }).limit(20),
      sb.from("content_404_log").select("*", { count: "exact", head: true }).is("resolved_at", null),
      sb.from("content_pages").select("*", { count: "exact", head: true }).eq("status", "published").like("url_path", "/p/%").gte("updated_at", day),
    ]);
    const tplMap = new Map<string, number>();
    for (const r of tpl || []) {
      const k = (r as any).template_type || "(none)";
      tplMap.set(k, (tplMap.get(k) || 0) + 1);
    }
    return {
      totalPublished: totalPub || 0,
      byTemplate: Array.from(tplMap.entries()).map(([template_type, count]) => ({ template_type, count })).sort((a, b) => b.count - a.count),
      recent404s: r404 || [],
      unresolved404s: unres || 0,
      recentlyPublished: recent || 0,
    };
  });

// ============================================================================
// SEO fix actions: AI-powered repair for thin/empty/missing-meta/title-is-slug
// ============================================================================

const SEO_SYSTEM = `
You write SEO + brand content for Pool Rental Near Me (PRNM), a marketplace where homeowners rent out private pools by the hour.
Differentiators (mention naturally): 10% flat host fee (vs Swimply's 15%+), $2M liability insurance included.
Voice: confident, friendly, host-first. Short paragraphs. Real, useful copy. No filler. Sentence case headings. No em dashes.
Format: Markdown only. Use ## and ### headings. Include 3-5 internal links from this set where relevant:
  /s, /p/hosting, /p/all-locations, /p/earnings-calculator, /p/how-it-works
List Your Pool CTA URL: /l/draft/00000000-0000-0000-0000-000000000000/new/details
Always end with a short CTA paragraph linking to the List Your Pool URL or /s.
Return your answer ONLY by calling the write_page tool.
`.trim();

const SEO_TOOL = {
  type: "function" as const,
  function: {
    name: "write_page",
    description: "Return the repaired page content.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Human-readable H1 title (case-correct, no slug-style)" },
        seo_title: { type: "string", description: "<=60 chars" },
        seo_description: { type: "string", description: "<=155 chars, compelling meta description" },
        body_markdown: { type: "string", description: "Full markdown body, 800-1200 words, no frontmatter" },
      },
      required: ["title", "seo_title", "seo_description", "body_markdown"],
      additionalProperties: false,
    },
  },
};

function humanizeSlug(slug: string): string {
  return slug.replace(/^\/p\//, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function runSeoFix(pageId: string, mode: "full" | "meta_only" | "title_only"): Promise<
  { ok: true; newWords: number; newTitle: string } | { ok: false; error: string }
> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { ok: false, error: "LOVABLE_API_KEY not configured" };

  const { data: page, error: pErr } = await (supabaseAdmin as any)
    .from("content_pages")
    .select("id, url_path, slug, title, seo_title, seo_description, body_markdown, template_type, category")
    .eq("id", pageId)
    .maybeSingle();
  if (pErr || !page) return { ok: false, error: "Page not found" };

  const topic = humanizeSlug(page.url_path || page.slug || "");
  const currentBody = page.body_markdown || "";
  const wordCount = currentBody.split(/\s+/).filter(Boolean).length;

  let userPrompt = "";
  if (mode === "meta_only" || mode === "title_only") {
    userPrompt = `Generate ONLY a clean human-readable title and SEO title/description for this existing page.

URL: ${page.url_path}
Topic (derived from slug): ${topic}
Existing title: ${page.title || "(none)"}
Existing body excerpt (first 800 chars): ${currentBody.slice(0, 800)}

Produce:
- title: proper sentence-case H1 (NOT the slug)
- seo_title: <=60 chars, includes primary keyword
- seo_description: <=155 chars, compelling and specific

For body_markdown, return the EXISTING body unchanged.`;
  } else {
    const reason =
      wordCount === 0 ? "Page body is EMPTY — write fresh content." :
      wordCount < 500 ? `Page body is THIN (${wordCount} words) — expand to 800-1200 words while keeping any existing facts.` :
      "Improve the existing page.";
    userPrompt = `Repair this content page.

URL: ${page.url_path}
Topic (derived from slug): ${topic}
Existing title: ${page.title || "(none)"}
Issue: ${reason}
${currentBody ? `Existing body to expand/improve:\n---\n${currentBody.slice(0, 3000)}\n---` : ""}

Length: 800-1200 words. Use ## sections and ### sub-points. Strong opening, no fluff.`;
  }

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: SEO_SYSTEM }, { role: "user", content: userPrompt }],
      tools: [SEO_TOOL],
      tool_choice: { type: "function", function: { name: "write_page" } },
    }),
  });
  if (resp.status === 402) return { ok: false, error: "AI credits exhausted" };
  if (resp.status === 429) return { ok: false, error: "Rate limited — slow down" };
  if (!resp.ok) return { ok: false, error: `AI gateway ${resp.status}: ${(await resp.text()).slice(0, 200)}` };

  const json = await resp.json();
  const tc = json?.choices?.[0]?.message?.tool_calls?.[0];
  if (!tc?.function?.arguments) return { ok: false, error: "AI returned no tool call" };
  const gen = JSON.parse(tc.function.arguments) as {
    title: string; seo_title: string; seo_description: string; body_markdown: string;
  };

  const update: any = {
    title: gen.title || page.title,
    seo_title: (gen.seo_title || page.seo_title || gen.title || "").slice(0, 70),
    seo_description: (gen.seo_description || page.seo_description || "").slice(0, 160),
    updated_at: new Date().toISOString(),
  };
  if (mode === "full" && gen.body_markdown && gen.body_markdown.length > 300) {
    update.body_markdown = gen.body_markdown;
    // Auto-promote scraped/pending rows to published once they have a real
    // body. Without this, /p/{slug} keeps 404'ing because lookupContentPage
    // only renders status='published'. This is what unblocks GSC validation
    // for "Crawled - currently not indexed" / "Soft 404" / "Not found 404".
    if (gen.body_markdown.length >= 1000) {
      update.status = "published";
      update.in_sitemap = true;
    }
  }

  const { error: uErr } = await (supabaseAdmin as any).from("content_pages").update(update).eq("id", pageId);
  if (uErr) return { ok: false, error: uErr.message };
  return {
    ok: true,
    newWords: (update.body_markdown || currentBody).split(/\s+/).filter(Boolean).length,
    newTitle: update.title,
  };
}

export const aiFixContentPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      mode: z.enum(["full", "meta_only", "title_only"]).default("full"),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    return runSeoFix(data.id, data.mode);
  });

// ============================================================================
// Background job queue: enqueue / status / cancel
// ============================================================================

export type SeoJobRow = {
  id: string;
  page_id: string;
  mode: "full" | "meta_only" | "title_only";
  status: "queued" | "processing" | "done" | "failed" | "cancelled";
  attempts: number;
  result: any;
  error: string | null;
  batch_id: string | null;
  created_at: string;
  finished_at: string | null;
};

export const enqueueSeoFixJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      pageIds: z.array(z.string().uuid()).min(1).max(500),
      mode: z.enum(["full", "meta_only", "title_only"]).default("full"),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const userId = (context as any).userId as string;
    await assertAdmin(userId);
    const sb = supabaseAdmin as any;
    const batchId = crypto.randomUUID();
    const rows = data.pageIds.map((pid) => ({
      page_id: pid, mode: data.mode, status: "queued", batch_id: batchId, enqueued_by: userId,
    }));
    const { error } = await sb.from("seo_fix_jobs").insert(rows);
    if (error) return { ok: false, error: error.message };
    return { ok: true, batchId, count: rows.length };
  });

export const getSeoJobStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      batchId: z.string().uuid().optional(),
      pageIds: z.array(z.string().uuid()).max(500).optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<{ jobs: SeoJobRow[]; summary: { queued: number; processing: number; done: number; failed: number; cancelled: number } }> => {
    await assertAdmin((context as any).userId);
    const sb = supabaseAdmin as any;
    let q = sb.from("seo_fix_jobs").select("id, page_id, mode, status, attempts, result, error, batch_id, created_at, finished_at").order("created_at", { ascending: false }).limit(500);
    if (data.batchId) q = q.eq("batch_id", data.batchId);
    if (data.pageIds && data.pageIds.length) q = q.in("page_id", data.pageIds);
    const { data: jobs } = await q;
    const summary = { queued: 0, processing: 0, done: 0, failed: 0, cancelled: 0 };
    // For each page, only count the most recent job
    const seen = new Set<string>();
    const latest: SeoJobRow[] = [];
    for (const j of (jobs || []) as SeoJobRow[]) {
      if (seen.has(j.page_id)) continue;
      seen.add(j.page_id);
      latest.push(j);
      (summary as any)[j.status] = ((summary as any)[j.status] || 0) + 1;
    }
    return { jobs: latest, summary };
  });

export const cancelQueuedSeoJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ batchId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    const { error, count } = await (supabaseAdmin as any)
      .from("seo_fix_jobs")
      .update({ status: "cancelled", finished_at: new Date().toISOString() }, { count: "exact" })
      .eq("batch_id", data.batchId)
      .eq("status", "queued");
    if (error) return { ok: false, error: error.message };
    return { ok: true, cancelled: count || 0 };
  });
