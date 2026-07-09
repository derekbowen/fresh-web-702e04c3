import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
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
const ADMIN_EMAILS = /* @__PURE__ */ new Set(["derekbowencorp@gmail.com", "derekcbowen@outlook.com", "derekcbowen@att.net"]);
const checkAdminRole_createServerFn_handler = createServerRpc({
  id: "71074beb2f431503bd63e12e77a9bb17a2f1cc767377df27e8b65871bcf78ae0",
  name: "checkAdminRole",
  filename: "src/server/admin-auth.functions.ts"
}, (opts) => checkAdminRole.__executeServer(opts));
const checkAdminRole = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(checkAdminRole_createServerFn_handler, async ({
  context
}) => {
  const ctx = context;
  let email = (ctx.claims?.email ?? "").toLowerCase();
  if (!email && ctx.supabase) {
    try {
      const {
        data
      } = await ctx.supabase.auth.getUser();
      email = (data?.user?.email ?? "").toLowerCase();
    } catch {
    }
  }
  return {
    isAdmin: ADMIN_EMAILS.has(email)
  };
});
export {
  checkAdminRole_createServerFn_handler
};
