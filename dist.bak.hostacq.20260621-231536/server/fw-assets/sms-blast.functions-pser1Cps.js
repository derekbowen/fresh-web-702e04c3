import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { c as createServerFn } from "../server.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
async function assertAdmin(userId) {
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}
const filterSchema = z.object({
  source: z.enum(["all", "jobsxml", "googlejobs", "jooble", "indeed", "ziprecruiter"]).default("all"),
  city: z.string().trim().max(120).optional().nullable(),
  region: z.string().trim().max(20).optional().nullable(),
  sinceDays: z.number().int().min(1).max(365).optional().nullable()
});
async function queryLeads(f, limit = 5e3) {
  let q = supabaseAdmin.from("host_leads").select("id, name, phone_e164, city, region, page, created_at").not("phone_e164", "is", null).order("created_at", {
    ascending: false
  }).limit(limit);
  if (f.source && f.source !== "all") {
    q = q.ilike("page", `%source=${f.source}%`);
  }
  if (f.city) q = q.ilike("city", f.city);
  if (f.region) q = q.ilike("region", f.region);
  if (f.sinceDays) {
    const since = new Date(Date.now() - f.sinceDays * 864e5).toISOString();
    q = q.gte("created_at", since);
  }
  const {
    data,
    error
  } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}
function renderBody(template, lead) {
  const first = (lead.name || "there").split(" ")[0].slice(0, 30);
  return template.replaceAll("{first_name}", first).replaceAll("{name}", first).replaceAll("{city}", lead.city || "your area").slice(0, 1500);
}
const previewSmsBlast_createServerFn_handler = createServerRpc({
  id: "9805350f35915072881e532c84e72bd84b3465a5836b6b9749b3af281cb18325",
  name: "previewSmsBlast",
  filename: "src/lib/sms-blast.functions.ts"
}, (opts) => previewSmsBlast.__executeServer(opts));
const previewSmsBlast = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => filterSchema.parse(d)).handler(previewSmsBlast_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const leads = await queryLeads(data, 5e3);
  const phones = leads.map((l) => l.phone_e164);
  const {
    data: optouts
  } = await supabaseAdmin.from("sms_opt_outs").select("phone_e164").in("phone_e164", phones.length ? phones : ["__none__"]);
  const optedSet = new Set((optouts ?? []).map((o) => o.phone_e164));
  const eligible = leads.filter((l) => !optedSet.has(l.phone_e164));
  return {
    ok: true,
    total: leads.length,
    optedOut: leads.length - eligible.length,
    eligible: eligible.length,
    sample: eligible.slice(0, 5).map((l) => ({
      id: l.id,
      name: l.name,
      phone: l.phone_e164,
      city: l.city,
      page: l.page
    }))
  };
});
const sendSchema = filterSchema.extend({
  body: z.string().trim().min(10).max(1500),
  scheduleAt: z.string().datetime().optional().nullable(),
  dryRun: z.boolean().default(false),
  dedupeDays: z.number().int().min(0).max(90).default(7)
});
const sendSmsBlast_createServerFn_handler = createServerRpc({
  id: "ed88ca29c540be0a952d5f62840a169bfd27edb6304345b2da68d986c8749393",
  name: "sendSmsBlast",
  filename: "src/lib/sms-blast.functions.ts"
}, (opts) => sendSmsBlast.__executeServer(opts));
const sendSmsBlast = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => sendSchema.parse(d)).handler(sendSmsBlast_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  if (!/\bSTOP\b/i.test(data.body)) {
    return {
      ok: false,
      error: "Message must include 'STOP' opt-out language (e.g. 'Reply STOP to opt out')."
    };
  }
  const leads = await queryLeads(data, 5e3);
  const phones = leads.map((l) => l.phone_e164);
  if (phones.length === 0) {
    return {
      ok: true,
      scheduled: 0,
      skippedOptOut: 0,
      skippedRecent: 0,
      dryRun: data.dryRun
    };
  }
  const {
    data: optouts
  } = await supabaseAdmin.from("sms_opt_outs").select("phone_e164").in("phone_e164", phones);
  const optedSet = new Set((optouts ?? []).map((o) => o.phone_e164));
  let recentSet = /* @__PURE__ */ new Set();
  if (data.dedupeDays > 0) {
    const cutoff = new Date(Date.now() - data.dedupeDays * 864e5).toISOString();
    const {
      data: recent
    } = await supabaseAdmin.from("sms_messages").select("phone_e164").in("phone_e164", phones).gte("created_at", cutoff).in("status", ["pending", "sent"]);
    recentSet = new Set((recent ?? []).map((r) => r.phone_e164));
  }
  const scheduledAt = data.scheduleAt ?? (/* @__PURE__ */ new Date()).toISOString();
  const rows = [];
  let skippedOptOut = 0;
  let skippedRecent = 0;
  for (const l of leads) {
    if (optedSet.has(l.phone_e164)) {
      skippedOptOut++;
      continue;
    }
    if (recentSet.has(l.phone_e164)) {
      skippedRecent++;
      continue;
    }
    rows.push({
      lead_id: l.id,
      phone_e164: l.phone_e164,
      body: renderBody(data.body, l),
      step: 99,
      // blast marker
      scheduled_at: scheduledAt,
      status: "pending"
    });
  }
  if (data.dryRun) {
    return {
      ok: true,
      dryRun: true,
      wouldSchedule: rows.length,
      skippedOptOut,
      skippedRecent,
      sample: rows.slice(0, 3).map((r) => ({
        phone: r.phone_e164,
        body: r.body
      }))
    };
  }
  if (rows.length === 0) {
    return {
      ok: true,
      scheduled: 0,
      skippedOptOut,
      skippedRecent,
      dryRun: false
    };
  }
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const {
      error
    } = await supabaseAdmin.from("sms_messages").insert(chunk);
    if (error) return {
      ok: false,
      error: error.message,
      inserted
    };
    inserted += chunk.length;
  }
  return {
    ok: true,
    scheduled: inserted,
    skippedOptOut,
    skippedRecent,
    dryRun: false,
    scheduledAt
  };
});
export {
  previewSmsBlast_createServerFn_handler,
  sendSmsBlast_createServerFn_handler
};
