import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { createHash } from "crypto";
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
const ClickSchema = z.object({
  ref_code: z.string().trim().min(1).max(40),
  landing_path: z.string().trim().max(500).optional().or(z.literal("")),
  referrer: z.string().trim().max(500).optional().or(z.literal(""))
});
const recordAffiliateClick_createServerFn_handler = createServerRpc({
  id: "f259095c7f085fb2645a4f9a4fee3775cc357340a8183dfbefd1a15b19c60bcd",
  name: "recordAffiliateClick",
  filename: "src/lib/affiliate-click.functions.ts"
}, (opts) => recordAffiliateClick.__executeServer(opts));
const recordAffiliateClick = createServerFn({
  method: "POST"
}).inputValidator((d) => ClickSchema.parse(d)).handler(recordAffiliateClick_createServerFn_handler, async ({
  data
}) => {
  try {
    const {
      supabaseAdmin
    } = await import("./client.server-D5ro3rAQ.js");
    const {
      getRequestHeader,
      getRequestIP
    } = await import("./server-C1PkAwMe.js");
    const {
      data: aff
    } = await supabaseAdmin.from("affiliates").select("id, status").eq("code", data.ref_code).maybeSingle();
    const ua = (getRequestHeader("user-agent") || "").slice(0, 500);
    const ip = getRequestIP({
      xForwardedFor: true
    }) || "";
    const ip_hash = ip ? createHash("sha256").update(ip).digest("hex").slice(0, 32) : null;
    await supabaseAdmin.from("affiliate_clicks").insert({
      affiliate_id: aff?.id ?? null,
      ref_code: data.ref_code,
      landing_path: data.landing_path || null,
      referrer: data.referrer || null,
      ip_hash,
      ua
    });
    return {
      ok: true
    };
  } catch (e) {
    console.error("[affiliate-click] failed", e);
    return {
      ok: false
    };
  }
});
export {
  recordAffiliateClick_createServerFn_handler
};
