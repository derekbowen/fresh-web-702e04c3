/**
 * Email Composer — server-only helpers.
 *
 * - getAudienceCount: count active recipients per audience
 * - generateBodyWithAI: Lovable AI Gateway → plain-text body
 * - sendComposerEmail: render branded shell per-recipient, send via Emailit,
 *   pace under 2/sec, log every send, respect unsubscribes + suppression.
 * - scheduleComposerEmail: store campaign with scheduled_at; cron sends later.
 * - runScheduledComposerEmails: cron entry point.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendViaEmailit } from "@/lib/email/emailit";
import {
  wrapInShell,
  renderForRecipient,
  composeFromPlainText,
  toPlainText,
} from "@/lib/email-static/composer/_shell";

const FROM = "Pool Rental Near Me <support@poolrentalnearme.com>";
const REPLY_TO = "support@poolrentalnearme.com";
const SITE_URL = "https://www.poolrentalnearme.com";

export type Audience =
  | "hosts"
  | "renters"
  | "waitlist"
  | "custom"
  | "single";

type Recipient = {
  email: string;
  firstName: string;
  unsubscribeUrl: string;
};

function genToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function firstNameOf(name: string | null | undefined): string {
  if (!name) return "";
  return name.trim().split(/\s+/)[0] || "";
}

// ---------- Audience count ----------

export async function getAudienceCount(audience: Audience): Promise<number> {
  if (audience === "hosts") {
    const { count } = await supabaseAdmin
      .from("host_subscribers").select("*", { count: "exact", head: true })
      .eq("status", "active");
    return count ?? 0;
  }
  if (audience === "renters") {
    const { count } = await supabaseAdmin
      .from("renter_subscribers").select("*", { count: "exact", head: true })
      .eq("status", "active");
    return count ?? 0;
  }
  if (audience === "waitlist") {
    const { count } = await supabaseAdmin
      .from("pool_waitlist").select("*", { count: "exact", head: true });
    return count ?? 0;
  }
  return 0;
}

// ---------- Inline unsubscribe token (custom/waitlist/single) ----------

function generateInlineToken(email: string): string {
  const seed = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 16) || "prnm-fallback";
  const raw = `${email}|${seed}`;
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) { h ^= raw.charCodeAt(i); h = (h * 16777619) >>> 0; }
  const sig = h.toString(36);
  const b64 = btoa(email).replace(/=+$/, "").replace(/\//g, "_").replace(/\+/g, "-");
  return `${b64}.${sig}`;
}

export function decodeInlineToken(token: string): string | null {
  try {
    const [b64, sig] = token.split(".");
    if (!b64 || !sig) return null;
    const email = atob(b64.replace(/-/g, "+").replace(/_/g, "/")).toLowerCase();
    const seed = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 16) || "prnm-fallback";
    const raw = `${email}|${seed}`;
    let h = 2166136261;
    for (let i = 0; i < raw.length; i++) { h ^= raw.charCodeAt(i); h = (h * 16777619) >>> 0; }
    if (h.toString(36) !== sig) return null;
    return email;
  } catch { return null; }
}

async function resolveRecipients(
  audience: Audience,
  customEmails: string[] | null,
  singleEmail: string | null,
): Promise<Recipient[]> {
  if (audience === "single") {
    if (!singleEmail) return [];
    const email = singleEmail.trim().toLowerCase();
    return [{
      email,
      firstName: "",
      unsubscribeUrl: `${SITE_URL}/unsubscribe-composer?token=${generateInlineToken(email)}`,
    }];
  }
  if (audience === "custom") {
    const emails = (customEmails || [])
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    const unique = Array.from(new Set(emails));
    return unique.map((email) => ({
      email,
      firstName: "",
      unsubscribeUrl: `${SITE_URL}/unsubscribe-composer?token=${generateInlineToken(email)}`,
    }));
  }
  if (audience === "hosts") {
    const { data } = await supabaseAdmin
      .from("host_subscribers")
      .select("email, name, unsubscribe_token")
      .eq("status", "active");
    return (data || []).map((r: any) => ({
      email: String(r.email).toLowerCase(),
      firstName: firstNameOf(r.name),
      unsubscribeUrl: `${SITE_URL}/unsubscribe-host?token=${r.unsubscribe_token}`,
    }));
  }
  if (audience === "renters") {
    const { data } = await supabaseAdmin
      .from("renter_subscribers")
      .select("email, name, unsubscribe_token")
      .eq("status", "active");
    return (data || []).map((r: any) => ({
      email: String(r.email).toLowerCase(),
      firstName: firstNameOf(r.name),
      unsubscribeUrl: `${SITE_URL}/unsubscribe-renter?token=${r.unsubscribe_token}`,
    }));
  }
  if (audience === "waitlist") {
    const { data } = await supabaseAdmin
      .from("pool_waitlist")
      .select("email");
    const emails = Array.from(new Set((data || []).map((r: any) => String(r.email).toLowerCase())));
    return emails.map((email) => ({
      email,
      firstName: "",
      unsubscribeUrl: `${SITE_URL}/unsubscribe-composer?token=${generateInlineToken(email)}`,
    }));
  }
  return [];
}

async function filterSuppressed(recipients: Recipient[]): Promise<Recipient[]> {
  if (recipients.length === 0) return [];
  const emails = recipients.map((r) => r.email);
  const { data: unsubs } = await supabaseAdmin
    .from("composer_unsubscribes" as any)
    .select("email")
    .in("email", emails);
  const unsubSet = new Set((unsubs || []).map((r: any) => String(r.email).toLowerCase()));
  const { data: supp } = await supabaseAdmin
    .from("suppressed_emails")
    .select("email")
    .in("email", emails);
  const suppSet = new Set((supp || []).map((r: any) => String(r.email).toLowerCase()));
  return recipients.filter((r) => !unsubSet.has(r.email) && !suppSet.has(r.email));
}

// ---------- AI generation (plain text out) ----------

export async function generateBodyWithAI(opts: {
  description: string;
  tone?: string;
}): Promise<{ subject: string; bodyText: string }> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

  const system = `You are an email copywriter for "Pool Rental Near Me", a peer-to-peer pool rental marketplace.

VOICE: Founder-mentor talking to homeowners or renters. Sentence case. Second person ("you"). Warm, direct, useful.

BANNED WORDS: leverage, utilize, seamlessly, robust, dive into, elevate, game-changer, unlock, journey, landscape, bustling, thriving, vibrant, state-of-the-art, cutting-edge.
BANNED PHRASES: "in this article", "in conclusion", "it's worth noting", "thousands of hosts", "proven track record".
No em dashes. Numbers under 10 spelled out.

OUTPUT FORMAT: Return ONLY a JSON object with two keys:
- "subject": the email subject line (under 70 chars, no quotes)
- "body": the email body as PLAIN TEXT with this tiny markdown:
   # Heading
   ## Subheading
   - bullet
   1. numbered
   [Button text](https://url) on its own line for the call to action
   **bold**  *italic*
   {{first_name}} for the recipient's first name
   Blank line between paragraphs.
End with "— The PRNM Team".

Do NOT write HTML. Do NOT add a header or footer or unsubscribe text — the system adds them.
Do NOT wrap your JSON in markdown code fences.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: opts.description + (opts.tone ? `\n\nTone: ${opts.tone}` : "") },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI gateway ${res.status}: ${t.slice(0, 300)}`);
  }
  const data: any = await res.json();
  const content = data?.choices?.[0]?.message?.content || "{}";
  let parsed: any = {};
  try { parsed = JSON.parse(content); } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) { try { parsed = JSON.parse(m[0]); } catch {} }
  }
  const subject = String(parsed.subject || "").slice(0, 200);
  const bodyText = String(parsed.body || "");
  if (!bodyText) throw new Error("AI returned empty body");
  return { subject, bodyText };
}

// ---------- Send (immediate) ----------

export async function sendComposerEmail(opts: {
  audience: Audience;
  customEmails?: string[];
  singleEmail?: string;
  subject: string;
  /** Plain text body (markdown-lite). Required unless bodyHtml is supplied. */
  bodyText?: string;
  /** Pre-rendered HTML body (advanced). Overrides bodyText if both supplied. */
  bodyHtml?: string;
  preview?: string;
  testOnly?: boolean;
  testRecipient?: string;
  createdBy?: string;
  /** Existing campaign row to send (used by the scheduler). */
  campaignId?: string;
}): Promise<{
  campaignId: string;
  total: number;
  sent: number;
  failed: number;
  skipped: number;
}> {
  if (!opts.subject.trim()) throw new Error("Subject is required");
  const bodyText = opts.bodyText?.trim() || "";
  let bodyHtml = opts.bodyHtml?.trim() || "";
  let plainBody = bodyText;
  if (!bodyHtml) {
    if (!bodyText) throw new Error("Body is required");
    const rendered = composeFromPlainText(bodyText);
    bodyHtml = rendered.html;
    plainBody = rendered.plain;
  } else if (!plainBody) {
    plainBody = bodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  } else {
    plainBody = toPlainText(plainBody);
  }
  if (!bodyHtml) throw new Error("Body is required");

  let recipients: Recipient[];
  if (opts.testOnly) {
    if (!opts.testRecipient) throw new Error("Test recipient required");
    const email = opts.testRecipient.trim().toLowerCase();
    recipients = [{
      email,
      firstName: "",
      unsubscribeUrl: `${SITE_URL}/unsubscribe-composer?token=${generateInlineToken(email)}`,
    }];
  } else {
    recipients = await resolveRecipients(
      opts.audience,
      opts.customEmails ?? null,
      opts.singleEmail ?? null,
    );
    recipients = await filterSuppressed(recipients);
  }

  // Create campaign row (or update existing scheduled one to "sending").
  let campaignId = opts.campaignId || "";
  if (campaignId) {
    await supabaseAdmin.from("composer_campaigns" as any)
      .update({
        status: "sending",
        recipient_count: recipients.length,
      })
      .eq("id", campaignId);
  } else {
    const { data: campaign, error: cErr } = await supabaseAdmin
      .from("composer_campaigns" as any)
      .insert({
        created_by: opts.createdBy ?? null,
        subject: opts.subject,
        audience: opts.testOnly ? `${opts.audience}:test` : opts.audience,
        body_html: bodyHtml,
        plain_body: plainBody,
        preview_text: opts.preview ?? null,
        recipient_count: recipients.length,
        status: "sending",
        test_only: !!opts.testOnly,
      })
      .select("id")
      .single();
    if (cErr || !campaign) throw new Error(`Failed to create campaign: ${cErr?.message}`);
    campaignId = (campaign as any).id as string;
  }

  if (recipients.length === 0) {
    await supabaseAdmin.from("composer_campaigns" as any)
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", campaignId);
    return { campaignId, total: 0, sent: 0, failed: 0, skipped: 0 };
  }

  const shellHtml = wrapInShell({
    subject: opts.subject,
    bodyHtml,
    preview: opts.preview,
  });

  let sent = 0, failed = 0;
  const skipped = 0;

  for (const r of recipients) {
    try {
      const html = renderForRecipient(shellHtml, {
        firstName: r.firstName,
        unsubscribeUrl: r.unsubscribeUrl,
      });
      const text = plainBody
        .replaceAll("{{first_name}}", r.firstName || "there")
        + `\n\n---\nUnsubscribe: ${r.unsubscribeUrl}`;
      const result = await sendViaEmailit({
        from: FROM,
        to: r.email,
        subject: opts.subject,
        html,
        text,
        replyTo: REPLY_TO,
        headers: {
          "List-Unsubscribe": `<${r.unsubscribeUrl}>, <mailto:${REPLY_TO}?subject=unsubscribe>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
      await supabaseAdmin.from("composer_email_log" as any).insert({
        campaign_id: campaignId,
        recipient_email: r.email,
        status: "sent",
        emailit_id: result.id,
      });
      sent++;
    } catch (err: any) {
      const msg = (err?.message || String(err)).slice(0, 500);
      await supabaseAdmin.from("composer_email_log" as any).insert({
        campaign_id: campaignId,
        recipient_email: r.email,
        status: "failed",
        error: msg,
      });
      failed++;
      if (err?.status === 429) {
        const wait = Math.max((err?.retryAfterSeconds ?? 2) * 1000, 2000);
        await new Promise((res) => setTimeout(res, wait));
      }
    }
    await new Promise((res) => setTimeout(res, 700));
  }

  await supabaseAdmin.from("composer_campaigns" as any)
    .update({
      status: "completed",
      sent_count: sent,
      failed_count: failed,
      completed_at: new Date().toISOString(),
    })
    .eq("id", campaignId);

  return { campaignId, total: recipients.length, sent, failed, skipped };
}

// ---------- Schedule (send later) ----------

export async function scheduleComposerEmail(opts: {
  audience: Audience;
  customEmails?: string[];
  singleEmail?: string;
  subject: string;
  bodyText: string;
  preview?: string;
  scheduledAt: string; // ISO timestamp
  createdBy?: string;
}): Promise<{ campaignId: string; scheduledAt: string }> {
  if (!opts.subject.trim()) throw new Error("Subject is required");
  if (!opts.bodyText.trim()) throw new Error("Body is required");
  const when = new Date(opts.scheduledAt);
  if (isNaN(when.getTime())) throw new Error("Invalid scheduled time");
  if (when.getTime() < Date.now() - 60_000) throw new Error("Scheduled time is in the past");

  const { html, plain } = composeFromPlainText(opts.bodyText);

  // Resolve count up-front (snapshot for UI; recipients are re-resolved at send time).
  const recipients = await resolveRecipients(
    opts.audience,
    opts.customEmails ?? null,
    opts.singleEmail ?? null,
  );

  const { data, error } = await supabaseAdmin
    .from("composer_campaigns" as any)
    .insert({
      created_by: opts.createdBy ?? null,
      subject: opts.subject,
      audience: opts.audience,
      body_html: html,
      plain_body: plain,
      preview_text: opts.preview ?? null,
      custom_emails: opts.customEmails ?? null,
      single_email: opts.singleEmail ?? null,
      scheduled_at: when.toISOString(),
      recipient_count: recipients.length,
      status: "scheduled",
      test_only: false,
    })
    .select("id, scheduled_at")
    .single();
  if (error || !data) throw new Error(`Failed to schedule: ${error?.message}`);
  return {
    campaignId: (data as any).id,
    scheduledAt: (data as any).scheduled_at,
  };
}

/** Cron: pick due scheduled campaigns and send. Returns counts. */
export async function runScheduledComposerEmails(): Promise<{
  picked: number;
  results: Array<{ campaignId: string; sent: number; failed: number; total: number }>;
}> {
  const nowIso = new Date().toISOString();
  const { data: due } = await supabaseAdmin
    .from("composer_campaigns" as any)
    .select("id, subject, audience, body_html, plain_body, preview_text, custom_emails, single_email")
    .eq("status", "scheduled")
    .lte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(5);

  const rows = (due as any[]) || [];
  const results: Array<{ campaignId: string; sent: number; failed: number; total: number }> = [];

  for (const row of rows) {
    try {
      const r = await sendComposerEmail({
        campaignId: row.id,
        audience: row.audience as Audience,
        customEmails: row.custom_emails || undefined,
        singleEmail: row.single_email || undefined,
        subject: row.subject,
        bodyHtml: row.body_html,
        bodyText: row.plain_body || undefined,
        preview: row.preview_text || undefined,
      });
      results.push({ campaignId: r.campaignId, sent: r.sent, failed: r.failed, total: r.total });
    } catch (err: any) {
      await supabaseAdmin.from("composer_campaigns" as any)
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      results.push({ campaignId: row.id, sent: 0, failed: 0, total: 0 });
    }
  }

  return { picked: rows.length, results };
}

// ---------- Unsubscribe (composer) ----------

export async function unsubscribeComposerByToken(token: string): Promise<{ ok: boolean; email?: string; already?: boolean }> {
  const email = decodeInlineToken(token);
  if (!email) return { ok: false };
  const { data: existing } = await supabaseAdmin
    .from("composer_unsubscribes" as any)
    .select("email")
    .eq("email", email)
    .maybeSingle();
  if (existing) return { ok: true, email, already: true };
  await supabaseAdmin.from("composer_unsubscribes" as any).insert({
    email,
    token: genToken(),
  });
  return { ok: true, email };
}
