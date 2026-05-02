import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/api/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [cities, categories, providers, posts, courses] = await Promise.all([
          supabaseAdmin.from("cities").select("slug, updated_at").eq("is_published", true),
          supabaseAdmin.from("categories").select("slug, updated_at").eq("is_published", true),
          supabaseAdmin.from("providers").select("slug, updated_at").eq("is_published", true),
          supabaseAdmin.from("blog_posts").select("slug, updated_at").eq("is_published", true),
          supabaseAdmin.from("courses").select("slug, updated_at").eq("is_published", true),
        ]);

        const urls: Array<{ loc: string; lastmod?: string; priority?: string }> = [
          { loc: `${SITE_URL}/`, priority: "1.0" },
          { loc: `${SITE_URL}/blog`, priority: "0.7" },
          { loc: `${SITE_URL}/providers`, priority: "0.7" },
          { loc: `${SITE_URL}/academy`, priority: "0.8" },
        ];

        for (const c of cities.data ?? []) {
          urls.push({ loc: `${SITE_URL}/pool-rental/${c.slug}`, lastmod: c.updated_at, priority: "0.9" });
          urls.push({ loc: `${SITE_URL}/pool-rental-laws/${c.slug}`, lastmod: c.updated_at, priority: "0.8" });
        }
        for (const c of categories.data ?? []) {
          urls.push({ loc: `${SITE_URL}/category/${c.slug}`, lastmod: c.updated_at, priority: "0.8" });
        }
        for (const p of providers.data ?? []) {
          urls.push({ loc: `${SITE_URL}/providers/${p.slug}`, lastmod: p.updated_at, priority: "0.6" });
        }
        for (const p of posts.data ?? []) {
          urls.push({ loc: `${SITE_URL}/blog/${p.slug}`, lastmod: p.updated_at, priority: "0.6" });
        }
        for (const c of courses.data ?? []) {
          urls.push({ loc: `${SITE_URL}/academy/${c.slug}`, lastmod: c.updated_at, priority: "0.7" });
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ""}${u.priority ? `\n    <priority>${u.priority}</priority>` : ""}
  </url>`,
  )
  .join("\n")}
</urlset>`;

        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
