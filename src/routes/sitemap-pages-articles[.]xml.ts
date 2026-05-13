import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import { buildContentPagesSitemap } from "@/lib/sitemap";

/** Resource articles + misc /p/{slug} pages (template_type in resource, other). */
export const Route = createFileRoute("/sitemap-pages-articles.xml")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        buildContentPagesSitemap(request, ["resource", "other", "pool_maintenance", "pool_maintenance_hub"], "/p", supabaseAdmin, SITE_URL),
    },
  },
});
