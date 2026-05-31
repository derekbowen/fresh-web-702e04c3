/**
 * Public hook (cron): nightly conservative auto-fix for broken /p/ links.
 * Only replaces links whose slug exactly matches a legacy_slugs[] entry on
 * a published content page. All other broken links stay manual via
 * /admin/link-checker.
 */
import { createFileRoute } from "@tanstack/react-router";
import { runLinkAutoFix } from "@/server/link-auto-fix.server";
import { authorizeHookRequest } from "@/server/hook-auth.server";

export const Route = createFileRoute("/api/public/hooks/link-auto-fix")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        try {
          const result = await runLinkAutoFix({ batchSize: 200, maxPages: 2000 });
          return new Response(JSON.stringify({ ok: true, ...result }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.error("[link-auto-fix] failed", e);
          return new Response(
            JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
