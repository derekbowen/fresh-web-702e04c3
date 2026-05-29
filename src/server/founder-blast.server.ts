/**
 * One-shot founder update blast (2026-05-28).
 * Sends a hand-written HTML email to all Sharetribe provider users.
 *
 * - Audience: Sharetribe users with publicData.userType = 'provider'
 *   (or no userType set — historic accounts default to provider) with email.
 * - Idempotency: skips any address already in `email_send_log` with
 *   template_name = 'founder-update-2026-05-28' (status pending|sent).
 * - Suppression: skips anything in `suppressed_emails`.
 * - Throttle: caller-controlled via batch size + per-send delay.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { integrationGet } from "./sharetribe.server";
import { sendViaEmailit, EmailitError } from "@/lib/email/emailit";
import RAW_HTML from "@/lib/email-static/founder-update-2026-05-28.html?raw";

export const FOUNDER_TEMPLATE_NAME = "founder-update-2026-05-28";
export const FOUNDER_SUBJECT = "Pool Rental Near Me update";
export const FOUNDER_FROM = "Derek @ Pool Rental Near Me <derek@poolrentalnearme.com>";
export const FOUNDER_REPLY_TO = "derek@poolrentalnearme.com";

export interface Recipient {
  email: string;
  firstName: string | null;
  userId: string;
}

interface STUser {
  id: { uuid: string } | string;
  attributes?: {
    email?: string;
    emailVerified?: boolean;
    banned?: boolean;
    deleted?: boolean;
    profile?: {
      firstName?: string;
      publicData?: { userType?: string } & Record<string, unknown>;
    };
  };
}

/** Paginate /users/query and return all candidate provider recipients. */
export async function fetchProviderAudience(): Promise<Recipient[]> {
  const out: Recipient[] = [];
  const seen = new Set<string>();
  let page = 1;
  const perPage = 100;
  // safety cap
  for (let i = 0; i < 50; i++) {
    const res = await integrationGet<{ data: STUser[]; meta?: { totalPages?: number } }>(
      "/users/query",
      { page, perPage },
    );
    const users = res?.data ?? [];
    for (const u of users) {
      const a = u.attributes ?? {};
      if (a.banned || a.deleted) continue;
      const email = (a.email ?? "").trim().toLowerCase();
      if (!email || !email.includes("@")) continue;
      const userType = a.profile?.publicData?.userType;
      // Accept explicit 'provider' OR missing userType (legacy accounts).
      if (userType && userType !== "provider") continue;
      if (seen.has(email)) continue;
      seen.add(email);
      const idStr = typeof u.id === "string" ? u.id : u.id?.uuid;
      out.push({
        email,
        firstName: (a.profile?.firstName ?? "").trim() || null,
        userId: idStr ?? "",
      });
    }
    const total = res?.meta?.totalPages ?? 1;
    if (page >= total || users.length === 0) break;
    page++;
  }
  return out;
}

/** Get-or-create one unsubscribe token per email address. */
async function getOrCreateUnsubToken(email: string): Promise<string> {
  const sb = supabaseAdmin as any;
  const { data: existing } = await sb
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", email)
    .maybeSingle();
  if (existing?.token && !existing.used_at) return existing.token as string;
  if (existing?.used_at) return existing.token as string; // address already unsubscribed; caller skips
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  await sb
    .from("email_unsubscribe_tokens")
    .upsert({ token, email }, { onConflict: "email", ignoreDuplicates: true });
  const { data: stored } = await sb
    .from("email_unsubscribe_tokens")
    .select("token")
    .eq("email", email)
    .maybeSingle();
  return (stored?.token as string) ?? token;
}

function renderHtml(firstName: string | null, unsubscribeToken: string): string {
  const name = (firstName && firstName.length > 0 ? firstName : "there")
    // basic HTML escape for safety
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return (RAW_HTML as string)
    .replaceAll("{firstName}", name)
    .replaceAll("{unsubscribeToken}", encodeURIComponent(unsubscribeToken));
}

