/**
 * Email Composer extras — server-only:
 *  - Snippets CRUD
 *  - Recipient lookup (for "preview as recipient")
 *  - AI sequence generator (multi-touch onboarding/drip drafts)
 *  - Schedule a sequence (N campaigns spaced N days apart)
 *  - A/B subject-line test: split 10/10, manual or auto winner
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  wrapInShell,
  renderForRecipient,
  composeFromPlainText,
  toPlainText,
} from "@/lib/email-static/composer/_shell";
import { sendViaEmailit } from "@/lib/email/emailit";

const FROM = "Pool Rental Near Me <support@poolrentalnearme.com>";
const REPLY_TO = "support@poolrentalnearme.com";
const SITE_URL = "https://www.poolrentalnearme.com";

// =================== Snippets ===================

export async function listSnippets() {
  const { data } = await supabaseAdmin
    .from("composer_snippets" as any)
    .select("id, name, body, category, updated_at")
    .order("category", { ascending: true })
    .order("updated_at", { ascending: false });
  return (data as any[]) || [];
}

export async function saveSnippet(opts: {
  id?: string;
  name: string;
  body: string;
  category?: string;
  createdBy?: string;
}) {
  if (!opts.name.trim() || !opts.body.trim()) throw new Error("Name and body required");
  if (opts.id) {
    const { data, error } = await supabaseAdmin
      .from("composer_snippets" as any)
      .update({ name: opts.name, body: opts.body, category: opts.category || "general" })
      .eq("id", opts.id)
      .select("id").single();
    if (error) throw new Error(error.message);
    return { id: (data as any).id };
  }
  const { data, error } = await supabaseAdmin
    .from("composer_snippets" as any)
    .insert({
      name: opts.name,
      body: opts.body,
      category: opts.category || "general",
      created_by: opts.createdBy ?? null,
    })
    .select("id").single();
  if (error) throw new Error(error.message);
  return { id: (data as any).id };
}

export async function deleteSnippet(id: string) {
  await supabaseAdmin.from("composer_snippets" as any).delete().eq("id", id);
  return { ok: true };
}

// =================== Recipient lookup (preview-as) ===================

export async function lookupRecipient(email: string): Promise<{
  found: boolean;
  email: string;
  firstName: string;
  audience: string | null;
  unsubscribeUrl: string;
}> {
  const e = email.trim().toLowerCase();
  if (!e) return { found: false, email: e, firstName: "", audience: null, unsubscribeUrl: "#preview" };

  // hosts
  const { data: host } = await supabaseAdmin
    .from("host_subscribers")
    .select("email, name, unsubscribe_token")
    .ilike("email", e)
    .maybeSingle();
  if (host) {
    return {
      found: true,
      email: e,
      firstName: firstNameOf((host as any).name),
      audience: "hosts",
      unsubscribeUrl: `${SITE_URL}/unsubscribe-host?token=${(host as any).unsubscribe_token}`,
    };
  }
  // renters
  const { data: renter } = await supabaseAdmin
    .from("renter_subscribers")
    .select("email, name, unsubscribe_token")
    .ilike("email", e)
    .maybeSingle();
  if (renter) {
    return {
      found: true,
      email: e,
      firstName: firstNameOf((renter as any).name),
      audience: "renters",
      unsubscribeUrl: `${SITE_URL}/unsubscribe-renter?token=${(renter as any).unsubscribe_token}`,
    };
  }
  // waitlist
  const { data: wait } = await supabaseAdmin
    .from("pool_waitlist")
    .select("email")
    .ilike("email", e)
    .maybeSingle();
  if (wait) {
    return {
      found: true,
      email: e,
      firstName: "",
      audience: "waitlist",
      unsubscribeUrl: `${SITE_URL}/unsubscribe-composer?token=preview`,
    };
  }
  return {
    found: false,
    email: e,
    firstName: "",
    audience: null,
    unsubscribeUrl: `${SITE_URL}/unsubscribe-composer?token=preview`,
  };
}

function firstNameOf(name: string | null | undefined): string {
  if (!name) return "";
  return name.trim().split(/\s+/)[0] || "";
}

// =================== AI sequence draft ===================

export async function generateSequenceWithAI(opts: {
  description: string;
  touches: number; // 2..7
  tone?: string;
}): Promise<{ drafts: Array<{ subject: string; bodyText: string; dayOffset: number; intent: string }> }> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
  const touches = Math.max(2, Math.min(7, Math.round(opts.touches)));

  const system = `You are an email sequence copywriter for "Pool Rental Near Me", a peer-to-peer pool rental marketplace.

VOICE: Founder-mentor to homeowners/renters. Sentence case. Second person ("you"). Warm, direct.
BANNED WORDS: leverage, utilize, seamlessly, robust, dive into, elevate, game-changer, unlock, journey, landscape, bustling, thriving, vibrant, state-of-the-art, cutting-edge.
BANNED PHRASES: "in this article", "in conclusion", "it's worth noting", "thousands of hosts", "proven track record".
No em dashes. Numbers under 10 spelled out.

OUTPUT FORMAT: Return ONLY a JSON object: {"drafts":[{"subject":"...","intent":"one-sentence purpose of this touch","dayOffset":N,"body":"..."}]}

Rules:
- Produce exactly ${touches} drafts.
- dayOffset values must form a sensible sequence starting at 0 (immediate) and increasing (e.g. 0, 2, 5, 9, 14).
- Each body is PLAIN TEXT using this tiny markdown:
   # Heading
   ## Subheading
   - bullet
   1. numbered
   [Button text](https://url) on its own line
   **bold**  *italic*
   {{first_name}} for the recipient's first name
   Blank line between paragraphs.
- End each body with "— The PRNM Team".
- Do NOT write HTML. Do NOT add a header, footer, or unsubscribe text — the system adds them.
- Do NOT wrap your JSON in markdown code fences.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
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
  const arr = Array.isArray(parsed.drafts) ? parsed.drafts : [];
  const drafts = arr.slice(0, touches).map((d: any, i: number) => ({
    subject: String(d.subject || "").slice(0, 200),
    intent: String(d.intent || ""),
    dayOffset: Number.isFinite(d.dayOffset) ? Math.max(0, Math.round(d.dayOffset)) : i * 3,
    bodyText: String(d.body || ""),
  }));
  if (drafts.length === 0) throw new Error("AI returned no drafts");
  return { drafts };
}

export async function scheduleSequence(opts: {
  audience: "hosts" | "renters" | "waitlist" | "custom" | "single";
  customEmails?: string[];
  singleEmail?: string;
  drafts: Array<{ subject: string; bodyText: string; dayOffset: number }>;
  preview?: string;
  createdBy?: string;
  startAt?: string; // ISO; defaults to "in 1 hour"
}): Promise<{ sequenceId: string; campaigns: Array<{ campaignId: string; scheduledAt: string }> }> {
  if (!opts.drafts.length) throw new Error("No drafts");
  const sequenceId = crypto.randomUUID();
  const start = opts.startAt ? new Date(opts.startAt) : new Date(Date.now() + 60 * 60 * 1000);
  if (isNaN(start.getTime())) throw new Error("Invalid start time");
  const out: Array<{ campaignId: string; scheduledAt: string }> = [];

  for (let i = 0; i < opts.drafts.length; i++) {
    const d = opts.drafts[i];
    const when = new Date(start.getTime() + d.dayOffset * 24 * 60 * 60 * 1000);
    const { html, plain } = composeFromPlainText(d.bodyText);
    const { data, error } = await supabaseAdmin
      .from("composer_campaigns" as any)
      .insert({
        created_by: opts.createdBy ?? null,
        subject: d.subject,
        audience: opts.audience,
        body_html: html,
        plain_body: plain,
        preview_text: opts.preview ?? null,
        custom_emails: opts.customEmails ?? null,
        single_email: opts.singleEmail ?? null,
        scheduled_at: when.toISOString(),
        status: "scheduled",
        test_only: false,
        sequence_id: sequenceId,
        sequence_position: i + 1,
      })
      .select("id, scheduled_at").single();
    if (error) throw new Error(`Failed to schedule step ${i + 1}: ${error.message}`);
    out.push({ campaignId: (data as any).id, scheduledAt: (data as any).scheduled_at });
  }
  return { sequenceId, campaigns: out };
}

// =================== Subject A/B test ===================

type Audience = "hosts" | "renters" | "waitlist" | "custom" | "single";

async function resolveAllRecipients(audience: Audience, customEmails?: string[], singleEmail?: string) {
  const { default: c } = await import("@/server/email-composer.server").then((m) => ({ default: m }));
  // re-use logic via a private import won't work cleanly; re-implement minimal
  if (audience === "single" && singleEmail) {
    return [{ email: singleEmail.trim().toLowerCase(), firstName: "", unsubscribeUrl: `${SITE_URL}/unsubscribe-composer?token=preview` }];
  }
  if (audience === "custom") {
    const emails = (customEmails || []).map((e) => e.trim().toLowerCase()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    return Array.from(new Set(emails)).map((email) => ({
      email,
      firstName: "",
      unsubscribeUrl: `${SITE_URL}/unsubscribe-composer?token=preview`,
    }));
  }
  if (audience === "hosts") {
    const { data } = await supabaseAdmin
      .from("host_subscribers").select("email, name, unsubscribe_token").eq("status", "active");
    return (data || []).map((r: any) => ({
      email: String(r.email).toLowerCase(),
      firstName: firstNameOf(r.name),
      unsubscribeUrl: `${SITE_URL}/unsubscribe-host?token=${r.unsubscribe_token}`,
    }));
  }
  if (audience === "renters") {
    const { data } = await supabaseAdmin
      .from("renter_subscribers").select("email, name, unsubscribe_token").eq("status", "active");
    return (data || []).map((r: any) => ({
      email: String(r.email).toLowerCase(),
      firstName: firstNameOf(r.name),
      unsubscribeUrl: `${SITE_URL}/unsubscribe-renter?token=${r.unsubscribe_token}`,
    }));
  }
  if (audience === "waitlist") {
    const { data } = await supabaseAdmin.from("pool_waitlist").select("email");
    const emails = Array.from(new Set((data || []).map((r: any) => String(r.email).toLowerCase())));
    return emails.map((email) => ({
      email,
      firstName: "",
      unsubscribeUrl: `${SITE_URL}/unsubscribe-composer?token=preview`,
    }));
  }
  return [];
}

async function filterSuppressed(recipients: Array<{ email: string }>) {
  if (!recipients.length) return recipients as any[];
  const emails = recipients.map((r) => r.email);
  const { data: unsubs } = await supabaseAdmin
    .from("composer_unsubscribes" as any).select("email").in("email", emails);
  const unsubSet = new Set((unsubs || []).map((r: any) => String(r.email).toLowerCase()));
  const { data: supp } = await supabaseAdmin
    .from("suppressed_emails").select("email").in("email", emails);
  const suppSet = new Set((supp || []).map((r: any) => String(r.email).toLowerCase()));
  return recipients.filter((r: any) => !unsubSet.has(r.email) && !suppSet.has(r.email));
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function sendBatch(opts: {
  recipients: Array<{ email: string; firstName: string; unsubscribeUrl: string }>;
  subject: string;
  bodyHtml: string;
  plainBody: string;
  preview?: string;
  campaignId: string;
}) {
  const shellHtml = wrapInShell({ subject: opts.subject, bodyHtml: opts.bodyHtml, preview: opts.preview });
  let sent = 0, failed = 0;
  for (const r of opts.recipients) {
    try {
      const html = renderForRecipient(shellHtml, { firstName: r.firstName, unsubscribeUrl: r.unsubscribeUrl });
      const text = opts.plainBody.replaceAll("{{first_name}}", r.firstName || "there")
        + `\n\n---\nUnsubscribe: ${r.unsubscribeUrl}`;
      const result = await sendViaEmailit({
        from: FROM, to: r.email, subject: opts.subject, html, text, replyTo: REPLY_TO,
        headers: {
          "List-Unsubscribe": `<${r.unsubscribeUrl}>, <mailto:${REPLY_TO}?subject=unsubscribe>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
      await supabaseAdmin.from("composer_email_log" as any).insert({
        campaign_id: opts.campaignId, recipient_email: r.email, status: "sent", emailit_id: result.id,
      });
      sent++;
    } catch (err: any) {
      const msg = (err?.message || String(err)).slice(0, 500);
      await supabaseAdmin.from("composer_email_log" as any).insert({
        campaign_id: opts.campaignId, recipient_email: r.email, status: "failed", error: msg,
      });
      failed++;
      if (err?.status === 429) {
        await new Promise((res) => setTimeout(res, Math.max((err?.retryAfterSeconds ?? 2) * 1000, 2000)));
      }
    }
    await new Promise((res) => setTimeout(res, 700));
  }
  return { sent, failed };
}

export async function startAbTest(opts: {
  audience: Audience;
  customEmails?: string[];
  subjectA: string;
  subjectB: string;
  bodyText: string;
  preview?: string;
  samplePercent?: number; // each side; default 10
  winnerAfterMinutes?: number; // default 120
  createdBy?: string;
}): Promise<{ abTestId: string; sampleA: number; sampleB: number; total: number; winnerAt: string }> {
  if (!opts.subjectA.trim() || !opts.subjectB.trim()) throw new Error("Both subjects required");
  if (!opts.bodyText.trim()) throw new Error("Body required");
  if (opts.audience === "single") throw new Error("A/B requires multiple recipients");

  const samplePct = Math.max(5, Math.min(40, opts.samplePercent ?? 10));
  const waitMin = Math.max(15, Math.min(72 * 60, opts.winnerAfterMinutes ?? 120));

  let recipients = await resolveAllRecipients(opts.audience, opts.customEmails);
  recipients = await filterSuppressed(recipients);
  if (recipients.length < 20) throw new Error(`A/B needs at least 20 recipients (got ${recipients.length})`);

  const shuffled = shuffle(recipients);
  const eachSampleSize = Math.max(5, Math.floor(shuffled.length * (samplePct / 100)));
  const sampleA = shuffled.slice(0, eachSampleSize);
  const sampleB = shuffled.slice(eachSampleSize, eachSampleSize * 2);
  const winnerPool = shuffled.slice(eachSampleSize * 2); // remaining → winner

  const { html: bodyHtml, plain: plainBody } = composeFromPlainText(opts.bodyText);
  const winnerAt = new Date(Date.now() + waitMin * 60 * 1000);

  // create ab_test row
  const { data: test, error: tErr } = await supabaseAdmin
    .from("composer_ab_tests" as any)
    .insert({
      created_by: opts.createdBy ?? null,
      audience: opts.audience,
      custom_emails: opts.customEmails ?? null,
      subject_a: opts.subjectA,
      subject_b: opts.subjectB,
      body_html: bodyHtml,
      plain_body: plainBody,
      preview_text: opts.preview ?? null,
      sample_percent: samplePct,
      winner_after_minutes: waitMin,
      status: "sampling",
      scheduled_winner_at: winnerAt.toISOString(),
      total_recipients: recipients.length,
      sample_a_count: sampleA.length,
      sample_b_count: sampleB.length,
      // remaining_emails snapshot stored as custom_emails on the winner campaign
    })
    .select("id").single();
  if (tErr || !test) throw new Error(`Failed to start A/B: ${tErr?.message}`);
  const abTestId = (test as any).id;

  // create campaign rows for samples
  const [{ data: campA }, { data: campB }] = await Promise.all([
    supabaseAdmin.from("composer_campaigns" as any).insert({
      created_by: opts.createdBy ?? null,
      subject: opts.subjectA, audience: opts.audience, body_html: bodyHtml, plain_body: plainBody,
      preview_text: opts.preview ?? null, recipient_count: sampleA.length,
      status: "sending", test_only: false, ab_test_id: abTestId, ab_variant: "a",
    }).select("id").single(),
    supabaseAdmin.from("composer_campaigns" as any).insert({
      created_by: opts.createdBy ?? null,
      subject: opts.subjectB, audience: opts.audience, body_html: bodyHtml, plain_body: plainBody,
      preview_text: opts.preview ?? null, recipient_count: sampleB.length,
      status: "sending", test_only: false, ab_test_id: abTestId, ab_variant: "b",
    }).select("id").single(),
  ]);

  // store the winner pool emails on a placeholder scheduled campaign so we don't lose the snapshot
  await supabaseAdmin.from("composer_campaigns" as any).insert({
    created_by: opts.createdBy ?? null,
    subject: `[A/B winner — pending] ${opts.subjectA}`,
    audience: "custom", body_html: bodyHtml, plain_body: plainBody,
    preview_text: opts.preview ?? null,
    custom_emails: winnerPool.map((r) => r.email),
    recipient_count: winnerPool.length,
    status: "ab_pending",
    test_only: false,
    ab_test_id: abTestId,
    ab_variant: "winner",
    scheduled_at: winnerAt.toISOString(),
  });

  // Fire sample sends (sequentially, paced).
  await sendBatch({
    recipients: sampleA, subject: opts.subjectA,
    bodyHtml, plainBody, preview: opts.preview, campaignId: (campA as any).id,
  }).then(async (r) => {
    await supabaseAdmin.from("composer_campaigns" as any)
      .update({ status: "completed", sent_count: r.sent, failed_count: r.failed, completed_at: new Date().toISOString() })
      .eq("id", (campA as any).id);
  });
  await sendBatch({
    recipients: sampleB, subject: opts.subjectB,
    bodyHtml, plainBody, preview: opts.preview, campaignId: (campB as any).id,
  }).then(async (r) => {
    await supabaseAdmin.from("composer_campaigns" as any)
      .update({ status: "completed", sent_count: r.sent, failed_count: r.failed, completed_at: new Date().toISOString() })
      .eq("id", (campB as any).id);
  });

  await supabaseAdmin.from("composer_ab_tests" as any)
    .update({ status: "awaiting_winner" })
    .eq("id", abTestId);

  return {
    abTestId,
    sampleA: sampleA.length,
    sampleB: sampleB.length,
    total: recipients.length,
    winnerAt: winnerAt.toISOString(),
  };
}

/** Score samples by inverse failure rate (no opens available). Ties → A. */
async function scoreVariants(abTestId: string): Promise<"a" | "b"> {
  const { data: camps } = await supabaseAdmin
    .from("composer_campaigns" as any)
    .select("id, ab_variant, sent_count, failed_count, recipient_count")
    .eq("ab_test_id", abTestId)
    .in("ab_variant", ["a", "b"]);
  let aScore = 0, bScore = 0;
  for (const c of (camps as any[]) || []) {
    const r = (c.recipient_count || 0) || 1;
    const score = (c.sent_count || 0) / r;
    if (c.ab_variant === "a") aScore = score;
    else if (c.ab_variant === "b") bScore = score;
  }
  return bScore > aScore ? "b" : "a";
}

