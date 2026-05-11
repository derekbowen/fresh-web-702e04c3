/**
 * Auto-outreach engine.
 * - Scans NEW lead_followups (host_lead, ig_lead, social_lead, provider_lead).
 * - Generates AI-personalized outreach via Lovable AI Gateway.
 * - Schedules a 3-touch cadence (0d / 3d / 7d) into auto_outreach_messages.
 * - Drains pending messages: sends email via Emailit, SMS via Twilio, DMs are
 *   stored as drafts (status='draft') for a future browser-automation channel.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendViaEmailit } from "@/lib/email/emailit";
import { sendSms, isOptedOut, toE164 } from "@/server/sms.server";

const sb = () => supabaseAdmin as any;
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_MODEL = "google/gemini-2.5-flash";

type LeadCtx = {
  source: "host_lead" | "ig_lead" | "social_lead" | "provider_lead";
  followup_id: string;
  lead_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  region: string | null;
  handle: string | null;
  profile_url: string | null;
  snippet: string | null;
};

async function loadLead(source: string, lead_id: string): Promise<Omit<LeadCtx, "followup_id" | "source" | "lead_id"> | null> {
  if (source === "host_lead") {
    const { data } = await sb().from("host_leads").select("name,email,phone_e164,city,region").eq("id", lead_id).maybeSingle();
    if (!data) return null;
    return { name: data.name, email: data.email, phone: data.phone_e164, city: data.city, region: data.region, handle: null, profile_url: null, snippet: null };
  }
  if (source === "provider_lead") {
    const { data } = await sb().from("provider_leads").select("name,email,phone,city,state_code,company,website,message").eq("id", lead_id).maybeSingle();
    if (!data) return null;
    return { name: data.name, email: data.email, phone: data.phone, city: data.city, region: data.state_code, handle: data.company, profile_url: data.website, snippet: data.message };
  }
  if (source === "ig_lead") {
    const { data } = await sb().from("ig_leads").select("profile_handle,profile_name,instagram_url,snippet").eq("id", lead_id).maybeSingle();
    if (!data) return null;
    return { name: data.profile_name, email: null, phone: null, city: null, region: null, handle: data.profile_handle, profile_url: data.instagram_url, snippet: data.snippet };
  }
  if (source === "social_lead") {
    const { data } = await sb().from("social_leads").select("display_name,handle,profile_url,source_url,snippet,location_hint").eq("id", lead_id).maybeSingle();
    if (!data) return null;
    return { name: data.display_name, email: null, phone: null, city: data.location_hint, region: null, handle: data.handle, profile_url: data.profile_url ?? data.source_url, snippet: data.snippet };
  }
  return null;
}

async function aiGenerate(channel: "email" | "sms" | "dm", lead: LeadCtx, step: number): Promise<{ subject?: string; body: string } | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;
  const fn = (lead.name || "there").split(" ")[0].slice(0, 40);
  const sys = `You write friendly, ultra-short outreach for Pool Rental Near Me — a Swimply alternative with a 10% flat host fee (vs 15%+) and $2M liability insurance included. Voice: founder, second person, sentence case, no em dashes, no hype words. Numbers $40-150/hr typical.`;
  const stepHint = step === 1
    ? "First touch. Warm, curious, ask if they'd consider hosting their pool. One soft CTA."
    : step === 2
    ? "Second touch (3 days later). Lead with one concrete benefit (10% fee or $2M insurance). One soft CTA."
    : "Last touch (7 days later). Brief, no pressure, leave the door open.";
  const channelHint = channel === "email"
    ? "Output JSON {subject, body}. Body 70-110 words, plain text with line breaks. Sign 'PRNM team'."
    : channel === "sms"
    ? "Output JSON {body}. Max 280 chars. End with 'Reply STOP to opt out.'"
    : "Output JSON {body}. Max 350 chars, casual DM tone. No links unless natural. No 'STOP' line.";
  const ctx = `Lead: ${fn} | source=${lead.source} | city=${lead.city ?? "?"} | handle=${lead.handle ?? "?"} | profile=${lead.profile_url ?? "?"} | snippet=${(lead.snippet ?? "").slice(0, 240)}`;

  const r = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: "system", content: `${sys}\n${stepHint}\n${channelHint}` },
        { role: "user", content: ctx },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!r.ok) {
    console.warn("[auto-outreach] ai", r.status, await r.text().catch(() => ""));
    return null;
  }
  const j = await r.json();
  const txt = j?.choices?.[0]?.message?.content;
  if (!txt) return null;
  try {
    const p = JSON.parse(txt);
    if (!p.body) return null;
    return { subject: p.subject, body: p.body };
  } catch { return null; }
}

const DAY = 24 * 60 * 60 * 1000;

async function enqueueForFollowup(fu: { id: string; source: string; lead_id: string }) {
  const lead0 = await loadLead(fu.source, fu.lead_id);
  if (!lead0) return { skipped: "no-lead" };
  const lead: LeadCtx = { ...lead0, followup_id: fu.id, lead_id: fu.lead_id, source: fu.source as any };

  // Decide channel
  let channel: "email" | "sms" | "dm";
  let to: string | null;
  if (lead.email) { channel = "email"; to = lead.email; }
  else if (lead.phone) { channel = "sms"; to = toE164(lead.phone) ?? lead.phone; }
  else { channel = "dm"; to = lead.profile_url; }

  const now = Date.now();
  const offsets = [0, 3 * DAY, 7 * DAY];
  let inserted = 0;
  for (let i = 0; i < offsets.length; i++) {
    const step = i + 1;
    const gen = await aiGenerate(channel, lead, step);
    if (!gen) continue;
    const status = channel === "dm" ? "draft" : "pending";
    const { error } = await sb().from("auto_outreach_messages").insert({
      followup_id: fu.id,
      source: fu.source,
      lead_id: fu.lead_id,
      channel,
      step,
      to_address: to,
      subject: gen.subject ?? null,
      body: gen.body,
      scheduled_at: new Date(now + offsets[i]).toISOString(),
      status,
    });
    if (!error) inserted++;
  }
  // Move followup forward
  await sb().from("lead_followups").update({ status: "attempting" }).eq("id", fu.id).eq("status", "new");
  return { inserted, channel };
}

async function sendOne(msg: any, settings: any): Promise<{ status: "sent" | "failed"; error?: string; provider_id?: string }> {
  if (msg.channel === "email") {
    if (!settings.email_enabled) return { status: "failed", error: "email_disabled" };
    if (!msg.to_address) return { status: "failed", error: "no_email" };
    try {
      const text = msg.body;
      const html = `<div style="font-family:system-ui,Arial,sans-serif;font-size:15px;line-height:1.55;color:#111;max-width:560px">${text.replace(/\n/g, "<br/>")}</div>`;
      const res = await sendViaEmailit({
        from: `${settings.from_name} <${settings.from_email}>`,
        to: msg.to_address,
        subject: msg.subject || "Quick thought about your pool",
        html,
        text,
        replyTo: settings.reply_to ?? null,
      });
      return { status: "sent", provider_id: res.id };
    } catch (e: any) {
      return { status: "failed", error: String(e?.message || e).slice(0, 500) };
    }
  }
  if (msg.channel === "sms") {
    if (!settings.sms_enabled) return { status: "failed", error: "sms_disabled" };
    if (!msg.to_address) return { status: "failed", error: "no_phone" };
    if (await isOptedOut(msg.to_address)) return { status: "failed", error: "opted_out" };
    const { sid, error } = await sendSms(msg.to_address, msg.body);
    if (error) return { status: "failed", error };
    return { status: "sent", provider_id: sid };
  }
  return { status: "failed", error: "unsupported" };
}

export async function runAutoOutreach(): Promise<{ ok: true; enqueued: number; sent: number; failed: number; skipped: number }> {
  const { data: settingsRow } = await sb().from("auto_outreach_settings").select("*").eq("id", 1).maybeSingle();
  const settings = settingsRow ?? { email_enabled: true, sms_enabled: true, dm_drafts_enabled: true, from_email: "hello@poolrentalnearme.com", from_name: "Pool Rental Near Me", reply_to: null, max_per_hour: 60 };

  // 1) Enqueue for new followups that have NO outreach messages yet (limit 20/run)
  const { data: newFu } = await sb()
    .from("lead_followups")
    .select("id, source, lead_id")
    .eq("status", "new")
    .order("created_at", { ascending: false })
    .limit(20);
  let enqueued = 0;
  for (const fu of newFu ?? []) {
    const { count } = await sb()
      .from("auto_outreach_messages")
      .select("id", { count: "exact", head: true })
      .eq("followup_id", fu.id);
    if ((count ?? 0) > 0) continue;
    try {
      const r = await enqueueForFollowup(fu);
      if ((r as any).inserted) enqueued += (r as any).inserted;
    } catch (e) {
      console.warn("[auto-outreach] enqueue failed", fu.id, e);
    }
  }

  // 2) Drain due messages (cap by max_per_hour roughly per run)
  const cap = Math.max(1, Math.floor((settings.max_per_hour ?? 60) / 12)); // 12 runs/hour @ 5m
  const { data: due } = await sb()
    .from("auto_outreach_messages")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(cap);

  let sent = 0, failed = 0, skipped = 0;
  for (const msg of due ?? []) {
    const r = await sendOne(msg, settings);
    if (r.status === "sent") {
      sent++;
      await sb().from("auto_outreach_messages").update({ status: "sent", sent_at: new Date().toISOString(), provider_id: r.provider_id ?? null }).eq("id", msg.id);
      await sb().from("lead_touches").insert({
        followup_id: msg.followup_id,
        channel: msg.channel,
        outcome: "attempted",
        notes: `auto:${msg.channel}:step${msg.step}`,
      }).then(() => null, () => null);
    } else {
      failed++;
      await sb().from("auto_outreach_messages").update({ status: "failed", error: r.error ?? null }).eq("id", msg.id);
    }
  }

  return { ok: true, enqueued, sent, failed, skipped };
}
