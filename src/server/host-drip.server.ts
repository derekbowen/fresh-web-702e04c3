/**
 * Host drip — server-only helpers.
 *
 * - pollSharetribeHosts: pull unique hosts (users with any listing in any state)
 *   from Sharetribe Integration API, upsert into host_subscribers, schedule the
 *   7-touch weekly sequence for new subscribers.
 * - scheduleSequence: insert 7 rows into host_drip_emails.
 * - sendDueHostEmails: drain pending rows whose scheduled_at has passed, render
 *   the static HTML with placeholder substitution, send via Emailit.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendViaEmailit } from "@/lib/email/emailit";
import { HOST_SEQUENCE } from "@/lib/email-static/host-drip/_shared";
import fs from "node:fs";
import path from "node:path";

const FROM = "Pool Rental Near Me <hello@notify.poolfriends.poolrentalnearme.com>";
const SITE_URL = "https://www.poolrentalnearme.com";

// Templates are static HTML on disk. Read once per process.
const TEMPLATE_CACHE = new Map<string, string>();
function loadTemplate(kind: string): string {
  if (TEMPLATE_CACHE.has(kind)) return TEMPLATE_CACHE.get(kind)!;
  const p = path.join(process.cwd(), "src/lib/email-static/host-drip", `${kind}.html`);
  const html = fs.readFileSync(p, "utf8");
  TEMPLATE_CACHE.set(kind, html);
  return html;
}

function renderTemplate(kind: string, firstName: string, unsubUrl: string): string {
  const tpl = loadTemplate(kind);
  return tpl
    .replaceAll("{{first_name}}", firstName || "there")
    .replaceAll("{{unsubscribe_url}}", unsubUrl);
}

// ---------- Sequence scheduling ----------

export async function scheduleSequence(subscriberId: string, baseAt = new Date()) {
  // step >= 99 are one-off broadcasts, not part of the weekly cadence.
  const rows = HOST_SEQUENCE.filter((s) => s.step < 99).map((s) => ({
    subscriber_id: subscriberId,
    step: s.step,
    kind: s.kind,
    scheduled_at: new Date(baseAt.getTime() + s.day * 86400_000).toISOString(),
    status: "pending" as const,
  }));
  await supabaseAdmin.from("host_drip_emails").insert(rows);

  await supabaseAdmin
    .from("host_subscribers")
    .update({ sequence_scheduled: true })
    .eq("id", subscriberId);
}

// ---------- Sharetribe poller ----------

export async function pollSharetribeHosts(): Promise<{
  fetched: number;
  inserted: number;
  scheduled: number;
  skipped: number;
}> {
  const { integrationGet } = await import("@/server/sharetribe.server");

  // Strategy: paginate /listings/query across all states with include=author
  // and fields.user=email,profile.firstName. Dedupe authors across pages.
  // This matches how the 96 existing hosts were initially counted.
  let page = 1;
  let fetched = 0;
  let inserted = 0;
  let scheduled = 0;
  let skipped = 0;
  const seenAuthors = new Map<string, { email: string; firstName: string; lastName: string }>();

  try {
    while (page <= 50) {
      const res: any = await integrationGet("/listings/query", {
        states: "published,draft,pendingApproval,closed",
        perPage: 100,
        page,
        include: "author",
        "fields.user": "email,profile.firstName,profile.lastName",
        "fields.listing": "title",
      });
      const listings: any[] = Array.isArray(res?.data) ? res.data : [];
      const included: any[] = Array.isArray(res?.included) ? res.included : [];

      for (const u of included) {
        if (u.type !== "user") continue;
        const id = typeof u.id === "string" ? u.id : u.id?.uuid || u.id?._ref;
        const email = (u.attributes?.email || "").toLowerCase().trim();
        const firstName = u.attributes?.profile?.firstName || "";
        const lastName = u.attributes?.profile?.lastName || "";
        if (!id || !email) continue;
        if (!seenAuthors.has(id)) {
          seenAuthors.set(id, { email, firstName, lastName });
          fetched++;
        }
      }

      const totalPages = res?.meta?.totalPages ?? 1;
      if (listings.length === 0 || page >= totalPages) break;
      page++;
    }

    // Upsert each unique host.
    const nowISO = new Date().toISOString();
    // Spread the initial step 0 send across a 30-min window so we don't blast
    // 96 emails in one second (Emailit limit is 2/sec).
    const baseStart = new Date(Date.now() + 5 * 60_000);
    let offsetSec = 0;

    for (const [stUserId, info] of seenAuthors) {
      const name = `${info.firstName} ${info.lastName}`.trim() || null;

      const { data: existing } = await supabaseAdmin
        .from("host_subscribers")
        .select("id, sequence_scheduled, status")
        .or(`st_user_id.eq.${stUserId},email.eq.${info.email}`)
        .maybeSingle();

      let subscriberId: string;
      if (existing) {
        subscriberId = existing.id;
        await supabaseAdmin
          .from("host_subscribers")
          .update({
            st_user_id: stUserId,
            email: info.email,
            name,
            last_synced_at: nowISO,
          })
          .eq("id", subscriberId);
        if (!existing.sequence_scheduled && existing.status === "active") {
          const baseAt = new Date(baseStart.getTime() + offsetSec * 1000);
          await scheduleSequence(subscriberId, baseAt);
          scheduled++;
          offsetSec += 1; // 1 second between initial sends
        } else {
          skipped++;
        }
      } else {
        const { data: ins } = await supabaseAdmin
          .from("host_subscribers")
          .insert({
            st_user_id: stUserId,
            email: info.email,
            name,
            last_synced_at: nowISO,
          })
          .select("id")
          .single();
        if (!ins) {
          skipped++;
          continue;
        }
        subscriberId = ins.id;
        inserted++;
        const baseAt = new Date(baseStart.getTime() + offsetSec * 1000);
        await scheduleSequence(subscriberId, baseAt);
        scheduled++;
        offsetSec += 1;
      }
    }
  } catch (err: any) {
    console.error("pollSharetribeHosts error:", err?.message || err);
  }

  await supabaseAdmin
    .from("host_drip_state")
    .update({ last_polled_at: new Date().toISOString() })
    .eq("id", 1);

  return { fetched, inserted, scheduled, skipped };
}

// ---------- Send loop ----------

export async function sendDueHostEmails(batch = 20): Promise<{
  considered: number;
  sent: number;
  failed: number;
  skipped: number;
}> {
  const { data: due } = await supabaseAdmin
    .from("host_drip_emails")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(batch);

  if (!due || due.length === 0) {
    return { considered: 0, sent: 0, failed: 0, skipped: 0 };
  }

  let sent = 0,
    failed = 0,
    skipped = 0;

  for (const row of due) {
    try {
      const { data: sub } = await supabaseAdmin
        .from("host_subscribers")
        .select("*")
        .eq("id", row.subscriber_id)
        .single();
      if (!sub || sub.status !== "active") {
        await supabaseAdmin
          .from("host_drip_emails")
          .update({ status: "skipped", error: "subscriber inactive" })
          .eq("id", row.id);
        skipped++;
        continue;
      }

      const step = HOST_SEQUENCE.find((s) => s.kind === row.kind);
      if (!step) {
        await supabaseAdmin
          .from("host_drip_emails")
          .update({ status: "failed", error: `unknown kind: ${row.kind}` })
          .eq("id", row.id);
        failed++;
        continue;
      }

      const firstName = (sub.name || "").split(" ")[0] || "";
      const unsubUrl = `${SITE_URL}/unsubscribe-host?token=${sub.unsubscribe_token}`;
      const html = renderTemplate(row.kind, firstName, unsubUrl);

      const result = await sendViaEmailit({
        from: FROM,
        to: sub.email,
        subject: step.subject,
        html,
        headers: {
          "List-Unsubscribe": `<${unsubUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });

      await supabaseAdmin
        .from("host_drip_emails")
        .update({
          status: "sent",
          subject: step.subject,
          emailit_id: result.id,
          sent_at: new Date().toISOString(),
          attempts: (row.attempts ?? 0) + 1,
        })
        .eq("id", row.id);
      sent++;

      // Pace at ~1.5/sec to stay under Emailit's 2/sec limit
      await new Promise((res) => setTimeout(res, 700));
    } catch (err: any) {
      const msg = err?.message || String(err);
      const status = err?.status as number | undefined;
      const retryAfter = (err?.retryAfterSeconds as number | null) ?? null;
      const attempts = (row.attempts ?? 0) + 1;
      // 429 → back off and retry; other errors → up to 3 attempts then fail
      const final = status === 429 ? false : attempts >= 3;
      const delayMs = status === 429
        ? Math.max((retryAfter ?? 2) * 1000, 2000)
        : 5 * 60_000;
      await supabaseAdmin
        .from("host_drip_emails")
        .update({
          status: final ? "failed" : "pending",
          error: msg.slice(0, 500),
          attempts,
          scheduled_at: final
            ? row.scheduled_at
            : new Date(Date.now() + delayMs).toISOString(),
        })
        .eq("id", row.id);
      if (final) failed++;
      if (status === 429) await new Promise((res) => setTimeout(res, delayMs));
    }
  }

  return { considered: due.length, sent, failed, skipped };
}

// ---------- One-off broadcast ----------

/**
 * Queue a one-off broadcast email (kind from HOST_SEQUENCE) to every active
 * host subscriber. Schedules rows ~1 second apart starting in 1 minute so the
 * existing /api/public/hooks/send-host-drip-emails cron drains them under the
 * Emailit 2/sec limit. Skips subscribers who already have a row for this kind.
 */
