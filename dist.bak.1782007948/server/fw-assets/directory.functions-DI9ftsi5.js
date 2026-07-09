import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { z } from "zod";
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
const listServiceCategories_createServerFn_handler = createServerRpc({
  id: "6c0b21a070fb08763de1b76b52dfd646879f4eddf8ad7eed82716c88a9ab9507",
  name: "listServiceCategories",
  filename: "src/server/directory.functions.ts"
}, (opts) => listServiceCategories.__executeServer(opts));
const listServiceCategories = createServerFn({
  method: "GET"
}).handler(listServiceCategories_createServerFn_handler, async () => {
  const {
    data
  } = await supabaseAdmin.from("service_categories").select("slug, name, plural_name, icon, hero_image_url, intro_markdown, seo_title, seo_description, sort_order").eq("is_published", true).order("sort_order");
  const cats = data ?? [];
  const countsRes = await supabaseAdmin.rpc("count_providers_by_category");
  const counts = countsRes?.data ?? null;
  const countMap = /* @__PURE__ */ new Map();
  if (Array.isArray(counts)) for (const r of counts) countMap.set(r.primary_category, Number(r.n) || 0);
  return {
    categories: cats.map((c) => ({
      ...c,
      provider_count: countMap.get(c.slug) ?? 0
    }))
  };
});
const getCategoryWithProviders_createServerFn_handler = createServerRpc({
  id: "5f44553c02f93f264442f97bfed35d50ecec190e1d65a330478233c3847da65b",
  name: "getCategoryWithProviders",
  filename: "src/server/directory.functions.ts"
}, (opts) => getCategoryWithProviders.__executeServer(opts));
const getCategoryWithProviders = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: z.string().min(1)
}).parse(d)).handler(getCategoryWithProviders_createServerFn_handler, async ({
  data
}) => {
  const [{
    data: cat
  }, {
    data: provs
  }] = await Promise.all([supabaseAdmin.from("service_categories").select("*").eq("slug", data.slug).eq("is_published", true).maybeSingle(), supabaseAdmin.from("providers").select("slug, name, business_type, city, state_code, logo_url, hero_image_url, description, primary_category, secondary_categories, is_featured, featured_until, listing_paid_until, plan, rating, rating_count").eq("is_published", true).or(`primary_category.eq.${data.slug},secondary_categories.cs.{${data.slug}}`).order("is_featured", {
    ascending: false
  }).order("rating", {
    ascending: false,
    nullsFirst: false
  }).order("name").limit(500)]);
  return {
    category: cat ?? null,
    providers: provs ?? []
  };
});
const STATE_NAMES = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia"
};
const stateName = (code) => STATE_NAMES[code.toUpperCase()] ?? code.toUpperCase();
function citySlugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
const getCategoryStateProviders_createServerFn_handler = createServerRpc({
  id: "279bb652db45f4ad8c915c922ff2210de5b713d798a1fb27a879823d4a0de284",
  name: "getCategoryStateProviders",
  filename: "src/server/directory.functions.ts"
}, (opts) => getCategoryStateProviders.__executeServer(opts));
const getCategoryStateProviders = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: z.string().min(1),
  state: z.string().length(2)
}).parse(d)).handler(getCategoryStateProviders_createServerFn_handler, async ({
  data
}) => {
  const stateCode = data.state.toUpperCase();
  const [{
    data: cat
  }, {
    data: rows
  }] = await Promise.all([supabaseAdmin.from("service_categories").select("*").eq("slug", data.slug).eq("is_published", true).maybeSingle(), supabaseAdmin.from("providers").select("slug, name, business_type, city, city_slug, state_code, logo_url, hero_image_url, description, primary_category, secondary_categories, is_featured, featured_until, listing_paid_until, plan, rating, rating_count").eq("is_published", true).eq("state_code", stateCode).or(`primary_category.eq.${data.slug},secondary_categories.cs.{${data.slug}}`).order("is_featured", {
    ascending: false
  }).order("rating", {
    ascending: false,
    nullsFirst: false
  }).order("name").limit(500)]);
  const provs = rows ?? [];
  const cityMap = /* @__PURE__ */ new Map();
  for (const r of provs) {
    if (!r.city) continue;
    const slug = r.city_slug || citySlugify(r.city);
    const cur = cityMap.get(slug);
    if (cur) cur.count++;
    else cityMap.set(slug, {
      name: r.city,
      slug,
      count: 1
    });
  }
  return {
    category: cat ?? null,
    stateCode,
    stateName: stateName(stateCode),
    providers: provs,
    cities: [...cityMap.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  };
});
const getCategoryCityProviders_createServerFn_handler = createServerRpc({
  id: "05f874bd6f89db40ee4d211bf87ae69042d7b545bdeb1a63b5391de69147b7e3",
  name: "getCategoryCityProviders",
  filename: "src/server/directory.functions.ts"
}, (opts) => getCategoryCityProviders.__executeServer(opts));
const getCategoryCityProviders = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: z.string().min(1),
  state: z.string().length(2),
  city: z.string().min(1)
}).parse(d)).handler(getCategoryCityProviders_createServerFn_handler, async ({
  data
}) => {
  const stateCode = data.state.toUpperCase();
  const citySlug = data.city.toLowerCase();
  const [{
    data: cat
  }, {
    data: provs
  }] = await Promise.all([supabaseAdmin.from("service_categories").select("*").eq("slug", data.slug).eq("is_published", true).maybeSingle(), supabaseAdmin.from("providers").select("slug, name, business_type, city, city_slug, state_code, logo_url, hero_image_url, description, primary_category, secondary_categories, is_featured, featured_until, listing_paid_until, plan, rating, rating_count, address, phone, website_url").eq("is_published", true).eq("state_code", stateCode).or(`primary_category.eq.${data.slug},secondary_categories.cs.{${data.slug}}`).order("is_featured", {
    ascending: false
  }).order("rating", {
    ascending: false,
    nullsFirst: false
  }).order("name").limit(500)]);
  const filtered = (provs ?? []).filter((p) => {
    if (p.city_slug) return p.city_slug.toLowerCase() === citySlug;
    if (p.city) return citySlugify(p.city) === citySlug;
    return false;
  });
  const displayCity = filtered[0]?.city || citySlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    category: cat ?? null,
    stateCode,
    stateName: stateName(stateCode),
    citySlug,
    cityName: displayCity,
    providers: filtered
  };
});
const listCategoryGeoCoverage_createServerFn_handler = createServerRpc({
  id: "526aa89d0f80b01cf7d4992cd9902ff8987f8aeb5d56b1b252d71b60daffdbef",
  name: "listCategoryGeoCoverage",
  filename: "src/server/directory.functions.ts"
}, (opts) => listCategoryGeoCoverage.__executeServer(opts));
const listCategoryGeoCoverage = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: z.string().min(1)
}).parse(d)).handler(listCategoryGeoCoverage_createServerFn_handler, async ({
  data
}) => {
  const {
    data: rows
  } = await supabaseAdmin.from("providers").select("city, city_slug, state_code").eq("is_published", true).or(`primary_category.eq.${data.slug},secondary_categories.cs.{${data.slug}}`).limit(5e3);
  const states = /* @__PURE__ */ new Map();
  for (const r of rows ?? []) {
    if (!r.state_code || !r.city) continue;
    const sc = r.state_code.toUpperCase();
    const slug = r.city_slug || citySlugify(r.city);
    if (!states.has(sc)) states.set(sc, /* @__PURE__ */ new Map());
    const cm = states.get(sc);
    const cur = cm.get(slug);
    if (cur) cur.count++;
    else cm.set(slug, {
      name: r.city,
      slug,
      count: 1
    });
  }
  return {
    states: [...states.entries()].map(([code, cm]) => ({
      code,
      name: stateName(code),
      cities: [...cm.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    })).sort((a, b) => a.name.localeCompare(b.name))
  };
});
const ListProviderInput = z.object({
  name: z.string().min(2).max(120),
  primary_category: z.string().min(2),
  city: z.string().min(2).max(80),
  state_code: z.string().length(2),
  website_url: z.string().url().max(300).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  email: z.string().email().max(160),
  description: z.string().min(20).max(2e3),
  services: z.array(z.string().max(60)).max(20).optional()
});
function slugify(s) {
  return s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
const submitProviderListing_createServerFn_handler = createServerRpc({
  id: "f26aa7f3b2c7ed27a5e5e5b93e26e41604f098702c9f3bfd569b10604f5e2df2",
  name: "submitProviderListing",
  filename: "src/server/directory.functions.ts"
}, (opts) => submitProviderListing.__executeServer(opts));
const submitProviderListing = createServerFn({
  method: "POST"
}).inputValidator((d) => ListProviderInput.parse(d)).handler(submitProviderListing_createServerFn_handler, async ({
  data
}) => {
  const {
    data: cat
  } = await supabaseAdmin.from("service_categories").select("slug").eq("slug", data.primary_category).eq("is_published", true).maybeSingle();
  if (!cat) throw new Error("Invalid category");
  const baseSlug = slugify(`${data.name}-${data.city}-${data.state_code}`);
  let slug = baseSlug;
  for (let i = 0; i < 5; i++) {
    const {
      data: exists
    } = await supabaseAdmin.from("providers").select("id").eq("slug", slug).maybeSingle();
    if (!exists) break;
    slug = `${baseSlug}-${Math.floor(Math.random() * 9e3) + 1e3}`;
  }
  const {
    error
  } = await supabaseAdmin.from("providers").insert({
    slug,
    name: data.name.trim(),
    business_type: cat.slug,
    primary_category: cat.slug,
    city: data.city.trim(),
    state_code: data.state_code.toUpperCase(),
    website_url: data.website_url || null,
    phone: data.phone || null,
    email: data.email,
    description: data.description.trim(),
    services: data.services ?? [],
    is_published: false,
    submission_status: "pending",
    claim_status: "pending",
    submitter_email: data.email
  });
  if (error) throw new Error(error.message);
  return {
    ok: true,
    slug
  };
});
async function requireAdmin(userId) {
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Not authorized");
}
const adminListPendingProviders_createServerFn_handler = createServerRpc({
  id: "cc3b706532e7174d7edb437ba3ccfbee7d0e7324a45604422fea89b4927a090c",
  name: "adminListPendingProviders",
  filename: "src/server/directory.functions.ts"
}, (opts) => adminListPendingProviders.__executeServer(opts));
const adminListPendingProviders = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(200).default(50),
  status: z.enum(["pending", "approved", "rejected", "all"]).default("all"),
  search: z.string().trim().max(120).default("")
}).partial().parse(d ?? {})).handler(adminListPendingProviders_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const page = data?.page ?? 1;
  const pageSize = data?.pageSize ?? 50;
  const status = data?.status ?? "all";
  const search = (data?.search ?? "").trim();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let q = supabaseAdmin.from("providers").select("id, slug, name, primary_category, city, state_code, email, submitter_email, description, website_url, phone, services, created_at, submission_status, is_published, is_featured, plan, featured_until, listing_paid_until, gsc_impressions, gsc_clicks, gsc_position, ai_content_generated_at, source_type", {
    count: "exact"
  }).order("submission_status", {
    ascending: true
  }).order("created_at", {
    ascending: false
  }).range(from, to);
  if (status !== "all") q = q.eq("submission_status", status);
  if (search) {
    const esc = search.replace(/[%_,]/g, "");
    q = q.or(`name.ilike.%${esc}%,slug.ilike.%${esc}%,city.ilike.%${esc}%,state_code.ilike.%${esc}%,email.ilike.%${esc}%`);
  }
  const {
    data: rows,
    count
  } = await q;
  return {
    providers: rows ?? [],
    total: count ?? 0,
    page,
    pageSize
  };
});
const adminScrapeProviderUrl_createServerFn_handler = createServerRpc({
  id: "df19e06b9251ffcdb70e5ee23fc9cd363acf591743a9c419d013473dae6d8426",
  name: "adminScrapeProviderUrl",
  filename: "src/server/directory.functions.ts"
}, (opts) => adminScrapeProviderUrl.__executeServer(opts));
const adminScrapeProviderUrl = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  url: z.string().url(),
  autoCreate: z.boolean().default(true)
}).parse(d)).handler(adminScrapeProviderUrl_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not configured");
  const sourceType = guessSourceType(data.url);
  const {
    data: job
  } = await supabaseAdmin.from("provider_scrape_jobs").insert({
    source_url: data.url,
    source_type: sourceType,
    status: "running",
    created_by: userId
  }).select("id").single();
  const jobId = job?.id;
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        url: data.url,
        formats: [{
          type: "json",
          prompt: "Extract EVERY business listing visible on the page (search results, map results, directory pages may contain dozens). Return JSON: { listings: [ { name (string, required), description (string, 1-3 sentences, may be empty), website (string|null), phone (string|null), email (string|null), address (string|null), city (string|null), state_code (2-letter US state, string|null), services (string[]), rating (number|null), rating_count (integer|null), logo_url (string|null), hero_image_url (string|null), gallery_urls (string[]) } ] }. If the page is a single business listing, return one item in the array. Never invent businesses; only include those actually on the page."
        }],
        onlyMainContent: true
      })
    });
    const payload = await res.json();
    if (!res.ok || !payload?.success) throw new Error(payload?.error || `Firecrawl ${res.status}`);
    const j = payload.data?.json ?? payload.json ?? {};
    let listings = Array.isArray(j?.listings) ? j.listings : Array.isArray(j?.businesses) ? j.businesses : Array.isArray(j?.results) ? j.results : j?.name ? [j] : [];
    listings = listings.filter((l) => l && typeof l.name === "string" && l.name.trim().length > 1);
    const providerIds = [];
    if (data.autoCreate && listings.length) {
      for (const it of listings) {
        const slug = slugify(`${it.name}-${it.city ?? ""}-${it.state_code ?? ""}`);
        if (!slug) continue;
        let logo_url = it.logo_url ?? null;
        let hero_image_url = it.hero_image_url ?? null;
        let gallery_urls = Array.isArray(it.gallery_urls) ? it.gallery_urls.filter(Boolean) : [];
        if (it.website && (!logo_url || !hero_image_url || gallery_urls.length === 0)) {
          try {
            const er = await fetch("https://api.firecrawl.dev/v2/scrape", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                url: it.website,
                formats: ["branding", {
                  type: "json",
                  prompt: "From this business website, return JSON: { logo_url (string|null, the company logo image URL), hero_image_url (string|null, the main hero/banner photo URL), gallery_urls (string[], up to 6 representative photo URLs of pools, work, or the business — absolute https URLs only). Use absolute URLs from <img src> attributes. No data: URIs, no SVG sprites, no tracking pixels."
                }],
                onlyMainContent: false
              })
            });
            const ep = await er.json().catch(() => null);
            const ej = ep?.data?.json ?? ep?.json ?? {};
            const branding = ep?.data?.branding ?? ep?.branding ?? {};
            const isHttp = (u) => typeof u === "string" && /^https?:\/\//i.test(u) && !/\.svg(\?|$)/i.test(u);
            logo_url = logo_url || (isHttp(ej.logo_url) ? ej.logo_url : null) || (isHttp(branding?.logo) ? branding.logo : null) || (isHttp(branding?.images?.logo) ? branding.images.logo : null);
            hero_image_url = hero_image_url || (isHttp(ej.hero_image_url) ? ej.hero_image_url : null) || (isHttp(branding?.images?.ogImage) ? branding.images.ogImage : null);
            const extra = Array.isArray(ej.gallery_urls) ? ej.gallery_urls.filter(isHttp) : [];
            gallery_urls = Array.from(/* @__PURE__ */ new Set([...gallery_urls, ...extra])).slice(0, 8);
          } catch {
          }
        }
        const upsert = await supabaseAdmin.from("providers").upsert({
          slug,
          name: it.name,
          description: it.description ?? null,
          website_url: it.website ?? null,
          phone: it.phone ?? null,
          email: it.email ?? null,
          address: it.address ?? null,
          city: it.city ?? null,
          state_code: it.state_code ?? null,
          services: Array.isArray(it.services) ? it.services : [],
          rating: typeof it.rating === "number" ? it.rating : null,
          rating_count: typeof it.rating_count === "number" ? it.rating_count : null,
          logo_url,
          hero_image_url,
          gallery_urls,
          source_url: data.url,
          source_type: sourceType,
          scraped_at: (/* @__PURE__ */ new Date()).toISOString(),
          submission_status: "pending",
          is_published: false
        }, {
          onConflict: "slug"
        }).select("id").single();
        const id = upsert.data?.id;
        if (id) providerIds.push(id);
      }
    }
    await supabaseAdmin.from("provider_scrape_jobs").update({
      status: "success",
      provider_id: providerIds[0] ?? null,
      raw: {
        count: listings.length,
        listings
      }
    }).eq("id", jobId);
    return {
      ok: true,
      jobId,
      providerId: providerIds[0] ?? null,
      providerIds,
      count: providerIds.length,
      extracted: listings
    };
  } catch (e) {
    await supabaseAdmin.from("provider_scrape_jobs").update({
      status: "failed",
      error: String(e?.message ?? e)
    }).eq("id", jobId);
    throw e;
  }
});
const adminListScrapeJobs_createServerFn_handler = createServerRpc({
  id: "c22f1be1fa0767dd471b7b210370a75b37ac8ac72829cfb34dd8726fb338316c",
  name: "adminListScrapeJobs",
  filename: "src/server/directory.functions.ts"
}, (opts) => adminListScrapeJobs.__executeServer(opts));
const adminListScrapeJobs = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(adminListScrapeJobs_createServerFn_handler, async ({
  context
}) => {
  await requireAdmin(context.userId);
  const {
    data
  } = await supabaseAdmin.from("provider_scrape_jobs").select("id, source_url, source_type, status, provider_id, error, created_at").order("created_at", {
    ascending: false
  }).limit(100);
  return {
    jobs: data ?? []
  };
});
const adminImportGscRows_createServerFn_handler = createServerRpc({
  id: "603285ad21173c223cffc4d531f00f5725f82a23bda3f346a9d613e255810502",
  name: "adminImportGscRows",
  filename: "src/server/directory.functions.ts"
}, (opts) => adminImportGscRows.__executeServer(opts));
const adminImportGscRows = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  rows: z.array(z.object({
    slug: z.string(),
    impressions: z.number().int().nonnegative(),
    clicks: z.number().int().nonnegative(),
    position: z.number().nullable().optional(),
    kind: z.enum(["provider", "page"]).optional()
  })).max(5e3)
}).parse(d)).handler(adminImportGscRows_createServerFn_handler, async ({
  context,
  data
}) => {
  await requireAdmin(context.userId);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  let updated = 0;
  for (const r of data.rows) {
    const kind = r.kind ?? "provider";
    const table = kind === "page" ? "content_pages" : "providers";
    const matchCol = kind === "page" ? "url_path" : "slug";
    const matchVal = kind === "page" ? `/p/${r.slug.replace(/^\/+/, "")}` : r.slug;
    const {
      error,
      count
    } = await supabaseAdmin.from(table).update({
      gsc_impressions: r.impressions,
      gsc_clicks: r.clicks,
      gsc_position: r.position ?? null,
      gsc_updated_at: now
    }, {
      count: "exact"
    }).eq(matchCol, matchVal);
    if (!error && (count ?? 0) > 0) updated += 1;
  }
  return {
    ok: true,
    updated,
    total: data.rows.length
  };
});
const adminGenerateProviderContent_createServerFn_handler = createServerRpc({
  id: "9355e8f5cc6ef6bc87f49f106a89800747716d984b4d4f1f25b3d698bb168c24",
  name: "adminGenerateProviderContent",
  filename: "src/server/directory.functions.ts"
}, (opts) => adminGenerateProviderContent.__executeServer(opts));
const adminGenerateProviderContent = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(adminGenerateProviderContent_createServerFn_handler, async ({
  context,
  data
}) => {
  await requireAdmin(context.userId);
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  const {
    data: p
  } = await supabaseAdmin.from("providers").select("id, name, city, state_code, primary_category, description, services, website_url").eq("id", data.id).single();
  if (!p) throw new Error("Provider not found");
  const sys = "You write SEO-optimized, factual long-form content for a pool services directory. Use second person, friendly founder-mentor tone. No banned words: leverage, utilize, seamlessly, robust, dive into, elevate, game-changer, unlock, journey, landscape, bustling, thriving, vibrant, state-of-the-art, cutting-edge. No em dashes. Output valid JSON only.";
  const user = `Write content for ${p.name}${p.city ? ` in ${p.city}, ${p.state_code}` : ""}. Category: ${p.primary_category ?? "pool services"}. Services: ${(p.services ?? []).join(", ") || "general pool services"}. Existing description: ${p.description ?? "(none)"}.

Return JSON with shape: { "long_description": string (700-900 words, markdown, no headings above h3), "faq": Array<{question: string, answer: string}> (5 items, locally relevant) }.`;
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{
        role: "system",
        content: sys
      }, {
        role: "user",
        content: user
      }],
      response_format: {
        type: "json_object"
      }
    })
  });
  if (!r.ok) throw new Error(`AI gateway ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const content = JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
  await supabaseAdmin.from("providers").update({
    long_description: content.long_description ?? null,
    faq: Array.isArray(content.faq) ? content.faq : [],
    ai_content_generated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", data.id);
  return {
    ok: true
  };
});
const adminListProvidersMissingAI_createServerFn_handler = createServerRpc({
  id: "c525005316a5e2a24ffa9100c6ad44bda5f927d3f01aa63048248e2d977ed481",
  name: "adminListProvidersMissingAI",
  filename: "src/server/directory.functions.ts"
}, (opts) => adminListProvidersMissingAI.__executeServer(opts));
const adminListProvidersMissingAI = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  limit: z.number().int().min(1).max(100).default(10)
}).parse(d)).handler(adminListProvidersMissingAI_createServerFn_handler, async ({
  context,
  data
}) => {
  await requireAdmin(context.userId);
  const {
    data: rows,
    error
  } = await supabaseAdmin.from("providers").select("id, name, slug, city, state_code").eq("is_published", true).is("long_description", null).order("updated_at", {
    ascending: true
  }).limit(data.limit);
  if (error) throw new Error(error.message);
  return {
    providers: rows ?? []
  };
});
const adminBulkGenerateProviderContent_createServerFn_handler = createServerRpc({
  id: "11ca4156ce30d160b183589e976fc837dc8ffb2630f4b8341dfd86ef55bf6cba",
  name: "adminBulkGenerateProviderContent",
  filename: "src/server/directory.functions.ts"
}, (opts) => adminBulkGenerateProviderContent.__executeServer(opts));
const adminBulkGenerateProviderContent = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  limit: z.number().int().min(1).max(50).default(10),
  onlyMissing: z.boolean().default(true)
}).parse(d)).handler(adminBulkGenerateProviderContent_createServerFn_handler, async ({
  context,
  data
}) => {
  await requireAdmin(context.userId);
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  let q = supabaseAdmin.from("providers").select("id, name, city, state_code, primary_category, description, services").eq("is_published", true).order("updated_at", {
    ascending: true
  }).limit(data.limit);
  if (data.onlyMissing) q = q.is("long_description", null);
  const {
    data: rows,
    error
  } = await q;
  if (error) throw new Error(error.message);
  const results = [];
  for (const p of rows ?? []) {
    try {
      const sys = "You write SEO-optimized, factual long-form content for a pool services directory. Use second person, friendly founder-mentor tone. No banned words: leverage, utilize, seamlessly, robust, dive into, elevate, game-changer, unlock, journey, landscape, bustling, thriving, vibrant, state-of-the-art, cutting-edge. No em dashes. Output valid JSON only.";
      const user = `Write content for ${p.name}${p.city ? ` in ${p.city}, ${p.state_code}` : ""}. Category: ${p.primary_category ?? "pool services"}. Services: ${(p.services ?? []).join(", ") || "general pool services"}. Existing description: ${p.description ?? "(none)"}.

Return JSON: { "long_description": string (700-900 words, markdown, no headings above h3), "faq": Array<{question:string,answer:string}> (5 items) }.`;
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{
            role: "system",
            content: sys
          }, {
            role: "user",
            content: user
          }],
          response_format: {
            type: "json_object"
          }
        })
      });
      if (r.status === 429) {
        results.push({
          id: p.id,
          ok: false,
          error: "rate limited"
        });
        await new Promise((rs) => setTimeout(rs, 3e3));
        continue;
      }
      if (r.status === 402) throw new Error("AI credits exhausted");
      if (!r.ok) {
        results.push({
          id: p.id,
          ok: false,
          error: `gateway ${r.status}`
        });
        continue;
      }
      const j = await r.json();
      const content = JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
      await supabaseAdmin.from("providers").update({
        long_description: content.long_description ?? null,
        faq: Array.isArray(content.faq) ? content.faq : [],
        ai_content_generated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", p.id);
      results.push({
        id: p.id,
        ok: true
      });
    } catch (e) {
      results.push({
        id: p.id,
        ok: false,
        error: e?.message || String(e)
      });
    }
    await new Promise((rs) => setTimeout(rs, 800));
  }
  return {
    ok: true,
    attempted: results.length,
    succeeded: results.filter((r) => r.ok).length,
    results
  };
});
function guessSourceType(url) {
  const h = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  })();
  if (h.includes("yelp")) return "yelp";
  if (h.includes("google")) return "google";
  if (h.includes("bbb.org")) return "bbb";
  if (h.includes("angi") || h.includes("angieslist")) return "angi";
  if (h.includes("houzz")) return "houzz";
  if (h.includes("thumbtack")) return "thumbtack";
  return "web";
}
const adminUpdateProvider_createServerFn_handler = createServerRpc({
  id: "498c731d7c4b3fedd8e7813883a64e1985cd4668b37a9222b8273997769103d8",
  name: "adminUpdateProvider",
  filename: "src/server/directory.functions.ts"
}, (opts) => adminUpdateProvider.__executeServer(opts));
const adminUpdateProvider = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject", "publish", "unpublish", "feature", "unfeature", "mark_paid", "mark_unpaid", "delete"])
}).parse(d)).handler(adminUpdateProvider_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const sb = supabaseAdmin;
  if (data.action === "delete") {
    const {
      error: error2
    } = await sb.from("providers").delete().eq("id", data.id);
    if (error2) throw new Error(error2.message);
    return {
      ok: true
    };
  }
  const patch = {};
  const inOneYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3).toISOString();
  if (data.action === "approve") {
    patch.submission_status = "approved";
    patch.is_published = true;
  }
  if (data.action === "reject") {
    patch.submission_status = "rejected";
    patch.is_published = false;
  }
  if (data.action === "publish") patch.is_published = true;
  if (data.action === "unpublish") patch.is_published = false;
  if (data.action === "feature") {
    patch.is_featured = true;
    patch.featured_until = inOneYear;
    patch.plan = "featured";
    patch.listing_paid_until = inOneYear;
  }
  if (data.action === "unfeature") {
    patch.is_featured = false;
    patch.featured_until = null;
    const {
      data: row
    } = await sb.from("providers").select("listing_paid_until").eq("id", data.id).maybeSingle();
    const paidUntil = row?.listing_paid_until ? new Date(row.listing_paid_until).getTime() : 0;
    patch.plan = paidUntil > Date.now() ? "paid" : "free";
  }
  if (data.action === "mark_paid") {
    patch.listing_paid_until = inOneYear;
    patch.plan = "paid";
    patch.is_published = true;
  }
  if (data.action === "mark_unpaid") {
    patch.listing_paid_until = null;
    patch.plan = "free";
    patch.is_featured = false;
    patch.featured_until = null;
  }
  const {
    error
  } = await sb.from("providers").update(patch).eq("id", data.id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const SubmitClaimInput = z.object({
  provider_slug: z.string().min(1).max(120),
  claimer_name: z.string().min(2).max(120),
  claimer_email: z.string().email().max(160),
  claimer_phone: z.string().max(40).optional().or(z.literal("")),
  claimer_role: z.string().max(80).optional().or(z.literal("")),
  business_email: z.string().email().max(160).optional().or(z.literal("")),
  business_phone: z.string().max(40).optional().or(z.literal("")),
  business_website: z.string().url().max(300).optional().or(z.literal("")),
  verification_notes: z.string().max(2e3).optional().or(z.literal("")),
  proposed_name: z.string().max(120).optional().or(z.literal("")),
  proposed_description: z.string().max(3e3).optional().or(z.literal("")),
  proposed_address: z.string().max(300).optional().or(z.literal("")),
  proposed_services: z.array(z.string().max(60)).max(20).optional(),
  source_path: z.string().max(300).optional().or(z.literal(""))
});
const submitProviderClaim_createServerFn_handler = createServerRpc({
  id: "3aaaec4f664ee02a164fc9f41b10527d13e0494de09916546e6f04db26003b06",
  name: "submitProviderClaim",
  filename: "src/server/directory.functions.ts"
}, (opts) => submitProviderClaim.__executeServer(opts));
const submitProviderClaim = createServerFn({
  method: "POST"
}).inputValidator((d) => SubmitClaimInput.parse(d)).handler(submitProviderClaim_createServerFn_handler, async ({
  data
}) => {
  const {
    data: prov
  } = await supabaseAdmin.from("providers").select("id, slug, claim_status").eq("slug", data.provider_slug).maybeSingle();
  if (!prov) throw new Error("Listing not found");
  if (prov.claim_status === "claimed") {
    throw new Error("This listing has already been claimed.");
  }
  const proposed = {};
  if (data.proposed_name) proposed.name = data.proposed_name;
  if (data.proposed_description) proposed.description = data.proposed_description;
  if (data.proposed_address) proposed.address = data.proposed_address;
  if (data.proposed_services?.length) proposed.services = data.proposed_services;
  if (data.business_email) proposed.email = data.business_email;
  if (data.business_phone) proposed.phone = data.business_phone;
  if (data.business_website) proposed.website_url = data.business_website;
  const {
    error
  } = await supabaseAdmin.from("provider_claims").insert({
    provider_id: prov.id,
    provider_slug: prov.slug,
    claimer_name: data.claimer_name.trim(),
    claimer_email: data.claimer_email,
    claimer_phone: data.claimer_phone || null,
    claimer_role: data.claimer_role || null,
    business_email: data.business_email || null,
    business_phone: data.business_phone || null,
    business_website: data.business_website || null,
    verification_notes: data.verification_notes || null,
    proposed_updates: proposed,
    source_path: data.source_path || null
  });
  if (error) throw new Error(error.message);
  if (prov.claim_status === "unclaimed") {
    await supabaseAdmin.from("providers").update({
      claim_status: "pending"
    }).eq("id", prov.id);
  }
  return {
    ok: true
  };
});
const adminListProviderClaims_createServerFn_handler = createServerRpc({
  id: "ab8e621daef98757eb3a39443207e2b68ac2cda182f34797fa603bc57ad3f4e3",
  name: "adminListProviderClaims",
  filename: "src/server/directory.functions.ts"
}, (opts) => adminListProviderClaims.__executeServer(opts));
const adminListProviderClaims = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(adminListProviderClaims_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    data
  } = await supabaseAdmin.from("provider_claims").select("*").order("status", {
    ascending: true
  }).order("created_at", {
    ascending: false
  }).limit(200);
  return {
    claims: data ?? []
  };
});
const adminReviewProviderClaim_createServerFn_handler = createServerRpc({
  id: "ee5f8a8bcce0d83c807b27a54adc164fd643714a74f443700fb15cedcc4805b7",
  name: "adminReviewProviderClaim",
  filename: "src/server/directory.functions.ts"
}, (opts) => adminReviewProviderClaim.__executeServer(opts));
const adminReviewProviderClaim = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject", "delete"]),
  admin_notes: z.string().max(2e3).optional(),
  apply_proposed: z.boolean().optional()
}).parse(d)).handler(adminReviewProviderClaim_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    data: claim
  } = await supabaseAdmin.from("provider_claims").select("*").eq("id", data.id).maybeSingle();
  if (!claim) throw new Error("Claim not found");
  if (data.action === "delete") {
    const {
      error
    } = await supabaseAdmin.from("provider_claims").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return {
      ok: true
    };
  }
  const newStatus = data.action === "approve" ? "approved" : "rejected";
  const {
    error: updErr
  } = await supabaseAdmin.from("provider_claims").update({
    status: newStatus,
    admin_notes: data.admin_notes ?? null,
    reviewed_at: (/* @__PURE__ */ new Date()).toISOString(),
    reviewed_by: userId
  }).eq("id", data.id);
  if (updErr) throw new Error(updErr.message);
  if (data.action === "approve") {
    const patch = {
      claim_status: "claimed",
      claimed_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (data.apply_proposed && claim.proposed_updates && typeof claim.proposed_updates === "object") {
      Object.assign(patch, claim.proposed_updates);
    }
    const {
      error: provErr
    } = await supabaseAdmin.from("providers").update(patch).eq("id", claim.provider_id);
    if (provErr) throw new Error(provErr.message);
  } else if (data.action === "reject") {
    const {
      count
    } = await supabaseAdmin.from("provider_claims").select("id", {
      count: "exact",
      head: true
    }).eq("provider_id", claim.provider_id).eq("status", "pending");
    if (!count) {
      await supabaseAdmin.from("providers").update({
        claim_status: "unclaimed"
      }).eq("id", claim.provider_id).eq("claim_status", "pending");
    }
  }
  return {
    ok: true
  };
});
const SubmitPlanInput = z.object({
  provider_slug: z.string().min(1).max(120),
  requester_name: z.string().min(2).max(120),
  requester_email: z.string().email().max(160),
  requester_phone: z.string().max(40).optional().or(z.literal("")),
  requested_plan: z.enum(["paid", "featured"]),
  payment_method: z.string().max(80).optional().or(z.literal("")),
  payment_reference: z.string().max(200).optional().or(z.literal("")),
  amount_usd: z.number().nonnegative().optional(),
  notes: z.string().max(2e3).optional().or(z.literal("")),
  source_path: z.string().max(300).optional().or(z.literal(""))
});
const submitProviderPlanRequest_createServerFn_handler = createServerRpc({
  id: "97d059c4d6aa722ad3a77614b08622323e968c000ac76acb3738e0b6caee2493",
  name: "submitProviderPlanRequest",
  filename: "src/server/directory.functions.ts"
}, (opts) => submitProviderPlanRequest.__executeServer(opts));
const submitProviderPlanRequest = createServerFn({
  method: "POST"
}).inputValidator((d) => SubmitPlanInput.parse(d)).handler(submitProviderPlanRequest_createServerFn_handler, async ({
  data
}) => {
  const {
    data: prov
  } = await supabaseAdmin.from("providers").select("id, slug").eq("slug", data.provider_slug).maybeSingle();
  if (!prov) throw new Error("Listing not found");
  const {
    error
  } = await supabaseAdmin.from("provider_plan_requests").insert({
    provider_id: prov.id,
    provider_slug: prov.slug,
    requester_name: data.requester_name.trim(),
    requester_email: data.requester_email,
    requester_phone: data.requester_phone || null,
    requested_plan: data.requested_plan,
    payment_method: data.payment_method || null,
    payment_reference: data.payment_reference || null,
    amount_usd: data.amount_usd ?? (data.requested_plan === "featured" ? 25 : 5),
    notes: data.notes || null,
    source_path: data.source_path || null
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const getProviderStatus_createServerFn_handler = createServerRpc({
  id: "0d4872eccf19ad759e2fff9edc8c9e191206b13673f783709b07520bed65bc31",
  name: "getProviderStatus",
  filename: "src/server/directory.functions.ts"
}, (opts) => getProviderStatus.__executeServer(opts));
const getProviderStatus = createServerFn({
  method: "GET"
}).inputValidator((d) => z.object({
  slug: z.string().min(1).max(120),
  email: z.string().email().max(160).optional()
}).parse(d)).handler(getProviderStatus_createServerFn_handler, async ({
  data
}) => {
  const {
    data: prov
  } = await supabaseAdmin.from("providers").select("id, slug, name, city, state_code, primary_category, is_published, is_featured, plan, claim_status, submission_status, listing_paid_until, featured_until, claimed_at").eq("slug", data.slug).maybeSingle();
  if (!prov) return {
    provider: null,
    claims: [],
    plan_requests: []
  };
  const filterEmail = data.email?.toLowerCase();
  const [{
    data: claims
  }, {
    data: reqs
  }] = await Promise.all([supabaseAdmin.from("provider_claims").select("id, status, claimer_name, claimer_email, created_at, reviewed_at, admin_notes").eq("provider_id", prov.id).order("created_at", {
    ascending: false
  }).limit(20), supabaseAdmin.from("provider_plan_requests").select("id, status, requested_plan, amount_usd, payment_method, payment_reference, requester_email, created_at, reviewed_at, admin_notes").eq("provider_id", prov.id).order("created_at", {
    ascending: false
  }).limit(20)]);
  const filterFn = (r) => !filterEmail || (r.claimer_email || r.requester_email || "").toLowerCase() === filterEmail;
  return {
    provider: prov,
    claims: (claims ?? []).filter(filterFn),
    plan_requests: (reqs ?? []).filter(filterFn)
  };
});
const adminListPlanRequests_createServerFn_handler = createServerRpc({
  id: "f0ffadc94a4cf446b4f1be0d3820a5b4d28edb89e5b740e551f235a7a74f332a",
  name: "adminListPlanRequests",
  filename: "src/server/directory.functions.ts"
}, (opts) => adminListPlanRequests.__executeServer(opts));
const adminListPlanRequests = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(adminListPlanRequests_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const {
    data
  } = await supabaseAdmin.from("provider_plan_requests").select("*").order("status", {
    ascending: true
  }).order("created_at", {
    ascending: false
  }).limit(200);
  return {
    requests: data ?? []
  };
});
const adminReviewPlanRequest_createServerFn_handler = createServerRpc({
  id: "aee9607eec0eef59aec13e133b8ce275a93f7aaf470cc2b83346a15ba2bba7da",
  name: "adminReviewPlanRequest",
  filename: "src/server/directory.functions.ts"
}, (opts) => adminReviewPlanRequest.__executeServer(opts));
const adminReviewPlanRequest = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject", "delete"]),
  admin_notes: z.string().max(2e3).optional()
}).parse(d)).handler(adminReviewPlanRequest_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const sb = supabaseAdmin;
  const {
    data: req
  } = await sb.from("provider_plan_requests").select("*").eq("id", data.id).maybeSingle();
  if (!req) throw new Error("Request not found");
  if (data.action === "delete") {
    const {
      error
    } = await sb.from("provider_plan_requests").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return {
      ok: true
    };
  }
  const newStatus = data.action === "approve" ? "approved" : "rejected";
  const {
    error: updErr
  } = await sb.from("provider_plan_requests").update({
    status: newStatus,
    admin_notes: data.admin_notes ?? null,
    reviewed_at: (/* @__PURE__ */ new Date()).toISOString(),
    reviewed_by: userId
  }).eq("id", data.id);
  if (updErr) throw new Error(updErr.message);
  if (data.action === "approve") {
    const inOneYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3).toISOString();
    const patch = {
      is_published: true,
      listing_paid_until: inOneYear,
      plan: req.requested_plan
    };
    if (req.requested_plan === "featured") {
      patch.is_featured = true;
      patch.featured_until = inOneYear;
    }
    const {
      error: provErr
    } = await supabaseAdmin.from("providers").update(patch).eq("id", req.provider_id);
    if (provErr) throw new Error(provErr.message);
  }
  return {
    ok: true
  };
});
export {
  adminBulkGenerateProviderContent_createServerFn_handler,
  adminGenerateProviderContent_createServerFn_handler,
  adminImportGscRows_createServerFn_handler,
  adminListPendingProviders_createServerFn_handler,
  adminListPlanRequests_createServerFn_handler,
  adminListProviderClaims_createServerFn_handler,
  adminListProvidersMissingAI_createServerFn_handler,
  adminListScrapeJobs_createServerFn_handler,
  adminReviewPlanRequest_createServerFn_handler,
  adminReviewProviderClaim_createServerFn_handler,
  adminScrapeProviderUrl_createServerFn_handler,
  adminUpdateProvider_createServerFn_handler,
  getCategoryCityProviders_createServerFn_handler,
  getCategoryStateProviders_createServerFn_handler,
  getCategoryWithProviders_createServerFn_handler,
  getProviderStatus_createServerFn_handler,
  listCategoryGeoCoverage_createServerFn_handler,
  listServiceCategories_createServerFn_handler,
  submitProviderClaim_createServerFn_handler,
  submitProviderListing_createServerFn_handler,
  submitProviderPlanRequest_createServerFn_handler
};
