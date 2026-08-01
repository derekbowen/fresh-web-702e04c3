import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
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
const EMPTY_STATS = {
  totals: {
    generated: 0,
    pending: 0,
    paused: 0,
    total: 0
  },
  pendingByTier: [],
  pausedByTier: [],
  pausedByValidator: [],
  topPausedReasons: [],
  recentInserts: [],
  recentErrors: [],
  perDay: []
};
function bucketReason(raw) {
  const s = raw.toLowerCase();
  if (s.includes("faq")) return "Missing required FAQ count";
  if (s.includes("section")) return "Missing required section";
  if (s.includes("too short") || s.includes("words, need")) return "Output too short";
  if (s.includes("internal links")) return "Missing internal links";
  if (s.includes("ai gateway") || s.includes("rate limit") || s.includes("429")) return "AI gateway error / rate limit";
  if (s.includes("timeout") || s.includes("aborted")) return "Timeout";
  if (s.includes("ai did not return")) return "Empty AI response";
  return "Other";
}
const getGenerateStats_createServerFn_handler = createServerRpc({
  id: "1048a77fafa7fe9958dacf0267ae980fd895aea9e5a03b611d64bc0f9dfb94b6",
  name: "getGenerateStats",
  filename: "src/server/generate-content-stats.functions.ts"
}, (opts) => getGenerateStats.__executeServer(opts));
const getGenerateStats = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getGenerateStats_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  const {
    data: roleRow
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!roleRow) {
    return {
      ok: false,
      ...EMPTY_STATS,
      error: "not admin"
    };
  }
  try {
    const [genCount, pendCount, pausedCount, allPending, allPaused, recentPages, recentErr] = await Promise.all([supabaseAdmin.from("content_plan").select("*", {
      count: "exact",
      head: true
    }).eq("status", "generated"), supabaseAdmin.from("content_plan").select("*", {
      count: "exact",
      head: true
    }).eq("status", "pending"), supabaseAdmin.from("content_plan").select("*", {
      count: "exact",
      head: true
    }).eq("status", "paused"), supabaseAdmin.from("content_plan").select("priority_tier").eq("status", "pending").limit(2e3), supabaseAdmin.from("content_plan").select("priority_tier,validator_version,last_error").eq("status", "paused").limit(2e3), supabaseAdmin.from("content_pages").select("slug,title,created_at").order("created_at", {
      ascending: false
    }).limit(20), supabaseAdmin.from("content_plan").select("slug,priority_tier,updated_at,last_error,attempt_count,status").in("status", ["pending", "paused"]).not("last_error", "is", null).order("updated_at", {
      ascending: false
    }).limit(15)]);
    const tally = (rows, key, fallback) => {
      const m = /* @__PURE__ */ new Map();
      for (const r of rows) {
        const v = r[key] ?? fallback;
        m.set(v, (m.get(v) ?? 0) + 1);
      }
      return Array.from(m.entries()).map(([tier, n]) => ({
        tier,
        n
      })).sort((a, b) => b.n - a.n);
    };
    const pendingByTier = tally(allPending.data ?? [], "priority_tier", "untiered");
    const pausedByTier = tally(allPaused.data ?? [], "priority_tier", "untiered");
    const pausedByValidator = tally(allPaused.data ?? [], "validator_version", "(pre-tracking)").map((r) => ({
      version: r.tier,
      n: r.n
    }));
    const reasonMap = /* @__PURE__ */ new Map();
    for (const r of allPaused.data ?? []) {
      const raw = r.last_error ?? "";
      const bucket = raw ? bucketReason(raw) : "Unknown";
      reasonMap.set(bucket, (reasonMap.get(bucket) ?? 0) + 1);
    }
    const topPausedReasons = Array.from(reasonMap.entries()).map(([reason, n]) => ({
      reason,
      n
    })).sort((a, b) => b.n - a.n).slice(0, 6);
    const since = new Date(Date.now() - 14 * 864e5).toISOString();
    const {
      data: dayRows
    } = await supabaseAdmin.from("content_pages").select("created_at").gte("created_at", since).limit(1e4);
    const dayMap = /* @__PURE__ */ new Map();
    for (const r of dayRows ?? []) {
      const d = new Date(r.created_at).toISOString().slice(0, 10);
      dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
    }
    const perDay = Array.from(dayMap.entries()).map(([day, n]) => ({
      day,
      n
    })).sort((a, b) => a.day < b.day ? 1 : -1);
    const generated = genCount.count ?? 0;
    const pending = pendCount.count ?? 0;
    const paused = pausedCount.count ?? 0;
    return {
      ok: true,
      totals: {
        generated,
        pending,
        paused,
        total: generated + pending + paused
      },
      pendingByTier,
      pausedByTier,
      pausedByValidator,
      topPausedReasons,
      recentInserts: (recentPages.data ?? []).map((r) => ({
        slug: r.slug,
        title: r.title ?? null,
        created_at: r.created_at
      })),
      recentErrors: (recentErr.data ?? []).map((r) => ({
        slug: r.slug,
        tier: r.priority_tier ?? null,
        updated_at: r.updated_at,
        error: (r.last_error ?? "").slice(0, 240),
        attempts: r.attempt_count ?? 0,
        status: r.status ?? "pending"
      })),
      perDay
    };
  } catch (e) {
    return {
      ok: false,
      ...EMPTY_STATS,
      error: e instanceof Error ? e.message : String(e)
    };
  }
});
export {
  getGenerateStats_createServerFn_handler
};
