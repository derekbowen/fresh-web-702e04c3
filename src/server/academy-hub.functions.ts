import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface AcademyCourseLink {
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  cover_image_url: string | null;
  category: string;
  language: string;
  level: string | null;
  duration_minutes: number | null;
  is_featured: boolean;
  tier: string | null;
}

export interface AcademyCategoryGroup {
  category: string;
  count: number;
  courses: AcademyCourseLink[];
}

export interface AcademyHubData {
  language: "en" | "es";
  total: number;
  featured: AcademyCourseLink[];
  categories: AcademyCategoryGroup[];
}

const COLS =
  "slug, title, subtitle, excerpt, cover_image_url, category, language, level, duration_minutes, is_featured, tier";

/**
 * Hub data for the learning academy. Returns featured courses and all
 * published courses grouped by category for the requested language.
 */
export const getAcademyHub = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ language: z.enum(["en", "es"]).default("en") }).parse(d ?? {}),
  )
  .handler(async ({ data }): Promise<AcademyHubData> => {
    try {
      const { data: rows, error } = await supabaseAdmin
        .from("courses")
        .select(COLS)
        .eq("is_published", true)
        .eq("language", data.language)
        .order("is_featured", { ascending: false })
        .order("published_at", { ascending: false, nullsFirst: false });
      if (error) {
        console.error("getAcademyHub:", error);
        return { language: data.language, total: 0, featured: [], categories: [] };
      }
      const courses = (rows ?? []) as AcademyCourseLink[];
      const featured = courses.filter((c) => c.is_featured).slice(0, 6);
      const byCat = new Map<string, AcademyCourseLink[]>();
      for (const c of courses) {
        const cat = c.category || "general";
        if (!byCat.has(cat)) byCat.set(cat, []);
        byCat.get(cat)!.push(c);
      }
      const categories: AcademyCategoryGroup[] = Array.from(byCat.entries())
        .map(([category, list]) => ({
          category,
          count: list.length,
          courses: list,
        }))
        .sort((a, b) => b.count - a.count);
      return { language: data.language, total: courses.length, featured, categories };
    } catch (err) {
      console.error("getAcademyHub failed:", err);
      return { language: data.language, total: 0, featured: [], categories: [] };
    }
  });

/** Backwards compat: simple list used by the legacy dispatcher JSON-LD. */
export const listAcademyCourses = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ language: z.enum(["en", "es"]).default("en") }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const hub = await getAcademyHub({ data: { language: data.language } });
    return hub.categories.flatMap((g) => g.courses).map((c) => ({
      slug: c.slug,
      title: c.title,
      description: c.excerpt,
    }));
  });
