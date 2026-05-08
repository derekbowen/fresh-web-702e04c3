import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface AcademyCourseLink {
  slug: string;
  title: string;
  description: string | null;
}

export const listAcademyCourses = createServerFn({ method: "GET" }).handler(
  async (): Promise<AcademyCourseLink[]> => {
    try {
      const { data } = await (supabaseAdmin as any)
        .from("content_pages")
        .select("slug, title, seo_title, seo_description, description")
        .like("slug", "elearning-academy-%")
        .eq("status", "published")
        .order("title", { ascending: true });
      const rows = (data ?? []) as Array<{
        slug: string;
        title: string | null;
        seo_title: string | null;
        seo_description: string | null;
        description: string | null;
      }>;
      return rows.map((r) => ({
        slug: r.slug,
        title: r.seo_title || r.title || r.slug,
        description: r.seo_description || r.description || null,
      }));
    } catch {
      return [];
    }
  },
);