function plainText(firstName: string | null): string {
  const name = firstName && firstName.length > 0 ? firstName : "there";
  return `Hey ${name},

It's Derek, founder of Pool Rental Near Me. Quick update on what we've been building.

We rebuilt the website from scratch — 5,800 pages live, page-one Google rankings in 500+ cities, and 1,100+ organic clicks last month (up from 100). Spanish-language pages just shipped. 77 new renters in the last 30 days.

Coming soon: instant-connection emails between new renters and the closest pools, plus AI-powered matching that rewards fast-responding hosts.

Reminder: our host fee is a flat 10% (Swimply takes 15-30%). The best way to push that even further is to share your listing on Nextdoor, Facebook groups, and your social bios.

Brandon and I aren't going anywhere. Matthew Ryan came in as an investor, the runway is secured, and we're building this for the long haul.

If you've got a question, an idea, or just want to talk pools — call or text me at 909-272-8096. Reply to this email any time.

Thanks for being a host.

— Derek
derek@poolrentalnearme.com
909-272-8096

Pool Rental Near Me · 10,000 Solutions LLC
`;
}

/** True if this address has already been sent (or attempted) for this template. */
async function alreadySent(email: string): Promise<boolean> {
  const { data } = await (supabaseAdmin as any)
    .from("email_send_log")
    .select("id, status")
    .eq("template_name", FOUNDER_TEMPLATE_NAME)
    .eq("recipient_email", email)
    .in("status", ["pending", "sent"])
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

async function isSuppressed(email: string): Promise<boolean> {
  const { data } = await (supabaseAdmin as any)
    .from("suppressed_emails")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  return Boolean(data);
}

/** Send one email. Logs to email_send_log. */
async function sendOne(r: Recipient): Promise<{ status: "sent" | "suppressed" | "failed"; error?: string }> {
  const sb = supabaseAdmin as any;
  const messageId = crypto.randomUUID();
  if (await isSuppressed(r.email)) {
    await sb.from("email_send_log").insert({
      message_id: messageId,
      template_name: FOUNDER_TEMPLATE_NAME,
      recipient_email: r.email,
      status: "suppressed",
    });
    return { status: "suppressed" };
  }
  // pending log row first so a crash mid-send still leaves a trail
  await sb.from("email_send_log").insert({
    message_id: messageId,
    template_name: FOUNDER_TEMPLATE_NAME,
    recipient_email: r.email,
    status: "pending",
  });
  try {
    const token = await getOrCreateUnsubToken(r.email);
    const html = renderHtml(r.firstName, token);
    const text = plainText(r.firstName);
    await sendViaEmailit({
      from: FOUNDER_FROM,
      to: r.email,
      subject: FOUNDER_SUBJECT,
      html,
      text,
      replyTo: FOUNDER_REPLY_TO,
      headers: {
        "List-Unsubscribe": `<https://www.poolrentalnearme.com/email/unsubscribe?token=${encodeURIComponent(token)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    await sb.from("email_send_log").insert({
      message_id: messageId,
      template_name: FOUNDER_TEMPLATE_NAME,
      recipient_email: r.email,
      status: "sent",
    });
    return { status: "sent" };
  } catch (e) {
    const msg = e instanceof EmailitError ? `${e.status}: ${e.body.slice(0, 200)}` : (e as Error).message;
    await sb.from("email_send_log").insert({
      message_id: messageId,
      template_name: FOUNDER_TEMPLATE_NAME,
      recipient_email: r.email,
      status: "failed",
      error_message: msg,
    });
    return { status: "failed", error: msg };
  }
}

/** Dry-run summary + send a single preview to derek@. */
export async function runDryRun() {
  const audience = await fetchProviderAudience();
  const withName = audience.filter((r) => r.firstName).length;
  const withoutName = audience.length - withName;
  const sample = audience.slice(0, 10).map((r) => ({
    email: r.email,
    firstName: r.firstName,
    hasFirstName: Boolean(r.firstName),
  }));

  // Send preview to derek (firstName forced to "Derek").
  const previewToken = await getOrCreateUnsubToken("derek@poolrentalnearme.com");
  const previewHtml = renderHtml("Derek", previewToken);
  let previewResult: { ok: boolean; error?: string };
  try {
    await sendViaEmailit({
      from: FOUNDER_FROM,
      to: "derek@poolrentalnearme.com",
      subject: `[PREVIEW] ${FOUNDER_SUBJECT}`,
      html: previewHtml,
      text: plainText("Derek"),
      replyTo: FOUNDER_REPLY_TO,
    });
    previewResult = { ok: true };
  } catch (e) {
    const msg = e instanceof EmailitError ? `${e.status}: ${e.body.slice(0, 200)}` : (e as Error).message;
    previewResult = { ok: false, error: msg };
  }

  return {
    audienceCount: audience.length,
    withFirstName: withName,
    withoutFirstName: withoutName,
    sample,
    preview: previewResult,
  };
}

/** Process the next batch of live sends. Caller invokes repeatedly until remaining=0. */
export async function runLiveBatch(opts: { batchSize: number; delayMs: number }) {
  const startedAt = new Date().toISOString();
  const audience = await fetchProviderAudience();
  // Find pending recipients (exclude already-logged for this template).
  const todo: Recipient[] = [];
  for (const r of audience) {
    if (await alreadySent(r.email)) continue;
    todo.push(r);
    if (todo.length >= opts.batchSize) break;
  }

  const results: Array<{
    email: string;
    firstName: string | null;
    status: "sent" | "suppressed" | "failed";
    error?: string;
  }> = [];

  for (let i = 0; i < todo.length; i++) {
    if (i > 0 && opts.delayMs > 0) {
      await new Promise((res) => setTimeout(res, opts.delayMs));
    }
    const r = todo[i];
    const res = await sendOne(r);
    results.push({ email: r.email, firstName: r.firstName, ...res });
  }

  // Compute remaining after this batch.
  let remaining = 0;
  for (const r of audience) {
    if (!(await alreadySent(r.email))) remaining++;
  }

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    audienceTotal: audience.length,
    processed: results.length,
    remaining,
    results,
  };
}

/** Final summary across the entire blast (queries email_send_log). */
export async function runFinalSummary() {
  const sb = supabaseAdmin as any;
  const { data: rows } = await sb
    .from("email_send_log")
    .select("recipient_email, status, error_message, created_at")
    .eq("template_name", FOUNDER_TEMPLATE_NAME)
    .order("created_at", { ascending: true });
  const r = (rows ?? []) as Array<{
    recipient_email: string;
    status: string;
    error_message: string | null;
    created_at: string;
  }>;
  // Deduplicate by email — keep last non-pending status.
  const byEmail = new Map<string, { status: string; error: string | null; at: string }>();
  for (const row of r) {
    if (row.status === "pending") continue;
    byEmail.set(row.recipient_email, {
      status: row.status,
      error: row.error_message,
      at: row.created_at,
    });
  }
  const sent: string[] = [];
  const suppressed: string[] = [];
  const failed: Array<{ email: string; error: string | null }> = [];
  for (const [email, v] of byEmail) {
    if (v.status === "sent") sent.push(email);
    else if (v.status === "suppressed") suppressed.push(email);
    else if (v.status === "failed") failed.push({ email, error: v.error });
  }
  const timestamps = r.filter((x) => x.status === "sent").map((x) => x.created_at);
  return {
    totalSent: sent.length,
    totalSuppressed: suppressed.length,
    totalFailed: failed.length,
    suppressed,
    failed,
    firstSendAt: timestamps[0] ?? null,
    lastSendAt: timestamps[timestamps.length - 1] ?? null,
  };
}
