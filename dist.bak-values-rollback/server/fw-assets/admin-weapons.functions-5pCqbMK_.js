import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
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
async function assertAdmin(userId) {
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}
const sb = () => supabaseAdmin;
const listCompetitorSites_createServerFn_handler = createServerRpc({
  id: "14d3a7795c2abab014699fc5ca23f7dcfbd829cbf0f184dbab271f7d1ee3627b",
  name: "listCompetitorSites",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => listCompetitorSites.__executeServer(opts));
const listCompetitorSites = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listCompetitorSites_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const {
    data
  } = await sb().from("competitor_sites").select("*").order("created_at", {
    ascending: false
  });
  return {
    rows: data || []
  };
});
const addCompetitorSite_createServerFn_handler = createServerRpc({
  id: "e9130c2cdd8853e7faf0eea4716513a3f57ca2e62d985fc7567092bf62b9b2b3",
  name: "addCompetitorSite",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => addCompetitorSite.__executeServer(opts));
const addCompetitorSite = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  domain: z.string().min(2).max(200),
  sitemap_url: z.string().url(),
  label: z.string().max(120).optional()
}).parse(d)).handler(addCompetitorSite_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const domain = data.domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
  const {
    error
  } = await sb().from("competitor_sites").insert({
    domain,
    sitemap_url: data.sitemap_url,
    label: data.label ?? null
  });
  return error ? {
    ok: false,
    error: error.message
  } : {
    ok: true
  };
});
const deleteCompetitorSite_createServerFn_handler = createServerRpc({
  id: "f8f33b2e00023d190f133d5f13a011c6929b3eb24179e18e2bf68d76d7277333",
  name: "deleteCompetitorSite",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => deleteCompetitorSite.__executeServer(opts));
const deleteCompetitorSite = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(deleteCompetitorSite_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    error
  } = await sb().from("competitor_sites").delete().eq("id", data.id);
  return error ? {
    ok: false,
    error: error.message
  } : {
    ok: true
  };
});
async function fetchSitemapUrls(sitemapUrl, depth = 0) {
  if (depth > 2) return [];
  const res = await fetch(sitemapUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PoolRentalNearMeBot/1.0; +https://www.poolrentalnearme.com)"
    }
  });
  if (!res.ok) throw new Error(`Sitemap fetch ${res.status}`);
  const xml = await res.text();
  const locs = Array.from(xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)).map((m) => m[1]);
  if (/<sitemapindex/i.test(xml)) {
    const out = [];
    for (const child of locs.slice(0, 25)) {
      try {
        const sub = await fetchSitemapUrls(child, depth + 1);
        out.push(...sub);
      } catch {
      }
    }
    return out;
  }
  return locs;
}
const runCompetitorScan_createServerFn_handler = createServerRpc({
  id: "81517c05c1e8aa3058d7a03b968d70633c743aa30df757eb20b82cc10f236231",
  name: "runCompetitorScan",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => runCompetitorScan.__executeServer(opts));
const runCompetitorScan = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  site_id: z.string().uuid().optional()
}).parse(d ?? {})).handler(runCompetitorScan_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  let q = sb().from("competitor_sites").select("*").eq("is_active", true);
  if (data.site_id) q = q.eq("id", data.site_id);
  const {
    data: sites
  } = await q;
  const results = [];
  for (const site of sites || []) {
    try {
      const urls = await fetchSitemapUrls(site.sitemap_url);
      const unique = Array.from(new Set(urls)).slice(0, 1e4);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const {
        data: existing
      } = await sb().from("competitor_urls").select("url").eq("site_id", site.id);
      const existingSet = new Set((existing || []).map((r) => r.url));
      const newOnes = unique.filter((u) => !existingSet.has(u));
      if (newOnes.length) {
        await sb().from("competitor_urls").insert(newOnes.map((url) => {
          const c = quickClassifyUrl(url);
          return {
            site_id: site.id,
            url,
            first_seen_at: now,
            last_seen_at: now,
            kind: c.kind,
            city_slug: c.city_slug,
            state_code: c.state_code
          };
        }));
      }
      const stillSeen = unique.filter((u) => existingSet.has(u));
      if (stillSeen.length) {
        for (let i = 0; i < stillSeen.length; i += 500) {
          const chunk = stillSeen.slice(i, i + 500);
          await sb().from("competitor_urls").update({
            last_seen_at: now
          }).eq("site_id", site.id).in("url", chunk);
        }
      }
      await sb().from("competitor_sites").update({
        last_checked_at: now,
        last_url_count: unique.length
      }).eq("id", site.id);
      results.push({
        domain: site.domain,
        new_count: newOnes.length,
        total: unique.length
      });
    } catch (e) {
      results.push({
        domain: site.domain,
        new_count: 0,
        total: 0,
        error: e?.message || "scan failed"
      });
    }
  }
  return {
    ok: true,
    results
  };
});
const listNewCompetitorUrls_createServerFn_handler = createServerRpc({
  id: "063d69f1f2682b59006a835b8640aa63cdedf46c94ba36000c97b0e2b755d48c",
  name: "listNewCompetitorUrls",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => listNewCompetitorUrls.__executeServer(opts));
const listNewCompetitorUrls = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  onlyUnacknowledged: z.boolean().default(true),
  limit: z.number().int().min(10).max(500).default(100),
  site_id: z.string().uuid().optional(),
  kind: z.string().optional(),
  excludeListings: z.boolean().default(true)
}).parse(d ?? {})).handler(listNewCompetitorUrls_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  let q = sb().from("competitor_urls").select("id, site_id, url, first_seen_at, last_seen_at, scraped_at, title, word_count, acknowledged, kind, city_slug, state_code, summary, competitor_sites(domain)").order("first_seen_at", {
    ascending: false
  }).limit(data.limit);
  if (data.onlyUnacknowledged) q = q.eq("acknowledged", false);
  if (data.site_id) q = q.eq("site_id", data.site_id);
  if (data.kind) q = q.eq("kind", data.kind);
  if (data.excludeListings && !data.kind) q = q.neq("kind", "listing");
  const {
    data: rows
  } = await q;
  const flat = (rows || []).map((r) => ({
    ...r,
    domain: r.competitor_sites?.domain ?? null
  }));
  return {
    rows: flat
  };
});
const acknowledgeCompetitorUrls_createServerFn_handler = createServerRpc({
  id: "838ce17b61ad793223f9dd93e9e9b2b4c1045ee67bfb5530aa43246671b556c3",
  name: "acknowledgeCompetitorUrls",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => acknowledgeCompetitorUrls.__executeServer(opts));
const acknowledgeCompetitorUrls = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  ids: z.array(z.string().uuid()).min(1).max(500)
}).parse(d)).handler(acknowledgeCompetitorUrls_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    error
  } = await sb().from("competitor_urls").update({
    acknowledged: true
  }).in("id", data.ids);
  return error ? {
    ok: false,
    error: error.message
  } : {
    ok: true
  };
});
const scrapeCompetitorUrlRow_createServerFn_handler = createServerRpc({
  id: "fcf0ff2b7c8a68737b6230c3f299dde154914c843f5adef72505231480e8349d",
  name: "scrapeCompetitorUrlRow",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => scrapeCompetitorUrlRow.__executeServer(opts));
const scrapeCompetitorUrlRow = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(scrapeCompetitorUrlRow_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    data: row
  } = await sb().from("competitor_urls").select("id, url").eq("id", data.id).maybeSingle();
  if (!row) return {
    ok: false,
    error: "Not found"
  };
  const fcKey = process.env.FIRECRAWL_API_KEY;
  if (!fcKey) return {
    ok: false,
    error: "FIRECRAWL_API_KEY not configured"
  };
  const resp = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${fcKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url: row.url,
      formats: ["markdown"],
      onlyMainContent: true
    })
  });
  if (!resp.ok) return {
    ok: false,
    error: `Firecrawl ${resp.status}`
  };
  const json = await resp.json();
  const doc = json?.data || json;
  const md = doc?.markdown || "";
  const meta = doc?.metadata || {};
  const word_count = md.split(/\s+/).filter(Boolean).length;
  await sb().from("competitor_urls").update({
    title: meta.title || meta.ogTitle || null,
    word_count,
    scraped_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", data.id);
  return {
    ok: true,
    word_count
  };
});
const listHostMatches_createServerFn_handler = createServerRpc({
  id: "d5d6363526ad9356a9568b0cf6305fe377136ecdf597a5a6aa32d7a2a4b9c76f",
  name: "listHostMatches",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => listHostMatches.__executeServer(opts));
const listHostMatches = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  status: z.enum(["new", "review", "contacted", "converted", "dismissed", "all"]).default("new"),
  minConfidence: z.number().min(0).max(100).default(40),
  limit: z.number().min(1).max(500).default(100)
}).parse(d ?? {})).handler(listHostMatches_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  let q = sb().from("competitor_host_matches").select("*").gte("match_confidence", data.minConfidence).order("match_confidence", {
    ascending: false
  }).order("created_at", {
    ascending: false
  }).limit(data.limit);
  if (data.status !== "all") q = q.eq("status", data.status);
  const {
    data: rows
  } = await q;
  return {
    rows: rows || []
  };
});
const updateHostMatchStatus_createServerFn_handler = createServerRpc({
  id: "17ad8af8ba6e68526b52fdfb1c681b33c73722d3b8ffbb3f02b3c71a073be8a9",
  name: "updateHostMatchStatus",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => updateHostMatchStatus.__executeServer(opts));
const updateHostMatchStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "review", "contacted", "converted", "dismissed"]),
  admin_notes: z.string().max(2e3).optional()
}).parse(d)).handler(updateHostMatchStatus_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const patch = {
    status: data.status
  };
  if (data.admin_notes !== void 0) patch.admin_notes = data.admin_notes;
  const {
    error
  } = await sb().from("competitor_host_matches").update(patch).eq("id", data.id);
  return error ? {
    ok: false,
    error: error.message
  } : {
    ok: true
  };
});
const runHostMatchOne_createServerFn_handler = createServerRpc({
  id: "2f479321ef485c24a7c1af7af38594c14e6580eb6ef6390f61259be3adceb4c4",
  name: "runHostMatchOne",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => runHostMatchOne.__executeServer(opts));
const runHostMatchOne = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  competitor_url_id: z.string().uuid()
}).parse(d)).handler(runHostMatchOne_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    matchCompetitorUrl
  } = await import("./host-matcher.server-DwygPzut.js");
  const {
    runReverseImageMatch
  } = await import("./reverse-image-host-matcher.server-DNawlaGx.js");
  const [textRes, imgRes] = await Promise.allSettled([matchCompetitorUrl(data.competitor_url_id), runReverseImageMatch(data.competitor_url_id)]);
  const text = textRes.status === "fulfilled" ? textRes.value : {
    ok: false,
    inserted: 0,
    reason: textRes.reason?.message
  };
  const img = imgRes.status === "fulfilled" ? imgRes.value : {
    ok: false,
    inserted: 0,
    reason: imgRes.reason?.message
  };
  return {
    ok: text.ok || img.ok,
    inserted: (text.inserted || 0) + (img.inserted || 0),
    text_pipeline: text,
    reverse_image_pipeline: img
  };
});
const enrichHostMatchOne_createServerFn_handler = createServerRpc({
  id: "f1c3dce6843fd729808eda510284e96dbaff7ed3b9b5a0caf92b8678799c8a44",
  name: "enrichHostMatchOne",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => enrichHostMatchOne.__executeServer(opts));
const enrichHostMatchOne = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  match_id: z.string().uuid(),
  force_tier: z.enum(["osint", "batchdata", "pdl"]).optional()
}).parse(d)).handler(enrichHostMatchOne_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    enrichHostMatch
  } = await import("./contact-enricher.server-XIm3a7Aa.js");
  return enrichHostMatch(data.match_id, {
    force_tier: data.force_tier
  });
});
const getEnrichmentSpend_createServerFn_handler = createServerRpc({
  id: "a7a07e080657b7e9c38ba1b0e50b073537a0661907becdc4526c1929c7fecd8b",
  name: "getEnrichmentSpend",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => getEnrichmentSpend.__executeServer(opts));
const getEnrichmentSpend = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getEnrichmentSpend_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + "-01";
  const {
    data: todayRows
  } = await sb().from("enrichment_spend_log").select("cost_usd, outcome").eq("spend_date", today);
  const {
    data: monthRows
  } = await sb().from("enrichment_spend_log").select("cost_usd").gte("spend_date", monthStart);
  const today_total = (todayRows || []).reduce((s, r) => s + Number(r.cost_usd || 0), 0);
  const month_total = (monthRows || []).reduce((s, r) => s + Number(r.cost_usd || 0), 0);
  return {
    today_spend_usd: Number(today_total.toFixed(2)),
    today_calls: (todayRows || []).length,
    today_hits: (todayRows || []).filter((r) => r.outcome === "hit").length,
    month_spend_usd: Number(month_total.toFixed(2)),
    daily_cap_usd: 10,
    monthly_target_usd: 25
  };
});
const reportFalsePositive_createServerFn_handler = createServerRpc({
  id: "30a11be2cd92777ceb4b7820523f59c4841cec6a29507dc822a37ff237e40ef6",
  name: "reportFalsePositive",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => reportFalsePositive.__executeServer(opts));
const reportFalsePositive = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  match_id: z.string().uuid(),
  reason: z.string().max(500).optional()
}).parse(d)).handler(reportFalsePositive_createServerFn_handler, async ({
  data,
  context
}) => {
  const userId = context.userId;
  await assertAdmin(userId);
  const {
    data: m
  } = await sb().from("competitor_host_matches").select("*").eq("id", data.match_id).maybeSingle();
  if (!m) return {
    ok: false,
    error: "match not found"
  };
  await sb().from("host_match_false_positives").insert({
    match_id: m.id,
    competitor_url: m.competitor_url,
    domain: m.domain,
    candidate_name: m.candidate_name,
    candidate_business_name: m.candidate_business_name,
    candidate_email: m.candidate_email,
    candidate_phone: m.candidate_phone,
    candidate_website: m.candidate_website,
    candidate_source: m.candidate_source,
    host_first_name: m.host_first_name,
    host_city: m.host_city,
    host_state: m.host_state,
    match_confidence: m.match_confidence,
    reason: data.reason || null,
    reported_by: userId
  });
  await sb().from("competitor_host_matches").update({
    status: "dismissed",
    admin_notes: `[false positive] ${data.reason || ""}`.slice(0, 2e3)
  }).eq("id", m.id);
  return {
    ok: true
  };
});
const runValidatorSelfTests_createServerFn_handler = createServerRpc({
  id: "8dbe2da725144eb48bdf897d14b83c410cc1af034c9b31425d792593734a3aec",
  name: "runValidatorSelfTests",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => runValidatorSelfTests.__executeServer(opts));
const runValidatorSelfTests = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(runValidatorSelfTests_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const {
    runSelfTests
  } = await import("./lead-validators.server-C0OugZJy.js");
  const results = runSelfTests();
  return {
    results,
    allPassed: results.every((r) => r.pass)
  };
});
const listTrackedKeywords_createServerFn_handler = createServerRpc({
  id: "0124477d5fcebea7d632a84eb6e0f6cfd986607cf4973f3a42509c15795f339b",
  name: "listTrackedKeywords",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => listTrackedKeywords.__executeServer(opts));
const listTrackedKeywords = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listTrackedKeywords_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const {
    data
  } = await sb().from("tracked_keywords").select("*").order("last_position", {
    ascending: true,
    nullsFirst: false
  });
  return {
    rows: data || []
  };
});
const addTrackedKeyword_createServerFn_handler = createServerRpc({
  id: "e56c4f372d6ef42c8ecf0c6f075396156ca179d82e7f859bed028f61ebfd10a2",
  name: "addTrackedKeyword",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => addTrackedKeyword.__executeServer(opts));
const addTrackedKeyword = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  keyword: z.string().min(1).max(200),
  target_url_path: z.string().max(300).optional(),
  market: z.string().max(10).default("us")
}).parse(d)).handler(addTrackedKeyword_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    error
  } = await sb().from("tracked_keywords").insert({
    keyword: data.keyword.trim(),
    target_url_path: data.target_url_path || null,
    market: data.market
  });
  return error ? {
    ok: false,
    error: error.message
  } : {
    ok: true
  };
});
const deleteTrackedKeyword_createServerFn_handler = createServerRpc({
  id: "d674bdd5bdaa8c00e13bd3438b79f6705b4f57bc585f3b5b72f3e6d171fab6f3",
  name: "deleteTrackedKeyword",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => deleteTrackedKeyword.__executeServer(opts));
const deleteTrackedKeyword = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(deleteTrackedKeyword_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    error
  } = await sb().from("tracked_keywords").delete().eq("id", data.id);
  return error ? {
    ok: false,
    error: error.message
  } : {
    ok: true
  };
});
const runSerpCheck_createServerFn_handler = createServerRpc({
  id: "7836715b7533f15d606ba7be7927f494bc1c0c7f659c9bc9eff3c4c04eeb1796",
  name: "runSerpCheck",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => runSerpCheck.__executeServer(opts));
const runSerpCheck = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(50).default(20)
}).parse(d ?? {})).handler(runSerpCheck_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const serpKey = process.env.SERPAPI_KEY;
  if (!serpKey) return {
    ok: false,
    error: "SERPAPI_KEY not configured"
  };
  let q = sb().from("tracked_keywords").select("*").eq("is_active", true);
  if (data.id) q = q.eq("id", data.id);
  else q = q.order("last_checked_at", {
    ascending: true,
    nullsFirst: true
  }).limit(data.limit);
  const {
    data: kws
  } = await q;
  const results = [];
  for (const kw of kws || []) {
    try {
      const params = new URLSearchParams({
        engine: "google",
        q: kw.keyword,
        gl: kw.market || "us",
        hl: "en",
        num: "100",
        api_key: serpKey
      });
      const resp = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        results.push({
          keyword: kw.keyword,
          position: null,
          delta: null,
          error: `serpapi ${resp.status}: ${txt.slice(0, 120)}`
        });
        continue;
      }
      const json = await resp.json();
      const organic = Array.isArray(json?.organic_results) ? json.organic_results : [];
      let position = null;
      let urlFound = null;
      for (const r of organic) {
        const link = r?.link || "";
        if (link.includes("poolrentalnearme.com")) {
          position = typeof r?.position === "number" ? r.position : organic.indexOf(r) + 1;
          urlFound = link;
          break;
        }
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      await sb().from("serp_rankings").insert({
        keyword_id: kw.id,
        position,
        url_found: urlFound,
        checked_at: now
      });
      await sb().from("tracked_keywords").update({
        previous_position: kw.last_position,
        last_position: position,
        last_checked_at: now
      }).eq("id", kw.id);
      const delta = kw.last_position != null && position != null ? kw.last_position - position : null;
      results.push({
        keyword: kw.keyword,
        position,
        delta
      });
    } catch (e) {
      results.push({
        keyword: kw.keyword,
        position: null,
        delta: null,
        error: e?.message || String(e)
      });
    }
  }
  return {
    ok: true,
    results
  };
});
function normalizeAuditPath(input) {
  let p = (input || "").trim();
  p = p.replace(/^https?:\/\/[^/]+/i, "");
  p = p.replace(/[?#].*$/, "");
  if (p.length > 1) p = p.replace(/\/+$/, "");
  if (!p.startsWith("/")) p = "/" + p;
  return p;
}
const auditPage_createServerFn_handler = createServerRpc({
  id: "c1846078e13f13d425356cd4d277ba0cef460600feb88188568f2153800b6b27",
  name: "auditPage",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => auditPage.__executeServer(opts));
const auditPage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  url_path: z.string().min(1).max(300)
}).parse(d)).handler(auditPage_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const lovKey = process.env.LOVABLE_API_KEY;
  if (!lovKey) return {
    ok: false,
    error: "LOVABLE_API_KEY not configured"
  };
  const path = normalizeAuditPath(data.url_path);
  const slugFromPath = path.replace(/^\/p\//, "");
  let {
    data: page
  } = await sb().from("content_pages").select("url_path, title, seo_description, body_markdown").eq("url_path", path).maybeSingle();
  if (!page && slugFromPath && slugFromPath !== path) {
    const {
      data: bySlug
    } = await sb().from("content_pages").select("url_path, title, seo_description, body_markdown").eq("slug", slugFromPath).maybeSingle();
    page = bySlug;
  }
  if (!page && slugFromPath) {
    const {
      data: byLegacy
    } = await sb().from("content_pages").select("url_path, title, seo_description, body_markdown").contains("legacy_slugs", [slugFromPath]).maybeSingle();
    page = byLegacy;
  }
  if (!page) {
    const needle = slugFromPath || path.replace(/^\//, "");
    const {
      data: similar
    } = await sb().from("content_pages").select("url_path, title, status").or(`url_path.ilike.%${needle}%,slug.ilike.%${needle}%,title.ilike.%${needle}%`).limit(8);
    return {
      ok: false,
      error: `Page not found for "${path}".`,
      suggestions: (similar || []).map((r) => ({
        url_path: r.url_path,
        title: r.title,
        status: r.status
      }))
    };
  }
  const {
    data: comps
  } = await sb().from("competitor_pages").select("url, title, word_count, headings").order("word_count", {
    ascending: false
  }).limit(3);
  const ourBody = (page.body_markdown || "").slice(0, 8e3);
  const compSummary = (comps || []).map((c) => `- ${c.url} (${c.word_count} words): ${(c.headings || []).slice(0, 8).map((h) => h.text).join(" | ")}`).join("\n") || "No competitor data yet.";
  const prompt = `You are an SEO auditor. Score this page 0-100 vs top-ranking competitors and return STRICT JSON:
{"score": <0-100>, "summary": "<one sentence>", "strengths": ["..."], "weaknesses": ["..."], "recommendations": ["..."]}

Page URL: ${page.url_path}
Title: ${page.title || "(none)"}
Description: ${page.seo_description || "(none)"}
Body (truncated):
${ourBody}

Competitor pages on similar topics:
${compSummary}

Return ONLY JSON, no markdown fences.`;
  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{
        role: "user",
        content: prompt
      }]
    })
  });
  if (!aiResp.ok) return {
    ok: false,
    error: `AI ${aiResp.status}: ${(await aiResp.text()).slice(0, 200)}`
  };
  const aiJson = await aiResp.json();
  const content = aiJson?.choices?.[0]?.message?.content || "";
  const cleaned = content.replace(/```json\s*/i, "").replace(/```\s*$/i, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return {
      ok: false,
      error: "AI returned non-JSON",
      raw: content.slice(0, 300)
    };
  }
  const {
    data: row,
    error
  } = await sb().from("page_audits").insert({
    url_path: page.url_path || path,
    score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
    summary: String(parsed.summary || "").slice(0, 1e3),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 20) : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 20) : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 20) : []
  }).select("*").maybeSingle();
  if (error) return {
    ok: false,
    error: error.message
  };
  return {
    ok: true,
    audit: row
  };
});
const listRecentAudits_createServerFn_handler = createServerRpc({
  id: "9456853ef1f99892aad68736b1232814f585b04838b7ac7a48445eea214ece8d",
  name: "listRecentAudits",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => listRecentAudits.__executeServer(opts));
const listRecentAudits = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  limit: z.number().int().min(10).max(200).default(50),
  url_path: z.string().max(300).optional()
}).parse(d ?? {})).handler(listRecentAudits_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  let q = sb().from("page_audits").select("*").order("audited_at", {
    ascending: false
  }).limit(data.limit);
  if (data.url_path) q = q.eq("url_path", data.url_path);
  const {
    data: rows
  } = await q;
  return {
    rows: rows || []
  };
});
const LISTING_URL_PATTERNS = [/\/pooldetails\//i, /\/pool\/\d+/i, /\/listings?\/[^/]+\/?$/i, /\/l\/[a-z0-9-]{6,}/i, /\/space\/[^/]+\/?$/i, /\/venue\/[^/]+\/?$/i, /\/host\/[^/]+\/?$/i, /\/users?\/[^/]+\/?$/i];
function isListingDetailUrl(url) {
  return LISTING_URL_PATTERNS.some((rx) => rx.test(url));
}
function quickClassifyUrl(url) {
  if (isListingDetailUrl(url)) return {
    kind: "listing",
    city_slug: null,
    state_code: null
  };
  const u = url.toLowerCase();
  if (/\/blog\//.test(u) || /\/article(s)?\//.test(u) || /\/posts?\//.test(u) || /\/guide(s)?\//.test(u)) {
    return {
      kind: "blog",
      city_slug: null,
      state_code: null
    };
  }
  const cityPatterns = [/\/(?:pool-rentals?|pool-party|swimming-pool)-(?:in-|near-)?([a-z][a-z-]+)-([a-z]{2})\/?$/i, /\/(?:cities|locations?|city|area)\/([a-z][a-z-]+?)(?:-([a-z]{2}))?\/?$/i, /\/([a-z][a-z-]+)-([a-z]{2})\/?$/, /\/p\/([a-z][a-z-]+?)(?:-([a-z]{2}))?\/?$/];
  for (const rx of cityPatterns) {
    const m = u.match(rx);
    if (m) {
      const slug = m[1];
      const state = m[2] || null;
      if (slug.length >= 3 && slug.length <= 60) {
        return {
          kind: "city_page",
          city_slug: slug,
          state_code: state ? state.toUpperCase() : null
        };
      }
    }
  }
  if (/\/(?:category|categories|tag|topics?)\//.test(u)) {
    return {
      kind: "category",
      city_slug: null,
      state_code: null
    };
  }
  if (/\/(?:about|pricing|how-it-works|faq|trust|safety|insurance|help)/.test(u)) {
    return {
      kind: "feature",
      city_slug: null,
      state_code: null
    };
  }
  return {
    kind: "other",
    city_slug: null,
    state_code: null
  };
}
const classifyCompetitorUrls_createServerFn_handler = createServerRpc({
  id: "7255488cd3d4e7b307e9cba105f30422d19321023b29e2fdf03c0a277f3c66ed",
  name: "classifyCompetitorUrls",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => classifyCompetitorUrls.__executeServer(opts));
const classifyCompetitorUrls = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  limit: z.number().int().min(10).max(5e3).default(2e3),
  force: z.boolean().default(false)
}).parse(d ?? {})).handler(classifyCompetitorUrls_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  let q = sb().from("competitor_urls").select("id, url, kind").limit(data.limit);
  if (!data.force) q = q.is("kind", null);
  const {
    data: rows
  } = await q;
  const list = rows || [];
  let updated = 0;
  for (let i = 0; i < list.length; i += 100) {
    const chunk = list.slice(i, i + 100);
    await Promise.all(chunk.map(async (r) => {
      const c = quickClassifyUrl(r.url);
      const {
        error
      } = await sb().from("competitor_urls").update({
        kind: c.kind,
        city_slug: c.city_slug,
        state_code: c.state_code
      }).eq("id", r.id);
      if (!error) updated += 1;
    }));
  }
  return {
    ok: true,
    updated,
    total: list.length
  };
});
const detectCityGaps_createServerFn_handler = createServerRpc({
  id: "0bd7da178e0cf1630c83be8ef3ee6e143ec24dd39c2b16933f91e05e987bc8da",
  name: "detectCityGaps",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => detectCityGaps.__executeServer(opts));
const detectCityGaps = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  minCompetitors: z.number().int().min(1).max(5).default(1)
}).parse(d ?? {})).handler(detectCityGaps_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const {
    data: cityRows
  } = await sb().from("competitor_urls").select("url, city_slug, state_code, competitor_sites(domain)").eq("kind", "city_page").not("city_slug", "is", null).limit(5e3);
  const grouped = /* @__PURE__ */ new Map();
  for (const r of cityRows || []) {
    const key = `${r.city_slug}|${r.state_code || ""}`;
    if (!grouped.has(key)) grouped.set(key, {
      city_slug: r.city_slug,
      state_code: r.state_code,
      urls: []
    });
    grouped.get(key).urls.push({
      url: r.url,
      domain: r.competitor_sites?.domain ?? null
    });
  }
  const slugs = Array.from(grouped.keys()).map((k) => k.split("|")[0]);
  const {
    data: ours
  } = await sb().from("content_pages").select("slug, url_path").or(slugs.slice(0, 200).map((s) => `slug.ilike.%${s}%,url_path.ilike.%${s}%`).join(","));
  const oursMap = /* @__PURE__ */ new Map();
  for (const o of ours || []) {
    for (const s of slugs) {
      if ((o.slug || "").includes(s) || (o.url_path || "").includes(s)) {
        oursMap.set(s, o.slug || o.url_path);
      }
    }
  }
  const out = Array.from(grouped.values()).filter((g) => g.urls.length >= 1).map((g) => ({
    city_slug: g.city_slug,
    state_code: g.state_code,
    competitor_urls: g.urls.slice(0, 5),
    has_our_page: oursMap.has(g.city_slug),
    our_slug: oursMap.get(g.city_slug) || null
  })).sort((a, b) => {
    if (a.has_our_page !== b.has_our_page) return a.has_our_page ? 1 : -1;
    return b.competitor_urls.length - a.competitor_urls.length;
  }).slice(0, 200);
  return {
    rows: out
  };
});
const createCounterPageFromGap_createServerFn_handler = createServerRpc({
  id: "865d0dd01ecf1c3f7a56e3f80d8c3c83b18cdc856fdb0debbce528cd2f401e77",
  name: "createCounterPageFromGap",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => createCounterPageFromGap.__executeServer(opts));
const createCounterPageFromGap = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  city_slug: z.string().min(2).max(80),
  state_code: z.string().length(2).nullable().optional(),
  competitor_url: z.string().url().optional()
}).parse(d)).handler(createCounterPageFromGap_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const stateSuffix = data.state_code ? `-${data.state_code.toLowerCase()}` : "";
  const slug = `${data.city_slug}${stateSuffix}`;
  const url_path = `/p/${slug}`;
  const {
    data: existing
  } = await sb().from("content_pages").select("id, url_path").or(`slug.eq.${slug},url_path.eq.${url_path}`).maybeSingle();
  if (existing) return {
    ok: false,
    error: "Page already exists",
    url_path: existing.url_path
  };
  const cityName = data.city_slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const stateLabel = data.state_code ? `, ${data.state_code.toUpperCase()}` : "";
  const {
    data: ins,
    error
  } = await sb().from("content_pages").insert({
    slug,
    url_path,
    title: `Pool rental in ${cityName}${stateLabel}`,
    seo_title: `Pool rental ${cityName}${stateLabel} — book hourly swim time`,
    seo_description: `Find heated, private pools to rent by the hour in ${cityName}${stateLabel}. Book a backyard pool for your party, family, or workout — vetted hosts, $2M insurance included.`,
    status: "draft",
    category: "city",
    template_type: "city",
    locale: "en",
    in_sitemap: false,
    source_url: data.competitor_url || null
  }).select("id, url_path").maybeSingle();
  if (error) return {
    ok: false,
    error: error.message
  };
  return {
    ok: true,
    id: ins?.id,
    url_path: ins?.url_path
  };
});
const generateCompetitorDigest_createServerFn_handler = createServerRpc({
  id: "aeb2f7b3e575da6163f8204221e333a2295a7ca2b51efb075335bae62fd4567c",
  name: "generateCompetitorDigest",
  filename: "src/server/admin-weapons.functions.ts"
}, (opts) => generateCompetitorDigest.__executeServer(opts));
const generateCompetitorDigest = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  days: z.number().int().min(1).max(30).default(7)
}).parse(d ?? {})).handler(generateCompetitorDigest_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const since = new Date(Date.now() - data.days * 864e5).toISOString();
  const {
    data: rows
  } = await sb().from("competitor_urls").select("url, kind, city_slug, first_seen_at, competitor_sites(domain)").gte("first_seen_at", since).neq("kind", "listing").limit(1e3);
  const list = rows || [];
  if (list.length === 0) {
    return {
      ok: true,
      digest: "_No new content pages from competitors in the selected window._",
      count: 0
    };
  }
  const groups = /* @__PURE__ */ new Map();
  for (const r of list) {
    const key = `${r.competitor_sites?.domain || "unknown"}|${r.kind || "other"}`;
    if (!groups.has(key)) groups.set(key, {
      domain: r.competitor_sites?.domain || "unknown",
      kind: r.kind || "other",
      urls: []
    });
    groups.get(key).urls.push(r.url);
  }
  const summary = Array.from(groups.values()).map((g) => `${g.domain} · ${g.kind} (${g.urls.length}): ${g.urls.slice(0, 8).join(", ")}`).join("\n");
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return {
    ok: true,
    digest: `## Last ${data.days} days

\`\`\`
${summary}
\`\`\``,
    count: list.length
  };
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{
          role: "system",
          content: "You are a competitive intelligence analyst for a pool-rental marketplace. Be terse, founder-to-founder, no fluff."
        }, {
          role: "user",
          content: `Summarize what these competitors shipped in the last ${data.days} days. Identify themes (city expansion, new features, content angles), call out which competitor is moving fastest, and end with 2-3 specific actions we should take this week. Markdown, under 250 words.

${summary}`
        }]
      })
    });
    const j = await resp.json();
    const md = j?.choices?.[0]?.message?.content || `## Last ${data.days} days

${summary}`;
    return {
      ok: true,
      digest: md,
      count: list.length
    };
  } catch (e) {
    return {
      ok: true,
      digest: `## Last ${data.days} days

\`\`\`
${summary}
\`\`\``,
      count: list.length,
      warning: e?.message
    };
  }
});
export {
  acknowledgeCompetitorUrls_createServerFn_handler,
  addCompetitorSite_createServerFn_handler,
  addTrackedKeyword_createServerFn_handler,
  auditPage_createServerFn_handler,
  classifyCompetitorUrls_createServerFn_handler,
  createCounterPageFromGap_createServerFn_handler,
  deleteCompetitorSite_createServerFn_handler,
  deleteTrackedKeyword_createServerFn_handler,
  detectCityGaps_createServerFn_handler,
  enrichHostMatchOne_createServerFn_handler,
  generateCompetitorDigest_createServerFn_handler,
  getEnrichmentSpend_createServerFn_handler,
  listCompetitorSites_createServerFn_handler,
  listHostMatches_createServerFn_handler,
  listNewCompetitorUrls_createServerFn_handler,
  listRecentAudits_createServerFn_handler,
  listTrackedKeywords_createServerFn_handler,
  reportFalsePositive_createServerFn_handler,
  runCompetitorScan_createServerFn_handler,
  runHostMatchOne_createServerFn_handler,
  runSerpCheck_createServerFn_handler,
  runValidatorSelfTests_createServerFn_handler,
  scrapeCompetitorUrlRow_createServerFn_handler,
  updateHostMatchStatus_createServerFn_handler
};
