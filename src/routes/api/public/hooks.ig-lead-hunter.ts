import { createFileRoute } from "@tanstack/react-router";
import { runIgLeadHunt } from "@/server/ig-lead-hunter.server";

export const Route = createFileRoute("/api/public/hooks/ig-lead-hunter")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const result = await runIgLeadHunt();
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e: any) {
          console.error("[ig-lead-hunter cron] failed", e);
          return new Response(JSON.stringify({ ok: false, error: e?.message || "failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