export async function pickAbWinner(opts: {
  abTestId: string;
  variant?: "a" | "b"; // manual; if omitted, auto-score
  pickedBy?: "manual" | "auto" | "fallback";
}): Promise<{ ok: true; winner: "a" | "b"; sent: number; failed: number; recipients: number }> {
  const { data: test } = await supabaseAdmin
    .from("composer_ab_tests" as any)
    .select("*").eq("id", opts.abTestId).maybeSingle();
  if (!test) throw new Error("Test not found");
  if ((test as any).status === "completed") throw new Error("Already completed");
  if ((test as any).status === "cancelled") throw new Error("Cancelled");

  const winner = opts.variant ?? (await scoreVariants(opts.abTestId));
  const winnerSubject = winner === "a" ? (test as any).subject_a : (test as any).subject_b;

  // Find the pending winner campaign for this test
  const { data: pending } = await supabaseAdmin
    .from("composer_campaigns" as any)
    .select("*")
    .eq("ab_test_id", opts.abTestId)
    .eq("ab_variant", "winner")
    .maybeSingle();
  if (!pending) throw new Error("Winner campaign not found");

  await supabaseAdmin.from("composer_ab_tests" as any)
    .update({
      status: "sending_winner",
      winner_variant: winner,
      winner_picked_at: new Date().toISOString(),
      winner_picked_by: opts.pickedBy ?? "manual",
    }).eq("id", opts.abTestId);

  await supabaseAdmin.from("composer_campaigns" as any)
    .update({ subject: winnerSubject, status: "sending" })
    .eq("id", (pending as any).id);

  const emails: string[] = (pending as any).custom_emails || [];
  const recipients = emails.map((e) => ({
    email: e, firstName: "",
    unsubscribeUrl: `${SITE_URL}/unsubscribe-composer?token=preview`,
  }));
  // re-resolve firstNames from hosts/renters if possible (best effort)
  const audience = (test as any).audience;
  if (audience === "hosts" || audience === "renters") {
    const table = audience === "hosts" ? "host_subscribers" : "renter_subscribers";
    const { data: rows } = await supabaseAdmin
      .from(table).select("email, name, unsubscribe_token").in("email", emails);
    const map = new Map<string, any>();
    for (const r of (rows as any[]) || []) map.set(String(r.email).toLowerCase(), r);
    for (const r of recipients) {
      const m = map.get(r.email);
      if (m) {
        r.firstName = firstNameOf(m.name);
        r.unsubscribeUrl = `${SITE_URL}/unsubscribe-${audience === "hosts" ? "host" : "renter"}?token=${m.unsubscribe_token}`;
      }
    }
  }

  const { sent, failed } = await sendBatch({
    recipients,
    subject: winnerSubject,
    bodyHtml: (test as any).body_html,
    plainBody: (test as any).plain_body || "",
    preview: (test as any).preview_text || undefined,
    campaignId: (pending as any).id,
  });

  await supabaseAdmin.from("composer_campaigns" as any)
    .update({
      status: "completed", sent_count: sent, failed_count: failed,
      recipient_count: recipients.length,
      completed_at: new Date().toISOString(),
    }).eq("id", (pending as any).id);

  await supabaseAdmin.from("composer_ab_tests" as any)
    .update({
      status: "completed",
      winner_recipient_count: recipients.length,
      completed_at: new Date().toISOString(),
    }).eq("id", opts.abTestId);

  return { ok: true, winner, sent, failed, recipients: recipients.length };
}

