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
const listAffiliatesAdmin_createServerFn_handler = createServerRpc({
  id: "707d9fcbf0eebecad1123d43d393104954b187e2951258db1439eba92d63b0c4",
  name: "listAffiliatesAdmin",
  filename: "src/lib/affiliate-admin.functions.ts"
}, (opts) => listAffiliatesAdmin.__executeServer(opts));
const listAffiliatesAdmin = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  status: z.enum(["all", "pending", "approved", "rejected", "paused"]).optional(),
  sort: z.enum(["recent", "gmv_30d", "approved_cents"]).optional()
}).parse(d ?? {})).handler(listAffiliatesAdmin_createServerFn_handler, async ({
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
  let q = supabaseAdmin.from("affiliates").select("id,code,full_name,email,status,tier,tier_override,user_id,created_at").order("created_at", {
    ascending: false
  }).limit(500);
  if (data.status && data.status !== "all") q = q.eq("status", data.status);
  const {
    data: affs,
    error
  } = await q;
  if (error) throw error;
  const ids = (affs || []).map((a) => a.id);
  const since30 = new Date(Date.now() - 30 * 864e5).toISOString();
  const activeCutoff = new Date(Date.now() - 60 * 864e5).toISOString();
  const [refsAgg, commAgg] = await Promise.all([ids.length ? supabaseAdmin.from("affiliate_referrals").select("affiliate_id,completed_bookings_count,last_booking_at").in("affiliate_id", ids) : Promise.resolve({
    data: []
  }), ids.length ? supabaseAdmin.from("affiliate_commissions").select("affiliate_id,commission_cents,booking_gross_cents,status,kind,booking_date").in("affiliate_id", ids) : Promise.resolve({
    data: []
  })]);
  const refCounts = /* @__PURE__ */ new Map();
  const activeCounts = /* @__PURE__ */ new Map();
  for (const r of refsAgg.data || []) {
    refCounts.set(r.affiliate_id, (refCounts.get(r.affiliate_id) || 0) + 1);
    if ((r.completed_bookings_count ?? 0) >= 3 && r.last_booking_at && r.last_booking_at >= activeCutoff) {
      activeCounts.set(r.affiliate_id, (activeCounts.get(r.affiliate_id) || 0) + 1);
    }
  }
  const totals = /* @__PURE__ */ new Map();
  for (const c of commAgg.data || []) {
    const t = totals.get(c.affiliate_id) || {
      p: 0,
      a: 0,
      pd: 0,
      gmv30: 0
    };
    if (c.status === "pending") t.p += c.commission_cents;
    else if (c.status === "approved") t.a += c.commission_cents;
    else if (c.status === "paid") t.pd += c.commission_cents;
    if (c.kind === "recurring" && c.booking_date >= since30) t.gmv30 += c.booking_gross_cents || 0;
    totals.set(c.affiliate_id, t);
  }
  const rows = (affs || []).map((a) => {
    const t = totals.get(a.id) || {
      p: 0,
      a: 0,
      pd: 0,
      gmv30: 0
    };
    return {
      ...a,
      tier: a.tier || "starter",
      tier_override: !!a.tier_override,
      referral_count: refCounts.get(a.id) || 0,
      active_host_count: activeCounts.get(a.id) || 0,
      gmv_30d_cents: t.gmv30,
      pending_cents: t.p,
      approved_cents: t.a,
      paid_cents: t.pd
    };
  });
  if (data.sort === "gmv_30d") rows.sort((a, b) => b.gmv_30d_cents - a.gmv_30d_cents);
  else if (data.sort === "approved_cents") rows.sort((a, b) => b.approved_cents - a.approved_cents);
  return {
    rows
  };
});
const setAffiliateStatus_createServerFn_handler = createServerRpc({
  id: "1136c1e2a3e5c7fa3adc5c91c42e855af7e628e115e74a668a604fd0ddc6e778",
  name: "setAffiliateStatus",
  filename: "src/lib/affiliate-admin.functions.ts"
}, (opts) => setAffiliateStatus.__executeServer(opts));
const setAffiliateStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected", "paused"])
}).parse(d)).handler(setAffiliateStatus_createServerFn_handler, async ({
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
  const patch = {
    status: data.status,
    ...data.status === "approved" ? {
      approved_at: (/* @__PURE__ */ new Date()).toISOString(),
      approved_by: userId
    } : {}
  };
  const {
    error
  } = await supabaseAdmin.from("affiliates").update(patch).eq("id", data.id);
  if (error) throw error;
  return {
    ok: true
  };
});
const linkHostToAffiliate_createServerFn_handler = createServerRpc({
  id: "1ec90cb8fc6c7e8ee3c93cf145372313119e4042db1a3f8b8e63b5abbef9b8bc",
  name: "linkHostToAffiliate",
  filename: "src/lib/affiliate-admin.functions.ts"
}, (opts) => linkHostToAffiliate.__executeServer(opts));
const linkHostToAffiliate = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  affiliate_id: z.string().uuid(),
  sharetribe_user_id: z.string().trim().min(1).max(64),
  email_seen: z.string().email().max(255).optional().or(z.literal("")),
  display_name: z.string().trim().max(255).optional().or(z.literal(""))
}).parse(d)).handler(linkHostToAffiliate_createServerFn_handler, async ({
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
  } = await supabaseAdmin.from("affiliate_referrals").upsert({
    affiliate_id: data.affiliate_id,
    sharetribe_user_id: data.sharetribe_user_id,
    email_seen: data.email_seen || null,
    display_name: data.display_name || null,
    attribution_source: "manual_admin"
  }, {
    onConflict: "sharetribe_user_id"
  });
  if (error) throw error;
  return {
    ok: true
  };
});
const createAffiliatePayout_createServerFn_handler = createServerRpc({
  id: "33b2f4f724d94bdcc795607b98693af1b5cb518577c22521524c40261b1302b2",
  name: "createAffiliatePayout",
  filename: "src/lib/affiliate-admin.functions.ts"
}, (opts) => createAffiliatePayout.__executeServer(opts));
const createAffiliatePayout = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  affiliate_id: z.string().uuid(),
  method: z.string().trim().max(40),
  reference: z.string().trim().max(255).optional().or(z.literal("")),
  notes: z.string().trim().max(1e3).optional().or(z.literal(""))
}).parse(d)).handler(createAffiliatePayout_createServerFn_handler, async ({
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
    data: pending
  } = await supabaseAdmin.from("affiliate_commissions").select("id,commission_cents,booking_date").eq("affiliate_id", data.affiliate_id).eq("status", "approved");
  const list = pending || [];
  if (!list.length) return {
    ok: true,
    count: 0,
    total_cents: 0
  };
  const total = list.reduce((s, c) => s + (c.commission_cents || 0), 0);
  const dates = list.map((c) => c.booking_date).sort();
  const period_start = dates[0]?.slice(0, 10) ?? null;
  const period_end = dates[dates.length - 1]?.slice(0, 10) ?? null;
  const {
    data: payout,
    error: payErr
  } = await supabaseAdmin.from("affiliate_payouts").insert({
    affiliate_id: data.affiliate_id,
    method: data.method,
    reference: data.reference || null,
    notes: data.notes || null,
    total_cents: total,
    period_start,
    period_end,
    paid_by: userId
  }).select("id").single();
  if (payErr || !payout) throw payErr || new Error("payout insert failed");
  const ids = list.map((c) => c.id);
  const {
    error: updErr
  } = await supabaseAdmin.from("affiliate_commissions").update({
    status: "paid",
    payout_id: payout.id
  }).in("id", ids);
  if (updErr) throw updErr;
  return {
    ok: true,
    payout_id: payout.id,
    total_cents: total,
    count: list.length
  };
});
const reverseCommission_createServerFn_handler = createServerRpc({
  id: "bcfc1ff4d73b39006d25b11e6bfd943ef1c122364946cac1b2d546c8a9293c7b",
  name: "reverseCommission",
  filename: "src/lib/affiliate-admin.functions.ts"
}, (opts) => reverseCommission.__executeServer(opts));
const reverseCommission = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(reverseCommission_createServerFn_handler, async ({
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
  } = await supabaseAdmin.from("affiliate_commissions").update({
    status: "reversed"
  }).eq("id", data.id);
  if (error) throw error;
  return {
    ok: true
  };
});
export {
  createAffiliatePayout_createServerFn_handler,
  linkHostToAffiliate_createServerFn_handler,
  listAffiliatesAdmin_createServerFn_handler,
  reverseCommission_createServerFn_handler,
  setAffiliateStatus_createServerFn_handler
};
