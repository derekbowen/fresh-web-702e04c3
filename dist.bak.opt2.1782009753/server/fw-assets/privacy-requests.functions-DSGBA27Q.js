import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
import { c as createServerFn, g as getRequestHeader } from "../server.js";
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
const RequestTypes = ["access", "delete", "correct", "portability", "opt_out_sale_share", "limit_sensitive", "appeal", "other"];
const SubmitSchema = z.object({
  requestType: z.enum(RequestTypes),
  email: z.string().trim().email().max(255),
  fullName: z.string().trim().max(120).optional().nullable(),
  stateCode: z.string().trim().length(2).optional().nullable(),
  details: z.string().trim().max(4e3).optional().nullable(),
  sourceUrl: z.string().trim().max(500).optional().nullable()
});
const submitPrivacyRequest_createServerFn_handler = createServerRpc({
  id: "feb9d6d6d0a9520db9c0b2c53eca1a71d517f8298732c0f448b19bad1cd8a0f8",
  name: "submitPrivacyRequest",
  filename: "src/server/privacy-requests.functions.ts"
}, (opts) => submitPrivacyRequest.__executeServer(opts));
const submitPrivacyRequest = createServerFn({
  method: "POST"
}).inputValidator((data) => SubmitSchema.parse(data)).handler(submitPrivacyRequest_createServerFn_handler, async ({
  data
}) => {
  const gpc = (getRequestHeader("Sec-GPC") || "").toString() === "1";
  const ua = (getRequestHeader("user-agent") || "").toString().slice(0, 400);
  const {
    error
  } = await supabaseAdmin.from("privacy_requests").insert({
    request_type: data.requestType,
    email: data.email,
    full_name: data.fullName || null,
    state_code: data.stateCode || null,
    details: data.details || null,
    source_url: data.sourceUrl || null,
    user_agent: ua,
    gpc_signal: gpc
  });
  if (error) throw new Error(error.message);
  return {
    ok: true,
    gpcDetected: gpc
  };
});
const listPrivacyRequests_createServerFn_handler = createServerRpc({
  id: "e725aa6616da92e590420aff75c6c1119541f9a84cf744634140206e9fc4740c",
  name: "listPrivacyRequests",
  filename: "src/server/privacy-requests.functions.ts"
}, (opts) => listPrivacyRequests.__executeServer(opts));
const listPrivacyRequests = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listPrivacyRequests_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  const {
    data: roleRow
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!roleRow) throw new Error("Forbidden");
  const {
    data,
    error
  } = await supabaseAdmin.from("privacy_requests").select("*").order("created_at", {
    ascending: false
  }).limit(500);
  if (error) throw new Error(error.message);
  return {
    rows: data ?? []
  };
});
export {
  listPrivacyRequests_createServerFn_handler,
  submitPrivacyRequest_createServerFn_handler
};
