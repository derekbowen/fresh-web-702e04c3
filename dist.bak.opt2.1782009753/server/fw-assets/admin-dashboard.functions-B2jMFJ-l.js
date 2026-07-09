import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
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
async function requireAdmin(userId) {
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Not authorized");
}
const getDashboardStats_createServerFn_handler = createServerRpc({
  id: "bec71ddc1a645896e13cf953b3185e973f7a6d59a51aaffb546ae8c3a3e4a12b",
  name: "getDashboardStats",
  filename: "src/server/admin-dashboard.functions.ts"
}, (opts) => getDashboardStats.__executeServer(opts));
const getDashboardStats = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getDashboardStats_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await requireAdmin(userId);
  const sb = supabaseAdmin;
  const now = Date.now();
  const day = new Date(now - 24 * 60 * 60 * 1e3).toISOString();
  const week = new Date(now - 7 * 24 * 60 * 60 * 1e3).toISOString();
  const twoWeeks = new Date(now - 14 * 24 * 60 * 60 * 1e3).toISOString();
  const month = new Date(now - 30 * 24 * 60 * 60 * 1e3).toISOString();
  const startOfTodayIso = new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0)).toISOString();
  const cnt = (q) => q.then((r) => r.count ?? 0);
  const cntSafe = (q) => q.then((r) => r.count ?? 0).catch(() => 0);
  const [cpTotal, cpPublished, cpPending, cpNeeds, cpLast24, blogTotal, blogPub, coursesTotal, coursesPub, helpTotal, helpPub, citiesTotal, citiesPub, providersTotal, providersPub, listingsTotal, listingsCreated7d, listingsCreatedToday, profilesTotal, profilesToday, profiles7d, profiles30d, adminsRows, waitlistTotal, waitlist7d, leadsTotal, leadsNew, hostLeadsTotal, hostLeadsLast7d, claimsPending, planRequestsPending, missingTotal, missingUnresolved] = await Promise.all([cnt(sb.from("content_pages").select("*", {
    count: "exact",
    head: true
  }).like("url_path", "/p/%")), cnt(sb.from("content_pages").select("*", {
    count: "exact",
    head: true
  }).like("url_path", "/p/%").eq("status", "published")), cnt(sb.from("content_pages").select("*", {
    count: "exact",
    head: true
  }).like("url_path", "/p/%").neq("status", "published")), cnt(sb.from("content_pages").select("*", {
    count: "exact",
    head: true
  }).like("url_path", "/p/%").neq("status", "published")), cnt(sb.from("content_pages").select("*", {
    count: "exact",
    head: true
  }).like("url_path", "/p/%").eq("status", "published").gte("updated_at", day)), cnt(sb.from("blog_posts").select("*", {
    count: "exact",
    head: true
  })), cnt(sb.from("blog_posts").select("*", {
    count: "exact",
    head: true
  }).eq("is_published", true)), cnt(sb.from("courses").select("*", {
    count: "exact",
    head: true
  })), cnt(sb.from("courses").select("*", {
    count: "exact",
    head: true
  }).eq("is_published", true)), cnt(sb.from("help_articles").select("*", {
    count: "exact",
    head: true
  })), cnt(sb.from("help_articles").select("*", {
    count: "exact",
    head: true
  }).eq("is_published", true)), cnt(sb.from("cities").select("*", {
    count: "exact",
    head: true
  })), cnt(sb.from("cities").select("*", {
    count: "exact",
    head: true
  }).eq("is_published", true)), cnt(sb.from("providers").select("*", {
    count: "exact",
    head: true
  })), cnt(sb.from("providers").select("*", {
    count: "exact",
    head: true
  }).eq("is_published", true)), cnt(sb.from("synced_listings").select("*", {
    count: "exact",
    head: true
  }).eq("is_deleted", false)), cntSafe(sb.from("synced_listings").select("*", {
    count: "exact",
    head: true
  }).eq("is_deleted", false).gte("created_at", week)), cntSafe(sb.from("synced_listings").select("*", {
    count: "exact",
    head: true
  }).eq("is_deleted", false).gte("created_at", startOfTodayIso)), cnt(sb.from("profiles").select("*", {
    count: "exact",
    head: true
  })), cntSafe(sb.from("profiles").select("*", {
    count: "exact",
    head: true
  }).gte("created_at", startOfTodayIso)), cntSafe(sb.from("profiles").select("*", {
    count: "exact",
    head: true
  }).gte("created_at", week)), cntSafe(sb.from("profiles").select("*", {
    count: "exact",
    head: true
  }).gte("created_at", month)), sb.from("user_roles").select("user_id", {
    count: "exact",
    head: true
  }).eq("role", "admin").then((r) => r.count ?? 0), cnt(sb.from("pool_waitlist").select("*", {
    count: "exact",
    head: true
  })), cnt(sb.from("pool_waitlist").select("*", {
    count: "exact",
    head: true
  }).gte("created_at", week)), cnt(sb.from("provider_leads").select("*", {
    count: "exact",
    head: true
  })), cnt(sb.from("provider_leads").select("*", {
    count: "exact",
    head: true
  }).eq("status", "new")), cntSafe(sb.from("host_leads").select("*", {
    count: "exact",
    head: true
  })), cntSafe(sb.from("host_leads").select("*", {
    count: "exact",
    head: true
  }).gte("created_at", week)), cntSafe(sb.from("provider_claims").select("*", {
    count: "exact",
    head: true
  }).eq("status", "pending")), cntSafe(sb.from("provider_plan_requests").select("*", {
    count: "exact",
    head: true
  }).eq("status", "pending")), cnt(sb.from("content_404_log").select("*", {
    count: "exact",
    head: true
  })), cnt(sb.from("content_404_log").select("*", {
    count: "exact",
    head: true
  }).is("resolved_at", null))]);
  const [oldestLead, oldestClaim, oldestPlanReq] = await Promise.all([sb.from("provider_leads").select("created_at").eq("status", "new").order("created_at", {
    ascending: true
  }).limit(1).maybeSingle(), sb.from("provider_claims").select("created_at").eq("status", "pending").order("created_at", {
    ascending: true
  }).limit(1).maybeSingle(), sb.from("provider_plan_requests").select("created_at").eq("status", "pending").order("created_at", {
    ascending: true
  }).limit(1).maybeSingle()]);
  const ageHours = (iso) => iso ? Math.max(0, Math.round((now - new Date(iso).getTime()) / 36e5)) : null;
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1e3);
  const {
    data: pubRecent
  } = await sb.from("content_pages").select("updated_at").like("url_path", "/p/%").eq("status", "published").gte("updated_at", sevenDaysAgo.toISOString()).limit(1e4);
  const ppdMap = /* @__PURE__ */ new Map();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 864e5);
    ppdMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of pubRecent || []) {
    const k = r.updated_at?.slice(0, 10);
    if (k && ppdMap.has(k)) ppdMap.set(k, (ppdMap.get(k) || 0) + 1);
  }
  const publishedPerDay = Array.from(ppdMap.entries()).map(([date, count]) => ({
    date,
    count
  }));
  const gscData = {
    lastCapturedAt: null,
    indexedPages: 0,
    clicks7d: 0,
    clicksPrior7d: 0,
    impressions7d: 0,
    impressionsPrior7d: 0,
    avgPosition7d: null,
    avgPositionPrior7d: null,
    winners: [],
    losers: []
  };
  try {
    const {
      data: gscRows
    } = await sb.from("gsc_query_data").select("url_path, clicks, impressions, position, captured_at").gte("captured_at", twoWeeks).limit(5e4);
    if (gscRows && gscRows.length) {
      const last = gscRows.reduce((acc, r) => !acc || r.captured_at > acc ? r.captured_at : acc, null);
      gscData.lastCapturedAt = last;
      const pageSet = /* @__PURE__ */ new Set();
      const cur = /* @__PURE__ */ new Map();
      const prior = /* @__PURE__ */ new Map();
      let posSumCur = 0, posCntCur = 0, posSumPrior = 0, posCntPrior = 0;
      for (const r of gscRows) {
        pageSet.add(r.url_path);
        if (r.captured_at >= week) {
          gscData.clicks7d += r.clicks || 0;
          gscData.impressions7d += r.impressions || 0;
          cur.set(r.url_path, (cur.get(r.url_path) || 0) + (r.clicks || 0));
          if (r.position != null) {
            posSumCur += Number(r.position);
            posCntCur++;
          }
        } else {
          gscData.clicksPrior7d += r.clicks || 0;
          gscData.impressionsPrior7d += r.impressions || 0;
          prior.set(r.url_path, (prior.get(r.url_path) || 0) + (r.clicks || 0));
          if (r.position != null) {
            posSumPrior += Number(r.position);
            posCntPrior++;
          }
        }
      }
      gscData.indexedPages = pageSet.size;
      gscData.avgPosition7d = posCntCur ? posSumCur / posCntCur : null;
      gscData.avgPositionPrior7d = posCntPrior ? posSumPrior / posCntPrior : null;
      const allPaths = /* @__PURE__ */ new Set([...cur.keys(), ...prior.keys()]);
      const diffs = Array.from(allPaths).map((p) => {
        const c = cur.get(p) || 0;
        const pr = prior.get(p) || 0;
        return {
          url_path: p,
          clicks: c,
          delta: c - pr
        };
      });
      gscData.winners = diffs.filter((d) => d.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 5);
      gscData.losers = diffs.filter((d) => d.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 5);
    }
  } catch {
  }
  const {
    data: byTemplateRaw
  } = await sb.from("content_pages").select("template_type, status").like("url_path", "/p/%").limit(5e3);
  const tplMap = /* @__PURE__ */ new Map();
  for (const r of byTemplateRaw || []) {
    const k = r.template_type || "(none)";
    const cur = tplMap.get(k) || {
      total: 0,
      published: 0
    };
    cur.total++;
    if (r.status === "published") cur.published++;
    tplMap.set(k, cur);
  }
  const byTemplate = Array.from(tplMap.entries()).map(([template_type, v]) => ({
    template_type,
    ...v
  })).sort((a, b) => b.total - a.total);
  const {
    data: recent
  } = await sb.from("content_pages").select("url_path, title, updated_at, body_markdown").like("url_path", "/p/%").eq("status", "published").order("updated_at", {
    ascending: false
  }).limit(10);
  const recentlyPublished = (recent || []).map((r) => ({
    url_path: r.url_path,
    title: r.title,
    updated_at: r.updated_at,
    words: (r.body_markdown || "").split(/\s+/).filter(Boolean).length
  }));
  const {
    data: lastSync
  } = await sb.from("listing_sync_log").select("finished_at, started_at").order("started_at", {
    ascending: false
  }).limit(1).maybeSingle();
  const [siteIssuesRes, tplQualityRes] = await Promise.all([sb.from("site_issues").select("*").maybeSingle(), sb.from("template_quality_breakdown").select("*")]);
  const siteIssues = siteIssuesRes.data || {
    missing_meta_published: 0,
    missing_schema_published: 0,
    no_links_published: 0,
    title_is_slug_published: 0,
    thin_published_total: 0,
    empty_published_total: 0
  };
  const qualityByTemplate = (tplQualityRes.data || []).map((r) => ({
    template_type: r.template_type,
    total: Number(r.total) || 0,
    published: Number(r.published) || 0,
    pending: Number(r.pending) || 0,
    published_empty: Number(r.published_empty) || 0,
    published_thin: Number(r.published_thin) || 0,
    published_medium: Number(r.published_medium) || 0,
    published_healthy: Number(r.published_healthy) || 0,
    published_missing_body: Number(r.published_missing_body) || 0,
    avg_words_published: r.avg_words_published == null ? null : Number(r.avg_words_published),
    oldest_pending: r.oldest_pending,
    published_last_7d: Number(r.published_last_7d) || 0
  })).sort((a, b) => b.total - a.total);
  const pendingTemplates = qualityByTemplate.filter((q) => q.pending > 10).map((q) => q.template_type).filter((x) => !!x);
  const pendingDiagnostics = [];
  if (pendingTemplates.length > 0) {
    const {
      data: pendingRows
    } = await sb.from("content_pages").select("template_type, slug, title, seo_description, body_markdown").like("url_path", "/p/%").neq("status", "published").in("template_type", pendingTemplates).limit(5e3);
    const allSlugs = (pendingRows || []).map((r) => r.slug).filter(Boolean);
    const errorBySlug = /* @__PURE__ */ new Map();
    for (let i = 0; i < allSlugs.length; i += 500) {
      const chunk = allSlugs.slice(i, i + 500);
      const {
        data: planErrs
      } = await sb.from("content_plan").select("slug, last_error").in("slug", chunk).not("last_error", "is", null);
      for (const r of planErrs || []) {
        if (r.last_error) errorBySlug.set(r.slug, r.last_error);
      }
    }
    const byTpl = /* @__PURE__ */ new Map();
    for (const r of pendingRows || []) {
      const k = r.template_type || "(none)";
      const cur = byTpl.get(k) || {
        pending: 0,
        missing_body: 0,
        missing_title: 0,
        missing_meta: 0,
        missing_slug: 0,
        errors: /* @__PURE__ */ new Map()
      };
      cur.pending++;
      if (!r.body_markdown || String(r.body_markdown).trim().length === 0) cur.missing_body++;
      if (!r.title || String(r.title).trim().length === 0) cur.missing_title++;
      if (!r.seo_description || String(r.seo_description).trim().length === 0) cur.missing_meta++;
      if (!r.slug) cur.missing_slug++;
      const err = errorBySlug.get(r.slug);
      if (err) {
        const short = err.length > 120 ? err.slice(0, 120) + "…" : err;
        cur.errors.set(short, (cur.errors.get(short) || 0) + 1);
      }
      byTpl.set(k, cur);
    }
    for (const [tpl, v] of byTpl.entries()) {
      const top_errors = Array.from(v.errors.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([reason, count]) => ({
        reason,
        count
      }));
      pendingDiagnostics.push({
        template_type: tpl,
        pending: v.pending,
        missing_body: v.missing_body,
        missing_title: v.missing_title,
        missing_meta: v.missing_meta,
        missing_slug: v.missing_slug,
        top_errors
      });
    }
    pendingDiagnostics.sort((a, b) => b.pending - a.pending);
  }
  const [spanishPagesRes, spanishPubRes, spanishPlanPendingRes, esCitiesRes, citiesTotalRes] = await Promise.all([cnt(sb.from("content_pages").select("*", {
    count: "exact",
    head: true
  }).like("url_path", "/p/%").or("locale.eq.es,template_type.eq.host_acq_city_es,template_type.eq.spanish_host_acq,template_type.eq.spanish_resource")), cnt(sb.from("content_pages").select("*", {
    count: "exact",
    head: true
  }).like("url_path", "/p/%").eq("status", "published").or("locale.eq.es,template_type.eq.host_acq_city_es,template_type.eq.spanish_host_acq,template_type.eq.spanish_resource")), cnt(sb.from("content_plan").select("*", {
    count: "exact",
    head: true
  }).eq("source_type", "hosting_es").eq("status", "pending")), cnt(sb.from("content_plan").select("*", {
    count: "exact",
    head: true
  }).eq("source_type", "hosting_es")), cnt(sb.from("cities").select("*", {
    count: "exact",
    head: true
  }).eq("is_published", true))]);
  return {
    contentPages: {
      total: cpTotal,
      published: cpPublished,
      pending: cpPending,
      needsContent: cpNeeds,
      last24h: cpLast24,
      publishedPerDay
    },
    byTemplate,
    recentlyPublished,
    blog: {
      total: blogTotal,
      published: blogPub
    },
    courses: {
      total: coursesTotal,
      published: coursesPub
    },
    helpArticles: {
      total: helpTotal,
      published: helpPub
    },
    cities: {
      total: citiesTotal,
      published: citiesPub
    },
    providers: {
      total: providersTotal,
      published: providersPub,
      pending: Math.max(0, providersTotal - providersPub)
    },
    listings: {
      total: listingsTotal,
      lastSync: lastSync?.finished_at || lastSync?.started_at || null,
      createdLast7d: listingsCreated7d,
      createdToday: listingsCreatedToday
    },
    users: {
      profiles: profilesTotal,
      admins: adminsRows,
      newProfilesToday: profilesToday,
      newProfiles7d: profiles7d,
      newProfiles30d: profiles30d
    },
    waitlist: {
      total: waitlistTotal,
      last7d: waitlist7d
    },
    leads: {
      total: leadsTotal,
      new: leadsNew,
      oldestAgeHours: ageHours(oldestLead.data?.created_at),
      hostLeadsTotal,
      hostLeadsLast7d
    },
    claims: {
      pending: claimsPending,
      oldestAgeHours: ageHours(oldestClaim.data?.created_at)
    },
    planRequests: {
      pending: planRequestsPending,
      oldestAgeHours: ageHours(oldestPlanReq.data?.created_at)
    },
    missing404s: {
      total: missingTotal,
      unresolved: missingUnresolved
    },
    gsc: gscData,
    quality: {
      siteIssues,
      byTemplate: qualityByTemplate
    },
    pendingDiagnostics,
    spanish: {
      pages_total: spanishPagesRes,
      pages_published: spanishPubRes,
      pages_pending: spanishPagesRes - spanishPubRes,
      plan_pending: spanishPlanPendingRes,
      cities_with_es: esCitiesRes,
      cities_eligible: citiesTotalRes
    },
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
});
export {
  getDashboardStats_createServerFn_handler
};
