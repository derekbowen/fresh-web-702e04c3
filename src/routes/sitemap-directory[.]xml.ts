import { createFileRoute } from "@tanstack/react-router";
import { sitemapGoneResponse } from "@/lib/sitemap";

/**
 * Retired 2026-11 (audit F2/F4): 410 Gone.
 *
 * This file listed the /p/pool-pros tree (1,357 URLs on 2026-11-14: the hub,
 * 465 category/state/city pages and 891 provider pages). Every one of those
 * routes is `noindex, nofollow` (p.pool-pros*.tsx), and a sitemap must not
 * advertise noindex URLs. It left the sitemap index on 2026-07-06 but stayed
 * reachable (and possibly submitted in Search Console). No indexable URL exists
 * in that tree today, so there is nothing to emit; if the tree is ever made
 * indexable, list it from a new route and add that route to the index.
 */
export const Route = createFileRoute("/sitemap-directory.xml")({
  server: {
    handlers: {
      GET: () =>
        sitemapGoneResponse(
          "The pool pros directory pages are not indexed, so this sitemap was retired.",
        ),
    },
  },
});
