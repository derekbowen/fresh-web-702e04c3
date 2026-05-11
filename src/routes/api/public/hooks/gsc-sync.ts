import { createFileRoute } from "@tanstack/react-router";
import { runGscSync } from "@/server/gsc-sync.server";

function authorizeCronRequest(request: Request): Response | null {
  const expected = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  const provided = request.headers.get("apikey") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || provided !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export const Route = createFileRoute("/api/public/hooks/gsc-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = authorizeCronRequest(request);
        if (unauth) return unauth;
        try {
          const result = await runGscSync({ days: 3, rowLimit: 25000, triggerSource: "cron" });
          return Response.json(result, { status: result.ok ? 200 : 500 });
        } catch (e) {
          console.error("[gsc-sync] hook failed", e);
          return Response.json(
            { ok: false, error: e instanceof Error ? e.message : String(e) },
            { status: 500 },
          );
        }
      },
    },
  },
});
