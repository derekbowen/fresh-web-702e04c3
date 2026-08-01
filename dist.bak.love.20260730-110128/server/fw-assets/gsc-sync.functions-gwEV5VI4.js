import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-Bd-cw3tB.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { r as runGscSync, g as getGscSyncOverview } from "./gsc-sync.server-BxVUz4Yz.js";
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
const syncSchema = z.object({
  days: z.number().int().min(1).max(30).default(3),
  rowLimit: z.number().int().min(100).max(1e5).default(25e3)
});
const adminRunGscSync_createServerFn_handler = createServerRpc({
  id: "f476018b04f2d7a0f0a3163e46d30f2fc47c34eba8f4f157fc5f525b161d41ff",
  name: "adminRunGscSync",
  filename: "src/lib/gsc-sync.functions.ts"
}, (opts) => adminRunGscSync.__executeServer(opts));
const adminRunGscSync = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => syncSchema.parse(data ?? {})).handler(adminRunGscSync_createServerFn_handler, async ({
  context,
  data
}) => {
  await assertAdmin(context.userId);
  return runGscSync({
    ...data,
    triggerSource: "manual"
  });
});
const adminGetGscSyncOverview_createServerFn_handler = createServerRpc({
  id: "c7fe898fb220570bb3c24dd39ad9f69efa9eda82e05ee2b4c513ebe4b6c5b3f1",
  name: "adminGetGscSyncOverview",
  filename: "src/lib/gsc-sync.functions.ts"
}, (opts) => adminGetGscSyncOverview.__executeServer(opts));
const adminGetGscSyncOverview = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(adminGetGscSyncOverview_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  return getGscSyncOverview();
});
export {
  adminGetGscSyncOverview_createServerFn_handler,
  adminRunGscSync_createServerFn_handler
};
