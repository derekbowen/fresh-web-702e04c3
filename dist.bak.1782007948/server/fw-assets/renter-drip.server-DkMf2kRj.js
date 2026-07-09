import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { s as sendViaEmailit } from "./emailit-DRsipvVx.js";
import fs from "node:fs";
import path from "node:path";
import "@supabase/supabase-js";
const FROM = "Pool Rental Near Me <support@poolrentalnearme.com>";
const SITE_URL = "https://www.poolrentalnearme.com";
const SEQUENCE = [
  {
    step: 0,
    kind: "warm_up",
    subject: "Ready for a swim? 🌊 Dive into our local pools today",
    day: 0,
    file: "01-warm-up"
  },
  {
    step: 1,
    kind: "new_pools",
    subject: "✨ New pools just dropped, come find your new favorite spot",
    day: 1,
    file: "02-new-pools"
  },
  {
    step: 2,
    kind: "booking_nudge",
    subject: "Don't miss out, prime pool days are booking fast ☀️",
    day: 2,
    file: "03-booking-nudge"
  }
];
const TEMPLATE_CACHE = /* @__PURE__ */ new Map();
function loadTemplate(file) {
  if (TEMPLATE_CACHE.has(file)) return TEMPLATE_CACHE.get(file);
  const p = path.join(process.cwd(), "src/lib/email-static/renter-drip", `${file}.html`);
  const html = fs.readFileSync(p, "utf8");
  TEMPLATE_CACHE.set(file, html);
  return html;
}
function renderTemplate(file, firstName, unsubUrl) {
  const tpl = loadTemplate(file);
  return tpl.replaceAll("{{first_name}}", firstName || "there").replaceAll("{{unsubscribe_url}}", unsubUrl);
}
async function scheduleSequence(subscriberId, baseAt = /* @__PURE__ */ new Date()) {
  const rows = SEQUENCE.map((s) => ({
    subscriber_id: subscriberId,
    step: s.step,
    kind: s.kind,
    scheduled_at: new Date(baseAt.getTime() + s.day * 864e5).toISOString(),
    status: "pending"
  }));
  await supabaseAdmin.from("renter_emails").insert(rows);
  await supabaseAdmin.from("renter_subscribers").update({ sequence_scheduled: true }).eq("id", subscriberId);
}
async function sendDueEmails(batch = 25) {
  const { data: due } = await supabaseAdmin.from("renter_emails").select("*").eq("status", "pending").lte("scheduled_at", (/* @__PURE__ */ new Date()).toISOString()).order("scheduled_at", { ascending: true }).limit(batch);
  if (!due || due.length === 0) {
    return { considered: 0, sent: 0, failed: 0, skipped: 0 };
  }
  let sent = 0, failed = 0, skipped = 0;
  for (const row of due) {
    try {
      const { data: sub } = await supabaseAdmin.from("renter_subscribers").select("*").eq("id", row.subscriber_id).single();
      if (!sub || sub.status !== "active") {
        await supabaseAdmin.from("renter_emails").update({ status: "skipped", error: "subscriber inactive" }).eq("id", row.id);
        skipped++;
        continue;
      }
      if (sub.intercom_paused_at) {
        await supabaseAdmin.from("renter_emails").update({ status: "skipped", error: "intercom paused" }).eq("id", row.id);
        skipped++;
        continue;
      }
      try {
        const { hasOpenConversation } = await import("./router-Bk6RtsuF.js").then((n) => n.bW);
        if (await hasOpenConversation(sub.email)) {
          await supabaseAdmin.from("renter_subscribers").update({ intercom_paused_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", sub.id);
          await supabaseAdmin.from("renter_emails").update({ status: "skipped", error: "intercom open conversation" }).eq("id", row.id);
          skipped++;
          continue;
        }
      } catch (e) {
      }
      const step = SEQUENCE.find((s) => s.kind === row.kind);
      console.log("[renter-drip] finding step for kind:", row.kind, "available:", SEQUENCE.map((s) => s.kind), "found:", !!step);
      if (!step) {
        await supabaseAdmin.from("renter_emails").update({ status: "failed", error: `unknown kind: ${row.kind}` }).eq("id", row.id);
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
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
        }
      });
      await supabaseAdmin.from("renter_emails").update({
        status: "sent",
        subject: step.subject,
        emailit_id: result.id,
        sent_at: (/* @__PURE__ */ new Date()).toISOString(),
        attempts: (row.attempts ?? 0) + 1
      }).eq("id", row.id);
      sent++;
      await new Promise((res) => setTimeout(res, 700));
    } catch (err) {
      const msg = err?.message || String(err);
      const status = err?.status;
      const retryAfter = err?.retryAfterSeconds ?? null;
      const attempts = (row.attempts ?? 0) + 1;
      const final = status === 429 ? false : attempts >= 3;
      const delayMs = status === 429 ? Math.max((retryAfter ?? 2) * 1e3, 2e3) : 5 * 6e4;
      await supabaseAdmin.from("renter_emails").update({
        status: final ? "failed" : "pending",
        error: msg.slice(0, 500),
        attempts,
        scheduled_at: final ? row.scheduled_at : new Date(Date.now() + delayMs).toISOString()
      }).eq("id", row.id);
      if (final) failed++;
      if (status === 429) await new Promise((res) => setTimeout(res, delayMs));
    }
  }
  return { considered: due.length, sent, failed, skipped };
}
async function pollSharetribeRenters() {
  const { integrationGet } = await import("./sharetribe.server-BZ7y3aGI.js");
  const { data: state } = await supabaseAdmin.from("renter_drip_state").select("last_st_created_at").eq("id", 1).single();
  const sinceISO = state?.last_st_created_at || new Date(Date.now() - 24 * 36e5).toISOString();
  let fetched = 0;
  let inserted = 0;
  let scheduled = 0;
  let skipped = 0;
  let newCursor = null;
  try {
    const res = await integrationGet("/users/query", {
      perPage: 100,
      sort: "createdAt",
      createdAtStart: sinceISO
    });
    const users = Array.isArray(res?.data) ? res.data : [];
    fetched = users.length;
    const baseStart = new Date(Date.now() + 6e4);
    let offsetSec = 0;
    for (const u of users) {
      const stUserId = typeof u.id === "string" ? u.id : u.id?.uuid || u.id?._ref || null;
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
      const { data: existing } = await supabaseAdmin.from("renter_subscribers").select("id, sequence_scheduled, status").or(`st_user_id.eq.${stUserId},email.eq.${email}`).maybeSingle();
      let subscriberId;
      if (existing) {
        subscriberId = existing.id;
        await supabaseAdmin.from("renter_subscribers").update({
          st_user_id: stUserId,
          email,
          name,
          st_created_at: createdAt
        }).eq("id", subscriberId);
        if (!existing.sequence_scheduled && existing.status === "active") {
          const baseAt = new Date(baseStart.getTime() + offsetSec * 1e3);
          await scheduleSequence(subscriberId, baseAt);
          scheduled++;
          offsetSec += 1;
        } else {
          skipped++;
        }
      } else {
        const { data: ins } = await supabaseAdmin.from("renter_subscribers").insert({
          st_user_id: stUserId,
          email,
          name,
          st_created_at: createdAt
        }).select("id").single();
        if (!ins) {
          skipped++;
          continue;
        }
        subscriberId = ins.id;
        inserted++;
        const baseAt = new Date(baseStart.getTime() + offsetSec * 1e3);
        await scheduleSequence(subscriberId, baseAt);
        scheduled++;
        offsetSec += 1;
      }
    }
  } catch (err) {
    console.error("pollSharetribeRenters error:", err?.message || err);
  }
  if (newCursor) {
    await supabaseAdmin.from("renter_drip_state").update({ last_st_created_at: newCursor, last_polled_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", 1);
  } else {
    await supabaseAdmin.from("renter_drip_state").update({ last_polled_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", 1);
  }
  return { fetched, inserted, scheduled, skipped, cursor: newCursor };
}
async function backfillSequenceForAll() {
  const { data: subs } = await supabaseAdmin.from("renter_subscribers").select("id, sequence_scheduled, status");
  let scheduled = 0;
  let skipped = 0;
  const baseStart = new Date(Date.now() + 6e4);
  let offsetSec = 0;
  for (const s of subs ?? []) {
    if (s.sequence_scheduled || s.status !== "active") {
      skipped++;
      continue;
    }
    const baseAt = new Date(baseStart.getTime() + offsetSec * 1e3);
    await scheduleSequence(s.id, baseAt);
    scheduled++;
    offsetSec += 1;
  }
  return { scheduled, skipped };
}
async function backfillAllSharetribeRenters() {
  const { integrationGet } = await import("./sharetribe.server-BZ7y3aGI.js");
  let fetched = 0;
  let inserted = 0;
  let scheduled = 0;
  let skipped = 0;
  let pages = 0;
  const baseStart = new Date(Date.now() + 2 * 6e4);
  let offsetSec = 0;
  let page = 1;
  const perPage = 100;
  while (page <= 200) {
    let res;
    try {
      res = await integrationGet("/users/query", { perPage, page, sort: "createdAt" });
    } catch (err) {
      console.error("backfillAllSharetribeRenters page", page, err?.message || err);
      break;
    }
    const users = Array.isArray(res?.data) ? res.data : [];
    pages++;
    if (users.length === 0) break;
    fetched += users.length;
    for (const u of users) {
      const stUserId = typeof u.id === "string" ? u.id : u.id?.uuid || u.id?._ref || null;
      const attrs = u.attributes || {};
      const email = (attrs.email || "").toLowerCase().trim();
      const createdAt = attrs.createdAt || null;
      if (!stUserId || !email) {
        skipped++;
        continue;
      }
      const profile = attrs.profile || {};
      const name = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || null;
      const { data: existing } = await supabaseAdmin.from("renter_subscribers").select("id, sequence_scheduled, status").or(`st_user_id.eq.${stUserId},email.eq.${email}`).maybeSingle();
      if (existing) {
        await supabaseAdmin.from("renter_subscribers").update({ st_user_id: stUserId, email, name, st_created_at: createdAt }).eq("id", existing.id);
        if (!existing.sequence_scheduled && existing.status === "active") {
          const baseAt = new Date(baseStart.getTime() + offsetSec * 1e3);
          await scheduleSequence(existing.id, baseAt);
          scheduled++;
          offsetSec += 1;
        } else {
          skipped++;
        }
      } else {
        const { data: ins } = await supabaseAdmin.from("renter_subscribers").insert({ st_user_id: stUserId, email, name, st_created_at: createdAt }).select("id").single();
        if (!ins) {
          skipped++;
          continue;
        }
        inserted++;
        const baseAt = new Date(baseStart.getTime() + offsetSec * 1e3);
        await scheduleSequence(ins.id, baseAt);
        scheduled++;
        offsetSec += 1;
      }
    }
    if (users.length < perPage) break;
    page++;
  }
  await supabaseAdmin.from("renter_drip_state").update({ last_polled_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", 1);
  return { fetched, inserted, scheduled, skipped, pages };
}
export {
  backfillAllSharetribeRenters,
  backfillSequenceForAll,
  pollSharetribeRenters,
  scheduleSequence,
  sendDueEmails
};
