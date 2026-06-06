/**
 * Email Composer — server-only helpers.
 *
 * - getAudienceCount: count active recipients per audience
 * - generateBodyWithAI: Lovable AI Gateway → inner body HTML
 * - sendComposerEmail: render branded shell per-recipient, send via Emailit,
 *   pace under 2/sec, log every send, respect unsubscribes + suppression.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendViaEmailit } from "@/lib/email/emailit";
import { wrapInShell, renderForRecipient } from "@/lib/email-static/composer/_shell";

const FROM = "Pool Rental Near Me <hello@notify.poolfriends.poolrentalnearme.com>";
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

// ---------- Resolve recipients ----------

// (Inline tokens are used for composer recipients — see generateInlineToken below.)


function generateInlineToken(email: string): string {
  // Deterministic per-email so retries land on the same link, but unguessable
  // because it carries a server secret-derived suffix.
  const seed = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 16) || "prnm-fallback";
  const raw = `${email}|${seed}`;
  // simple FNV-1a hash
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
  // composer_unsubscribes
  const { data: unsubs } = await supabaseAdmin
    .from("composer_unsubscribes" as any)
    .select("email")
    .in("email", emails);
  const unsubSet = new Set((unsubs || []).map((r: any) => String(r.email).toLowerCase()));
  // suppressed_emails (bounces / complaints)
  const { data: supp } = await supabaseAdmin
    .from("suppressed_emails")
    .select("email")
    .in("email", emails);
  const suppSet = new Set((supp || []).map((r: any) => String(r.email).toLowerCase()));
  return recipients.filter((r) => !unsubSet.has(r.email) && !suppSet.has(r.email));
}

// ---------- AI generation ----------

export async function generateBodyWithAI(opts: {
  description: string;
  tone?: string;
}): Promise<{ subject: string; bodyHtml: string }> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

  const system = `You are an email copywriter for "Pool Rental Near Me", a peer-to-peer pool rental marketplace.

VOICE: Founder-mentor talking to homeowners or renters. Sentence case. Second person ("you"). Warm, direct, useful.

BANNED WORDS: leverage, utilize, seamlessly, robust, dive into, elevate, game-changer, unlock, journey, landscape, bustling, thriving, vibrant, state-of-the-art, cutting-edge.
BANNED PHRASES: "in this article", "in conclusion", "it's worth noting", "thousands of hosts", "proven track record".
No em dashes. Numbers under 10 spelled out.

OUTPUT FORMAT: Return ONLY a JSON object with two keys:
- "subject": the email subject line (under 70 chars, no quotes)
- "body": the inner email body as HTML using only <p>, <h2>, <ul>, <ol>, <li>, <a>, <strong>, <em> tags with inline styles. Use the placeholder {{first_name}} for the recipient's first name. Use #0c4a6e for h2 color and #0ea5e9 for link/button color. If a clear call to action fits, include a button like:
<p style="margin:28px 0;"><a href="URL" style="background:#0ea5e9;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">CTA TEXT</a></p>
End with "— The PRNM Team".

Do NOT include <html>, <head>, <body>, header, logo, or unsubscribe text — those are added by the system.
Do NOT wrap your JSON in markdown code fences.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
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
    // Best-effort fallback: try to extract from a code fence
    const m = content.match(/\{[\s\S]*\}/);
    if (m) { try { parsed = JSON.parse(m[0]); } catch {} }
  }
  const subject = String(parsed.subject || "").slice(0, 200);
  const bodyHtml = String(parsed.body || "");
  if (!bodyHtml) throw new Error("AI returned empty body");
  return { subject, bodyHtml };
}

// ---------- Send ----------

export async function sendComposerEmail(opts: {
  audience: Audience;
  customEmails?: string[];
  singleEmail?: string;
  subject: string;
  bodyHtml: string;
  preview?: string;
  testOnly?: boolean;
  testRecipient?: string;
  createdBy?: string;
}): Promise<{
  campaignId: string;
  total: number;
  sent: number;
  failed: number;
  skipped: number;
}> {
  if (!opts.subject.trim()) throw new Error("Subject is required");
  if (!opts.bodyHtml.trim()) throw new Error("Body is required");

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

  const { data: campaign, error: cErr } = await supabaseAdmin
    .from("composer_campaigns" as any)
    .insert({
      created_by: opts.createdBy ?? null,
      subject: opts.subject,
      audience: opts.testOnly ? `${opts.audience}:test` : opts.audience,
      body_html: opts.bodyHtml,
      recipient_count: recipients.length,
      status: "sending",
      test_only: !!opts.testOnly,
    })
    .select("id")
    .single();
  if (cErr || !campaign) throw new Error(`Failed to create campaign: ${cErr?.message}`);
  const campaignId = (campaign as any).id as string;

  if (recipients.length === 0) {
    await supabaseAdmin.from("composer_campaigns" as any)
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", campaignId);
    return { campaignId, total: 0, sent: 0, failed: 0, skipped: 0 };
  }

  // Build the shell once (subject + body are constant); per-recipient
  // substitution only swaps first_name and unsubscribe_url.
  const shellHtml = wrapInShell({
    subject: opts.subject,
    bodyHtml: opts.bodyHtml,
    preview: opts.preview,
  });

  let sent = 0, failed = 0, skipped = 0;

  for (const r of recipients) {
    try {
      const html = renderForRecipient(shellHtml, {
        firstName: r.firstName,
        unsubscribeUrl: r.unsubscribeUrl,
      });
      const result = await sendViaEmailit({
        from: FROM,
        to: r.email,
        subject: opts.subject,
        html,
        headers: {
          "List-Unsubscribe": `<${r.unsubscribeUrl}>`,
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
      // Respect 429 by sleeping longer
      if (err?.status === 429) {
        const wait = Math.max((err?.retryAfterSeconds ?? 2) * 1000, 2000);
        await new Promise((res) => setTimeout(res, wait));
      }
    }
    // Pace at ~1.5/sec
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
