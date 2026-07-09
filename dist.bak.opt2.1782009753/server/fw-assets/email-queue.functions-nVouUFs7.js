import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
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
const listQueuedEmails_createServerFn_handler = createServerRpc({
  id: "d1f6d9d80aa685de7a58e391a2f9844c5fbccdefb29a723cdd4f48b3729661a7",
  name: "listQueuedEmails",
  filename: "src/server/email-queue.functions.ts"
}, (opts) => listQueuedEmails.__executeServer(opts));
const listQueuedEmails = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listQueuedEmails_createServerFn_handler, async ({
  context
}) => {
  try {
    const {
      supabaseAdmin
    } = await import("./client.server-D5ro3rAQ.js");
    const {
      userId
    } = context;
    const {
      data: roleRow
    } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleRow) return {
      ok: false,
      emails: [],
      error: "Not authorized"
    };
    const [host, renter] = await Promise.all([supabaseAdmin.from("host_drip_emails").select("id, step, kind, subject, scheduled_at, host_subscribers!inner(email, name)").eq("status", "pending").gt("scheduled_at", (/* @__PURE__ */ new Date()).toISOString()).order("scheduled_at", {
      ascending: true
    }).limit(500), supabaseAdmin.from("renter_emails").select("id, step, kind, subject, scheduled_at, renter_subscribers!inner(email, name)").eq("status", "pending").gt("scheduled_at", (/* @__PURE__ */ new Date()).toISOString()).order("scheduled_at", {
      ascending: true
    }).limit(500)]);
    const out = [];
    for (const r of host.data ?? []) {
      out.push({
        source: "host_drip",
        id: r.id,
        email: r.host_subscribers?.email ?? "",
        name: r.host_subscribers?.name ?? null,
        step: r.step,
        kind: r.kind,
        subject: r.subject ?? null,
        scheduled_at: r.scheduled_at
      });
    }
    for (const r of renter.data ?? []) {
      out.push({
        source: "renter_drip",
        id: r.id,
        email: r.renter_subscribers?.email ?? "",
        name: r.renter_subscribers?.name ?? null,
        step: r.step,
        kind: r.kind,
        subject: r.subject ?? null,
        scheduled_at: r.scheduled_at
      });
    }
    out.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
    return {
      ok: true,
      emails: out
    };
  } catch (e) {
    return {
      ok: false,
      emails: [],
      error: e?.message ?? String(e)
    };
  }
});
export {
  listQueuedEmails_createServerFn_handler
};
