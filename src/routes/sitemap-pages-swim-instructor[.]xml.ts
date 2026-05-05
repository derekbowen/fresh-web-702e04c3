import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import { buildContentPagesSitemap } from "@/lib/sitemap";

export const Route = createFileRoute("/sitemap-pages-swim-instructor.xml")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        buildContentPagesSitemap(
          request,
          ["swim_instructor_city", "swim_instructor_hub"],
          "/p",
          supabaseAdmin,
          SITE_URL,
        ),
    },
  },
});
