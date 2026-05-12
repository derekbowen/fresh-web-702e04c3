import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import { buildContentPagesSitemap } from "@/lib/sitemap";

/** Spanish content — /p/conviertete-en-anfitrion-de-piscina-* + /p/aprende-* (~51) */
export const Route = createFileRoute("/sitemap-pages-spanish.xml")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        buildContentPagesSitemap(
          request,
          ["spanish_host_acq", "spanish_resource", "host_acq_city_es"],
          "/p",
          supabaseAdmin,
          SITE_URL,
        ),
    },
  },
});
