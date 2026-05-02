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