export async function queueBroadcast(kind: string): Promise<{
  queued: number;
  skipped: number;
  total: number;
}> {
  const step = HOST_SEQUENCE.find((s) => s.kind === kind);
  if (!step) throw new Error(`Unknown broadcast kind: ${kind}`);

  const { data: subs } = await supabaseAdmin
    .from("host_subscribers")
    .select("id")
    .eq("status", "active");
  const list = subs ?? [];

  // Find subscribers who already have a row for this kind (avoid dupes).
  const { data: existing } = await supabaseAdmin
    .from("host_drip_emails")
    .select("subscriber_id")
    .eq("kind", kind);
  const sent = new Set((existing ?? []).map((r: any) => r.subscriber_id));

  const baseStart = new Date(Date.now() + 60_000);
  const rows: any[] = [];
  let offset = 0;
  let skipped = 0;
  for (const s of list) {
    if (sent.has(s.id)) {
      skipped++;
      continue;
    }
    rows.push({
      subscriber_id: s.id,
      step: step.step,
      kind: step.kind,
      scheduled_at: new Date(baseStart.getTime() + offset * 1000).toISOString(),
      status: "pending" as const,
    });
    offset += 1;
  }

  if (rows.length > 0) {
    // Insert in batches of 200 to avoid payload limits.
    for (let i = 0; i < rows.length; i += 200) {
      await supabaseAdmin.from("host_drip_emails").insert(rows.slice(i, i + 200));
    }
  }

  return { queued: rows.length, skipped, total: list.length };
}
