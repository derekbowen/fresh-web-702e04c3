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
const getHostDripStats_createServerFn_handler = createServerRpc({
  id: "419f7deee03a76702e51abbc66e02377056ac5fe32a2a7913144effb4762cdd4",
  name: "getHostDripStats",
  filename: "src/routes/admin.host-drip.tsx"
}, (opts) => getHostDripStats.__executeServer(opts));
const getHostDripStats = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getHostDripStats_createServerFn_handler, async ({
  context
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const {
    userId
  } = context;
  const {
    data: role
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!role) throw new Error("Forbidden");
  const [{
    count: subs
  }, {
    count: active
  }, {
    count: unsub
  }, {
    count: sent
  }, {
    count: pending
  }, {
    count: failed
  }, {
    data: state
  }, {
    data: recent
  }, {
    data: upcoming
  }] = await Promise.all([supabaseAdmin.from("host_subscribers").select("*", {
    count: "exact",
    head: true
  }), supabaseAdmin.from("host_subscribers").select("*", {
    count: "exact",
    head: true
  }).eq("status", "active"), supabaseAdmin.from("host_subscribers").select("*", {
    count: "exact",
    head: true
  }).eq("status", "unsubscribed"), supabaseAdmin.from("host_drip_emails").select("*", {
    count: "exact",
    head: true
  }).eq("status", "sent"), supabaseAdmin.from("host_drip_emails").select("*", {
    count: "exact",
    head: true
  }).eq("status", "pending"), supabaseAdmin.from("host_drip_emails").select("*", {
    count: "exact",
    head: true
  }).eq("status", "failed"), supabaseAdmin.from("host_drip_state").select("*").eq("id", 1).maybeSingle(), supabaseAdmin.from("host_subscribers").select("email, name, status, sequence_scheduled, created_at").order("created_at", {
    ascending: false
  }).limit(25), supabaseAdmin.from("host_drip_emails").select("kind, status, scheduled_at, subject, sent_at, error").order("scheduled_at", {
    ascending: true
  }).limit(40)]);
  return {
    counts: {
      subs: subs ?? 0,
      active: active ?? 0,
      unsubscribed: unsub ?? 0,
      sent: sent ?? 0,
      pending: pending ?? 0,
      failed: failed ?? 0
    },
    state,
    recent: recent ?? [],
    upcoming: upcoming ?? []
  };
});
const runPollNow_createServerFn_handler = createServerRpc({
  id: "2f96e28ab0cab80fb423363e2fc82d7a7cd1e2b2a4032f5e6f3a78b19fa8c75d",
  name: "runPollNow",
  filename: "src/routes/admin.host-drip.tsx"
}, (opts) => runPollNow.__executeServer(opts));
const runPollNow = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(runPollNow_createServerFn_handler, async ({
  context
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const {
    userId
  } = context;
  const {
    data: role
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!role) throw new Error("Forbidden");
  const {
    pollSharetribeHosts
  } = await import("./host-drip.server-CJ5RKG29.js");
  return await pollSharetribeHosts();
});
const runSendNow_createServerFn_handler = createServerRpc({
  id: "52b7ea1eb8607930f2ec1ff76325a2262d69193f5d6b39cf7c3e048bfab8886b",
  name: "runSendNow",
  filename: "src/routes/admin.host-drip.tsx"
}, (opts) => runSendNow.__executeServer(opts));
const runSendNow = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(runSendNow_createServerFn_handler, async ({
  context
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const {
    userId
  } = context;
  const {
    data: role
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!role) throw new Error("Forbidden");
  const {
    sendDueHostEmails
  } = await import("./host-drip.server-CJ5RKG29.js");
  return await sendDueHostEmails(20);
});
const runBroadcastShareLink_createServerFn_handler = createServerRpc({
  id: "1641fc6aaa81dd89297aae0b6c529dec914ca7858d43d0f98d6c0f5dd16003a8",
  name: "runBroadcastShareLink",
  filename: "src/routes/admin.host-drip.tsx"
}, (opts) => runBroadcastShareLink.__executeServer(opts));
const runBroadcastShareLink = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(runBroadcastShareLink_createServerFn_handler, async ({
  context
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const {
    userId
  } = context;
  const {
    data: role
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!role) throw new Error("Forbidden");
  const {
    queueBroadcast
  } = await import("./host-drip.server-CJ5RKG29.js");
  return await queueBroadcast("15-share-link-profits");
});
export {
  getHostDripStats_createServerFn_handler,
  runBroadcastShareLink_createServerFn_handler,
  runPollNow_createServerFn_handler,
  runSendNow_createServerFn_handler
};
