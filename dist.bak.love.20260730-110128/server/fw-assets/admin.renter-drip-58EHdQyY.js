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
const getRenterDripStats_createServerFn_handler = createServerRpc({
  id: "64d1b9724b52363c0c9e704af2dc508be1bd0de12332f0add16958d200d0b3e5",
  name: "getRenterDripStats",
  filename: "src/routes/admin.renter-drip.tsx"
}, (opts) => getRenterDripStats.__executeServer(opts));
const getRenterDripStats = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getRenterDripStats_createServerFn_handler, async ({
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
    data: state
  }, {
    data: recent
  }, {
    data: pending
  }] = await Promise.all([supabaseAdmin.from("renter_subscribers").select("*", {
    count: "exact",
    head: true
  }), supabaseAdmin.from("renter_subscribers").select("*", {
    count: "exact",
    head: true
  }).eq("status", "active"), supabaseAdmin.from("renter_subscribers").select("*", {
    count: "exact",
    head: true
  }).eq("status", "unsubscribed"), supabaseAdmin.from("renter_drip_state").select("*").eq("id", 1).maybeSingle(), supabaseAdmin.from("renter_subscribers").select("email, name, city, state_code, zip, status, created_at").order("created_at", {
    ascending: false
  }).limit(20), supabaseAdmin.from("renter_emails").select("kind, status, scheduled_at, subject").order("scheduled_at", {
    ascending: true
  }).limit(30)]);
  return {
    counts: {
      subs: subs ?? 0,
      active: active ?? 0,
      unsubscribed: unsub ?? 0
    },
    state,
    recent: recent ?? [],
    pending: pending ?? []
  };
});
const runPollNow_createServerFn_handler = createServerRpc({
  id: "176ef6087ced490f189541f2aef8c7864c1c8160a95b0020bed18a856e5fabbc",
  name: "runPollNow",
  filename: "src/routes/admin.renter-drip.tsx"
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
    pollSharetribeRenters
  } = await import("./renter-drip.server-BojrhpHE.js");
  return await pollSharetribeRenters();
});
const runSendNow_createServerFn_handler = createServerRpc({
  id: "4e451ce5c630005e8b740159d06ae4c17becf1790a22bd7506759961fa195442",
  name: "runSendNow",
  filename: "src/routes/admin.renter-drip.tsx"
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
    sendDueEmails
  } = await import("./renter-drip.server-BojrhpHE.js");
  return await sendDueEmails(50);
});
const runBackfillAll_createServerFn_handler = createServerRpc({
  id: "28f46cc2d7c87c7f94dcfbc4c7f251e6730af076d6e5c76265185a10115056d2",
  name: "runBackfillAll",
  filename: "src/routes/admin.renter-drip.tsx"
}, (opts) => runBackfillAll.__executeServer(opts));
const runBackfillAll = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(runBackfillAll_createServerFn_handler, async ({
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
    backfillAllSharetribeRenters
  } = await import("./renter-drip.server-BojrhpHE.js");
  return await backfillAllSharetribeRenters();
});
export {
  getRenterDripStats_createServerFn_handler,
  runBackfillAll_createServerFn_handler,
  runPollNow_createServerFn_handler,
  runSendNow_createServerFn_handler
};
