import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import { buildContentPagesSitemap } from "@/lib/sitemap";
import { contentGroup } from "@/lib/sitemap-groups";

/** Spanish content — /p/conviertete-en-anfitrion-de-piscina-* + /p/aprende-* + /p/es/* */
const GROUP = contentGroup("/sitemap-pages-spanish.xml");

export const Route = createFileRoute("/sitemap-pages-spanish.xml")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        buildContentPagesSitemap(request, GROUP, "/p", supabaseAdmin, SITE_URL),
    },
  },
});
