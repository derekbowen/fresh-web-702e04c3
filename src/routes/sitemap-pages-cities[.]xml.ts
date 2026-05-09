import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import { buildContentPagesSitemap } from "@/lib/sitemap";

export const Route = createFileRoute("/sitemap-pages-cities.xml")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        buildContentPagesSitemap(
          request,
          ["city_main"],
          "/p",
          supabaseAdmin,
          SITE_URL,
        ),
    },
  },
});
