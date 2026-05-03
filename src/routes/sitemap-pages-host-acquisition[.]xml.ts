import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import { buildContentPagesSitemap } from "@/lib/sitemap";

/**
 * /p/become-a-(swimming-)pool-host-{city} — biggest pSEO bucket (~1,257 pages
 * after de-duping the 10 known duplicate pairs).
 */
export const Route = createFileRoute("/sitemap-pages-host-acquisition.xml")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        buildContentPagesSitemap(request, ["host_acquisition_city"], "/p", supabaseAdmin, SITE_URL),
    },
  },
});
