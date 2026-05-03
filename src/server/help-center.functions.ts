import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";




export const listHelpCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("help_categories")
    .select("slug, name, description, icon, hero_image_url, sort_order")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  if (error) console.error("listHelpCategories:", error);
  return { categories: data ?? [] };
});

export const listPopularHelpArticles = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("help_articles")
    .select("slug, title, category_slug")
    .eq("is_published", true)
    .eq("is_popular", true)
    .order("title", { ascending: true })
    .limit(10);
  if (error) console.error("listPopularHelpArticles:", error);
  return { articles: data ?? [] };
});

export const getHelpCategoryWithArticles = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(160).regex(/^[a-z0-9-]+$/) }).parse(d))
  .handler(async ({ data }) => {
    const [{ data: category }, { data: articles }] = await Promise.all([
      supabaseAdmin
        .from("help_categories")
        .select("*")
        .eq("slug", data.slug)
        .eq("is_published", true)
        .maybeSingle(),
      supabaseAdmin
        .from("help_articles")
        .select("slug, title, excerpt, sort_order, view_count")
        .eq("category_slug", data.slug)
        .eq("is_published", true)
        .order("sort_order", { ascending: true }),
    ]);
    return { category: category ?? null, articles: articles ?? [] };
  });

export const getHelpArticle = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(160).regex(/^[a-z0-9-]+$/) }).parse(d))
  .handler(async ({ data }) => {
    const { data: article } = await supabaseAdmin
      .from("help_articles")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!article) return { article: null, category: null, related: [] };

    const [{ data: category }, { data: related }] = await Promise.all([
      supabaseAdmin
        .from("help_categories")
        .select("slug, name, description")
        .eq("slug", article.category_slug)
        .maybeSingle(),
      supabaseAdmin
        .from("help_articles")
        .select("slug, title")
        .eq("category_slug", article.category_slug)
        .eq("is_published", true)
        .neq("slug", article.slug)
        .order("sort_order", { ascending: true })
        .limit(6),
    ]);

    return { article, category: category ?? null, related: related ?? [] };
  });

const searchSchema = z.object({ q: z.string().min(1).max(120) });
export const searchHelpArticles = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => searchSchema.parse(d))
  .handler(async ({ data }) => {
    const term = data.q.trim();
    if (!term) return { results: [] };
    const { data: results } = await supabaseAdmin
      .from("help_articles")
      .select("slug, title, excerpt, category_slug")
      .eq("is_published", true)
      .or(`title.ilike.%${term}%,excerpt.ilike.%${term}%,content.ilike.%${term}%`)
      .limit(20);
    return { results: results ?? [] };
  });
