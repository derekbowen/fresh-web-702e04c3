import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const slugSchema = z.string().min(1).max(140).regex(/^[a-z0-9-]+$/);

const tierSchema = z.enum(["tier-1", "tier-2", "tier-3"]);

const listSchema = z.object({
  page: z.number().int().min(1).max(500).default(1),
  pageSize: z.number().int().min(1).max(48).default(12),
  category: z.string().min(1).max(48).regex(/^[a-z0-9-]+$/).optional(),
  language: z.enum(["en", "es"]).optional(),
  search: z.string().min(1).max(80).optional(),
  tier: tierSchema.optional(),
});

const COURSE_FIELDS =
  "slug, title, subtitle, excerpt, cover_image_url, category, language, level, duration_minutes, is_featured, published_at";

/** Paginated listing of published courses with optional filters. */
export const listCourses = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => listSchema.parse(d ?? {}))
  .handler(async ({ data }) => {
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    let q = supabaseAdmin
      .from("courses")
      .select(COURSE_FIELDS, { count: "exact" })
      .eq("is_published", true);
    if (data.category) q = q.eq("category", data.category);
    if (data.language) q = q.eq("language", data.language);
    if (data.search) {
      const s = data.search.replace(/[%_,]/g, " ");
      q = q.or(`title.ilike.%${s}%,excerpt.ilike.%${s}%`);
    }
    const { data: rows, count, error } = await q
      .order("is_featured", { ascending: false })
      .order("published_at", { ascending: false, nullsFirst: false })
      .range(from, to);
    if (error) console.error("listCourses:", error);
    return {
      courses: rows ?? [],
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
      category: data.category ?? null,
      language: data.language ?? null,
      search: data.search ?? null,
    };
  });

/** Distinct categories with published-course counts (optionally per language). */
export const listCourseCategories = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ language: z.enum(["en", "es"]).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("courses")
      .select("category")
      .eq("is_published", true);
    if (data.language) q = q.eq("language", data.language);
    const { data: rows, error } = await q;
    if (error) console.error("listCourseCategories:", error);
    const counts = new Map<string, number>();
    for (const row of rows ?? []) {
      const c = (row as { category: string | null }).category;
      if (!c) continue;
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    const categories = Array.from(counts.entries())
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count);
    return { categories };
  });

/** Featured courses for the catalog hero row. */
export const listFeaturedCourses = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        language: z.enum(["en", "es"]).optional(),
        limit: z.number().int().min(1).max(12).default(3),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("courses")
      .select(COURSE_FIELDS + ", excerpt")
      .eq("is_published", true)
      .eq("is_featured", true);
    if (data.language) q = q.eq("language", data.language);
    const { data: rows, error } = await q
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(data.limit);
    if (error) console.error("listFeaturedCourses:", error);
    return { courses: rows ?? [] };
  });

/** Single published course by slug. */
export const getCourse = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: slugSchema }).parse(d))
  .handler(async ({ data }) => {
    const { data: course, error } = await supabaseAdmin
      .from("courses")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) console.error("getCourse:", error);
    return { course: course ?? null };
  });

/** Up to 4 related courses in the same category, excluding the current slug. */
export const getRelatedCourses = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        slug: slugSchema,
        category: z.string().min(1).max(48).regex(/^[a-z0-9-]+$/),
        language: z.enum(["en", "es"]).default("en"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("courses")
      .select(COURSE_FIELDS)
      .eq("is_published", true)
      .eq("category", data.category)
      .eq("language", data.language)
      .neq("slug", data.slug)
      .order("is_featured", { ascending: false })
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(4);
    if (error) console.error("getRelatedCourses:", error);
    return { related: rows ?? [] };
  });

/** All published course slugs for sitemap generation. */
export const listAllCourseSlugs = createServerFn({ method: "GET" }).handler(
  async () => {
    const { data, error } = await supabaseAdmin
      .from("courses")
      .select("slug, updated_at")
      .eq("is_published", true);
    if (error) console.error("listAllCourseSlugs:", error);
    return { courses: data ?? [] };
  },
);
