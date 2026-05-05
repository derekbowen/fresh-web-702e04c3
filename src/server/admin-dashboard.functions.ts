import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type DashboardStats = {
  contentPages: {
    total: number;
    published: number;
    pending: number;
    needsContent: number; // published but body too short OR not published
    last24h: number;
  };
  byTemplate: Array<{ template_type: string | null; total: number; published: number }>;
  recentlyPublished: Array<{ url_path: string; title: string | null; updated_at: string; words: number }>;
  blog: { total: number; published: number };
  courses: { total: number; published: number };
  helpArticles: { total: number; published: number };
  cities: { total: number; published: number };
  providers: { total: number; published: number };
  listings: { total: number; lastSync: string | null };
  users: { profiles: number; admins: number };
  waitlist: { total: number; last7d: number };
  leads: { total: number; new: number };
  missing404s: { total: number; unresolved: number };
  quality: {
    siteIssues: {
      missing_meta_published: number;
      missing_schema_published: number;
      no_links_published: number;
      title_is_slug_published: number;
      thin_published_total: number;
      empty_published_total: number;
    };
    byTemplate: Array<{
      template_type: string | null;
      total: number;
      published: number;
      pending: number;
      published_empty: number;
      published_thin: number;
      published_medium: number;
      published_healthy: number;
      avg_words_published: number | null;
      oldest_pending: string | null;
      published_last_7d: number;
    }>;
  };
  generatedAt: string;
};

