import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { p as processFollowupReminders } from "./followup-reminders.server-cq9Qg0-p.js";
import { c as createServerFn } from "../server.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "./emailit-DRsipvVx.js";
import "./sms.server-BJah3xxU.js";
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
const getMyReminderSettings_createServerFn_handler = createServerRpc({
  id: "b574c0176162cf5328022bda343a01f75d3eedffd63b43ae3c0959e2d490ddd0",
  name: "getMyReminderSettings",
  filename: "src/lib/followup-reminders.functions.ts"
}, (opts) => getMyReminderSettings.__executeServer(opts));
const getMyReminderSettings = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getMyReminderSettings_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  const {
    data
  } = await supabaseAdmin.from("followup_reminder_settings").select("*").eq("owner_id", userId).maybeSingle();
  return data ?? null;
});
const UpdateSchema = z.object({
  email: z.string().email().max(254).nullable().or(z.literal("").transform(() => null)),
  phone_e164: z.string().regex(/^\+[1-9]\d{6,14}$/, "Use E.164 format like +15551234567").nullable().or(z.literal("").transform(() => null)),
  email_enabled: z.boolean(),
  sms_enabled: z.boolean(),
  min_interval_minutes: z.number().int().min(15).max(1440),
  paused: z.boolean()
});
const updateMyReminderSettings_createServerFn_handler = createServerRpc({
  id: "e75b6e936630b34932918f8f769e4625477c231ae67c055dc1b67f29e78b169b",
  name: "updateMyReminderSettings",
  filename: "src/lib/followup-reminders.functions.ts"
}, (opts) => updateMyReminderSettings.__executeServer(opts));
const updateMyReminderSettings = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => UpdateSchema.parse(d)).handler(updateMyReminderSettings_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  const {
    error
  } = await supabaseAdmin.from("followup_reminder_settings").upsert({
    owner_id: userId,
    ...data
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const getRecentReminderLog_createServerFn_handler = createServerRpc({
  id: "f4387101a7753eba81e134922b1dd0f7569d20ae36538d44f97ba9f3296be286",
  name: "getRecentReminderLog",
  filename: "src/lib/followup-reminders.functions.ts"
}, (opts) => getRecentReminderLog.__executeServer(opts));
const getRecentReminderLog = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getRecentReminderLog_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  const {
    data
  } = await supabaseAdmin.from("followup_reminder_log").select("*").order("created_at", {
    ascending: false
  }).limit(100);
  return data ?? [];
});
const getMyDueCount_createServerFn_handler = createServerRpc({
  id: "dfba2289918e8d0a9e79618f60fe32178a132c436138b1781e8463c7f9d2e0d1",
  name: "getMyDueCount",
  filename: "src/lib/followup-reminders.functions.ts"
}, (opts) => getMyDueCount.__executeServer(opts));
const getMyDueCount = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getMyDueCount_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const {
    count
  } = await supabaseAdmin.from("lead_followups").select("id", {
    count: "exact",
    head: true
  }).in("status", ["new", "attempting", "connected", "no_response"]).lte("next_action_at", nowIso).eq("owner_id", userId);
  return {
    dueCount: count ?? 0
  };
});
const runReminderWorkerNow_createServerFn_handler = createServerRpc({
  id: "5c6d00db4d1761801b6ca8cf35830370ea571968e8b6ede499c71f3bd5768c72",
  name: "runReminderWorkerNow",
  filename: "src/lib/followup-reminders.functions.ts"
}, (opts) => runReminderWorkerNow.__executeServer(opts));
const runReminderWorkerNow = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(runReminderWorkerNow_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  return await processFollowupReminders();
});
export {
  getMyDueCount_createServerFn_handler,
  getMyReminderSettings_createServerFn_handler,
  getRecentReminderLog_createServerFn_handler,
  runReminderWorkerNow_createServerFn_handler,
  updateMyReminderSettings_createServerFn_handler
};
