import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";
import { redirect301 } from "@/lib/sitemap";

// Legacy Sharetribe-template default sitemap path → 301 to new parent index
export const Route = createFileRoute("/sitemap-index.xml")({
  server: { handlers: { GET: () => redirect301("/sitemap.xml", SITE_URL) } },
});
