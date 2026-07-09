import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { r as resolveCityRow } from "./cities.functions-DKA5O9eJ.js";
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
const SELECT = "id, bucket, title, url, publisher, key_fact";
async function loadCitySources(rawSlug) {
  let lookupSlug = rawSlug;
  try {
    const row = await resolveCityRow(rawSlug);
    if (row?.slug) lookupSlug = row.slug;
  } catch {
  }
  const {
    data,
    error
  } = await supabaseAdmin.from("city_sources").select(SELECT).eq("city_slug", lookupSlug).order("bucket", {
    ascending: true
  });
  if (error || !data) return [];
  return data;
}
const getCitySources_createServerFn_handler = createServerRpc({
  id: "938eb8f8e10b36adf2cedd77488d0ef03e85b4a35ad99c31f79fdc76b5f81397",
  name: "getCitySources",
  filename: "src/server/city-sources.functions.ts"
}, (opts) => getCitySources.__executeServer(opts));
const getCitySources = createServerFn({
  method: "GET"
}).inputValidator((data) => z.object({
  slug: z.string().min(1)
}).parse(data)).handler(getCitySources_createServerFn_handler, async ({
  data
}) => {
  try {
    return await loadCitySources(data.slug);
  } catch {
    return [];
  }
});
export {
  getCitySources_createServerFn_handler
};
