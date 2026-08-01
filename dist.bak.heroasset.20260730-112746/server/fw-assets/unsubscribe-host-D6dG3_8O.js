import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { c as createServerFn } from "../server.js";
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
const unsubscribeHost_createServerFn_handler = createServerRpc({
  id: "a41359f47a55a453303790c2acaded78dc2455792165ce029a3ba74e5c33de59",
  name: "unsubscribeHost",
  filename: "src/routes/unsubscribe-host.tsx"
}, (opts) => unsubscribeHost.__executeServer(opts));
const unsubscribeHost = createServerFn({
  method: "POST"
}).inputValidator((d) => z.object({
  token: z.string().min(8).max(128)
}).parse(d)).handler(unsubscribeHost_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const {
    data: sub
  } = await supabaseAdmin.from("host_subscribers").select("id, email, status").eq("unsubscribe_token", data.token).maybeSingle();
  if (!sub) return {
    ok: false,
    reason: "invalid"
  };
  if (sub.status === "unsubscribed") return {
    ok: true,
    already: true,
    email: sub.email
  };
  await supabaseAdmin.from("host_subscribers").update({
    status: "unsubscribed",
    unsubscribed_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", sub.id);
  await supabaseAdmin.from("host_drip_emails").update({
    status: "cancelled"
  }).eq("subscriber_id", sub.id).eq("status", "pending");
  return {
    ok: true,
    email: sub.email
  };
});
export {
  unsubscribeHost_createServerFn_handler
};
