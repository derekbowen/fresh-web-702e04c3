import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import { buildContentPagesSitemap } from "@/lib/sitemap";
import { contentGroup } from "@/lib/sitemap-groups";

/** /p/become-a-(swimming-)pool-host-{city} and the host hub rows (biggest pSEO bucket, paged). */
const GROUP = contentGroup("/sitemap-pages-host-acquisition.xml");

export const Route = createFileRoute("/sitemap-pages-host-acquisition.xml")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        buildContentPagesSitemap(request, GROUP, "/p", supabaseAdmin, SITE_URL),
    },
  },
});
