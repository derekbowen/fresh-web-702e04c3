import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/api/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const body = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`;
        return new Response(body, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
