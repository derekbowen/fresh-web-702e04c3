/**
 * Public cron endpoint for the automated alias backfill.
 *
 * Called weekly by pg_cron. The /api/public/* prefix bypasses auth at the
 * edge, so we authenticate via the shared hook auth helper which validates
 * a real admin token (HOOKS_ADMIN_TOKEN / BACKFILL_ADMIN_TOKEN / Vault).
 */
import { createFileRoute } from "@tanstack/react-router";
import { runAliasBackfill } from "@/server/alias-backfill.server";
import { authorizeHookRequest } from "@/server/hook-auth.server";

export const Route = createFileRoute("/api/public/hooks/alias-backfill")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;

        try {
          const out = await runAliasBackfill({ limit: 1000 });
          return new Response(
            JSON.stringify({ ok: true, summary: out.summary }),
            { headers: { "Content-Type": "application/json" } },
          );
        } catch (e) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: e instanceof Error ? e.message : String(e),
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
