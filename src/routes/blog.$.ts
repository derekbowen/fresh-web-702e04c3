import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";
import { redirect301 } from "@/lib/sitemap";

/**
 * Legacy /blog/{slug} URLs are now served at /p/{slug}.
 * 301-redirects everything under /blog/* (and bare /blog) to the new path.
 *
 * NOTE: For these to fire in production the nginx config on EC2 must
 * forward /blog and /blog/* to fresh-web. Until then the handler still
 * runs in preview, the link checker, and any future proxy update.
 */
export const Route = createFileRoute("/blog/$")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const splat = ((params as { _splat?: string })._splat ?? "")
          .replace(/^\/+|\/+$/g, "");
        const target = splat ? `/p/${splat}` : "/p/blog";
        return redirect301(target, SITE_URL);
      },
    },
  },
});
