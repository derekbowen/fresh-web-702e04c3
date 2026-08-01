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
const InputSchema = z.object({
  days: z.number().int().min(1).max(365).default(30),
  limit: z.number().int().min(1).max(500).default(50)
});
async function assertAdmin(userId) {
  const {
    data,
    error
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error("Failed to verify admin role");
  if (!data) throw new Error("Forbidden: admin role required");
}
const getCityClickReport_createServerFn_handler = createServerRpc({
  id: "b9b6d5f3972bec018d1fab730b1717012f1308bc954ffcfd2c9aee6fb8d912e4",
  name: "getCityClickReport",
  filename: "src/server/click-report.functions.ts"
}, (opts) => getCityClickReport.__executeServer(opts));
const getCityClickReport = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => InputSchema.parse(input)).handler(getCityClickReport_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  const since = new Date(Date.now() - data.days * 24 * 60 * 60 * 1e3).toISOString();
  const {
    data: rows,
    error
  } = await supabaseAdmin.from("city_link_clicks").select("to_city_slug, visitor_hash, clicked_at").gte("clicked_at", since).order("clicked_at", {
    ascending: false
  }).limit(5e4);
  if (error) throw new Error(error.message);
  const agg = /* @__PURE__ */ new Map();
  for (const r of rows ?? []) {
    const slug = r.to_city_slug;
    const entry = agg.get(slug) ?? {
      total: 0,
      visitors: /* @__PURE__ */ new Set(),
      last: r.clicked_at
    };
    entry.total += 1;
    if (r.visitor_hash) entry.visitors.add(r.visitor_hash);
    if (r.clicked_at > entry.last) entry.last = r.clicked_at;
    agg.set(slug, entry);
  }
  const sortedSlugs = Array.from(agg.entries()).sort((a, b) => b[1].total - a[1].total).slice(0, data.limit);
  const slugs = sortedSlugs.map(([s]) => s);
  const {
    data: cities
  } = slugs.length ? await supabaseAdmin.from("cities").select("slug, name, state_code").in("slug", slugs) : {
    data: []
  };
  const cityMap = /* @__PURE__ */ new Map();
  for (const c of cities ?? []) cityMap.set(c.slug, {
    name: c.name,
    state_code: c.state_code
  });
  const result = sortedSlugs.map(([slug, v]) => ({
    to_city_slug: slug,
    city_name: cityMap.get(slug)?.name ?? null,
    state_code: cityMap.get(slug)?.state_code ?? null,
    total_clicks: v.total,
    unique_visitors: v.visitors.size,
    last_clicked_at: v.last
  }));
  return {
    rows: result,
    windowDays: data.days,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
});
export {
  getCityClickReport_createServerFn_handler
};
