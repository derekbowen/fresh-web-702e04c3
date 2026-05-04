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
          // Require an explicit admin token from the caller. Accept either the
          // request body's `adminToken` field or an `x-admin-token` header.
          // Never fall back to server-side env vars — that would let any
          // unauthenticated caller pass the equality check inside the handler.
          const headerToken = request.headers.get("x-admin-token") || undefined;
          const adminToken: string | undefined = body?.adminToken || headerToken;
          if (!adminToken || typeof adminToken !== "string") {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }
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
