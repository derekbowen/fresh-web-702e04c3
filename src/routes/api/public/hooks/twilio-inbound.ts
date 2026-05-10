// Twilio inbound SMS webhook. Handles STOP / START / HELP and logs replies.
// Configure in Twilio: Phone Number → Messaging → "A message comes in" →
//   POST https://fresh-web.lovable.app/api/public/hooks/twilio-inbound
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { recordOptOut, recordOptIn, toE164 } from "@/server/sms.server";

const STOP_WORDS = new Set(["stop", "stopall", "unsubscribe", "cancel", "end", "quit"]);
const START_WORDS = new Set(["start", "unstop", "yes"]);
const HELP_WORDS = new Set(["help", "info"]);

function twiml(message?: string): Response {
  const body = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response/>`;
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string));
}

export const Route = createFileRoute("/api/public/hooks/twilio-inbound")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData();
        const fromRaw = String(form.get("From") || "");
        const to = String(form.get("To") || "");
        const body = String(form.get("Body") || "").trim();
        const sid = String(form.get("MessageSid") || "");
        const fromE164 = toE164(fromRaw) ?? fromRaw;
        const keyword = body.toLowerCase().replace(/[^a-z]/g, "");

        let action = "received";
        let reply: string | undefined;

        if (STOP_WORDS.has(keyword)) {
          await recordOptOut(fromE164, "inbound_stop");
          action = "opt_out";
          reply = "You're opted out of Pool Rental Near Me messages. Reply START to opt back in.";
        } else if (START_WORDS.has(keyword)) {
          await recordOptIn(fromE164);
          action = "opt_in";
          reply = "You're opted back in to Pool Rental Near Me messages. Reply STOP anytime to opt out.";
        } else if (HELP_WORDS.has(keyword)) {
          action = "help";
          reply = "Pool Rental Near Me: hosting support. Msg&data rates may apply. Reply STOP to opt out. hello@poolrentalnearme.com";
        }

        await supabaseAdmin.from("sms_inbound_log").insert({
          from_phone: fromE164,
          to_phone: to,
          body,
          twilio_sid: sid,
          action,
        });

        return twiml(reply);
      },
    },
  },
});
