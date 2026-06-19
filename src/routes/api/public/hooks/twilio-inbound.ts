// Twilio inbound SMS webhook. Handles STOP / START / HELP and logs replies.
// SMS SENDING IS DISABLED — this route only handles inbound opt-out/opt-in.
// Configure in Twilio: Phone Number → Messaging → "A message comes in" →
//   POST https://www.poolrentalnearme.com/api/public/hooks/twilio-inbound
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { recordOptOut, recordOptIn, toE164 } from "@/server/sms.server";

const STOP_WORDS = new Set(["stop", "stopall", "unsubscribe", "cancel", "end", "quit"]);
const START_WORDS = new Set(["start", "unstop", "yes"]);
const HELP_WORDS = new Set(["help", "info"]);

/**
 * Validate the X-Twilio-Signature header per
 * https://www.twilio.com/docs/usage/webhooks/webhooks-security
 * Signature = base64(HMAC-SHA1(authToken, fullUrl + sortedKey+value pairs))
 */
function verifyTwilioSignature(authToken: string, url: string, params: Record<string, string>, signature: string): boolean {
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const k of sortedKeys) data += k + params[k];
  const expected = createHmac("sha1", authToken).update(data).digest("base64");
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

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
        const params: Record<string, string> = {};
        for (const [k, v] of form.entries()) params[k] = typeof v === "string" ? v : "";

        // Verify Twilio signature so attackers can't forge STOP/START messages.
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!authToken) {
          console.error("[twilio-inbound] TWILIO_AUTH_TOKEN not set");
          return new Response("Server misconfigured", { status: 500 });
        }
        const signature = request.headers.get("x-twilio-signature") ?? "";
        // Twilio signs the full external URL Twilio called. Reconstruct it from
        // X-Forwarded-* if present (we run behind nginx).
        const fwdProto = request.headers.get("x-forwarded-proto") ?? "https";
        const fwdHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;
        const path = new URL(request.url).pathname + new URL(request.url).search;
        const fullUrl = `${fwdProto}://${fwdHost}${path}`;
        if (!signature || !verifyTwilioSignature(authToken, fullUrl, params, signature)) {
          return new Response("Invalid signature", { status: 403 });
        }

        const fromRaw = params["From"] ?? "";
        const to = params["To"] ?? "";
        const body = (params["Body"] ?? "").trim();
        const sid = params["MessageSid"] ?? "";
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
