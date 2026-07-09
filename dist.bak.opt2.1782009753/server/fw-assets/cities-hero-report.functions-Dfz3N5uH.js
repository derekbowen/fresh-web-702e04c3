import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
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
const getHeroBackfillReport_createServerFn_handler = createServerRpc({
  id: "c1dba8f5e92bc0ed980fbdb68bbaeb3c1a68efe10d7d9c4f7900968ec161cd91",
  name: "getHeroBackfillReport",
  filename: "src/server/cities-hero-report.functions.ts"
}, (opts) => getHeroBackfillReport.__executeServer(opts));
const getHeroBackfillReport = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getHeroBackfillReport_createServerFn_handler, async ({
  context
}) => {
  const {
    data: roleRow
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (!roleRow) throw new Error("Admin role required");
  const pageSize = 1e3;
  const all = [];
  for (let from = 0; ; from += pageSize) {
    const {
      data,
      error
    } = await supabaseAdmin.from("cities_hero_backfill_log").select("city_slug,status,error,source_url,ran_at").order("ran_at", {
      ascending: false
    }).range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
  }
  const bySlug = /* @__PURE__ */ new Map();
  for (const row of all) {
    let agg = bySlug.get(row.city_slug);
    if (!agg) {
      agg = {
        city_slug: row.city_slug,
        city_name: null,
        state_code: null,
        has_hero: false,
        ok: 0,
        miss: 0,
        skipped: 0,
        error: 0,
        last_status: null,
        last_error: null,
        last_source_url: null,
        last_ran_at: null
      };
      bySlug.set(row.city_slug, agg);
    }
    if (row.status === "ok") agg.ok++;
    else if (row.status === "miss") agg.miss++;
    else if (row.status === "skipped") agg.skipped++;
    else if (row.status === "error") agg.error++;
    if (!agg.last_ran_at) {
      agg.last_status = row.status;
      agg.last_error = row.error;
      agg.last_source_url = row.source_url;
      agg.last_ran_at = row.ran_at;
    }
  }
  const slugs = Array.from(bySlug.keys());
  const chunk = 500;
  for (let i = 0; i < slugs.length; i += chunk) {
    const piece = slugs.slice(i, i + chunk);
    const {
      data: cities
    } = await supabaseAdmin.from("cities").select("slug,name,state_code,hero_image_url").in("slug", piece);
    for (const c of cities ?? []) {
      const agg = bySlug.get(c.slug);
      if (!agg) continue;
      agg.city_name = c.name;
      agg.state_code = c.state_code;
      agg.has_hero = !!c.hero_image_url;
    }
  }
  const rows = Array.from(bySlug.values()).sort((a, b) => {
    const fa = a.error * 10 + a.miss * 3 + a.skipped;
    const fb = b.error * 10 + b.miss * 3 + b.skipped;
    if (fb !== fa) return fb - fa;
    return (a.city_name ?? a.city_slug).localeCompare(b.city_name ?? b.city_slug);
  });
  const totals = rows.reduce((acc, r) => {
    acc.cities++;
    acc.ok += r.ok;
    acc.miss += r.miss;
    acc.skipped += r.skipped;
    acc.error += r.error;
    if (!r.has_hero) acc.missingHero++;
    if (r.last_status && r.last_status !== "ok") acc.lastFailing++;
    return acc;
  }, {
    cities: 0,
    ok: 0,
    miss: 0,
    skipped: 0,
    error: 0,
    missingHero: 0,
    lastFailing: 0
  });
  return {
    rows,
    totals
  };
});
export {
  getHeroBackfillReport_createServerFn_handler
};
