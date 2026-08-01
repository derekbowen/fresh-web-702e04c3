import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
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
const Input = z.object({
  minLength: z.number().int().min(0).max(1e4).default(500),
  limit: z.number().int().min(1).max(5e3).default(1e3),
  onlyInSitemap: z.boolean().default(false)
});
const scanContentHealth_createServerFn_handler = createServerRpc({
  id: "8ed0cf74651f06db30d5a4b78b6c221c4e58f8c48a1beeb1c2d6358aa324401d",
  name: "scanContentHealth",
  filename: "src/server/content-health.functions.ts"
}, (opts) => scanContentHealth.__executeServer(opts));
const scanContentHealth = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => Input.parse(d ?? {})).handler(scanContentHealth_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const sb = supabaseAdmin;
  let q = sb.from("content_pages").select("id, url_path, slug, title, template_type, locale, in_sitemap, updated_at, body_markdown", {
    count: "exact"
  }).eq("status", "published");
  if (data.onlyInSitemap) q = q.eq("in_sitemap", true);
  const {
    data: rows,
    count
  } = await q.order("url_path", {
    ascending: true
  }).limit(1e4);
  const affected = [];
  let missing = 0, blank = 0, thin = 0;
  for (const r of rows || []) {
    const body = r.body_markdown || "";
    const len = body.trim().length;
    let reason = null;
    if (r.body_markdown === null) reason = "missing";
    else if (len === 0) reason = "blank";
    else if (len < data.minLength) reason = "thin";
    if (!reason) continue;
    if (reason === "missing") missing++;
    else if (reason === "blank") blank++;
    else thin++;
    affected.push({
      id: r.id,
      url_path: r.url_path || "",
      slug: r.slug,
      title: r.title,
      template_type: r.template_type,
      locale: r.locale || "en",
      in_sitemap: !!r.in_sitemap,
      body_len: len,
      reason,
      updated_at: r.updated_at
    });
  }
  affected.sort((a, b) => a.body_len - b.body_len || a.url_path.localeCompare(b.url_path));
  return {
    totalPublished: count || 0,
    totalAffected: affected.length,
    byReason: {
      missing,
      blank,
      thin
    },
    rows: affected.slice(0, data.limit),
    minLength: data.minLength,
    ranAt: (/* @__PURE__ */ new Date()).toISOString()
  };
});
export {
  scanContentHealth_createServerFn_handler
};
