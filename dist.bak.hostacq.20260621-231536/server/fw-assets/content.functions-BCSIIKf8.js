import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
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
const getCity_createServerFn_handler = createServerRpc({
  id: "b7d5e20c6a117310b3122bfe251ba965bc2120364f0d609be4ba0bbf80e9e131",
  name: "getCity",
  filename: "src/server/content.functions.ts"
}, (opts) => getCity.__executeServer(opts));
const getCity = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/)
}).parse(d)).handler(getCity_createServerFn_handler, async ({
  data
}) => {
  const {
    data: city,
    error
  } = await supabaseAdmin.from("cities").select("*").eq("slug", data.slug).eq("is_published", true).maybeSingle();
  if (error) console.error("getCity:", error);
  if (city) return {
    city
  };
  const fallback = data.slug.match(/^(.+)-([a-z]{2})$/);
  if (!fallback) return {
    city: null
  };
  const cityName = fallback[1].replace(/-/g, " ");
  const stateCode = fallback[2].toUpperCase();
  const {
    data: fallbackCity,
    error: fallbackError
  } = await supabaseAdmin.from("cities").select("*").ilike("name", cityName).eq("state_code", stateCode).eq("is_published", true).limit(1).maybeSingle();
  if (fallbackError) console.error("getCity fallback:", fallbackError);
  return {
    city: fallbackCity ?? null
  };
});
const getCategory_createServerFn_handler = createServerRpc({
  id: "3e449c74c7e0ea3c0c398d29ca14c4c274929be533910e98753c07ce9ef33724",
  name: "getCategory",
  filename: "src/server/content.functions.ts"
}, (opts) => getCategory.__executeServer(opts));
const getCategory = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/)
}).parse(d)).handler(getCategory_createServerFn_handler, async ({
  data
}) => {
  const {
    data: category,
    error
  } = await supabaseAdmin.from("categories").select("*").eq("slug", data.slug).eq("is_published", true).maybeSingle();
  if (error) console.error("getCategory:", error);
  return {
    category: category ?? null
  };
});
const getProvider_createServerFn_handler = createServerRpc({
  id: "3ba4b56c2f9808243a7605abde47d54a8f807a577eb5133a33619a3b33cd3acc",
  name: "getProvider",
  filename: "src/server/content.functions.ts"
}, (opts) => getProvider.__executeServer(opts));
const getProvider = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/)
}).parse(d)).handler(getProvider_createServerFn_handler, async ({
  data
}) => {
  const {
    data: provider,
    error
  } = await supabaseAdmin.from("providers").select("id, slug, name, city, city_slug, state_code, phone, website_url, address, description, long_description, faq, gallery_urls, logo_url, hero_image_url, rating, rating_count, primary_category, secondary_categories, google_category, is_featured, is_published, plan, claim_status, services, seo_title, seo_description, google_cid, business_type, source_type, source_url, gsc_impressions, gsc_clicks, gsc_position, latitude, longitude, ai_content_generated_at, ai_enriched_at, scraped_at, featured_until, listing_paid_until, created_at, updated_at").eq("slug", data.slug).eq("is_published", true).maybeSingle();
  if (error) console.error("getProvider:", error);
  return {
    provider: provider ?? null
  };
});
const getBlogPost_createServerFn_handler = createServerRpc({
  id: "a80684d216c66308d6f632d62319ae188bc81e487da0555b3d4945a269971dda",
  name: "getBlogPost",
  filename: "src/server/content.functions.ts"
}, (opts) => getBlogPost.__executeServer(opts));
const getBlogPost = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/)
}).parse(d)).handler(getBlogPost_createServerFn_handler, async ({
  data
}) => {
  const {
    data: post,
    error
  } = await supabaseAdmin.from("blog_posts").select("*").eq("slug", data.slug).eq("is_published", true).maybeSingle();
  if (error) console.error("getBlogPost:", error);
  return {
    post: post ?? null
  };
});
const getBlogLinkTargets_createServerFn_handler = createServerRpc({
  id: "845e56bf958978679713246213ffdd1df479f40d4e56eb0729a5a36ce9bf1295",
  name: "getBlogLinkTargets",
  filename: "src/server/content.functions.ts"
}, (opts) => getBlogLinkTargets.__executeServer(opts));
const getBlogLinkTargets = createServerFn({
  method: "GET"
}).handler(getBlogLinkTargets_createServerFn_handler, async () => {
  const [cities, helpArticles, tools] = await Promise.all([supabaseAdmin.from("cities").select("slug, name, state, state_code").eq("is_published", true), supabaseAdmin.from("help_articles").select("slug, title, category_slug").eq("is_published", true).in("category_slug", ["legal-and-compliance", "safety-first", "pool-management", "for-hosts", "getting-started-hub"]), supabaseAdmin.from("host_tools").select("slug, title").eq("is_published", true)]);
  return {
    cities: cities.data ?? [],
    helpArticles: helpArticles.data ?? [],
    tools: tools.data ?? []
  };
});
const listAllSitemapEntries_createServerFn_handler = createServerRpc({
  id: "6ca5a289633d6eaa7a4851b9081e08bbcb3a9bdaa52a83587bcdb50e654f0030",
  name: "listAllSitemapEntries",
  filename: "src/server/content.functions.ts"
}, (opts) => listAllSitemapEntries.__executeServer(opts));
const listAllSitemapEntries = createServerFn({
  method: "GET"
}).handler(listAllSitemapEntries_createServerFn_handler, async () => {
  const [cities, categories, providers, posts] = await Promise.all([supabaseAdmin.from("cities").select("slug, updated_at").eq("is_published", true), supabaseAdmin.from("categories").select("slug, updated_at").eq("is_published", true), supabaseAdmin.from("providers").select("slug, updated_at").eq("is_published", true), supabaseAdmin.from("blog_posts").select("slug, updated_at").eq("is_published", true)]);
  return {
    cities: cities.data ?? [],
    categories: categories.data ?? [],
    providers: providers.data ?? [],
    posts: posts.data ?? []
  };
});
const getNearbyCities_createServerFn_handler = createServerRpc({
  id: "cc5e4db90b9b483e6286479667f56c7e1c074a40536427192affc125d0fc4d8e",
  name: "getNearbyCities",
  filename: "src/server/content.functions.ts"
}, (opts) => getNearbyCities.__executeServer(opts));
const getNearbyCities = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  state_code: z.string().length(2).optional(),
  limit: z.number().int().min(1).max(24).optional()
}).parse(d)).handler(getNearbyCities_createServerFn_handler, async ({
  data
}) => {
  const limit = data.limit ?? 12;
  const {
    data: rows,
    error
  } = await supabaseAdmin.rpc("nearby_cities_by_distance", {
    _slug: data.slug,
    _limit: limit
  });
  if (error) {
    console.error("getNearbyCities rpc:", error);
    let q = supabaseAdmin.from("cities").select("slug, name, state, state_code").eq("is_published", true).neq("slug", data.slug).limit(limit);
    if (data.state_code) q = q.eq("state_code", data.state_code);
    const {
      data: fb
    } = await q;
    return {
      cities: (fb ?? []).map((c) => ({
        ...c,
        distance_km: null
      }))
    };
  }
  const cities = (rows ?? []).map((r) => ({
    slug: r.out_slug,
    name: r.out_name,
    state: r.out_state,
    state_code: r.out_state_code,
    distance_km: r.out_distance_km
  }));
  return {
    cities
  };
});
const listCategories_createServerFn_handler = createServerRpc({
  id: "7c1d440a83f1f9f599d8f19dcb19bd1ca5197c705707963261fc065d2f6e1e81",
  name: "listCategories",
  filename: "src/server/content.functions.ts"
}, (opts) => listCategories.__executeServer(opts));
const listCategories = createServerFn({
  method: "GET"
}).handler(listCategories_createServerFn_handler, async () => {
  const {
    data,
    error
  } = await supabaseAdmin.from("categories").select("slug, name, icon").eq("is_published", true).order("name");
  if (error) console.error("listCategories:", error);
  return {
    categories: data ?? []
  };
});
const listBlogPostsPaged_createServerFn_handler = createServerRpc({
  id: "bddc5486b7ffdadbfbad0b252ca7b71efad4a86e9e583642f8b1a476e20128d0",
  name: "listBlogPostsPaged",
  filename: "src/server/content.functions.ts"
}, (opts) => listBlogPostsPaged.__executeServer(opts));
const listBlogPostsPaged = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  page: z.number().int().min(1).max(500).default(1),
  pageSize: z.number().int().min(1).max(48).default(12),
  topic: z.string().min(1).max(48).regex(/^[a-z0-9-]+$/).optional(),
  q: z.string().trim().min(1).max(120).optional()
}).parse(d ?? {})).handler(listBlogPostsPaged_createServerFn_handler, async ({
  data
}) => {
  const from = (data.page - 1) * data.pageSize;
  const to = from + data.pageSize - 1;
  let q = supabaseAdmin.from("blog_posts").select("slug, title, excerpt, cover_image_url, published_at, topic", {
    count: "exact"
  }).eq("is_published", true);
  if (data.topic) q = q.eq("topic", data.topic);
  if (data.q) {
    const safe = data.q.replace(/[%,()]/g, " ").trim();
    if (safe) {
      const pattern = `%${safe}%`;
      q = q.or(`title.ilike.${pattern},excerpt.ilike.${pattern}`);
    }
  }
  const {
    data: rows,
    count,
    error
  } = await q.order("published_at", {
    ascending: false,
    nullsFirst: false
  }).range(from, to);
  if (error) console.error("listBlogPostsPaged:", error);
  return {
    posts: rows ?? [],
    total: count ?? 0,
    page: data.page,
    pageSize: data.pageSize,
    topic: data.topic ?? null,
    q: data.q ?? null
  };
});
const listBlogTopics_createServerFn_handler = createServerRpc({
  id: "a3b734f6aebba577023470bdd15d9f3b76d26a913df7b8dd7f50fbfc868dc984",
  name: "listBlogTopics",
  filename: "src/server/content.functions.ts"
}, (opts) => listBlogTopics.__executeServer(opts));
const listBlogTopics = createServerFn({
  method: "GET"
}).handler(listBlogTopics_createServerFn_handler, async () => {
  const {
    data,
    error
  } = await supabaseAdmin.from("blog_posts").select("topic").eq("is_published", true).not("topic", "is", null);
  if (error) console.error("listBlogTopics:", error);
  const counts = /* @__PURE__ */ new Map();
  for (const row of data ?? []) {
    const t = row.topic;
    if (!t) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const topics = Array.from(counts.entries()).map(([slug, count]) => ({
    slug,
    count
  })).sort((a, b) => b.count - a.count);
  return {
    topics
  };
});
const getStateRegulation_createServerFn_handler = createServerRpc({
  id: "83d4989f4968bbabb330981ca27f1539e8d0240555e6aba8d72b8d6bd3f6feda",
  name: "getStateRegulation",
  filename: "src/server/content.functions.ts"
}, (opts) => getStateRegulation.__executeServer(opts));
const getStateRegulation = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  state_code: z.string().length(2).regex(/^[A-Z]{2}$/)
}).parse(d)).handler(getStateRegulation_createServerFn_handler, async ({
  data
}) => {
  const {
    data: row,
    error
  } = await supabaseAdmin.from("state_pool_regulations").select("*").eq("state_code", data.state_code).maybeSingle();
  if (error) {
    console.error("getStateRegulation:", error);
    return {
      regulation: null
    };
  }
  if (!row) return {
    regulation: null
  };
  return {
    regulation: {
      state_code: row.state_code,
      state_name: row.state_name,
      legality_status: row.legality_status,
      summary: row.summary ?? null,
      zoning_summary: row.zoning_summary ?? null,
      permit_name: row.permit_name ?? null,
      permit_fee_min_usd: row.permit_fee_min_usd ?? null,
      permit_fee_max_usd: row.permit_fee_max_usd ?? null,
      authority_name: row.authority_name ?? null,
      authority_url: row.authority_url ?? null,
      enforcement_notes: row.enforcement_notes ?? null,
      compliance_steps: Array.isArray(row.compliance_steps) ? row.compliance_steps : [],
      faqs: Array.isArray(row.faqs) ? row.faqs : [],
      source_urls: row.source_urls ?? [],
      last_verified_at: row.last_verified_at ?? null
    }
  };
});
export {
  getBlogLinkTargets_createServerFn_handler,
  getBlogPost_createServerFn_handler,
  getCategory_createServerFn_handler,
  getCity_createServerFn_handler,
  getNearbyCities_createServerFn_handler,
  getProvider_createServerFn_handler,
  getStateRegulation_createServerFn_handler,
  listAllSitemapEntries_createServerFn_handler,
  listBlogPostsPaged_createServerFn_handler,
  listBlogTopics_createServerFn_handler,
  listCategories_createServerFn_handler
};
