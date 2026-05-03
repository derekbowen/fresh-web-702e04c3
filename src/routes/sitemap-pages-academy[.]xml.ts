import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import { buildContentPagesSitemap } from "@/lib/sitemap";

/** /p/elearning-academy-{slug} — academy marketing landing pages (~69) */
export const Route = createFileRoute("/sitemap-pages-academy.xml")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        buildContentPagesSitemap(request, ["elearning"], "/p", supabaseAdmin, SITE_URL),
    },
  },
});
