import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import { buildContentPagesSitemap } from "@/lib/sitemap";

/** /p/guide-to-{event-type}-pool-rental-{city} — ~566 pages */
export const Route = createFileRoute("/sitemap-pages-event-guides.xml")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        buildContentPagesSitemap(request, ["event_guide"], "/p", supabaseAdmin, SITE_URL),
    },
  },
});
