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
const unsubscribeRenter_createServerFn_handler = createServerRpc({
  id: "cf9c28fe0ebd74187307812640274bc1bc7e7ed788525f83a9f2f1c51dea67e7",
  name: "unsubscribeRenter",
  filename: "src/routes/unsubscribe-renter.tsx"
}, (opts) => unsubscribeRenter.__executeServer(opts));
const unsubscribeRenter = createServerFn({
  method: "POST"
}).inputValidator((d) => z.object({
  token: z.string().min(8).max(128)
}).parse(d)).handler(unsubscribeRenter_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const {
    data: sub
  } = await supabaseAdmin.from("renter_subscribers").select("id, email, status").eq("unsubscribe_token", data.token).maybeSingle();
  if (!sub) return {
    ok: false,
    reason: "invalid"
  };
  if (sub.status === "unsubscribed") return {
    ok: true,
    already: true,
    email: sub.email
  };
  await supabaseAdmin.from("renter_subscribers").update({
    status: "unsubscribed"
  }).eq("id", sub.id);
  await supabaseAdmin.from("renter_emails").update({
    status: "cancelled"
  }).eq("subscriber_id", sub.id).eq("status", "pending");
  return {
    ok: true,
    email: sub.email
  };
});
export {
  unsubscribeRenter_createServerFn_handler
};
