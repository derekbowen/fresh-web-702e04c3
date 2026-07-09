import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
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
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("forbidden");
}
const getSharetribeDashboard_createServerFn_handler = createServerRpc({
  id: "18fc7ec8f596387b612cbc87b727812c6aa7557c5310ec22e417151cb74cc050",
  name: "getSharetribeDashboard",
  filename: "src/lib/sharetribe-mirror-admin.functions.ts"
}, (opts) => getSharetribeDashboard.__executeServer(opts));
const getSharetribeDashboard = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(getSharetribeDashboard_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const [usersC, listingsC, txC, msgsC, alertsC, sync, recentTx, recentMsg, alerts, txWithMsg, txConfirmed] = await Promise.all([supabaseAdmin.from("st_users").select("*", {
    count: "exact",
    head: true
  }), supabaseAdmin.from("st_listings").select("*", {
    count: "exact",
    head: true
  }), supabaseAdmin.from("st_transactions").select("*", {
    count: "exact",
    head: true
  }), supabaseAdmin.from("st_messages").select("*", {
    count: "exact",
    head: true
  }), supabaseAdmin.from("st_security_alerts").select("*", {
    count: "exact",
    head: true
  }).eq("status", "open"), supabaseAdmin.from("st_sync_state").select("resource,last_synced_at,last_run_at,last_run_status,last_run_rows,last_run_error").order("resource"), supabaseAdmin.from("st_transactions").select("sharetribe_id,last_transition,state,listing_title,payin_total_cents,currency,last_transitioned_at,provider_st_id,customer_st_id").order("last_transitioned_at", {
    ascending: false,
    nullsFirst: false
  }).limit(50), supabaseAdmin.from("st_messages").select("id,sharetribe_id,transaction_st_id,sender_st_id,content,created_at_st").order("created_at_st", {
    ascending: false
  }).limit(50), supabaseAdmin.from("st_security_alerts").select("id,message_st_id,transaction_st_id,sender_st_id,category,severity,matched_terms,snippet,status,created_at").order("created_at", {
    ascending: false
  }).limit(100), supabaseAdmin.from("st_transactions").select("sharetribe_id", {
    count: "exact",
    head: true
  }).not("last_transition", "is", null), supabaseAdmin.from("st_transactions").select("sharetribe_id", {
    count: "exact",
    head: true
  }).in("state", ["confirm-payment", "complete", "reviewed"])]);
  const total = txWithMsg.count || 0;
  const confirmed = txConfirmed.count || 0;
  return {
    syncState: sync.data || [],
    counts: {
      users: usersC.count || 0,
      listings: listingsC.count || 0,
      transactions: txC.count || 0,
      messages: msgsC.count || 0,
      open_alerts: alertsC.count || 0
    },
    funnel: {
      tx_with_messages: total,
      tx_confirmed: confirmed,
      rate: total > 0 ? confirmed / total : 0
    },
    recent_transactions: recentTx.data || [],
    recent_messages: recentMsg.data || [],
    alerts: alerts.data || []
  };
});
const setAlertStatus_createServerFn_handler = createServerRpc({
  id: "4d0cd24e723ec6ba43931cce9161ed84be4f762f608196f5b4f9567de9bb6ddf",
  name: "setAlertStatus",
  filename: "src/lib/sharetribe-mirror-admin.functions.ts"
}, (opts) => setAlertStatus.__executeServer(opts));
const setAlertStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "reviewed", "dismissed", "escalated"]),
  notes: z.string().max(1e3).optional()
}).parse(d)).handler(setAlertStatus_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const {
    error
  } = await supabaseAdmin.from("st_security_alerts").update({
    status: data.status,
    notes: data.notes ?? null,
    reviewed_by: userId,
    reviewed_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", data.id);
  if (error) throw error;
  return {
    ok: true
  };
});
const triggerSharetribeSyncNow_createServerFn_handler = createServerRpc({
  id: "a58c7d9c7ff62162cf6acd63db7ec7fbab6f9ba46d2c06470835084aa6602782",
  name: "triggerSharetribeSyncNow",
  filename: "src/lib/sharetribe-mirror-admin.functions.ts"
}, (opts) => triggerSharetribeSyncNow.__executeServer(opts));
const triggerSharetribeSyncNow = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(triggerSharetribeSyncNow_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  try {
    const {
      syncSharetribeMirror
    } = await import("./sharetribe-mirror.server-D8Jwl9-L.js");
    const result = await syncSharetribeMirror();
    return {
      ok: true,
      result
    };
  } catch (e) {
    return {
      ok: false,
      error: e?.message || String(e)
    };
  }
});
export {
  getSharetribeDashboard_createServerFn_handler,
  setAlertStatus_createServerFn_handler,
  triggerSharetribeSyncNow_createServerFn_handler
};
