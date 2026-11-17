import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import { buildContentPagesSitemap } from "@/lib/sitemap";
import { contentGroup } from "@/lib/sitemap-groups";

/** /p/guide-to-{event-type}-pool-rental-{city} */
const GROUP = contentGroup("/sitemap-pages-event-guides.xml");

export const Route = createFileRoute("/sitemap-pages-event-guides.xml")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        buildContentPagesSitemap(request, GROUP, "/p", supabaseAdmin, SITE_URL),
    },
  },
});
