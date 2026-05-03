import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";
import { redirect301 } from "@/lib/sitemap";

export const Route = createFileRoute("/pools-directory-sitemap.xml")({
  server: { handlers: { GET: () => redirect301("/sitemap.xml", SITE_URL) } },
});