async function requireAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Not authorized");
}

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardStats> => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);

    const sb = supabaseAdmin;
    const day = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const cnt = (q: any) => q.then((r: any) => r.count ?? 0);

    const [
      cpTotal,
      cpPublished,
      cpPending,
      cpNeeds,
      cpLast24,
      blogTotal,
      blogPub,
      coursesTotal,
      coursesPub,
      helpTotal,
      helpPub,
      citiesTotal,
      citiesPub,
      providersTotal,
      providersPub,
      listingsTotal,
      profilesTotal,
      adminsRows,
      waitlistTotal,
      waitlist7d,
      leadsTotal,
      leadsNew,
      missingTotal,
      missingUnresolved,
    ] = await Promise.all([
      cnt(sb.from("content_pages").select("*", { count: "exact", head: true }).like("url_path", "/p/%")),
      cnt(sb.from("content_pages").select("*", { count: "exact", head: true }).like("url_path", "/p/%").eq("status", "published")),
      cnt(sb.from("content_pages").select("*", { count: "exact", head: true }).like("url_path", "/p/%").neq("status", "published")),
      // needs content: not published yet (proxy)
      cnt(sb.from("content_pages").select("*", { count: "exact", head: true }).like("url_path", "/p/%").neq("status", "published")),
      cnt(sb.from("content_pages").select("*", { count: "exact", head: true }).like("url_path", "/p/%").eq("status", "published").gte("updated_at", day)),
      cnt(sb.from("blog_posts").select("*", { count: "exact", head: true })),
      cnt(sb.from("blog_posts").select("*", { count: "exact", head: true }).eq("is_published", true)),
      cnt(sb.from("courses").select("*", { count: "exact", head: true })),
      cnt(sb.from("courses").select("*", { count: "exact", head: true }).eq("is_published", true)),
      cnt(sb.from("help_articles").select("*", { count: "exact", head: true })),
      cnt(sb.from("help_articles").select("*", { count: "exact", head: true }).eq("is_published", true)),
      cnt(sb.from("cities").select("*", { count: "exact", head: true })),
      cnt(sb.from("cities").select("*", { count: "exact", head: true }).eq("is_published", true)),
      cnt(sb.from("providers").select("*", { count: "exact", head: true })),
      cnt(sb.from("providers").select("*", { count: "exact", head: true }).eq("is_published", true)),
      cnt(sb.from("synced_listings").select("*", { count: "exact", head: true }).eq("is_deleted", false)),
      cnt(sb.from("profiles").select("*", { count: "exact", head: true })),
      sb.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "admin").then((r: any) => r.count ?? 0),
      cnt(sb.from("pool_waitlist").select("*", { count: "exact", head: true })),
      cnt(sb.from("pool_waitlist").select("*", { count: "exact", head: true }).gte("created_at", week)),
      cnt(sb.from("provider_leads").select("*", { count: "exact", head: true })),
      cnt(sb.from("provider_leads").select("*", { count: "exact", head: true }).eq("status", "new")),
      cnt(sb.from("content_404_log").select("*", { count: "exact", head: true })),
      cnt(sb.from("content_404_log").select("*", { count: "exact", head: true }).is("resolved_at", null)),
    ]);

    const { data: byTemplateRaw } = await sb
      .from("content_pages")
      .select("template_type, status")
      .like("url_path", "/p/%")
      .limit(5000);
    const tplMap = new Map<string, { total: number; published: number }>();
    for (const r of byTemplateRaw || []) {
      const k = r.template_type || "(none)";
      const cur = tplMap.get(k) || { total: 0, published: 0 };
      cur.total++;
      if (r.status === "published") cur.published++;
      tplMap.set(k, cur);
    }
    const byTemplate = Array.from(tplMap.entries())
      .map(([template_type, v]) => ({ template_type, ...v }))
      .sort((a, b) => b.total - a.total);

    const { data: recent } = await sb
      .from("content_pages")
      .select("url_path, title, updated_at, body_markdown")
      .like("url_path", "/p/%")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(10);
    const recentlyPublished = (recent || []).map((r: any) => ({
      url_path: r.url_path,
      title: r.title,
      updated_at: r.updated_at,
      words: (r.body_markdown || "").split(/\s+/).filter(Boolean).length,
    }));

    const { data: lastSync } = await sb
      .from("listing_sync_log")
      .select("finished_at, started_at")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Quality (Phase 1)
    const [siteIssuesRes, tplQualityRes] = await Promise.all([
      (sb as any).from("site_issues").select("*").maybeSingle(),
      (sb as any).from("template_quality_breakdown").select("*"),
    ]);
    const siteIssues = (siteIssuesRes.data as any) || {
      missing_meta_published: 0,
      missing_schema_published: 0,
      no_links_published: 0,
      title_is_slug_published: 0,
      thin_published_total: 0,
      empty_published_total: 0,
    };
    const qualityByTemplate = ((tplQualityRes.data as any[]) || [])
      .map((r) => ({
        template_type: r.template_type,
        total: Number(r.total) || 0,
        published: Number(r.published) || 0,
        pending: Number(r.pending) || 0,
        published_empty: Number(r.published_empty) || 0,
        published_thin: Number(r.published_thin) || 0,
        published_medium: Number(r.published_medium) || 0,
        published_healthy: Number(r.published_healthy) || 0,
        avg_words_published: r.avg_words_published == null ? null : Number(r.avg_words_published),
        oldest_pending: r.oldest_pending,
        published_last_7d: Number(r.published_last_7d) || 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      contentPages: {
        total: cpTotal,
        published: cpPublished,
        pending: cpPending,
        needsContent: cpNeeds,
        last24h: cpLast24,
      },
      byTemplate,
      recentlyPublished,
      blog: { total: blogTotal, published: blogPub },
      courses: { total: coursesTotal, published: coursesPub },
      helpArticles: { total: helpTotal, published: helpPub },
      cities: { total: citiesTotal, published: citiesPub },
      providers: { total: providersTotal, published: providersPub },
      listings: { total: listingsTotal, lastSync: lastSync?.finished_at || lastSync?.started_at || null },
      users: { profiles: profilesTotal, admins: adminsRows as number },
      waitlist: { total: waitlistTotal, last7d: waitlist7d },
      leads: { total: leadsTotal, new: leadsNew },
      missing404s: { total: missingTotal, unresolved: missingUnresolved },
      quality: { siteIssues, byTemplate: qualityByTemplate },
      generatedAt: new Date().toISOString(),
    };
  });
