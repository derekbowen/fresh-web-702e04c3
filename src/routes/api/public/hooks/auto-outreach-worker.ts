import { createFileRoute } from "@tanstack/react-router";
import { authorizeHookRequest } from "@/server/hook-auth.server";
import { runAutoOutreach } from "@/server/auto-outreach.server";

export const Route = createFileRoute("/api/public/hooks/auto-outreach-worker")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = authorizeHookRequest(request);
        if (unauth) return unauth;
        try {
          const r = await runAutoOutreach();
          return new Response(JSON.stringify(r), { status: 200, headers: { "Content-Type": "application/json" } });
        } catch (e: any) {
          console.error("[auto-outreach-worker] failed", e);
          return new Response(JSON.stringify({ ok: false, error: e?.message || "failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});
