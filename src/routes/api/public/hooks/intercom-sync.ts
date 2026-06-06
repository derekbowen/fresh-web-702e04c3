import { createFileRoute } from "@tanstack/react-router";
import { syncAllToIntercom } from "@/server/intercom-sync.server";

export const Route = createFileRoute("/api/public/hooks/intercom-sync")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const out = await syncAllToIntercom();
          return Response.json({ ok: true, ...out });
        } catch (err: any) {
          return Response.json(
            { ok: false, error: err?.message || String(err) },
            { status: 500 },
          );
        }
      },
      GET: async () => Response.json({ ok: true, hint: "POST to run sync" }),
    },
  },
});
