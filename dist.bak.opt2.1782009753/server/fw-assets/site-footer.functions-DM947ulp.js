import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { D as DEFAULT_FOOTER } from "./site-footer-defaults-C7gHxS5b.js";
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
async function loadSiteFooter() {
  try {
    const {
      data
    } = await supabaseAdmin.from("site_footer_settings").select("*").eq("id", 1).maybeSingle();
    if (!data) return DEFAULT_FOOTER;
    const row = data;
    const arr = (v, fallback) => Array.isArray(v) && v.length > 0 ? v : fallback;
    return {
      contact_phone: row.contact_phone ?? DEFAULT_FOOTER.contact_phone,
      contact_phone_label: row.contact_phone_label ?? DEFAULT_FOOTER.contact_phone_label,
      contact_phone_hours: row.contact_phone_hours ?? DEFAULT_FOOTER.contact_phone_hours,
      contact_email: row.contact_email ?? DEFAULT_FOOTER.contact_email,
      bottom_text: row.bottom_text ?? DEFAULT_FOOTER.bottom_text,
      explore_links: arr(row.explore_links, DEFAULT_FOOTER.explore_links),
      host_links: arr(row.host_links, DEFAULT_FOOTER.host_links),
      company_links: arr(row.company_links, DEFAULT_FOOTER.company_links),
      compare_links: arr(row.compare_links, DEFAULT_FOOTER.compare_links),
      popular_markets: arr(row.popular_markets, DEFAULT_FOOTER.popular_markets),
      socials: arr(row.socials, DEFAULT_FOOTER.socials)
    };
  } catch {
    return DEFAULT_FOOTER;
  }
}
const getSiteFooter_createServerFn_handler = createServerRpc({
  id: "4f39613f620aba63963fb1552d47c9c5e3f902be3953d01389d12012cb6b73c4",
  name: "getSiteFooter",
  filename: "src/server/site-footer.functions.ts"
}, (opts) => getSiteFooter.__executeServer(opts));
const getSiteFooter = createServerFn({
  method: "GET"
}).handler(getSiteFooter_createServerFn_handler, async () => {
  return loadSiteFooter();
});
const LinkSchema = z.object({
  label: z.string().min(1).max(120),
  href: z.string().min(1).max(500)
});
const MarketSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120)
});
const SocialSchema = z.object({
  label: z.string().min(1).max(60),
  href: z.string().min(1).max(500),
  icon: z.string().min(1).max(40)
});
const UpdateSchema = z.object({
  contact_phone: z.string().max(120).nullable().or(z.literal("").transform(() => null)),
  contact_phone_label: z.string().max(120).nullable().or(z.literal("").transform(() => null)),
  contact_phone_hours: z.string().max(120).nullable().or(z.literal("").transform(() => null)),
  contact_email: z.string().max(120).nullable().or(z.literal("").transform(() => null)),
  bottom_text: z.string().max(500).nullable().or(z.literal("").transform(() => null)),
  explore_links: z.array(LinkSchema).max(50),
  host_links: z.array(LinkSchema).max(50),
  company_links: z.array(LinkSchema).max(50),
  compare_links: z.array(LinkSchema).max(50),
  popular_markets: z.array(MarketSchema).max(50),
  socials: z.array(SocialSchema).max(20)
});
async function assertAdmin(userId) {
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}
const getSiteFooterAdmin_createServerFn_handler = createServerRpc({
  id: "ef3fd02513d3cad39306d22ee2ca1c4387e0a6fa82ee660205a133ebe2ef5b5e",
  name: "getSiteFooterAdmin",
  filename: "src/server/site-footer.functions.ts"
}, (opts) => getSiteFooterAdmin.__executeServer(opts));
const getSiteFooterAdmin = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getSiteFooterAdmin_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  return loadSiteFooter();
});
const updateSiteFooter_createServerFn_handler = createServerRpc({
  id: "bf638fbaa59a45334a7e9712503d06a6415be89e7eb19f84a159bbaa6cb2c5ad",
  name: "updateSiteFooter",
  filename: "src/server/site-footer.functions.ts"
}, (opts) => updateSiteFooter.__executeServer(opts));
const updateSiteFooter = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => UpdateSchema.parse(data)).handler(updateSiteFooter_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  const {
    error
  } = await supabaseAdmin.from("site_footer_settings").upsert({
    id: 1,
    ...data
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const resetSiteFooter_createServerFn_handler = createServerRpc({
  id: "5ed86f26def732fcfd337ac51d46220d443d9b21c68d09a4c8c1b515f7b3601c",
  name: "resetSiteFooter",
  filename: "src/server/site-footer.functions.ts"
}, (opts) => resetSiteFooter.__executeServer(opts));
const resetSiteFooter = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(resetSiteFooter_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  const {
    error
  } = await supabaseAdmin.from("site_footer_settings").upsert({
    id: 1,
    ...DEFAULT_FOOTER
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
export {
  getSiteFooterAdmin_createServerFn_handler,
  getSiteFooter_createServerFn_handler,
  resetSiteFooter_createServerFn_handler,
  updateSiteFooter_createServerFn_handler
};
