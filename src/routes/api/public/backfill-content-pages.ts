import { createFileRoute } from "@tanstack/react-router";
import { runBackfillContentPages } from "@/server/backfill-content-pages.server";

/**
 * POST /api/public/backfill-content-pages
 * Body: { adminToken?, limit?, model?, dryRun? }
 * If adminToken is omitted, falls back to BACKFILL_ADMIN_TOKEN / SUPABASE_SERVICE_ROLE_KEY
 * from server env (so trusted callers don't have to ship the secret).
 */
export const Route = createFileRoute("/api/public/backfill-content-pages")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any = {};
        try {
          const text = await request.text();
          body = text ? JSON.parse(text) : {};
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        try {
          const adminToken =
            body?.adminToken ||
            process.env.BACKFILL_ADMIN_TOKEN ||
            process.env.SUPABASE_SERVICE_ROLE_KEY;
          const result = await runBackfillContentPages({ ...body, adminToken });
          return new Response(JSON.stringify(result, null, 2), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return new Response(JSON.stringify({ error: msg }), {
            status: msg === "Unauthorized" ? 401 : 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
