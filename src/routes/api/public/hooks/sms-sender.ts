// Cron-driven SMS sender. Picks up due rows from sms_messages and sends via Twilio.
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendSms, isOptedOut } from "@/server/sms.server";

export const Route = createFileRoute("/api/public/hooks/sms-sender")({
  server: {
    handlers: {
      POST: async () => {
        const nowIso = new Date().toISOString();
        const { data: due, error } = await supabaseAdmin
          .from("sms_messages")
          .select("id, phone_e164, body, lead_id")
          .eq("status", "pending")
          .lte("scheduled_at", nowIso)
          .order("scheduled_at", { ascending: true })
          .limit(50);

        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const results: Array<Record<string, unknown>> = [];
        for (const msg of due ?? []) {
          if (await isOptedOut(msg.phone_e164)) {
            await supabaseAdmin
              .from("sms_messages")
              .update({ status: "cancelled", error: "opted_out" })
              .eq("id", msg.id);
            results.push({ id: msg.id, status: "cancelled" });
            continue;
          }
          const { sid, error: sendErr } = await sendSms(msg.phone_e164, msg.body);
          if (sendErr) {
            await supabaseAdmin
              .from("sms_messages")
              .update({ status: "failed", error: sendErr })
              .eq("id", msg.id);
            results.push({ id: msg.id, status: "failed", error: sendErr });
          } else {
            await supabaseAdmin
              .from("sms_messages")
              .update({ status: "sent", sent_at: new Date().toISOString(), twilio_sid: sid ?? null })
              .eq("id", msg.id);
            results.push({ id: msg.id, status: "sent", sid });
          }
        }

        return new Response(
          JSON.stringify({ ok: true, processed: results.length, results }),
          { headers: { "Content-Type": "application/json" } }
        );
      },
    },
  },
});
