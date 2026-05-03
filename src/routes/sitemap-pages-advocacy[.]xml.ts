import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import { buildContentPagesSitemap } from "@/lib/sitemap";

/** /p/host-advocacy* + /p/{state}-pool-host-advocacy-guide — ~59 pages */
export const Route = createFileRoute("/sitemap-pages-advocacy.xml")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        buildContentPagesSitemap(
          request,
          ["host_advocacy_hub", "host_advocacy_state"],
          "/p",
          supabaseAdmin,
          SITE_URL,
        ),
    },
  },
});
