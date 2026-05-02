import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const slugSchema = z.object({ slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/) });

export const getCity = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => slugSchema.parse(d))
  .handler(async ({ data }) => {
    const { data: city, error } = await supabaseAdmin
      .from("cities")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) console.error("getCity:", error);
    return { city: city ?? null };
  });

export const getCategory = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => slugSchema.parse(d))
  .handler(async ({ data }) => {
    const { data: category, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) console.error("getCategory:", error);
    return { category: category ?? null };
  });

export const getProvider = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => slugSchema.parse(d))
  .handler(async ({ data }) => {
    const { data: provider, error } = await supabaseAdmin
      .from("providers")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) console.error("getProvider:", error);
    return { provider: provider ?? null };
  });

export const getBlogPost = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => slugSchema.parse(d))
  .handler(async ({ data }) => {
    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) console.error("getBlogPost:", error);
    return { post: post ?? null };
  });

export const listAllSitemapEntries = createServerFn({ method: "GET" }).handler(
  async () => {
    const [cities, categories, providers, posts] = await Promise.all([
      supabaseAdmin
        .from("cities")
        .select("slug, updated_at")
        .eq("is_published", true),
      supabaseAdmin
        .from("categories")
        .select("slug, updated_at")
        .eq("is_published", true),
      supabaseAdmin
        .from("providers")
        .select("slug, updated_at")
        .eq("is_published", true),
      supabaseAdmin
        .from("blog_posts")
        .select("slug, updated_at")
        .eq("is_published", true),
    ]);
    return {
      cities: cities.data ?? [],
      categories: categories.data ?? [],
      providers: providers.data ?? [],
      posts: posts.data ?? [],
    };
  },
);

const nearbyInputSchema = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  state_code: z.string().length(2).optional(),
  limit: z.number().int().min(1).max(24).optional(),
});

/**
 * Get the geographically nearest published cities to the given slug.
 * Falls back to same-state results when coordinates aren't available.
 */
export const getNearbyCities = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => nearbyInputSchema.parse(d))
  .handler(async ({ data }) => {
    const limit = data.limit ?? 12;
    const { data: rows, error } = await supabaseAdmin.rpc(
      "nearby_cities_by_distance",
      { _slug: data.slug, _limit: limit },
    );
    if (error) {
      console.error("getNearbyCities rpc:", error);
      // Fallback: same-state cities
      let q = supabaseAdmin
        .from("cities")
        .select("slug, name, state, state_code")
        .eq("is_published", true)
        .neq("slug", data.slug)
        .limit(limit);
      if (data.state_code) q = q.eq("state_code", data.state_code);
      const { data: fb } = await q;
      return { cities: (fb ?? []).map((c) => ({ ...c, distance_km: null })) };
    }
    type Row = {
      out_slug: string;
      out_name: string;
      out_state: string;
      out_state_code: string;
      out_distance_km: number | null;
    };
    const cities = ((rows ?? []) as Row[]).map((r) => ({
      slug: r.out_slug,
      name: r.out_name,
      state: r.out_state,
      state_code: r.out_state_code,
      distance_km: r.out_distance_km,
    }));
    return { cities };
  });

/** All published categories (slug, name, icon). */
export const listCategories = createServerFn({ method: "GET" }).handler(
  async () => {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("slug, name, icon")
      .eq("is_published", true)
      .order("name");
    if (error) console.error("listCategories:", error);
    return { categories: data ?? [] };
  },
);

const blogListSchema = z.object({
  page: z.number().int().min(1).max(500).default(1),
  pageSize: z.number().int().min(1).max(48).default(12),
  topic: z.string().min(1).max(48).regex(/^[a-z0-9-]+$/).optional(),
});

/** Paginated published blog posts, optionally filtered by topic. */
export const listBlogPostsPaged = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => blogListSchema.parse(d ?? {}))
  .handler(async ({ data }) => {
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    let q = supabaseAdmin
      .from("blog_posts")
      .select("slug, title, excerpt, cover_image_url, published_at, topic", { count: "exact" })
      .eq("is_published", true);
    if (data.topic) q = q.eq("topic", data.topic);
    const { data: rows, count, error } = await q
      .order("published_at", { ascending: false, nullsFirst: false })
      .range(from, to);
    if (error) console.error("listBlogPostsPaged:", error);
    return {
      posts: rows ?? [],
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
      topic: data.topic ?? null,
    };
  });

/** Distinct topics with post counts (published only). */
export const listBlogTopics = createServerFn({ method: "GET" }).handler(
  async () => {
    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .select("topic")
      .eq("is_published", true)
      .not("topic", "is", null);
    if (error) console.error("listBlogTopics:", error);
    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      const t = (row as { topic: string | null }).topic;
      if (!t) continue;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    const topics = Array.from(counts.entries())
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count);
    return { topics };
  },
);

const stateCodeSchema = z.object({
  state_code: z.string().length(2).regex(/^[A-Z]{2}$/),
});

export type StatePoolRegulation = {
  state_code: string;
  state_name: string;
  legality_status: "legal" | "conditional" | "prohibited" | "unknown";
  summary: string | null;
  zoning_summary: string | null;
  permit_name: string | null;
  permit_fee_min_usd: number | null;
  permit_fee_max_usd: number | null;
  authority_name: string | null;
  authority_url: string | null;
  enforcement_notes: string | null;
  compliance_steps: string[];
  faqs: Array<{ q: string; a: string }>;
  source_urls: string[];
  last_verified_at: string | null;
};

export const getStateRegulation = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => stateCodeSchema.parse(d))
  .handler(async ({ data }): Promise<{ regulation: StatePoolRegulation | null }> => {
    const { data: row, error } = await supabaseAdmin
      .from("state_pool_regulations")
      .select("*")
      .eq("state_code", data.state_code)
      .maybeSingle();
    if (error) {
      console.error("getStateRegulation:", error);
      return { regulation: null };
    }
    if (!row) return { regulation: null };
    return {
      regulation: {
        state_code: row.state_code as string,
        state_name: row.state_name as string,
        legality_status: row.legality_status as StatePoolRegulation["legality_status"],
        summary: (row.summary as string | null) ?? null,
        zoning_summary: (row.zoning_summary as string | null) ?? null,
        permit_name: (row.permit_name as string | null) ?? null,
        permit_fee_min_usd: (row.permit_fee_min_usd as number | null) ?? null,
        permit_fee_max_usd: (row.permit_fee_max_usd as number | null) ?? null,
        authority_name: (row.authority_name as string | null) ?? null,
        authority_url: (row.authority_url as string | null) ?? null,
        enforcement_notes: (row.enforcement_notes as string | null) ?? null,
        compliance_steps: Array.isArray(row.compliance_steps)
          ? (row.compliance_steps as string[])
          : [],
        faqs: Array.isArray(row.faqs)
          ? (row.faqs as Array<{ q: string; a: string }>)
          : [],
        source_urls: (row.source_urls as string[] | null) ?? [],
        last_verified_at: (row.last_verified_at as string | null) ?? null,
      },
    };
  });
