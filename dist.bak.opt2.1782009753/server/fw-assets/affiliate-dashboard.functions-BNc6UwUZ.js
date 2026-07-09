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
const DORMANT_DAYS = 60;
const LEAD_ACTIVE_HOSTS = 5;
const CAPTAIN_30D_GMV_CENTS = 1e6;
function hostStatus(r) {
  const now = Date.now();
  if (r.last_booking_at) {
    const ageDays = (now - new Date(r.last_booking_at).getTime()) / 864e5;
    if (ageDays > DORMANT_DAYS) return "dormant";
    if (r.recurring_unlocked_at) return "active";
    return "warming";
  }
  return "new";
}
const getAffiliateDashboard_createServerFn_handler = createServerRpc({
  id: "86168ccdee1dbdef8bdf4c447f92da1b1dde0709bb182a5f1e3421609b6e7ae5",
  name: "getAffiliateDashboard",
  filename: "src/lib/affiliate-dashboard.functions.ts"
}, (opts) => getAffiliateDashboard.__executeServer(opts));
const getAffiliateDashboard = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(getAffiliateDashboard_createServerFn_handler, async ({
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
  } = await supabaseAdmin.from("affiliates").select("id,code,status,tier,full_name,email,payout_method,payout_details").eq("user_id", userId).maybeSingle();
  const empty = {
    affiliate: aff ? {
      ...aff,
      tier: aff.tier || "starter",
      payout_details: aff.payout_details ?? {}
    } : null,
    totals: {
      clicks: 0,
      referred_hosts: 0,
      active_hosts: 0,
      pending_cents: 0,
      approved_cents: 0,
      paid_cents: 0,
      activation_bonus_cents: 0,
      recurring_cents: 0,
      gmv_30d_cents: 0
    },
    tier_progress: {
      next: "lead",
      active_hosts_current: 0,
      active_hosts_required: LEAD_ACTIVE_HOSTS,
      gmv30_current_cents: 0,
      gmv30_required_cents: CAPTAIN_30D_GMV_CENTS
    },
    crew: [],
    commissions: [],
    payouts: []
  };
  if (!aff) return empty;
  const since30 = new Date(Date.now() - 30 * 864e5).toISOString();
  const [clicksRes, refsRes, commRes, paysRes] = await Promise.all([supabaseAdmin.from("affiliate_clicks").select("id", {
    count: "exact",
    head: true
  }).eq("affiliate_id", aff.id), supabaseAdmin.from("affiliate_referrals").select("id,display_name,email_seen,attributed_at,first_booking_at,last_booking_at,completed_bookings_count,activation_paid_at,recurring_unlocked_at,total_gross_cents").eq("affiliate_id", aff.id).order("attributed_at", {
    ascending: false
  }).limit(200), supabaseAdmin.from("affiliate_commissions").select("id,referral_id,listing_title,booking_gross_cents,commission_cents,currency,booking_date,status,kind").eq("affiliate_id", aff.id).order("booking_date", {
    ascending: false
  }).limit(500), supabaseAdmin.from("affiliate_payouts").select("id,total_cents,method,reference,paid_at").eq("affiliate_id", aff.id).order("paid_at", {
    ascending: false
  }).limit(50)]);
  const commissions = commRes.data || [];
  const earnedByRef = /* @__PURE__ */ new Map();
  for (const c of commissions) {
    earnedByRef.set(c.referral_id, (earnedByRef.get(c.referral_id) || 0) + (c.commission_cents || 0));
  }
  const crew = (refsRes.data || []).map((r) => ({
    id: r.id,
    display_name: r.display_name,
    email_seen: r.email_seen,
    attributed_at: r.attributed_at,
    first_booking_at: r.first_booking_at,
    last_booking_at: r.last_booking_at,
    completed_bookings_count: r.completed_bookings_count ?? 0,
    activation_paid_at: r.activation_paid_at,
    recurring_unlocked_at: r.recurring_unlocked_at,
    total_gross_cents: r.total_gross_cents ?? 0,
    total_earned_cents: earnedByRef.get(r.id) || 0,
    status: hostStatus(r)
  }));
  const activeHosts = crew.filter((c) => c.status === "active").length;
  const gmv30 = commissions.filter((c) => c.booking_date >= since30 && c.kind === "recurring").reduce((s, c) => s + (c.booking_gross_cents || 0), 0);
  const sum = (status) => commissions.filter((c) => c.status === status).reduce((s, c) => s + (c.commission_cents || 0), 0);
  const sumKind = (k) => commissions.filter((c) => c.kind === k).reduce((s, c) => s + (c.commission_cents || 0), 0);
  const tier = aff.tier || "starter";
  const nextTier = tier === "starter" ? "lead" : tier === "lead" ? "captain" : null;
  return {
    affiliate: {
      ...aff,
      tier,
      payout_details: aff.payout_details ?? {}
    },
    totals: {
      clicks: clicksRes.count || 0,
      referred_hosts: crew.length,
      active_hosts: activeHosts,
      pending_cents: sum("pending"),
      approved_cents: sum("approved"),
      paid_cents: sum("paid"),
      activation_bonus_cents: sumKind("activation_bonus"),
      recurring_cents: sumKind("recurring"),
      gmv_30d_cents: gmv30
    },
    tier_progress: {
      next: nextTier,
      active_hosts_current: activeHosts,
      active_hosts_required: LEAD_ACTIVE_HOSTS,
      gmv30_current_cents: gmv30,
      gmv30_required_cents: CAPTAIN_30D_GMV_CENTS
    },
    crew,
    commissions: commissions.map((c) => ({
      id: c.id,
      listing_title: c.listing_title,
      booking_gross_cents: c.booking_gross_cents,
      commission_cents: c.commission_cents,
      currency: c.currency,
      booking_date: c.booking_date,
      status: c.status,
      kind: c.kind
    })),
    payouts: paysRes.data || []
  };
});
const PayoutMethodSchema = z.object({
  payout_method: z.enum(["paypal", "venmo", "ach", "check"]),
  payout_details: z.record(z.string(), z.string().max(500))
});
const updateMyPayoutMethod_createServerFn_handler = createServerRpc({
  id: "3bf8803c3fa924d600291acba2efb5c3f4a9d72a5064b455e273f1489467657f",
  name: "updateMyPayoutMethod",
  filename: "src/lib/affiliate-dashboard.functions.ts"
}, (opts) => updateMyPayoutMethod.__executeServer(opts));
const updateMyPayoutMethod = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => PayoutMethodSchema.parse(d)).handler(updateMyPayoutMethod_createServerFn_handler, async ({
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
    error
  } = await supabaseAdmin.from("affiliates").update({
    payout_method: data.payout_method,
    payout_details: data.payout_details
  }).eq("user_id", userId);
  if (error) {
    console.error("[affiliate-payout-method] failed", error);
    return {
      ok: false
    };
  }
  return {
    ok: true
  };
});
export {
  getAffiliateDashboard_createServerFn_handler,
  updateMyPayoutMethod_createServerFn_handler
};
