import { createFileRoute } from "@tanstack/react-router";
import { syncAllToIntercom } from "@/server/intercom-sync.server";

export const Route = createFileRoute("/api/public/hooks/intercom-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const dryRun =
            url.searchParams.get("dryRun") === "1" ||
            url.searchParams.get("dryRun") === "true";
          const limit = Math.min(
            500,
            Math.max(1, parseInt(url.searchParams.get("limit") || "100", 10) || 100),
          );
          const out = await syncAllToIntercom({ dryRun, limit });
          return Response.json({ ok: true, ...out });
        } catch (err: any) {
          return Response.json(
            { ok: false, error: err?.message || String(err) },
            { status: 500 },
          );
        }
      },
      GET: async () =>
        Response.json({
          ok: true,
          hint:
            "POST to run sync. Add ?dryRun=1 to preview changes without writes. Optional ?limit=N (default 100, max 500).",
        }),
    },
  },
});
