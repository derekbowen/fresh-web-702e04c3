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
async function assertAdmin(userId) {
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}
const getRecentLinkHealthRuns_createServerFn_handler = createServerRpc({
  id: "961f52e15c3b37f70f67bf125b194a1e2076180aa053894db3e71c8df5b7bc33",
  name: "getRecentLinkHealthRuns",
  filename: "src/server/link-health.functions.ts"
}, (opts) => getRecentLinkHealthRuns.__executeServer(opts));
const getRecentLinkHealthRuns = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getRecentLinkHealthRuns_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const {
    data,
    error
  } = await supabaseAdmin.from("link_health_runs").select("id, ran_at, origin, checked, broken_count, ok, broken, duration_ms, source").order("ran_at", {
    ascending: false
  }).limit(30);
  if (error) {
    console.error("getRecentLinkHealthRuns failed:", error);
    return [];
  }
  return data || [];
});
export {
  getRecentLinkHealthRuns_createServerFn_handler
};
