import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { r as requireSupabaseAuth } from "./auth-middleware-Bd-cw3tB.js";
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
const sb = () => supabaseAdmin;
async function assertAdmin(userId) {
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}
const listIgLeads_createServerFn_handler = createServerRpc({
  id: "1e7a8b6ad873de2e4e1c36c76f0deaa1c924de555f202c68099381143f88de11",
  name: "listIgLeads",
  filename: "src/server/ig-lead-hunter.functions.ts"
}, (opts) => listIgLeads.__executeServer(opts));
const listIgLeads = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  filter: z.enum(["all", "new", "contacted"]).default("new"),
  limit: z.number().min(1).max(500).default(200)
}).parse(d ?? {})).handler(listIgLeads_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  let q = sb().from("ig_leads").select("*").order("created_at", {
    ascending: false
  }).limit(data.limit);
  if (data.filter === "new") q = q.eq("contacted", false);
  if (data.filter === "contacted") q = q.eq("contacted", true);
  const {
    data: rows,
    error
  } = await q;
  if (error) return {
    ok: false,
    rows: [],
    error: error.message
  };
  return {
    ok: true,
    rows: rows || []
  };
});
const runIgLeadHuntNow_createServerFn_handler = createServerRpc({
  id: "a110cb2a99bbf25540f65a06642e788891c65352a0468f5475d618412c555405",
  name: "runIgLeadHuntNow",
  filename: "src/server/ig-lead-hunter.functions.ts"
}, (opts) => runIgLeadHuntNow.__executeServer(opts));
const runIgLeadHuntNow = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(runIgLeadHuntNow_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const {
    runIgLeadHunt
  } = await import("./ig-lead-hunter.server-BzgLZUba.js");
  return runIgLeadHunt();
});
const setIgLeadContacted_createServerFn_handler = createServerRpc({
  id: "2af8b5443ded64125d23f482856644fd7759202783056f09d0f988c028dc90d8",
  name: "setIgLeadContacted",
  filename: "src/server/ig-lead-hunter.functions.ts"
}, (opts) => setIgLeadContacted.__executeServer(opts));
const setIgLeadContacted = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  contacted: z.boolean()
}).parse(d)).handler(setIgLeadContacted_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    error
  } = await sb().from("ig_leads").update({
    contacted: data.contacted,
    contacted_at: data.contacted ? (/* @__PURE__ */ new Date()).toISOString() : null
  }).eq("id", data.id);
  if (error) return {
    ok: false,
    error: error.message
  };
  return {
    ok: true
  };
});
const bulkSetIgLeadsContacted_createServerFn_handler = createServerRpc({
  id: "d0e07d87bbfda18d86aa02b648650c53fc62eb085c836a164d7e8763c893bcb1",
  name: "bulkSetIgLeadsContacted",
  filename: "src/server/ig-lead-hunter.functions.ts"
}, (opts) => bulkSetIgLeadsContacted.__executeServer(opts));
const bulkSetIgLeadsContacted = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
  contacted: z.boolean()
}).parse(d)).handler(bulkSetIgLeadsContacted_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    error,
    count
  } = await sb().from("ig_leads").update({
    contacted: data.contacted,
    contacted_at: data.contacted ? (/* @__PURE__ */ new Date()).toISOString() : null
  }, {
    count: "exact"
  }).in("id", data.ids);
  if (error) return {
    ok: false,
    updated: 0,
    error: error.message
  };
  return {
    ok: true,
    updated: count ?? data.ids.length
  };
});
const updateIgLeadNotes_createServerFn_handler = createServerRpc({
  id: "28ce74133d9ad1cbf62f8cae49e9aaf6c31b9917e6ee532e49d7a48e99c328fe",
  name: "updateIgLeadNotes",
  filename: "src/server/ig-lead-hunter.functions.ts"
}, (opts) => updateIgLeadNotes.__executeServer(opts));
const updateIgLeadNotes = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  notes: z.string().max(2e3)
}).parse(d)).handler(updateIgLeadNotes_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    error
  } = await sb().from("ig_leads").update({
    notes: data.notes
  }).eq("id", data.id);
  if (error) return {
    ok: false,
    error: error.message
  };
  return {
    ok: true
  };
});
const deleteIgLead_createServerFn_handler = createServerRpc({
  id: "00537e5b134af5e7b1d1f0d9511711a195b97a22988758852916f731777d13ca",
  name: "deleteIgLead",
  filename: "src/server/ig-lead-hunter.functions.ts"
}, (opts) => deleteIgLead.__executeServer(opts));
const deleteIgLead = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(deleteIgLead_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    error
  } = await sb().from("ig_leads").delete().eq("id", data.id);
  if (error) return {
    ok: false,
    error: error.message
  };
  return {
    ok: true
  };
});
export {
  bulkSetIgLeadsContacted_createServerFn_handler,
  deleteIgLead_createServerFn_handler,
  listIgLeads_createServerFn_handler,
  runIgLeadHuntNow_createServerFn_handler,
  setIgLeadContacted_createServerFn_handler,
  updateIgLeadNotes_createServerFn_handler
};
