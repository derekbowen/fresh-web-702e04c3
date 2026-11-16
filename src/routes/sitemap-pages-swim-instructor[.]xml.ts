import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import { buildContentPagesSitemap } from "@/lib/sitemap";
import { contentGroup } from "@/lib/sitemap-groups";

/** /p/swim-instructor-pool-rental-{city} and the hub. */
const GROUP = contentGroup("/sitemap-pages-swim-instructor.xml");

export const Route = createFileRoute("/sitemap-pages-swim-instructor.xml")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        buildContentPagesSitemap(request, GROUP, "/p", supabaseAdmin, SITE_URL),
    },
  },
});
