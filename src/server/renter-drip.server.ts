/**
 * Renter drip — 3-day welcome sequence.
 *
 * - Pulls new renters from Sharetribe Integration API.
 * - Schedules a 3-touch sequence (Day 0, 1, 2) per subscriber.
 * - Renders static HTML templates with first-name + unsubscribe substitution
 *   and sends via Emailit, paced under the 2/sec limit.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendViaEmailit } from "@/lib/email/emailit";
import fs from "node:fs";
import path from "node:path";

const FROM = "Pool Rental Near Me <hello@notify.poolfriends.poolrentalnearme.com>";
const SITE_URL = "https://www.poolrentalnearme.com";

// ---------- Sequence definition ----------

type Step = {
  step: number;
  kind: "warm_up" | "new_pools" | "booking_nudge";
  subject: string;
  /** Days from baseAt when this email should send. */
  day: number;
  /** Filename stem under src/lib/email-static/renter-drip/ */
  file: string;
};

const SEQUENCE: Step[] = [
  {
    step: 0,
    kind: "warm_up",
    subject: "Ready for a swim? 🌊 Dive into our local pools today",
    day: 0,
    file: "01-warm-up",
  },
  {
    step: 1,
    kind: "new_pools",
    subject: "✨ New pools just dropped, come find your new favorite spot",
    day: 1,
    file: "02-new-pools",
  },
  {
    step: 2,
    kind: "booking_nudge",
    subject: "Don't miss out, prime pool days are booking fast ☀️",
    day: 2,
    file: "03-booking-nudge",
  },
];

// ---------- Template loading + rendering ----------

const TEMPLATE_CACHE = new Map<string, string>();
function loadTemplate(file: string): string {
  if (TEMPLATE_CACHE.has(file)) return TEMPLATE_CACHE.get(file)!;
  const p = path.join(process.cwd(), "src/lib/email-static/renter-drip", `${file}.html`);
  const html = fs.readFileSync(p, "utf8");
  TEMPLATE_CACHE.set(file, html);
  return html;
}

function renderTemplate(file: string, firstName: string, unsubUrl: string): string {
  const tpl = loadTemplate(file);
  return tpl
    .replaceAll("{{first_name}}", firstName || "there")
    .replaceAll("{{unsubscribe_url}}", unsubUrl);
}

// ---------- Sequence scheduling ----------

export async function scheduleSequence(subscriberId: string, baseAt = new Date()) {
  const rows = SEQUENCE.map((s) => ({
    subscriber_id: subscriberId,
    step: s.step,
    kind: s.kind,
    scheduled_at: new Date(baseAt.getTime() + s.day * 86400_000).toISOString(),
    status: "pending" as const,
  }));
  await supabaseAdmin.from("renter_emails").insert(rows);
  await supabaseAdmin
    .from("renter_subscribers")
    .update({ sequence_scheduled: true })
    .eq("id", subscriberId);
}

// ---------- Send loop ----------

