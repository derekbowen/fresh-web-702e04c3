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
