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
const getTopCities_createServerFn_handler = createServerRpc({
  id: "a299d5188002fd52fc20aa4ee3efab12b571e61773a00c95f2ec04990df7c25f",
  name: "getTopCities",
  filename: "src/server/top-cities.functions.ts"
}, (opts) => getTopCities.__executeServer(opts));
const getTopCities = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  limit: z.number().int().min(1).max(60).default(24)
}).parse(d ?? {})).handler(getTopCities_createServerFn_handler, async ({
  data
}) => {
  try {
    const {
      data: rows
    } = await supabaseAdmin.from("cities").select("slug, name, state_code, population").eq("is_published", true).order("population", {
      ascending: false,
      nullsFirst: false
    }).limit(data.limit);
    return (rows || []).map((r) => {
      const stateLow = r.state_code ? r.state_code.toLowerCase() : null;
      const hostAcqSlug = stateLow ? `become-a-swimming-pool-host-${r.slug}${r.slug.endsWith(`-${stateLow}`) ? "" : `-${stateLow}`}` : `become-a-swimming-pool-host-${r.slug}`;
      return {
        slug: r.slug,
        name: r.name,
        state_code: r.state_code,
        hostAcqHref: `/p/${hostAcqSlug}`
      };
    });
  } catch (err) {
    console.error("getTopCities failed:", err);
    return [];
  }
});
export {
  getTopCities_createServerFn_handler
};