export async function sendDueEmails(batch = 25): Promise<{
  considered: number;
  sent: number;
  failed: number;
  skipped: number;
}> {
  const { data: due } = await supabaseAdmin
    .from("renter_emails")
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
        .from("renter_subscribers")
        .select("*")
        .eq("id", row.subscriber_id)
        .single();
      if (!sub || sub.status !== "active") {
        await supabaseAdmin
          .from("renter_emails")
          .update({ status: "skipped", error: "subscriber inactive" })
          .eq("id", row.id);
        skipped++;
        continue;
      }

      const step = SEQUENCE.find((s) => s.kind === row.kind);
      if (!step) {
        await supabaseAdmin
          .from("renter_emails")
          .update({ status: "failed", error: `unknown kind: ${row.kind}` })
          .eq("id", row.id);
        failed++;
        continue;
      }

      const firstName = (sub.name || "").split(" ")[0] || "";
      const unsubUrl = `${SITE_URL}/unsubscribe-renter?token=${sub.unsubscribe_token}`;
      const html = renderTemplate(step.file, firstName, unsubUrl);

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
        .from("renter_emails")
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
      const final = status === 429 ? false : attempts >= 3;
      const delayMs =
        status === 429
          ? Math.max((retryAfter ?? 2) * 1000, 2000)
          : 5 * 60_000;
      await supabaseAdmin
        .from("renter_emails")
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

// ---------- Sharetribe poller ----------

export async function pollSharetribeRenters(): Promise<{
  fetched: number;
  inserted: number;
  scheduled: number;
  skipped: number;
  cursor: string | null;
}> {
  const { integrationGet } = await import("@/server/sharetribe.server");

  const { data: state } = await supabaseAdmin
    .from("renter_drip_state")
    .select("last_st_created_at")
    .eq("id", 1)
    .single();

  const sinceISO =
    state?.last_st_created_at ||
    new Date(Date.now() - 24 * 3600_000).toISOString();

  let fetched = 0;
  let inserted = 0;
  let scheduled = 0;
  let skipped = 0;
  let newCursor: string | null = null;

  try {
    const res: any = await integrationGet("/users/query", {
      perPage: 100,
      sort: "createdAt",
      createdAtStart: sinceISO,
    });
    const users: any[] = Array.isArray(res?.data) ? res.data : [];
    fetched = users.length;

    // Stagger initial sends 1 sec apart so we don't burst Emailit
    const baseStart = new Date(Date.now() + 60_000);
    let offsetSec = 0;

    for (const u of users) {
      const stUserId =
        typeof u.id === "string" ? u.id : u.id?.uuid || u.id?._ref || null;
      const attrs = u.attributes || {};
      const email = (attrs.email || "").toLowerCase().trim();
      const createdAt = attrs.createdAt || null;
      if (!stUserId || !email) {
        skipped++;
        continue;
      }
      if (createdAt && (!newCursor || createdAt > newCursor)) newCursor = createdAt;

      const profile = attrs.profile || {};
      const firstName = profile.firstName || "";
      const lastName = profile.lastName || "";
      const name = `${firstName} ${lastName}`.trim() || null;

      const { data: existing } = await supabaseAdmin
        .from("renter_subscribers")
        .select("id, sequence_scheduled, status")
        .or(`st_user_id.eq.${stUserId},email.eq.${email}`)
        .maybeSingle();

      let subscriberId: string;
      if (existing) {
        subscriberId = existing.id;
        await supabaseAdmin
          .from("renter_subscribers")
          .update({
            st_user_id: stUserId,
            email,
            name,
            st_created_at: createdAt,
          })
          .eq("id", subscriberId);
        if (!existing.sequence_scheduled && existing.status === "active") {
          const baseAt = new Date(baseStart.getTime() + offsetSec * 1000);
          await scheduleSequence(subscriberId, baseAt);
          scheduled++;
          offsetSec += 1;
        } else {
          skipped++;
        }
      } else {
        const { data: ins } = await supabaseAdmin
          .from("renter_subscribers")
          .insert({
            st_user_id: stUserId,
            email,
            name,
            st_created_at: createdAt,
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
    console.error("pollSharetribeRenters error:", err?.message || err);
  }

  if (newCursor) {
    await supabaseAdmin
      .from("renter_drip_state")
      .update({ last_st_created_at: newCursor, last_polled_at: new Date().toISOString() })
      .eq("id", 1);
  } else {
    await supabaseAdmin
      .from("renter_drip_state")
      .update({ last_polled_at: new Date().toISOString() })
      .eq("id", 1);
  }

  return { fetched, inserted, scheduled, skipped, cursor: newCursor };
}

// ---------- Backfill helper ----------

/**
 * One-time backfill: schedule the 3-day sequence for every active renter
 * subscriber that doesn't have one yet. Staggers initial sends 1 sec apart.
 */
export async function backfillSequenceForAll(): Promise<{
  scheduled: number;
  skipped: number;
}> {
  const { data: subs } = await supabaseAdmin
    .from("renter_subscribers")
    .select("id, sequence_scheduled, status");
  let scheduled = 0;
  let skipped = 0;
  const baseStart = new Date(Date.now() + 60_000);
  let offsetSec = 0;
  for (const s of subs ?? []) {
    if (s.sequence_scheduled || s.status !== "active") {
      skipped++;
      continue;
    }
    const baseAt = new Date(baseStart.getTime() + offsetSec * 1000);
    await scheduleSequence(s.id, baseAt);
    scheduled++;
    offsetSec += 1;
  }
  return { scheduled, skipped };
}

/**
 * Pulls ALL existing Sharetribe users (paginated, no date cursor), upserts
 * them as renter_subscribers, and queues the 3-day sequence for any active
 * subscriber that doesn't already have one. Day-0 sends are staggered ~1s
 * apart starting ~2 min from now to respect Emailit's 2/sec limit.
 */
export async function backfillAllSharetribeRenters(): Promise<{
  fetched: number;
  inserted: number;
  scheduled: number;
  skipped: number;
  pages: number;
}> {
  const { integrationGet } = await import("@/server/sharetribe.server");

  let fetched = 0;
  let inserted = 0;
  let scheduled = 0;
  let skipped = 0;
  let pages = 0;

  const baseStart = new Date(Date.now() + 2 * 60_000);
  let offsetSec = 0;

  let page = 1;
  const perPage = 100;
  while (page <= 200) {
    let res: any;
    try {
      res = await integrationGet("/users/query", { perPage, page, sort: "createdAt" });
    } catch (err: any) {
      console.error("backfillAllSharetribeRenters page", page, err?.message || err);
      break;
    }
    const users: any[] = Array.isArray(res?.data) ? res.data : [];
    pages++;
    if (users.length === 0) break;
    fetched += users.length;

    for (const u of users) {
      const stUserId =
        typeof u.id === "string" ? u.id : u.id?.uuid || u.id?._ref || null;
      const attrs = u.attributes || {};
      const email = (attrs.email || "").toLowerCase().trim();
      const createdAt = attrs.createdAt || null;
      if (!stUserId || !email) { skipped++; continue; }

      const profile = attrs.profile || {};
      const name = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || null;

      const { data: existing } = await supabaseAdmin
        .from("renter_subscribers")
        .select("id, sequence_scheduled, status")
        .or(`st_user_id.eq.${stUserId},email.eq.${email}`)
        .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from("renter_subscribers")
          .update({ st_user_id: stUserId, email, name, st_created_at: createdAt })
          .eq("id", existing.id);
        if (!existing.sequence_scheduled && existing.status === "active") {
          const baseAt = new Date(baseStart.getTime() + offsetSec * 1000);
          await scheduleSequence(existing.id, baseAt);
          scheduled++;
          offsetSec += 1;
        } else {
          skipped++;
        }
      } else {
        const { data: ins } = await supabaseAdmin
          .from("renter_subscribers")
          .insert({ st_user_id: stUserId, email, name, st_created_at: createdAt })
          .select("id")
          .single();
        if (!ins) { skipped++; continue; }
        inserted++;
        const baseAt = new Date(baseStart.getTime() + offsetSec * 1000);
        await scheduleSequence(ins.id, baseAt);
        scheduled++;
        offsetSec += 1;
      }
    }

    if (users.length < perPage) break;
    page++;
  }

  await supabaseAdmin
    .from("renter_drip_state")
    .update({ last_polled_at: new Date().toISOString() })
    .eq("id", 1);

  return { fetched, inserted, scheduled, skipped, pages };
}
