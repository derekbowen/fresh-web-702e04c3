import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
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
const LEAD_ACTIVE_HOSTS = 5;
const CAPTAIN_30D_GMV_CENTS = 1e6;
const ACTIVE_WINDOW_DAYS = 60;
async function recomputeAffiliateTier(affiliateId) {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const {
    data: aff
  } = await supabaseAdmin.from("affiliates").select("id,tier,tier_override").eq("id", affiliateId).maybeSingle();
  if (!aff) return "starter";
  if (aff.tier_override) return aff.tier;
  const activeCutoff = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 864e5).toISOString();
  const {
    data: refs
  } = await supabaseAdmin.from("affiliate_referrals").select("id,completed_bookings_count,last_booking_at,total_gross_cents").eq("affiliate_id", affiliateId);
  const activeHosts = (refs || []).filter((r) => (r.completed_bookings_count ?? 0) >= 3 && r.last_booking_at && r.last_booking_at >= activeCutoff).length;
  const since30 = new Date(Date.now() - 30 * 864e5).toISOString();
  const {
    data: recent
  } = await supabaseAdmin.from("affiliate_commissions").select("booking_gross_cents,kind").eq("affiliate_id", affiliateId).eq("kind", "recurring").gte("booking_date", since30);
  const gmv30 = (recent || []).reduce((s, c) => s + (c.booking_gross_cents || 0), 0);
  let newTier = "starter";
  if (activeHosts >= LEAD_ACTIVE_HOSTS) newTier = "lead";
  if (newTier === "lead" && gmv30 >= CAPTAIN_30D_GMV_CENTS) newTier = "captain";
  if (newTier !== aff.tier) {
    await supabaseAdmin.from("affiliates").update({
      tier: newTier,
      tier_set_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", affiliateId);
  }
  return newTier;
}
const setAffiliateTierOverride_createServerFn_handler = createServerRpc({
  id: "2d8388ffca0b3f985380529ec4df68811129eddbadb29f9c36c72e0da54b3cc4",
  name: "setAffiliateTierOverride",
  filename: "src/lib/affiliate-tier.functions.ts"
}, (opts) => setAffiliateTierOverride.__executeServer(opts));
const setAffiliateTierOverride = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  affiliate_id: z.string().uuid(),
  tier: z.enum(["starter", "lead", "captain"]),
  override: z.boolean()
}).parse(d)).handler(setAffiliateTierOverride_createServerFn_handler, async ({
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
  await supabaseAdmin.from("affiliates").update({
    tier: data.tier,
    tier_override: data.override,
    tier_set_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", data.affiliate_id);
  if (!data.override) {
    const recomputed = await recomputeAffiliateTier(data.affiliate_id);
    return {
      ok: true,
      tier: recomputed
    };
  }
  return {
    ok: true,
    tier: data.tier
  };
});
export {
  setAffiliateTierOverride_createServerFn_handler
};
