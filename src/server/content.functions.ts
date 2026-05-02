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
