/**
 * Cron: auto-pick A/B winners past their scheduled_winner_at.
 * Requires x-admin-token (HOOKS_ADMIN_TOKEN) — called by pg_cron every minute.
 */
import { createFileRoute } from "@tanstack/react-router";
import { authorizeHookRequest } from "@/server/hook-auth.server";

export const Route = createFileRoute("/api/public/hooks/ab-auto-winner")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
        if (unauth) return unauth;
        try {
          const { runAbAutoWinnerCron } = await import("@/server/email-composer-extras.server");
          const result = await runAbAutoWinnerCron();
          return new Response(JSON.stringify({ ok: true, ...result }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ ok: false, error: String(err?.message || err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
