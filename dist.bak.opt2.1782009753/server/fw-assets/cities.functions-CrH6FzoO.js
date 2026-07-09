import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
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
const SELECT_COLS = "slug, name, state, state_code, description, latitude, longitude, hero_image_url";
const US_STATES = /* @__PURE__ */ new Set(["al", "ak", "az", "ar", "ca", "co", "ct", "de", "fl", "ga", "hi", "id", "il", "in", "ia", "ks", "ky", "la", "me", "md", "ma", "mi", "mn", "ms", "mo", "mt", "ne", "nv", "nh", "nj", "nm", "ny", "nc", "nd", "oh", "ok", "or", "pa", "ri", "sc", "sd", "tn", "tx", "ut", "vt", "va", "wa", "wv", "wi", "wy", "dc"]);
function splitStateSuffix(slug) {
  const m = slug.match(/^(.+)-([a-z]{2})$/);
  if (!m) return null;
  if (!US_STATES.has(m[2])) return null;
  return {
    base: m[1],
    state: m[2].toUpperCase()
  };
}
async function resolveCityRow(slug) {
  const sb = supabaseAdmin;
  {
    const {
      data: row
    } = await sb.from("cities").select(SELECT_COLS).eq("slug", slug).eq("is_published", true).maybeSingle();
    if (row) return row;
  }
  const split = splitStateSuffix(slug);
  if (!split) return null;
  {
    const {
      data: row
    } = await sb.from("cities").select(SELECT_COLS).eq("slug", split.base).eq("state_code", split.state).eq("is_published", true).maybeSingle();
    if (row) return row;
  }
  const name = split.base.split("-").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  {
    const {
      data: row
    } = await sb.from("cities").select(SELECT_COLS).ilike("name", name).eq("state_code", split.state).eq("is_published", true).maybeSingle();
    if (row) return row;
  }
  return null;
}
const getCityBySlug_createServerFn_handler = createServerRpc({
  id: "f78c68b3168c5b0a9ba9b7f9bf7233486108d2ebbe6730d4d5777720feb6416f",
  name: "getCityBySlug",
  filename: "src/server/cities.functions.ts"
}, (opts) => getCityBySlug.__executeServer(opts));
const getCityBySlug = createServerFn({
  method: "GET"
}).inputValidator((data) => z.object({
  slug: z.string().min(1)
}).parse(data)).handler(getCityBySlug_createServerFn_handler, async ({
  data
}) => {
  try {
    return await resolveCityRow(data.slug);
  } catch {
    return null;
  }
});
export {
  getCityBySlug_createServerFn_handler
};
