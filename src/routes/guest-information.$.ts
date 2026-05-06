import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";
import { resolveLegacyRedirect, legacyRedirectResponse } from "@/lib/legacy-redirects";

/**
 * Legacy /guest-information/* help-center URLs surfaced in GSC's "Crawled — currently
 * not indexed" report. These prefixes 404 in production today; once nginx
 * forwards them to fresh-web, this handler 301s them to a live /p/* page.
 */
export const Route = createFileRoute("/guest-information/$")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const splat = (params as { _splat?: string })._splat ?? "";
        const target = resolveLegacyRedirect("guest-information", splat);
        return legacyRedirectResponse(target, SITE_URL);
      },
    },
  },
});
