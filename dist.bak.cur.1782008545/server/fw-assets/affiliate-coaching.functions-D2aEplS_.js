import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
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
const InputSchema = z.object({
  referral_id: z.string().uuid().nullable().optional(),
  note: z.string().trim().min(1).max(2e3),
  template_used: z.string().trim().max(64).nullable().optional()
});
const logCoachingActivity_createServerFn_handler = createServerRpc({
  id: "2e98a3d655094ebe28008e5260238bab8e3b7ff28d999f5b29adbd404a105978",
  name: "logCoachingActivity",
  filename: "src/lib/affiliate-coaching.functions.ts"
}, (opts) => logCoachingActivity.__executeServer(opts));
const logCoachingActivity = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => InputSchema.parse(d)).handler(logCoachingActivity_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const {
    userId
  } = context;
  const {
    data: aff
  } = await supabaseAdmin.from("affiliates").select("id").eq("user_id", userId).maybeSingle();
  if (!aff) throw new Error("Not an affiliate");
  if (data.referral_id) {
    const {
      data: ref
    } = await supabaseAdmin.from("affiliate_referrals").select("id").eq("id", data.referral_id).eq("affiliate_id", aff.id).maybeSingle();
    if (!ref) throw new Error("Referral not in your crew");
  }
  const {
    data: row,
    error
  } = await supabaseAdmin.from("affiliate_coaching_log").insert({
    affiliate_id: aff.id,
    referral_id: data.referral_id || null,
    note: data.note,
    template_used: data.template_used || null
  }).select("id").single();
  if (error || !row) throw error || new Error("insert failed");
  return {
    ok: true,
    id: row.id
  };
});
const listMyCoachingLog_createServerFn_handler = createServerRpc({
  id: "97a11c1acf2b2ec33d7e63d16329718b2e259bb7a2a493613550088e869994d7",
  name: "listMyCoachingLog",
  filename: "src/lib/affiliate-coaching.functions.ts"
}, (opts) => listMyCoachingLog.__executeServer(opts));
const listMyCoachingLog = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(listMyCoachingLog_createServerFn_handler, async ({
  context
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const {
    userId
  } = context;
  const {
    data: aff
  } = await supabaseAdmin.from("affiliates").select("id").eq("user_id", userId).maybeSingle();
  if (!aff) return {
    entries: []
  };
  const {
    data
  } = await supabaseAdmin.from("affiliate_coaching_log").select("id,referral_id,note,template_used,created_at").eq("affiliate_id", aff.id).order("created_at", {
    ascending: false
  }).limit(200);
  return {
    entries: data || []
  };
});
const listCoachingForAffiliate_createServerFn_handler = createServerRpc({
  id: "12babc8844acd2104b17cdecfb1cd8ebf2d7b33f9f9f94e5de894ea313c17e04",
  name: "listCoachingForAffiliate",
  filename: "src/lib/affiliate-coaching.functions.ts"
}, (opts) => listCoachingForAffiliate.__executeServer(opts));
const listCoachingForAffiliate = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  affiliate_id: z.string().uuid()
}).parse(d)).handler(listCoachingForAffiliate_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const {
    userId
  } = context;
  const {
    data: role
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!role) throw new Error("forbidden");
  const {
    data: rows
  } = await supabaseAdmin.from("affiliate_coaching_log").select("id,referral_id,note,template_used,created_at").eq("affiliate_id", data.affiliate_id).order("created_at", {
    ascending: false
  }).limit(500);
  return {
    entries: rows || []
  };
});
export {
  listCoachingForAffiliate_createServerFn_handler,
  listMyCoachingLog_createServerFn_handler,
  logCoachingActivity_createServerFn_handler
};
