import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { s as stateName } from "./states-UIdvqlKs.js";
import { c as createServerFn } from "../server.js";
import "@supabase/supabase-js";
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
const listBuilderStates_createServerFn_handler = createServerRpc({
  id: "4c9441d3b6002616fda31deda2a8a4227b4d053d0084d0605b76c816e2b0b836",
  name: "listBuilderStates",
  filename: "src/server/builders.functions.ts"
}, (opts) => listBuilderStates.__executeServer(opts));
const listBuilderStates = createServerFn({
  method: "GET"
}).handler(listBuilderStates_createServerFn_handler, async () => {
  const {
    data,
    error
  } = await supabaseAdmin.from("providers").select("state_code").eq("is_published", true).not("state_code", "is", null).limit(5e3);
  if (error) console.error("listBuilderStates:", error);
  const counts = /* @__PURE__ */ new Map();
  for (const r of data ?? []) {
    const sc = r.state_code;
    if (!sc) continue;
    counts.set(sc, (counts.get(sc) ?? 0) + 1);
  }
  return {
    states: Array.from(counts.entries()).map(([code, count]) => ({
      code,
      name: stateName(code),
      count,
      slug: code.toLowerCase()
    })).sort((a, b) => b.count - a.count)
  };
});
const listAllBuilders_createServerFn_handler = createServerRpc({
  id: "e32249312a5ac6377e83cd7ab18c9f46b327d1ba0ddaac9b1602a5aea2558b03",
  name: "listAllBuilders",
  filename: "src/server/builders.functions.ts"
}, (opts) => listAllBuilders.__executeServer(opts));
const listAllBuilders = createServerFn({
  method: "GET"
}).handler(listAllBuilders_createServerFn_handler, async () => {
  const {
    data,
    error
  } = await supabaseAdmin.from("providers").select("slug, name, city, city_slug, state_code, rating, rating_count, business_type, logo_url").eq("is_published", true).order("rating", {
    ascending: false,
    nullsFirst: false
  }).order("rating_count", {
    ascending: false,
    nullsFirst: false
  }).limit(1e3);
  if (error) console.error("listAllBuilders:", error);
  return {
    providers: data ?? []
  };
});
const getBuildersByState_createServerFn_handler = createServerRpc({
  id: "e8a588df9ea5f16c934ded3c1ab3c467647278f0d31bcc331d6d263391563e68",
  name: "getBuildersByState",
  filename: "src/server/builders.functions.ts"
}, (opts) => getBuildersByState.__executeServer(opts));
const getBuildersByState = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  state: z.string().regex(/^[a-z]{2}$/)
}).parse(d)).handler(getBuildersByState_createServerFn_handler, async ({
  data
}) => {
  const code = data.state.toUpperCase();
  const {
    data: providers,
    error
  } = await supabaseAdmin.from("providers").select("slug, name, city, city_slug, state_code, rating, rating_count, business_type, logo_url, hero_image_url, latitude, longitude").eq("is_published", true).eq("state_code", code).order("rating", {
    ascending: false,
    nullsFirst: false
  }).order("rating_count", {
    ascending: false,
    nullsFirst: false
  }).limit(500);
  if (error) console.error("getBuildersByState:", error);
  const cityMap = /* @__PURE__ */ new Map();
  for (const p of providers ?? []) {
    const row = p;
    if (!row.city || !row.city_slug) continue;
    const existing = cityMap.get(row.city_slug);
    if (existing) existing.count++;
    else cityMap.set(row.city_slug, {
      city: row.city,
      slug: row.city_slug,
      count: 1
    });
  }
  const cities = Array.from(cityMap.values()).sort((a, b) => b.count - a.count);
  return {
    state: {
      code,
      name: stateName(code),
      slug: code.toLowerCase(),
      count: providers?.length ?? 0
    },
    providers: providers ?? [],
    cities
  };
});
const getBuildersByCity_createServerFn_handler = createServerRpc({
  id: "ddd8a524252354f8d281e76dc64a8671b3ce2e032663c538ed516e6667f90ffd",
  name: "getBuildersByCity",
  filename: "src/server/builders.functions.ts"
}, (opts) => getBuildersByCity.__executeServer(opts));
const getBuildersByCity = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  state: z.string().regex(/^[a-z]{2}$/),
  city: z.string().regex(/^[a-z0-9-]+$/).max(80)
}).parse(d)).handler(getBuildersByCity_createServerFn_handler, async ({
  data
}) => {
  const code = data.state.toUpperCase();
  const fullSlug = data.city.endsWith(`-${data.state}`) ? data.city : `${data.city}-${data.state}`;
  const {
    data: providers,
    error
  } = await supabaseAdmin.from("providers").select("slug, name, city, city_slug, state_code, rating, rating_count, business_type, address, phone, website_url, logo_url, hero_image_url, latitude, longitude, description").eq("is_published", true).eq("state_code", code).eq("city_slug", fullSlug).order("rating", {
    ascending: false,
    nullsFirst: false
  }).order("rating_count", {
    ascending: false,
    nullsFirst: false
  });
  if (error) console.error("getBuildersByCity:", error);
  const cityName = providers?.[0]?.city ?? null;
  return {
    state: {
      code,
      name: stateName(code),
      slug: code.toLowerCase()
    },
    city: cityName ? {
      name: cityName,
      slug: fullSlug
    } : null,
    providers: providers ?? []
  };
});
const submitProviderLead_createServerFn_handler = createServerRpc({
  id: "52e5a9df7f3d469c9a46bf9fb8b5c0a4f283ae5bd87ec1dce2093dc046a3161e",
  name: "submitProviderLead",
  filename: "src/server/builders.functions.ts"
}, (opts) => submitProviderLead.__executeServer(opts));
const submitProviderLead = createServerFn({
  method: "POST"
}).inputValidator((d) => z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  website: z.string().trim().max(300).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  state_code: z.string().trim().max(4).optional().or(z.literal("")),
  message: z.string().trim().max(2e3).optional().or(z.literal("")),
  source_provider_slug: z.string().trim().max(120).optional().or(z.literal("")),
  source_path: z.string().trim().max(300).optional().or(z.literal(""))
}).parse(d)).handler(submitProviderLead_createServerFn_handler, async ({
  data
}) => {
  const blank = (s) => s && s.trim() ? s.trim() : null;
  const {
    error
  } = await supabaseAdmin.from("provider_leads").insert({
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: blank(data.phone),
    company: blank(data.company),
    website: blank(data.website),
    city: blank(data.city),
    state_code: blank(data.state_code)?.toUpperCase() ?? null,
    message: blank(data.message),
    source_provider_slug: blank(data.source_provider_slug),
    source_path: blank(data.source_path)
  });
  if (error) {
    console.error("submitProviderLead:", error);
    return {
      ok: false,
      error: "Could not submit. Please try again."
    };
  }
  return {
    ok: true
  };
});
export {
  getBuildersByCity_createServerFn_handler,
  getBuildersByState_createServerFn_handler,
  listAllBuilders_createServerFn_handler,
  listBuilderStates_createServerFn_handler,
  submitProviderLead_createServerFn_handler
};
