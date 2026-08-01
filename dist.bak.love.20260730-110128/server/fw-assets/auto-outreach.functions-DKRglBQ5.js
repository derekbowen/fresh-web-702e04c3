import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-Bd-cw3tB.js";
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
const sb = () => supabaseAdmin;
async function assertAdmin(userId) {
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}
const getAutoOutreachState_createServerFn_handler = createServerRpc({
  id: "f21bd80c9b38e795c2db3e974a2af4e79f02f21c0f3c6438ba80a82396479f1b",
  name: "getAutoOutreachState",
  filename: "src/lib/auto-outreach.functions.ts"
}, (opts) => getAutoOutreachState.__executeServer(opts));
const getAutoOutreachState = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(getAutoOutreachState_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const {
    data: settings
  } = await sb().from("auto_outreach_settings").select("*").eq("id", 1).maybeSingle();
  const {
    data: messages
  } = await sb().from("auto_outreach_messages").select("id, source, channel, step, to_address, subject, body, status, scheduled_at, sent_at, error, created_at").order("created_at", {
    ascending: false
  }).limit(100);
  const {
    data: counts
  } = await sb().from("auto_outreach_messages").select("status").limit(5e3);
  const tally = {};
  (counts ?? []).forEach((r) => {
    tally[r.status] = (tally[r.status] ?? 0) + 1;
  });
  return {
    ok: true,
    settings,
    messages: messages ?? [],
    tally
  };
});
const settingsSchema = z.object({
  email_enabled: z.boolean(),
  sms_enabled: z.boolean(),
  dm_drafts_enabled: z.boolean(),
  from_email: z.string().email().max(200),
  from_name: z.string().min(1).max(120),
  reply_to: z.string().email().max(200).nullable().optional(),
  max_per_hour: z.number().int().min(1).max(1e3)
});
const updateAutoOutreachSettings_createServerFn_handler = createServerRpc({
  id: "929a4afaed7f8ed0755b255e401e54216dd83a71fda27cf43b56c86bac2436a2",
  name: "updateAutoOutreachSettings",
  filename: "src/lib/auto-outreach.functions.ts"
}, (opts) => updateAutoOutreachSettings.__executeServer(opts));
const updateAutoOutreachSettings = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => settingsSchema.parse(d)).handler(updateAutoOutreachSettings_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    error
  } = await sb().from("auto_outreach_settings").update({
    ...data,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", 1);
  if (error) return {
    ok: false,
    error: error.message
  };
  return {
    ok: true
  };
});
const runAutoOutreachNow_createServerFn_handler = createServerRpc({
  id: "db7425dbb8ab0aefcb4099c78e776e0c672d82462eda5b663ade7f61324a403d",
  name: "runAutoOutreachNow",
  filename: "src/lib/auto-outreach.functions.ts"
}, (opts) => runAutoOutreachNow.__executeServer(opts));
const runAutoOutreachNow = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(runAutoOutreachNow_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const {
    runAutoOutreach
  } = await import("./auto-outreach.server-DLLupcxB.js");
  return runAutoOutreach();
});
const cancelAutoOutreachMessage_createServerFn_handler = createServerRpc({
  id: "7c92389154c37b73eee6341dcd6568e18e04983a6fa33ccd16f6a9a7fb7b85a9",
  name: "cancelAutoOutreachMessage",
  filename: "src/lib/auto-outreach.functions.ts"
}, (opts) => cancelAutoOutreachMessage.__executeServer(opts));
const cancelAutoOutreachMessage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(cancelAutoOutreachMessage_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    error
  } = await sb().from("auto_outreach_messages").update({
    status: "skipped"
  }).eq("id", data.id).eq("status", "pending");
  if (error) return {
    ok: false,
    error: error.message
  };
  return {
    ok: true
  };
});
export {
  cancelAutoOutreachMessage_createServerFn_handler,
  getAutoOutreachState_createServerFn_handler,
  runAutoOutreachNow_createServerFn_handler,
  updateAutoOutreachSettings_createServerFn_handler
};
