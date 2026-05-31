import { createFileRoute } from "@tanstack/react-router";
import { runGscSync } from "@/server/gsc-sync.server";
import { authorizeHookRequest } from "@/server/hook-auth.server";

export const Route = createFileRoute("/api/public/hooks/gsc-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await authorizeHookRequest(request);
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
