import { createFileRoute } from "@tanstack/react-router";
import { authorizeHookRequest } from "@/server/hook-auth.server";
import { processFollowupReminders } from "@/server/followup-reminders.server";

export const Route = createFileRoute("/api/public/hooks/followup-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = authorizeHookRequest(request);
        if (unauth) return unauth;
        try {
          const result = await processFollowupReminders();
          return new Response(JSON.stringify({ ok: true, ...result }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
