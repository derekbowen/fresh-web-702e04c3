import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { c as cityForContentPage } from "./city-slug-Bqls2qOy.js";
import { r as resolveCityRow } from "./cities.functions-XBYRqf13.js";
import { c as createServerFn } from "../server.js";
import "@supabase/supabase-js";
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
const getNearbyCitiesForPage_createServerFn_handler = createServerRpc({
  id: "78b890a64751dc1fa77a1fcbd4136714e6c2205a7ea32c71ae1882b50242c20d",
  name: "getNearbyCitiesForPage",
  filename: "src/server/nearby-cities.functions.ts"
}, (opts) => getNearbyCitiesForPage.__executeServer(opts));
const getNearbyCitiesForPage = createServerFn({
  method: "GET"
}).inputValidator((data) => z.object({
  templateType: z.string().nullable(),
  slug: z.string().nullable(),
  limit: z.number().int().min(1).max(24).optional(),
  requirePathPrefix: z.string().optional()
}).parse(data)).handler(getNearbyCitiesForPage_createServerFn_handler, async ({
  data
}) => {
  const rawSlug = cityForContentPage(data.templateType, data.slug);
  if (!rawSlug) return [];
  const resolved = await resolveCityRow(rawSlug);
  const citySlug = resolved?.slug ?? rawSlug;
  const limit = data.limit ?? 6;
  const fetchLimit = data.requirePathPrefix ? Math.min(24, limit * 4) : limit;
  const {
    data: rows,
    error
  } = await supabaseAdmin.rpc("nearby_cities_by_distance", {
    _slug: citySlug,
    _limit: fetchLimit
  });
  if (error || !rows) return [];
  const cities = rows.map((r) => ({
    slug: String(r.out_slug),
    name: String(r.out_name),
    state: r.out_state ?? null,
    state_code: r.out_state_code ?? null,
    distance_km: r.out_distance_km == null ? null : Number(r.out_distance_km)
  }));
  if (!data.requirePathPrefix) return cities.slice(0, limit);
  const prefix = data.requirePathPrefix;
  const candidates = [];
  for (const c of cities) {
    const stateLow = c.state_code ? c.state_code.toLowerCase() : null;
    const base = `/p/${prefix}${c.slug}`;
    candidates.push(base);
    if (stateLow && !c.slug.endsWith(`-${stateLow}`)) {
      candidates.push(`${base}-${stateLow}`);
    }
  }
  const {
    data: existingRows
  } = await supabaseAdmin.from("content_pages").select("url_path").eq("status", "published").in("url_path", candidates);
  const existing = new Set((existingRows ?? []).map((r) => r.url_path));
  const out = [];
  for (const c of cities) {
    const stateLow = c.state_code ? c.state_code.toLowerCase() : null;
    const base = `${prefix}${c.slug}`;
    const withState = stateLow && !c.slug.endsWith(`-${stateLow}`) ? `${base}-${stateLow}` : null;
    let linkSlug = null;
    if (existing.has(`/p/${base}`)) linkSlug = base;
    else if (withState && existing.has(`/p/${withState}`)) linkSlug = withState;
    if (linkSlug) {
      out.push({
        ...c,
        linkSlug
      });
      if (out.length >= limit) break;
    }
  }
  return out;
});
export {
  getNearbyCitiesForPage_createServerFn_handler
};
