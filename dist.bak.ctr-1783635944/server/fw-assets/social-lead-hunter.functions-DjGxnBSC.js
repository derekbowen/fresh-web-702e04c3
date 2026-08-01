import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
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
const SOURCES = ["ig", "fb", "tiktok", "nextdoor", "craigslist", "youtube"];
async function assertAdmin(userId) {
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}
const listSocialLeads_createServerFn_handler = createServerRpc({
  id: "bbb58db06f3141ce9d5f836cd65a98d85569efe618d8490734acc925e1cad298",
  name: "listSocialLeads",
  filename: "src/server/social-lead-hunter.functions.ts"
}, (opts) => listSocialLeads.__executeServer(opts));
const listSocialLeads = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  source: z.enum(["all", ...SOURCES]).default("all"),
  filter: z.enum(["all", "new", "contacted"]).default("new"),
  limit: z.number().min(1).max(500).default(300)
}).parse(d ?? {})).handler(listSocialLeads_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  let q = sb().from("social_leads").select("*").order("created_at", {
    ascending: false
  }).limit(data.limit);
  if (data.source !== "all") q = q.eq("source", data.source);
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
const runSocialLeadHuntNow_createServerFn_handler = createServerRpc({
  id: "6cc88656dca947f1fa5b25d51f134bb94b23a54ce65751d49130b0aab75a8e76",
  name: "runSocialLeadHuntNow",
  filename: "src/server/social-lead-hunter.functions.ts"
}, (opts) => runSocialLeadHuntNow.__executeServer(opts));
const runSocialLeadHuntNow = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  sources: z.array(z.enum(SOURCES)).optional()
}).parse(d ?? {})).handler(runSocialLeadHuntNow_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    runSocialLeadHunt
  } = await import("./social-lead-hunter.server-DSNblMsK.js");
  return runSocialLeadHunt({
    sources: data.sources
  });
});
const setSocialLeadContacted_createServerFn_handler = createServerRpc({
  id: "7d7f77a365423c8b0b40125b18fb4ddf04d0cfe76e8f7ee5a3df96e5ede02bd0",
  name: "setSocialLeadContacted",
  filename: "src/server/social-lead-hunter.functions.ts"
}, (opts) => setSocialLeadContacted.__executeServer(opts));
const setSocialLeadContacted = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  contacted: z.boolean()
}).parse(d)).handler(setSocialLeadContacted_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    error
  } = await sb().from("social_leads").update({
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
const updateSocialLeadNotes_createServerFn_handler = createServerRpc({
  id: "737c1c94cf3fc28a9b564d810eda9abb03d7fb498f162f61f3fb32271e3ac236",
  name: "updateSocialLeadNotes",
  filename: "src/server/social-lead-hunter.functions.ts"
}, (opts) => updateSocialLeadNotes.__executeServer(opts));
const updateSocialLeadNotes = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  notes: z.string().max(2e3)
}).parse(d)).handler(updateSocialLeadNotes_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    error
  } = await sb().from("social_leads").update({
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
const deleteSocialLead_createServerFn_handler = createServerRpc({
  id: "61e069fbe5504ed4989aa77bde7f1dbd5b3934986eb96cb9faa9b66d14f072e8",
  name: "deleteSocialLead",
  filename: "src/server/social-lead-hunter.functions.ts"
}, (opts) => deleteSocialLead.__executeServer(opts));
const deleteSocialLead = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(deleteSocialLead_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    error
  } = await sb().from("social_leads").delete().eq("id", data.id);
  if (error) return {
    ok: false,
    error: error.message
  };
  return {
    ok: true
  };
});
export {
  deleteSocialLead_createServerFn_handler,
  listSocialLeads_createServerFn_handler,
  runSocialLeadHuntNow_createServerFn_handler,
  setSocialLeadContacted_createServerFn_handler,
  updateSocialLeadNotes_createServerFn_handler
};
