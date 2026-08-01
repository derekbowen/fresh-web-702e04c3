import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { s as sendViaEmailit } from "./emailit-DRsipvVx.js";
import fs from "node:fs";
import path from "node:path";
import "@supabase/supabase-js";
const HOST_SEQUENCE = [
  {
    step: 0,
    kind: "01-lower-fees",
    subject: "Welcome - you're keeping 90% on every Pool Rental Near Me booking",
    day: 0
  },
  {
    step: 1,
    kind: "04-help",
    subject: "Stuck getting started? I'll help you personally",
    day: 3
  },
  {
    step: 2,
    kind: "03-elearning",
    subject: "Free Pool Host Academy: the playbook top hosts use",
    day: 7
  },
  {
    step: 3,
    kind: "06-listing-tuneup",
    subject: "Want me to tune up your pool listing? Free, takes 10 min",
    day: 14
  },
  {
    step: 4,
    kind: "05-share-link",
    subject: "Got customers asking? Share your booking link, keep 90%",
    day: 30
  },
  {
    // One-off broadcast (not part of the welcome cadence). Day is unused
    // because rows are scheduled manually from the admin broadcast button.
    step: 99,
    kind: "15-share-link-profits",
    subject: "Keep more of your profits 🌊 Share your link with returning guests",
    day: 0
  }
];
const FROM = "Pool Rental Near Me <support@poolrentalnearme.com>";
const SITE_URL = "https://www.poolrentalnearme.com";
async function findSubscriberByIdOrEmail(stUserId, email) {
  const sel = "id, sequence_scheduled, status";
  const { data: byId } = await supabaseAdmin.from("host_subscribers").select(sel).eq("st_user_id", stUserId).maybeSingle();
  if (byId) return byId;
  const { data: byEmail } = await supabaseAdmin.from("host_subscribers").select(sel).eq("email", email).maybeSingle();
  return byEmail ?? null;
}
const TEMPLATE_CACHE = /* @__PURE__ */ new Map();
function loadTemplate(kind) {
  if (TEMPLATE_CACHE.has(kind)) return TEMPLATE_CACHE.get(kind);
  const p = path.join(process.cwd(), "src/lib/email-static/host-drip", `${kind}.html`);
  const html = fs.readFileSync(p, "utf8");
  TEMPLATE_CACHE.set(kind, html);
  return html;
}
function renderTemplate(kind, firstName, unsubUrl) {
  const tpl = loadTemplate(kind);
  return tpl.replaceAll("{{first_name}}", firstName || "there").replaceAll("{{unsubscribe_url}}", unsubUrl);
}
async function scheduleSequence(subscriberId, baseAt = /* @__PURE__ */ new Date()) {
  const rows = HOST_SEQUENCE.filter((s) => s.step < 99).map((s) => ({
    subscriber_id: subscriberId,
    step: s.step,
    kind: s.kind,
    scheduled_at: new Date(baseAt.getTime() + s.day * 864e5).toISOString(),
    status: "pending"
  }));
  await supabaseAdmin.from("host_drip_emails").insert(rows);
  await supabaseAdmin.from("host_subscribers").update({ sequence_scheduled: true }).eq("id", subscriberId);
}
async function pollSharetribeHosts() {
  const { integrationGet } = await import("./sharetribe.server-BZ7y3aGI.js");
  let page = 1;
  let fetched = 0;
  let inserted = 0;
  let scheduled = 0;
  let skipped = 0;
  const seenAuthors = /* @__PURE__ */ new Map();
  try {
    while (page <= 50) {
      const res = await integrationGet("/listings/query", {
        states: "published,draft,pendingApproval,closed",
        perPage: 100,
        page,
        include: "author",
        "fields.user": "email,profile.firstName,profile.lastName",
        "fields.listing": "title"
      });
      const listings = Array.isArray(res?.data) ? res.data : [];
      const included = Array.isArray(res?.included) ? res.included : [];
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
    const nowISO = (/* @__PURE__ */ new Date()).toISOString();
    const baseStart = new Date(Date.now() + 5 * 6e4);
    let offsetSec = 0;
    for (const [stUserId, info] of seenAuthors) {
      const name = `${info.firstName} ${info.lastName}`.trim() || null;
      const existing = await findSubscriberByIdOrEmail(stUserId, info.email);
      let subscriberId;
      if (existing) {
        subscriberId = existing.id;
        await supabaseAdmin.from("host_subscribers").update({
          st_user_id: stUserId,
          email: info.email,
          name,
          last_synced_at: nowISO
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
        const { data: ins } = await supabaseAdmin.from("host_subscribers").insert({
          st_user_id: stUserId,
          email: info.email,
          name,
          last_synced_at: nowISO
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
    console.error("pollSharetribeHosts error:", err?.message || err);
  }
  await supabaseAdmin.from("host_drip_state").update({ last_polled_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", 1);
  return { fetched, inserted, scheduled, skipped };
}
async function sendDueHostEmails(batch = 20) {
  const { data: due } = await supabaseAdmin.from("host_drip_emails").select("*").eq("status", "pending").lte("scheduled_at", (/* @__PURE__ */ new Date()).toISOString()).order("scheduled_at", { ascending: true }).limit(batch);
  if (!due || due.length === 0) {
    return { considered: 0, sent: 0, failed: 0, skipped: 0 };
  }
  let sent = 0, failed = 0, skipped = 0;
  for (const row of due) {
    try {
      const { data: sub } = await supabaseAdmin.from("host_subscribers").select("*").eq("id", row.subscriber_id).single();
      if (!sub || sub.status !== "active") {
        await supabaseAdmin.from("host_drip_emails").update({ status: "skipped", error: "subscriber inactive" }).eq("id", row.id);
        skipped++;
        continue;
      }
      if (sub.intercom_paused_at) {
        await supabaseAdmin.from("host_drip_emails").update({ status: "skipped", error: "intercom paused" }).eq("id", row.id);
        skipped++;
        continue;
      }
      try {
        const { hasOpenConversation } = await import("./router-B2eXowiP.js").then((n) => n.bX);
        if (await hasOpenConversation(sub.email)) {
          await supabaseAdmin.from("host_subscribers").update({ intercom_paused_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", sub.id);
          await supabaseAdmin.from("host_drip_emails").update({ status: "skipped", error: "intercom open conversation" }).eq("id", row.id);
          skipped++;
          continue;
        }
      } catch (e) {
      }
      const step = HOST_SEQUENCE.find((s) => s.kind === row.kind);
      if (!step) {
        await supabaseAdmin.from("host_drip_emails").update({ status: "failed", error: `unknown kind: ${row.kind}` }).eq("id", row.id);
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
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
        }
      });
      await supabaseAdmin.from("host_drip_emails").update({
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
      await supabaseAdmin.from("host_drip_emails").update({
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
async function queueBroadcast(kind) {
  const step = HOST_SEQUENCE.find((s) => s.kind === kind);
  if (!step) throw new Error(`Unknown broadcast kind: ${kind}`);
  const { data: subs } = await supabaseAdmin.from("host_subscribers").select("id").eq("status", "active");
  const list = subs ?? [];
  const { data: existing } = await supabaseAdmin.from("host_drip_emails").select("subscriber_id").eq("kind", kind);
  const sent = new Set((existing ?? []).map((r) => r.subscriber_id));
  const baseStart = new Date(Date.now() + 6e4);
  const rows = [];
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
      scheduled_at: new Date(baseStart.getTime() + offset * 1e3).toISOString(),
      status: "pending"
    });
    offset += 1;
  }
  if (rows.length > 0) {
    for (let i = 0; i < rows.length; i += 200) {
      await supabaseAdmin.from("host_drip_emails").insert(rows.slice(i, i + 200));
    }
  }
  return { queued: rows.length, skipped, total: list.length };
}
async function enrollNewSignups() {
  const { integrationGet } = await import("./sharetribe.server-BZ7y3aGI.js");
  const nowISO = (/* @__PURE__ */ new Date()).toISOString();
  const { data: state } = await supabaseAdmin.from("host_drip_state").select("*").eq("id", 1).maybeSingle();
  let hwm = state?.last_st_created_at ?? null;
  if (!hwm) {
    await supabaseAdmin.from("host_drip_state").update({ last_st_created_at: nowISO, updated_at: nowISO }).eq("id", 1);
    return { fetched: 0, enrolled: 0, skipped: 0, hwm: nowISO };
  }
  let page = 1, fetched = 0, enrolled = 0, skipped = 0, newest = hwm;
  let advancing = true;
  try {
    while (page <= 20) {
      const res = await integrationGet("/users/query", {
        createdAtStart: hwm,
        sort: "createdAt",
        perPage: 100,
        page,
        "fields.user": "email,createdAt,profile.firstName,profile.lastName,profile.publicData"
      });
      const users = Array.isArray(res?.data) ? res.data : [];
      if (users.length === 0) break;
      for (const u of users) {
        const id = typeof u.id === "string" ? u.id : u.id?.uuid || u.id?._ref;
        const attr = u.attributes || {};
        const createdAt = attr.createdAt;
        let handled = false;
        try {
          const email = (attr.email || "").toLowerCase().trim();
          const userType = attr.profile?.publicData?.userType;
          if (!id || !email) {
            skipped++;
            handled = true;
          } else if (userType !== "provider") {
            skipped++;
            handled = true;
          } else {
            fetched++;
            const name = `${attr.profile?.firstName || ""} ${attr.profile?.lastName || ""}`.trim() || null;
            const existing = await findSubscriberByIdOrEmail(id, email);
            if (existing) {
              if (existing.sequence_scheduled || existing.status !== "active") {
                skipped++;
                handled = true;
              } else {
                await supabaseAdmin.from("host_subscribers").update({ st_user_id: id, email, name, last_synced_at: nowISO }).eq("id", existing.id);
                await scheduleSequence(existing.id, /* @__PURE__ */ new Date());
                enrolled++;
                handled = true;
              }
            } else {
              const { data: ins } = await supabaseAdmin.from("host_subscribers").insert({ st_user_id: id, email, name, last_synced_at: nowISO }).select("id").single();
              if (!ins) {
                skipped++;
              } else {
                await scheduleSequence(ins.id, /* @__PURE__ */ new Date());
                enrolled++;
                handled = true;
              }
            }
          }
        } catch (e) {
          console.error("enrollNewSignups user error:", e?.message || e);
        }
        if (handled && advancing) {
          if (createdAt && createdAt > newest) newest = createdAt;
        } else if (!handled) {
          advancing = false;
        }
      }
      const totalPages = res?.meta?.totalPages ?? 1;
      if (page >= totalPages) break;
      page++;
    }
  } catch (err) {
    console.error("enrollNewSignups error:", err?.message || err);
  }
  await supabaseAdmin.from("host_drip_state").update({ last_st_created_at: newest, updated_at: nowISO }).eq("id", 1);
  return { fetched, enrolled, skipped, hwm: newest };
}
export {
  enrollNewSignups,
  pollSharetribeHosts,
  queueBroadcast,
  scheduleSequence,
  sendDueHostEmails
};
