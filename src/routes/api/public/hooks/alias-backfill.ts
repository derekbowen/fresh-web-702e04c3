/**
 * Public cron endpoint for the automated alias backfill.
 *
 * Called weekly by pg_cron. The /api/public/* prefix bypasses auth at the
 * edge, so we authenticate the request via the Supabase anon key in an
 * `apikey` header. Anyone with the publishable key can trigger this — the
 * job is idempotent and only ever appends safe slug aliases derived from
 * existing 404 logs, so this is acceptable.
 */
import { createFileRoute } from "@tanstack/react-router";
import { runAliasBackfill } from "@/server/alias-backfill.server";

export const Route = createFileRoute("/api/public/hooks/alias-backfill")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey");
        const expected =
          process.env.SUPABASE_ANON_KEY ||
          process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected) {
          return new Response(
            JSON.stringify({ error: "Server misconfigured: anon key missing" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
        if (!apiKey || apiKey !== expected) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { "Content-Type": "application/json" } },
          );
        }

        try {
          const out = await runAliasBackfill({ limit: 1000 });
          return new Response(
            JSON.stringify({
              ok: true,
              summary: out.summary,
            }),
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
