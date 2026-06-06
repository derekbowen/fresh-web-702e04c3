import { createFileRoute } from "@tanstack/react-router";

/**
 * Temp diagnostic: test the Sharetribe Test Admin API key.
 * Tries a few likely endpoints and returns raw status + body so we can
 * see what works.
 */
export const Route = createFileRoute("/api/public/test-st-admin")({
  server: {
    handlers: {
      GET: async () => {
        const key = process.env.SHARETRIBE_TEST_ADMIN_API_KEY;
        if (!key) {
          return new Response(
            JSON.stringify({ ok: false, error: "SHARETRIBE_TEST_ADMIN_API_KEY missing" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        const attempts = [
          {
            name: "flex-api assets v1 (landing-page latest)",
            url: "https://flex-api.sharetribe.com/v1/assets/content/landing-page.json?alias=latest",
          },
          {
            name: "flex-api assets v1 (no alias)",
            url: "https://flex-api.sharetribe.com/v1/assets/content/landing-page.json",
          },
          {
            name: "build-api assets v1 (landing-page)",
            url: "https://build-api.sharetribe.com/v1/assets/content/landing-page.json?alias=latest",
          },
          {
            name: "asset-delivery api",
            url: "https://asset-delivery-api.sharetribe.com/v1/assets/content/landing-page.json?alias=latest",
          },
        ];

        const results: any[] = [];
        for (const a of attempts) {
          try {
            const r = await fetch(a.url, {
              headers: {
                Authorization: `Bearer ${key}`,
                Accept: "application/json",
              },
            });
            const text = await r.text();
            results.push({
              name: a.name,
              url: a.url,
              status: r.status,
              ok: r.ok,
              bodyPreview: text.slice(0, 400),
            });
          } catch (e: any) {
            results.push({ name: a.name, url: a.url, error: e?.message || String(e) });
          }
        }

        return new Response(JSON.stringify({ keyPrefix: key.slice(0, 8), results }, null, 2), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