export async function listAbTests() {
  const { data } = await supabaseAdmin
    .from("composer_ab_tests" as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  return (data as any[]) || [];
}

export async function cancelAbTest(abTestId: string) {
  await supabaseAdmin.from("composer_ab_tests" as any)
    .update({ status: "cancelled" }).eq("id", abTestId)
    .in("status", ["sampling", "awaiting_winner"] as any);
  await supabaseAdmin.from("composer_campaigns" as any)
    .update({ status: "cancelled" })
    .eq("ab_test_id", abTestId).eq("ab_variant", "winner").eq("status", "ab_pending");
  return { ok: true };
}

/** Cron: auto-pick winner for any A/B past its scheduled_winner_at. */
export async function runAbAutoWinnerCron(): Promise<{ picked: number; results: any[] }> {
  const nowIso = new Date().toISOString();
  const { data: due } = await supabaseAdmin
    .from("composer_ab_tests" as any)
    .select("id")
    .eq("status", "awaiting_winner")
    .lte("scheduled_winner_at", nowIso)
    .limit(5);
  const rows = (due as any[]) || [];
  const results: any[] = [];
  for (const t of rows) {
    try {
      const r = await pickAbWinner({ abTestId: t.id, pickedBy: "auto" });
      results.push({ id: t.id, ...r });
    } catch (err: any) {
      results.push({ id: t.id, error: String(err?.message || err) });
    }
  }
  return { picked: rows.length, results };
}
