import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
import { A as ACADEMY_SLUGS } from "./academy-config-B5vgptOj.js";
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
const SLUG_LABELS = {
  "learning-academy": "Browse 100+ free courses (CTA)",
  "host-training-academy": "Earn certifications (CTA)",
  "elearning-academy-tax-deduction-tracking-guide-pool-hosts": "Taxes & Pool Rental Income",
  "elearning-academy-dealing-with-difficult-scenarios-pool-hosts": "Difficult Guest Scenarios",
  "elearning-academy-hoa-navigation-guide-pool-hosts": "HOA Navigation",
  "elearning-academy-dealing-with-neighbor-complaints-in-real-time": "Neighbor Complaints",
  "elearning-academy-content-marketing-for-pool-rentals": "Content Marketing",
  "elearning-academy-listing-optimization-photography-conversion": "Photography & Listings"
};
const LANDING_ACADEMY_LINKS = ACADEMY_SLUGS.map((slug) => ({
  label: SLUG_LABELS[slug] ?? slug,
  href: `/p/${slug}`
}));
async function assertAdmin(userId) {
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}
const checkLandingAcademyLinks_createServerFn_handler = createServerRpc({
  id: "1a0db541b1be2cda73a67cbaec79a0e0ebeb9955bd5567ceac8e53436dbbd67e",
  name: "checkLandingAcademyLinks",
  filename: "src/server/landing-link-check.functions.ts"
}, (opts) => checkLandingAcademyLinks.__executeServer(opts));
const checkLandingAcademyLinks = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(checkLandingAcademyLinks_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const sb = supabaseAdmin;
  const paths = LANDING_ACADEMY_LINKS.map((l) => l.href);
  const {
    data: rows
  } = await sb.from("content_pages").select("url_path, status").in("url_path", paths);
  const byPath = /* @__PURE__ */ new Map();
  for (const r of rows || []) {
    byPath.set(r.url_path, r.status);
  }
  const results = LANDING_ACADEMY_LINKS.map((l) => {
    const status = byPath.get(l.href);
    if (!status) return {
      ...l,
      ok: false,
      status: "missing"
    };
    if (status !== "published") return {
      ...l,
      ok: false,
      status: "unpublished"
    };
    return {
      ...l,
      ok: true,
      status: "published"
    };
  });
  const okCount = results.filter((r) => r.ok).length;
  return {
    results,
    total: results.length,
    ok: okCount,
    broken: results.length - okCount,
    checkedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
});
export {
  checkLandingAcademyLinks_createServerFn_handler
};
