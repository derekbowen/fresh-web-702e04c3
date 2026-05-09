import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";
import { redirect301 } from "@/lib/sitemap";

/** Legacy /blog index → /p/blog hub. */
export const Route = createFileRoute("/blog")({
  server: {
    handlers: {
      GET: () => redirect301("/p/blog", SITE_URL),
    },
  },
});
