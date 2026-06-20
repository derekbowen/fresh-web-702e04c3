// Server-only Twilio SMS sender + sequence scheduling.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

export function toE164(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) {
    const d = digits.slice(1).replace(/\D/g, "");
    return d.length >= 10 && d.length <= 15 ? `+${d}` : null;
  }
  const d = digits.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return null;
}

export async function isOptedOut(phoneE164: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("sms_opt_outs")
    .select("phone_e164")
    .eq("phone_e164", phoneE164)
    .maybeSingle();
  return !!data;
}

export async function recordOptOut(phoneE164: string, source = "inbound_stop") {
  await supabaseAdmin
    .from("sms_opt_outs")
    .upsert({ phone_e164: phoneE164, source }, { onConflict: "phone_e164" });
  // Cancel any pending scheduled messages
  await supabaseAdmin
    .from("sms_messages")
    .update({ status: "cancelled" })
    .eq("phone_e164", phoneE164)
    .eq("status", "pending");
}

export async function recordOptIn(phoneE164: string) {
  await supabaseAdmin.from("sms_opt_outs").delete().eq("phone_e164", phoneE164);
}

export async function sendSms(to: string, body: string): Promise<{ sid?: string; error?: string }> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
  const FROM = process.env.TWILIO_SMS_FROM;
  if (!LOVABLE_API_KEY) return { error: "LOVABLE_API_KEY missing" };
  if (!TWILIO_API_KEY) return { error: "TWILIO_API_KEY missing" };
  if (!FROM) return { error: "TWILIO_SMS_FROM missing" };

  const res = await fetch(`${GATEWAY_URL}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TWILIO_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: FROM, Body: body }),
  });
  const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
  if (!res.ok) return { error: `Twilio ${res.status}: ${data.message || JSON.stringify(data)}` };
  return { sid: data.sid };
}

// 5-touch cadence: 0m, 1d, 3d, 7d, 14d
export function buildSequence(firstName: string): Array<{ step: number; offsetMs: number; body: string }> {
  const fn = (firstName || "there").split(" ")[0].slice(0, 30);
  const day = 24 * 60 * 60 * 1000;
  return [
    {
      step: 1,
      offsetMs: 0,
      body: `Hey ${fn}, it's Pool Rental Near Me. Thanks for your interest in hosting! Quick Q — is your pool ready for guests this season? Reply STOP to opt out.`,
    },
    {
      step: 2,
      offsetMs: 1 * day,
      body: `Hi ${fn}, following up — most hosts in your area earn $40-150/hr. Want a free rate estimate? Reply YES and we'll send it. Reply STOP to opt out.`,
    },
    {
      step: 3,
      offsetMs: 3 * day,
      body: `${fn}, our top hosts list in under 10 minutes — photos, rate, calendar. Need a hand getting set up? Just reply. STOP to opt out.`,
    },
    {
      step: 4,
      offsetMs: 7 * day,
      body: `${fn} — quick check-in. We include $2M liability insurance + a 10% flat host fee (vs Swimply's 15%+). Worth a 5-min call? STOP to opt out.`,
    },
    {
      step: 5,
      offsetMs: 14 * day,
      body: `Last note from us, ${fn}. If hosting isn't a fit right now, no worries. Anytime you're ready: poolrentalnearme.com. STOP to opt out.`,
    },
  ];
}

export async function scheduleSequence(opts: {
  leadId: string;
  phoneE164: string;
  firstName: string;
}) {
  if (await isOptedOut(opts.phoneE164)) return { skipped: true };
  const now = Date.now();
  const rows = buildSequence(opts.firstName).map((m) => ({
    lead_id: opts.leadId,
    phone_e164: opts.phoneE164,
    body: m.body,
    step: m.step,
    scheduled_at: new Date(now + m.offsetMs).toISOString(),
    status: "pending",
  }));
  await supabaseAdmin.from("sms_messages").insert(rows);
  return { scheduled: rows.length };
}
