import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import { buildContentPagesSitemap } from "@/lib/sitemap";
import { contentGroup } from "@/lib/sitemap-groups";

/**
 * /p/elearning-academy-{slug}: academy landing and course pages. On www this
 * path is still answered by a static file on WEST (frozen 2026-07-20); see
 * docs/seo-repairs-2026-11/academy-sitemap.md for what WEST must do.
 */
const GROUP = contentGroup("/sitemap-pages-academy.xml");

export const Route = createFileRoute("/sitemap-pages-academy.xml")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        buildContentPagesSitemap(request, GROUP, "/p", supabaseAdmin, SITE_URL),
    },
  },
});
