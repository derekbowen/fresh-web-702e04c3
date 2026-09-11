import { createFileRoute } from "@tanstack/react-router";
import { buildUrlsetXml, sitemapResponse } from "@/lib/sitemap";

/**
 * Retired 2026-09-02. Course pages moved to /p/elearning-academy-* and every
 * /p/course/{slug} URL is a permanent nginx redirect to its academy page; the
 * academy pages are listed in sitemap-pages-academy.xml. This route stays so
 * the URL Search Console already knows keeps answering 200 with an empty
 * urlset instead of turning into a 404 — and it is no longer advertised in
 * sitemap.xml. Do not add the course redirects back here.
 */
export const Route = createFileRoute("/sitemap-pages-courses.xml")({
  server: {
    handlers: {
      GET: async () => sitemapResponse(buildUrlsetXml([])),
    },
  },
});
