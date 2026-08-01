import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
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
const EnvSchema = z.enum(["live", "test"]);
async function assertAdmin(userId) {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("forbidden");
}
async function fetchTotal(env, path, query = {}) {
  const {
    stIntegGet
  } = await import("./sharetribe-env.server-CBYJF14h.js");
  const j = await stIntegGet(env, path, {
    ...query,
    perPage: 1
  });
  return j.meta?.totalItems ?? 0;
}
const getMarketplaceOverview_createServerFn_handler = createServerRpc({
  id: "768ac784ec8e9da92d8be65face66da6227f8301000ae55ccc9931b2457d9945",
  name: "getMarketplaceOverview",
  filename: "src/lib/marketplace-console.functions.ts"
}, (opts) => getMarketplaceOverview.__executeServer(opts));
const getMarketplaceOverview = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  env: EnvSchema
}).parse(d)).handler(getMarketplaceOverview_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const env = data.env;
  const [users, listings, txAll, reviews] = await Promise.all([fetchTotal(env, "/users/query").catch(() => 0), fetchTotal(env, "/listings/query").catch(() => 0), fetchTotal(env, "/transactions/query").catch(() => 0), fetchTotal(env, "/reviews/query").catch(() => 0)]);
  let last30d = 0;
  let allTime = 0;
  let currency = "USD";
  if (env === "live") {
    const {
      supabaseAdmin
    } = await import("./client.server-D5ro3rAQ.js");
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    const [a, b] = await Promise.all([supabaseAdmin.from("st_transactions").select("payin_total_cents,currency").gte("last_transitioned_at", since).in("state", ["confirm-payment", "complete", "reviewed"]), supabaseAdmin.from("st_transactions").select("payin_total_cents,currency").in("state", ["confirm-payment", "complete", "reviewed"])]);
    for (const r of a.data || []) last30d += r.payin_total_cents || 0;
    for (const r of b.data || []) {
      allTime += r.payin_total_cents || 0;
      if (r.currency) currency = r.currency;
    }
  }
  return {
    env,
    counts: {
      users,
      listings,
      transactions: txAll,
      reviews
    },
    gmv: {
      last30dCents: last30d,
      allTimeCents: allTime,
      currency
    },
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
});
const listMarketplaceResource_createServerFn_handler = createServerRpc({
  id: "9f87402ed2cefe652d0bfbe21bdaabbe39d4fecda09d9ef09d1bde32a3865174",
  name: "listMarketplaceResource",
  filename: "src/lib/marketplace-console.functions.ts"
}, (opts) => listMarketplaceResource.__executeServer(opts));
const listMarketplaceResource = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  env: EnvSchema,
  resource: z.enum(["users", "listings", "transactions", "reviews"]),
  page: z.number().int().min(1).max(500).default(1),
  perPage: z.number().int().min(1).max(100).default(25),
  keywords: z.string().max(200).optional(),
  state: z.string().max(50).optional(),
  // listings state filter
  lastTransition: z.string().max(100).optional()
  // transactions
}).parse(d)).handler(listMarketplaceResource_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    stIntegGet
  } = await import("./sharetribe-env.server-CBYJF14h.js");
  const path = `/${data.resource}/query`;
  const query = {
    page: data.page,
    perPage: data.perPage
  };
  if (data.keywords) query.keywords = data.keywords;
  if (data.resource === "listings" && data.state) query.states = data.state;
  if (data.resource === "transactions" && data.lastTransition) {
    query.lastTransitions = data.lastTransition;
  }
  if (data.resource === "listings") query.include = "author,images";
  if (data.resource === "transactions") query.include = "listing,customer,provider";
  if (data.resource === "reviews") query.include = "author,subject,listing";
  try {
    const res = await stIntegGet(data.env, path, query);
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/\[404\]/.test(msg)) {
      return {
        data: [],
        included: [],
        meta: {
          totalItems: 0,
          totalPages: 0,
          page: data.page,
          perPage: data.perPage
        }
      };
    }
    throw e;
  }
});
export {
  getMarketplaceOverview_createServerFn_handler,
  listMarketplaceResource_createServerFn_handler
};
