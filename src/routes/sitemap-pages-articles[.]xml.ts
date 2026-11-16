import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import { buildContentPagesSitemap } from "@/lib/sitemap";
import { contentGroup } from "@/lib/sitemap-groups";

/** Resource articles + misc /p/{slug} content pages. */
const GROUP = contentGroup("/sitemap-pages-articles.xml");

export const Route = createFileRoute("/sitemap-pages-articles.xml")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        buildContentPagesSitemap(request, GROUP, "/p", supabaseAdmin, SITE_URL),
    },
  },
});
