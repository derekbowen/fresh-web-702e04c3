import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";

/**
 * Production host — only this hostname serves an indexable robots.txt.
 * Any other host (preview, *.lovable.app, EC2 IP, staging) gets a hard
 * Disallow: / so we don't fragment SEO across duplicate origins.
 */
const PROD_HOST = "poolrentalnearme.com";

/**
 * Country domains. Each serves the same app as .com and self-canonicalises, so
 * they must NOT be opened up wholesale - that would advertise four copies of
 * every page. Each one is allowed to be crawled only for its own country's
 * pages, and points at a country-scoped sitemap on its own origin.
 */
const COUNTRY_HOSTS: Record<string, { label: string; allow: string[] }> = {
  "poolrentalnearme.com.au": {
    label: "Australia",
    allow: [
      "/p/*-australia$",
      "/p/australian-*",
      "/p/rent-out-your-pool-sydney$",
      "/p/rent-out-your-pool-melbourne$",
    ],
  },
  "poolrentalnearme.co.uk": {
    label: "United Kingdom",
    allow: [
      "/p/*-uk$",
      "/p/*-united-kingdom$",
      "/p/rent-out-your-pool-london$",
      "/p/rent-out-your-pool-manchester$",
    ],
  },
  "poolrentalnearme.ca": {
    label: "Canada",
    allow: [
      "/p/*-canada$",
      "/p/canadian-*",
      "/p/rent-out-your-pool-toronto$",
      "/p/rent-out-your-pool-vancouver$",
    ],
  },
};

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const host = (() => {
          try {
            return new URL(request.url).hostname.toLowerCase();
          } catch {
            return "";
          }
        })();

        const isProd = host === PROD_HOST || host === `www.${PROD_HOST}`;
        const bareHost = host.replace(/^www\./, "");
        const country = isProd ? undefined : COUNTRY_HOSTS[bareHost];

        const body = isProd
          ? `User-agent: *
Allow: /

# Auth-required marketplace flows (Sharetribe-handled, not for indexing)
Disallow: /admin/
Disallow: /account/
Disallow: /auth/
Disallow: /inbox/
Disallow: /listings
Disallow: /profile-settings
Disallow: /verify/

# Sharetribe public user profiles — thin pages stuck in
# "Crawled — currently not indexed". Block to save crawl budget.
# /l/* (pool listings) stays ALLOWED — those are core marketplace content.
Disallow: /u/

# Internal API endpoints
Disallow: /api/sharetribe/
Disallow: /api/public/track-city-click

# Don't index search query strings (paginated/filtered /s),
# but allow the bare search hub at /s
Allow: /s$
Allow: /s
Disallow: /s?

Sitemap: ${SITE_URL}/sitemap.xml
`
          : country
            ? `# ${country.label} domain for Pool Rental Near Me.
# Only this country's pages are crawlable here; everything else lives on
# ${SITE_URL} and must not be duplicated across origins.
User-agent: *
Disallow: /
${country.allow.map((p) => `Allow: ${p}`).join("\n")}

Sitemap: https://${host}/sitemap-country.xml
`
            : `# Non-production host (${host || "unknown"}): block all crawling.
User-agent: *
Disallow: /
`;

        return new Response(body, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
            "X-Robots-Tag": isProd || country ? "all" : "noindex, nofollow",
          },
        });
      },
    },
  },
});
