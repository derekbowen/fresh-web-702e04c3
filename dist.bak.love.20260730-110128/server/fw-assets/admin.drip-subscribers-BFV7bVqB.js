import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { r as requireSupabaseAuth } from "./auth-middleware-Bd-cw3tB.js";
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
async function requireAdmin(userId) {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const {
    data: role
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!role) throw new Error("Forbidden");
}
function tableFor(kind) {
  return kind === "host" ? "host_subscribers" : "renter_subscribers";
}
const fetchSubs_createServerFn_handler = createServerRpc({
  id: "459e0bd50d3ce0d0a627c617ce8c0cb057f785c693a37b4f12037d719b2cefb1",
  name: "fetchSubs",
  filename: "src/routes/admin.drip-subscribers.tsx"
}, (opts) => fetchSubs.__executeServer(opts));
const fetchSubs = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(fetchSubs_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const table = tableFor(data.kind);
  let q = supabaseAdmin.from(table).select("id, email, name, status, sequence_scheduled, unsubscribed_at, created_at", {
    count: "exact"
  }).order("created_at", {
    ascending: false
  }).limit(data.limit ?? 100);
  if (data.status !== "all") q = q.eq("status", data.status);
  if (data.search.trim()) q = q.ilike("email", `%${data.search.trim()}%`);
  const {
    data: rows,
    count
  } = await q;
  const counts = {
    active: 0,
    paused: 0,
    unsubscribed: 0
  };
  for (const k of Object.keys(counts)) {
    const {
      count: c
    } = await supabaseAdmin.from(table).select("*", {
      count: "exact",
      head: true
    }).eq("status", k);
    counts[k] = c ?? 0;
  }
  return {
    rows: rows ?? [],
    total: count ?? 0,
    counts
  };
});
const updateStatus_createServerFn_handler = createServerRpc({
  id: "7928dadb38fd9bbecad4c57ba3ad924c5b97be7d77d5fec49a51f964d928a69a",
  name: "updateStatus",
  filename: "src/routes/admin.drip-subscribers.tsx"
}, (opts) => updateStatus.__executeServer(opts));
const updateStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(updateStatus_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const patch = {
    status: data.status
  };
  if (data.status === "unsubscribed") patch.unsubscribed_at = (/* @__PURE__ */ new Date()).toISOString();
  if (data.status === "active") patch.unsubscribed_at = null;
  const {
    error
  } = await supabaseAdmin.from(tableFor(data.kind)).update(patch).eq("id", data.id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const bulkUpdate_createServerFn_handler = createServerRpc({
  id: "e0211a9d106b99a30402bad62409cd3c4bea284d35c8e29c4d46d23462c9f376",
  name: "bulkUpdate",
  filename: "src/routes/admin.drip-subscribers.tsx"
}, (opts) => bulkUpdate.__executeServer(opts));
const bulkUpdate = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(bulkUpdate_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  if (data.ids.length === 0) return {
    ok: true,
    updated: 0
  };
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const patch = {
    status: data.status
  };
  if (data.status === "unsubscribed") patch.unsubscribed_at = (/* @__PURE__ */ new Date()).toISOString();
  if (data.status === "active") patch.unsubscribed_at = null;
  const {
    error
  } = await supabaseAdmin.from(tableFor(data.kind)).update(patch).in("id", data.ids);
  if (error) throw new Error(error.message);
  return {
    ok: true,
    updated: data.ids.length
  };
});
export {
  bulkUpdate_createServerFn_handler,
  fetchSubs_createServerFn_handler,
  updateStatus_createServerFn_handler
};
