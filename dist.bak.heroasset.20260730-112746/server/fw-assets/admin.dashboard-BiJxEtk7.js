import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { s as supabase } from "./client-Dh5RMKgP.js";
import { u as checkAdminRole } from "./router-DnjagyeS.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { r as requireSupabaseAuth } from "./auth-middleware-Bd-cw3tB.js";
import { c as createServerFn } from "../server.js";
import { z } from "zod";
import { A as AdminLayout, G as GROUPS } from "./admin-layout-BAYjOizo.js";
import "@supabase/supabase-js";
import "@tanstack/react-query";
import "./site-footer-defaults-asWdr-hi.js";
import "./client.server-D5ro3rAQ.js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
import "./transactional-email.server-BoL6nxoQ.js";
import "@react-email/components";
import "./_unsubscribe-footer-DXp0Y_3B.js";
import "lucide-react";
import "./states-UIdvqlKs.js";
import "./courses.server-Bfz1suZ4.js";
import "@lovable.dev/webhooks-js";
import "crypto";
import "./emailit-DRsipvVx.js";
import "@lovable.dev/email-js";
import "./reauthentication-CCohUDQL.js";
import "node:crypto";
import "./sms.server-BJah3xxU.js";
import "./sharetribe-mirror.server-D8Jwl9-L.js";
import "./sharetribe.server-BZ7y3aGI.js";
import "./listing-sync.server-C2GpYdIM.js";
import "./renter-drip.server-D2A63B6b.js";
import "node:fs";
import "node:path";
import "./host-drip.server-CML6Wr0O.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
const getDashboardStats = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("bec71ddc1a645896e13cf953b3185e973f7a6d59a51aaffb546ae8c3a3e4a12b"));
const listPendingFailures = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  template_type: z.string().min(1),
  limit: z.number().int().min(1).max(500).default(100)
}).parse(d)).handler(createSsrRpc("93fc66fad9ec997fecba32b8afc03be58b59c7017f38ac192357daa55f5a51cb"));
const retryPendingTemplate = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  template_type: z.string().min(1),
  limit: z.number().int().min(1).max(1e3).default(500)
}).parse(d)).handler(createSsrRpc("d75149d360af488d60156946c2fddf95ff5ecb088576b376da7a7f7dac4d4cf6"));
const queueSpanishCityBatch = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  count: z.number().int().min(1).max(500).default(100)
}).parse(d)).handler(createSsrRpc("1dbf07014cb459359ad11a211494b7303f665d86bf658d3c23cf450360f6ba8d"));
function fmt(n) {
  if (n == null) return "—";
  return n.toLocaleString();
}
function pct(num, denom) {
  return denom > 0 ? Math.round(num / Math.max(denom, 1) * 100) : 0;
}
function pctChange(cur, prior) {
  if (prior === 0) return cur > 0 ? {
    value: 100,
    positive: true
  } : null;
  const v = Math.round((cur - prior) / prior * 100);
  return {
    value: Math.abs(v),
    positive: v >= 0
  };
}
function ageLabel(hours) {
  if (hours == null) return "—";
  if (hours < 1) return "<1h";
  if (hours < 48) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}
function ageTone(hours) {
  if (hours == null) return "ok";
  if (hours > 48) return "danger";
  if (hours > 24) return "warn";
  return "ok";
}
function bandPaint(tone) {
  return tone === "danger" ? "border-red-500/30 bg-red-500/5" : tone === "warn" ? "border-yellow-500/30 bg-yellow-500/5" : tone === "ok" ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-card";
}
function buildTopActions(s) {
  const actions = [];
  for (const t of s.byTemplate) {
    if (t.total > 100 && t.published === 0) {
      actions.push({
        severity: "critical",
        title: `Publish ${t.total} ${t.template_type || "(none)"} pages`,
        why: `Highest-intent supply pages stuck at 0% published.`,
        cta: "Open template",
        href: `/admin/content-pages?template=${encodeURIComponent(t.template_type || "")}`,
        score: 100 + t.total
      });
    }
  }
  if (s.missing404s.unresolved > 500) {
    actions.push({
      severity: "critical",
      title: `Triage ${fmt(s.missing404s.unresolved)} 404s`,
      why: `Bleeding crawl budget — Google is wasting time on dead URLs.`,
      cta: "Open 404 log",
      href: "/admin/missing-pages",
      score: 100
    });
  }
  if (s.contentPages.pending > 2e3) {
    actions.push({
      severity: "important",
      title: `${fmt(s.contentPages.pending)} generated pages awaiting publish`,
      why: `Run bulk publish to unlock organic traffic.`,
      cta: "Bulk publish",
      href: "/admin/content-pages?status=pending",
      score: 50
    });
  }
  const spCov = pct(s.spanish.cities_with_es, s.spanish.cities_eligible);
  if (spCov < 25) {
    actions.push({
      severity: "opportunity",
      title: `Spanish coverage at ${spCov}%`,
      why: `Generate next 100 cities to capture es-MX search demand.`,
      cta: "Queue Spanish batch",
      href: "/admin/dashboard#factory",
      score: 20
    });
  }
  if (s.leads.new > 0 && (s.leads.oldestAgeHours ?? 0) > 24) {
    actions.push({
      severity: "critical",
      title: `${s.leads.new} leads unactioned, oldest ${ageLabel(s.leads.oldestAgeHours)} old`,
      why: `Leads cool fast — every hour past 24h cuts close rate.`,
      cta: "Open leads",
      href: "/admin/leads",
      score: 100 + (s.leads.oldestAgeHours ?? 0)
    });
  }
  if (s.providers.pending > 50) {
    actions.push({
      severity: "important",
      title: `${s.providers.pending} providers awaiting moderation`,
      why: `Unpublished providers can't show in directory or city pages.`,
      cta: "Open directory",
      href: "/admin/directory",
      score: 50 + s.providers.pending
    });
  }
  if (s.planRequests.pending > 0) {
    actions.push({
      severity: "important",
      title: `${s.planRequests.pending} plan requests waiting`,
      why: `Provider upgrades blocked until you approve.`,
      cta: "Review requests",
      href: "/admin/plan-requests",
      score: 50
    });
  }
  return actions.sort((a, b) => b.score - a.score).slice(0, 3);
}
function AdminDashboard() {
  const [authorized, setAuthorized] = React.useState(false);
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);
  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const {
        data,
        error
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (error || !data.user) {
        window.location.href = "/auth?redirect=%2Fadmin%2Fdashboard&mode=signin";
        return;
      }
      try {
        const {
          isAdmin
        } = await checkAdminRole();
        if (cancelled) return;
        if (!isAdmin) {
          window.location.replace("/admin/no-access");
          return;
        }
        setAuthorized(true);
      } catch {
        if (!cancelled) window.location.href = "/auth?redirect=%2Fadmin%2Fdashboard&mode=signin";
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const load = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setStats(await getDashboardStats());
    } catch (e) {
      setErr(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => {
    if (!authorized) return;
    void load();
    const id = setInterval(load, 3e4);
    return () => clearInterval(id);
  }, [authorized, load]);
  const actions = stats ? buildTopActions(stats) : [];
  return /* @__PURE__ */ jsx(AdminLayout, { title: "Morning Command Center", children: !authorized ? /* @__PURE__ */ jsx("div", { className: "mt-12 text-center text-sm text-muted-foreground", children: "Checking admin access…" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Morning Command Center" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
          "Your daily operating rhythm. Top to bottom. Coffee in hand.",
          stats && /* @__PURE__ */ jsxs(Fragment, { children: [
            " · Updated ",
            new Date(stats.generatedAt).toLocaleTimeString()
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsx(Link, { to: "/admin/email-composer", className: "inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700", children: "✉️ Email Tools" }),
        /* @__PURE__ */ jsx("button", { onClick: load, className: "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground", children: loading ? "Refreshing…" : "Refresh" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("nav", { className: "sticky top-0 z-10 -mx-4 mt-4 flex flex-wrap gap-2 overflow-x-auto bg-background/90 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-full sm:border sm:border-border sm:px-3", children: [{
      href: "#today",
      label: "🎯 Today"
    }, {
      href: "#revenue",
      label: "💰 Revenue"
    }, {
      href: "#seo",
      label: "📈 SEO"
    }, {
      href: "#factory",
      label: "⚙️ Factory"
    }, {
      href: "#humans",
      label: "👥 Humans"
    }, {
      href: "#tools",
      label: "🔧 Tools"
    }].map((p) => /* @__PURE__ */ jsx("a", { href: p.href, className: "shrink-0 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold hover:border-primary hover:bg-primary/5", children: p.label }, p.href)) }),
    err && /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm", children: err }),
    stats && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Band, { id: "today", header: "🎯 Today's Top 3 Actions", subtitle: "Ranked by revenue/risk impact. Auto-refreshes every 30s.", children: actions.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl", children: "✨" }),
        /* @__PURE__ */ jsx("div", { className: "mt-1 text-sm font-semibold", children: "All clear. Nothing critical." }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Scroll down for the rhythm bands." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 lg:grid-cols-3", children: actions.map((a, i) => /* @__PURE__ */ jsx(ActionCard, { action: a }, i)) }) }),
      /* @__PURE__ */ jsx(Band, { id: "revenue", header: "💰 Revenue & Conversion Pulse", subtitle: "The numbers that pay the bills.", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6", children: [
        /* @__PURE__ */ jsx(Metric, { label: "Host signups", value: fmt(stats.users.newProfilesToday), sub: `${fmt(stats.users.newProfiles7d)} / 7d · ${fmt(stats.users.newProfiles30d)} / 30d`, href: "/admin/team" }),
        /* @__PURE__ */ jsx(Metric, { label: "New listings", value: fmt(stats.listings.createdToday), sub: `${fmt(stats.listings.createdLast7d)} this week`, href: "/admin/sharetribe-prune" }),
        /* @__PURE__ */ jsx(Metric, { label: "Booking requests (7d)", value: "—", sub: "Connect Sharetribe transactions", tone: "warn", href: "/admin/sharetribe-prune", placeholder: true }),
        /* @__PURE__ */ jsx(Metric, { label: "GMV (7d)", value: "—", sub: "Connect Sharetribe transactions", tone: "warn", href: "/admin/sharetribe-prune", placeholder: true }),
        /* @__PURE__ */ jsx(Metric, { label: "Lead inbox", value: fmt(stats.leads.new), sub: stats.leads.oldestAgeHours != null ? `oldest ${ageLabel(stats.leads.oldestAgeHours)}` : "no unactioned", tone: ageTone(stats.leads.oldestAgeHours), href: "/admin/leads" }),
        /* @__PURE__ */ jsx(Metric, { label: "Visitors → Hosts", value: stats.gsc.clicks7d > 0 && stats.users.newProfiles7d > 0 ? `${(stats.users.newProfiles7d / stats.gsc.clicks7d * 100).toFixed(2)}%` : "—", sub: "organic clicks ÷ new hosts", href: "/admin/keyword-opportunities" })
      ] }) }),
      /* @__PURE__ */ jsxs(Band, { id: "seo", header: "📈 Organic Performance", subtitle: "Last 7d vs prior 7d. Source: GSC import.", children: [
        (() => {
          const stale = stats.gsc.lastCapturedAt ? (Date.now() - new Date(stats.gsc.lastCapturedAt).getTime()) / 36e5 > 48 : true;
          if (stale) {
            return /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center justify-between rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm", children: [
              /* @__PURE__ */ jsxs("span", { children: [
                stats.gsc.lastCapturedAt ? `GSC data is ${Math.round((Date.now() - new Date(stats.gsc.lastCapturedAt).getTime()) / 864e5)} days old` : "No GSC data imported yet",
                " — ",
                "re-sync to see fresh trends."
              ] }),
              /* @__PURE__ */ jsx(Link, { to: "/admin/gsc-import", className: "rounded-full bg-yellow-600 px-3 py-1 text-xs font-semibold text-white", children: "Import GSC" })
            ] });
          }
          return null;
        })(),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 lg:grid-cols-4", children: [
          /* @__PURE__ */ jsx(Metric, { label: "Indexed pages", value: fmt(stats.gsc.indexedPages), href: "/admin/indexing" }),
          /* @__PURE__ */ jsx(Metric, { label: "Clicks (7d)", value: fmt(stats.gsc.clicks7d), delta: pctChange(stats.gsc.clicks7d, stats.gsc.clicksPrior7d), href: "/admin/keyword-opportunities" }),
          /* @__PURE__ */ jsx(Metric, { label: "Impressions (7d)", value: fmt(stats.gsc.impressions7d), delta: pctChange(stats.gsc.impressions7d, stats.gsc.impressionsPrior7d), href: "/admin/keyword-opportunities" }),
          /* @__PURE__ */ jsx(Metric, { label: "Avg position", value: stats.gsc.avgPosition7d ? stats.gsc.avgPosition7d.toFixed(1) : "—", sub: stats.gsc.avgPositionPrior7d ? `prior ${stats.gsc.avgPositionPrior7d.toFixed(1)}` : void 0, href: "/admin/rank-tracker" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-3 lg:grid-cols-2", children: [
          /* @__PURE__ */ jsx(WinnersLosers, { title: "🟢 Top 5 Winners", rows: stats.gsc.winners, positive: true }),
          /* @__PURE__ */ jsx(WinnersLosers, { title: "🔴 Top 5 Decliners", rows: stats.gsc.losers, positive: false })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Band, { id: "factory", header: "⚙️ Content Factory", subtitle: "Goal: 200 published pages/day.", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 lg:grid-cols-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-4 lg:col-span-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Published" }),
                /* @__PURE__ */ jsx("div", { className: "text-3xl font-bold", children: fmt(stats.contentPages.published) })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "goal 200/day" })
            ] }),
            /* @__PURE__ */ jsx(Sparkline, { data: stats.contentPages.publishedPerDay, goal: 200 })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-2", children: [
            /* @__PURE__ */ jsx(Metric, { label: "Total", value: fmt(stats.contentPages.total), compact: true }),
            /* @__PURE__ */ jsx(Metric, { label: "Pending", value: fmt(stats.contentPages.pending), tone: stats.contentPages.pending > 2e3 ? "warn" : "ok", compact: true }),
            /* @__PURE__ */ jsx(Metric, { label: "Last 24h", value: fmt(stats.contentPages.last24h), compact: true })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 overflow-x-auto rounded-xl border border-border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-left text-xs uppercase", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Template" }),
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Total" }),
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Published" }),
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "% done" }),
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Pending" }),
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: [...stats.byTemplate].sort((a, b) => pct(a.published, a.total) - pct(b.published, b.total)).map((t) => {
            const p = pct(t.published, t.total);
            const stuck = t.total > 100 && p < 10;
            return /* @__PURE__ */ jsxs("tr", { className: `border-t border-border ${stuck ? "bg-red-500/5" : ""}`, children: [
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 font-mono text-xs", children: t.template_type || "(none)" }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right", children: fmt(t.total) }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right", children: fmt(t.published) }),
              /* @__PURE__ */ jsxs("td", { className: `px-3 py-2 text-right ${stuck ? "font-bold text-red-600" : ""}`, children: [
                p,
                "%"
              ] }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right", children: fmt(t.total - t.published) }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right", children: /* @__PURE__ */ jsx(PublishButton, { templateType: t.template_type || "", disabled: t.total - t.published === 0 }) })
            ] }, t.template_type || "(none)");
          }) })
        ] }) }),
        /* @__PURE__ */ jsx(PendingDiagnosticsSection, { diagnostics: stats.pendingDiagnostics }),
        /* @__PURE__ */ jsx(SpanishEngineSection, { spanish: stats.spanish, onQueued: load }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold uppercase tracking-wider text-muted-foreground", children: "Content inventory" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6", children: [
            /* @__PURE__ */ jsx(Metric, { label: "Blog", value: `${stats.blog.published}/${stats.blog.total}`, compact: true, href: "/admin/blog" }),
            /* @__PURE__ */ jsx(Metric, { label: "Courses", value: `${stats.courses.published}/${stats.courses.total}`, compact: true, href: "/admin/learning" }),
            /* @__PURE__ */ jsx(Metric, { label: "Help", value: `${stats.helpArticles.published}/${stats.helpArticles.total}`, compact: true }),
            /* @__PURE__ */ jsx(Metric, { label: "Cities", value: `${stats.cities.published}/${stats.cities.total}`, compact: true, href: "/admin/cities-heroes" }),
            /* @__PURE__ */ jsx(Metric, { label: "Providers", value: `${stats.providers.published}/${stats.providers.total}`, compact: true, href: "/admin/directory" }),
            /* @__PURE__ */ jsx(Metric, { label: "Listings", value: fmt(stats.listings.total), compact: true, href: "/admin/sharetribe-prune" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl border border-border bg-card p-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold uppercase tracking-wider text-muted-foreground", children: "Health" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3", children: [
            /* @__PURE__ */ jsx(Metric, { label: "Unresolved 404s", value: fmt(stats.missing404s.unresolved), sub: `${fmt(stats.missing404s.total)} total logged`, tone: stats.missing404s.unresolved > 500 ? "danger" : stats.missing404s.unresolved > 10 ? "warn" : "ok", href: "/admin/missing-pages", compact: true }),
            /* @__PURE__ */ jsx(Metric, { label: "SEO health", value: "open", href: "/admin/seo-health", compact: true, sub: "View site issues" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Band, { id: "humans", header: "👥 Humans Waiting On Me", subtitle: "Anything red is past 48h.", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5", children: [
        /* @__PURE__ */ jsx(HumanCard, { label: "Lead inbox", count: stats.leads.new, ageHours: stats.leads.oldestAgeHours, href: "/admin/leads" }),
        /* @__PURE__ */ jsx(HumanCard, { label: "Listing claims", count: stats.claims.pending, ageHours: stats.claims.oldestAgeHours, href: "/admin/claims" }),
        /* @__PURE__ */ jsx(HumanCard, { label: "Plan requests", count: stats.planRequests.pending, ageHours: stats.planRequests.oldestAgeHours, href: "/admin/plan-requests" }),
        /* @__PURE__ */ jsx(HumanCard, { label: "Directory mod", count: stats.providers.pending, ageHours: null, href: "/admin/directory" }),
        /* @__PURE__ */ jsx(HumanCard, { label: "Waitlist (7d)", count: stats.waitlist.last7d, ageHours: null, href: "/admin/team" })
      ] }) }),
      /* @__PURE__ */ jsx(Band, { id: "tools", header: "🔧 All Tools", subtitle: "Direct access when you need a specific tool.", children: /* @__PURE__ */ jsx("div", { className: "grid gap-4 lg:grid-cols-2", children: GROUPS.filter((g) => g.label !== "Overview").map((g) => /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground", children: g.label }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-2 sm:grid-cols-2", children: g.items.map((it) => /* @__PURE__ */ jsxs(Link, { to: it.to, className: "group flex items-center gap-2.5 rounded-lg border border-border bg-background p-3 text-sm font-medium hover:border-primary hover:bg-primary/5", children: [
          /* @__PURE__ */ jsx(it.icon, { className: "h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" }),
          /* @__PURE__ */ jsx("span", { className: "truncate", children: it.label })
        ] }, it.to)) })
      ] }, g.label)) }) })
    ] }),
    loading && !stats && /* @__PURE__ */ jsx("div", { className: "mt-12 text-center text-sm text-muted-foreground", children: "Loading…" })
  ] }) });
}
function Band({
  id,
  header,
  subtitle,
  children
}) {
  return /* @__PURE__ */ jsxs("section", { id, className: "mt-8 scroll-mt-20 border-t border-border pt-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold sm:text-2xl", children: header }),
      subtitle && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: subtitle })
    ] }),
    children
  ] });
}
function ActionCard({
  action
}) {
  const sev = action.severity;
  const palette = sev === "critical" ? "border-red-500/40 bg-red-500/5" : sev === "important" ? "border-yellow-500/40 bg-yellow-500/5" : "border-emerald-500/40 bg-emerald-500/5";
  const badge = sev === "critical" ? "🚨 Critical" : sev === "important" ? "⚠️ Important" : "📈 Opportunity";
  const btn = sev === "critical" ? "bg-red-600 hover:bg-red-700" : sev === "important" ? "bg-yellow-600 hover:bg-yellow-700" : "bg-emerald-600 hover:bg-emerald-700";
  return /* @__PURE__ */ jsxs("div", { className: `flex flex-col rounded-2xl border-2 p-5 ${palette}`, children: [
    /* @__PURE__ */ jsx("span", { className: "self-start rounded-full bg-background px-2 py-0.5 text-xs font-bold", children: badge }),
    /* @__PURE__ */ jsx("h3", { className: "mt-3 text-lg font-bold leading-snug", children: action.title }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 flex-1 text-sm text-muted-foreground", children: action.why }),
    /* @__PURE__ */ jsxs(Link, { to: action.href, className: `mt-4 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white ${btn}`, children: [
      action.cta,
      " →"
    ] })
  ] });
}
function Metric({
  label,
  value,
  sub,
  delta,
  tone,
  href,
  compact,
  placeholder
}) {
  const toneCls = bandPaint(tone || "neutral");
  const inner = /* @__PURE__ */ jsxs("div", { className: `rounded-xl border p-4 ${toneCls} ${href ? "transition hover:border-primary" : ""} ${placeholder ? "border-dashed" : ""}`, children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: `mt-1 ${compact ? "text-xl" : "text-2xl"} font-bold`, children: value }),
    (sub || delta) && /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-2 text-xs text-muted-foreground", children: [
      delta && /* @__PURE__ */ jsxs("span", { className: `rounded px-1.5 py-0.5 font-semibold ${delta.positive ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-red-500/15 text-red-700 dark:text-red-300"}`, children: [
        delta.positive ? "▲" : "▼",
        " ",
        delta.value,
        "%"
      ] }),
      sub && /* @__PURE__ */ jsx("span", { children: sub })
    ] })
  ] });
  return href ? /* @__PURE__ */ jsx(Link, { to: href, className: "block", children: inner }) : inner;
}
function Sparkline({
  data,
  goal
}) {
  const max = Math.max(goal, ...data.map((d) => d.count), 1);
  return /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
    /* @__PURE__ */ jsx("div", { className: "flex h-20 items-end gap-1", children: data.map((d, i) => {
      const h = d.count / max * 100;
      const reached = d.count >= goal;
      return /* @__PURE__ */ jsxs("div", { className: "flex flex-1 flex-col items-center gap-1", children: [
        /* @__PURE__ */ jsx("div", { className: `w-full rounded-t ${reached ? "bg-emerald-500" : "bg-primary/60"}`, style: {
          height: `${Math.max(h, 4)}%`
        }, title: `${d.date}: ${d.count}` }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground", children: d.date.slice(5) })
      ] }, i);
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-1 flex justify-between text-[10px] text-muted-foreground", children: [
      /* @__PURE__ */ jsx("span", { children: "last 7d published/day" }),
      /* @__PURE__ */ jsxs("span", { children: [
        "goal ",
        goal,
        "/day"
      ] })
    ] })
  ] });
}
function WinnersLosers({
  title,
  rows,
  positive
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-4", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold", children: title }),
    rows.length === 0 ? /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: "No data — import GSC." }) : /* @__PURE__ */ jsx("ul", { className: "mt-2 divide-y divide-border text-sm", children: rows.map((r) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between gap-2 py-2", children: [
      /* @__PURE__ */ jsx(Link, { to: r.url_path, className: "truncate font-mono text-xs hover:underline", children: r.url_path }),
      /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 gap-2 text-xs", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
          r.clicks,
          " clicks"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: `font-semibold ${positive ? "text-emerald-600" : "text-red-600"}`, children: [
          r.delta > 0 ? "+" : "",
          r.delta
        ] })
      ] })
    ] }, r.url_path)) })
  ] });
}
function HumanCard({
  label,
  count,
  ageHours,
  href
}) {
  const tone = count === 0 ? "ok" : ageTone(ageHours);
  return /* @__PURE__ */ jsxs(Link, { to: href, className: `block rounded-xl border p-4 transition hover:border-primary ${bandPaint(tone)}`, children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "mt-1 text-2xl font-bold", children: fmt(count) }),
    /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: count === 0 ? "all caught up" : ageHours != null ? `oldest ${ageLabel(ageHours)}` : "no age data" })
  ] });
}
function PublishButton({
  templateType,
  disabled
}) {
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState(null);
  async function go() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await retryPendingTemplate({
        data: {
          template_type: templateType,
          limit: 50
        }
      });
      setMsg(`Queued ${r.retried}`);
    } catch (e) {
      setMsg(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
    msg && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: msg }),
    /* @__PURE__ */ jsx("button", { onClick: go, disabled: disabled || busy, className: "rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-40", children: busy ? "…" : "Publish next 50" })
  ] });
}
function PendingDiagnosticsSection({
  diagnostics
}) {
  const [busy, setBusy] = React.useState(null);
  const [failedFor, setFailedFor] = React.useState(null);
  const [failed, setFailed] = React.useState(null);
  const [msg, setMsg] = React.useState(null);
  if (!diagnostics || diagnostics.length === 0) return null;
  async function retry(t) {
    setBusy(t);
    setMsg(null);
    try {
      const r = await retryPendingTemplate({
        data: {
          template_type: t,
          limit: 500
        }
      });
      setMsg(`Re-queued ${r.retried} pending pages for ${t}.`);
    } catch (e) {
      setMsg(e?.message || "Retry failed");
    } finally {
      setBusy(null);
    }
  }
  async function viewFailed(t) {
    setBusy(t);
    setFailedFor(t);
    setFailed(null);
    try {
      const list = await listPendingFailures({
        data: {
          template_type: t,
          limit: 100
        }
      });
      setFailed(list);
    } catch (e) {
      setMsg(e?.message || "Load failed");
    } finally {
      setBusy(null);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold uppercase tracking-wider text-muted-foreground", children: "Pending queue diagnostics" }),
    msg && /* @__PURE__ */ jsx("div", { className: "mt-2 rounded border border-border bg-muted/30 p-2 text-xs", children: msg }),
    /* @__PURE__ */ jsx("div", { className: "mt-3 space-y-3", children: diagnostics.map((d) => /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "font-mono text-sm font-bold", children: d.template_type || "(none)" }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
            d.pending,
            " pending · ",
            d.missing_body,
            " missing body · ",
            d.missing_title,
            " missing title · ",
            d.missing_meta,
            " missing meta · ",
            d.missing_slug,
            " missing slug"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => retry(d.template_type || ""), disabled: busy === d.template_type, className: "rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50", children: busy === d.template_type ? "…" : "Retry all pending" }),
          /* @__PURE__ */ jsx("button", { onClick: () => viewFailed(d.template_type || ""), className: "rounded-full border border-border px-3 py-1.5 text-xs font-semibold", children: "View failed" })
        ] })
      ] }),
      d.top_errors.length > 0 && /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-1 text-xs", children: d.top_errors.map((e, i) => /* @__PURE__ */ jsxs("li", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs("span", { className: "rounded bg-red-500/15 px-1.5 font-bold text-red-700 dark:text-red-300", children: [
          e.count,
          "×"
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: e.reason })
      ] }, i)) }),
      failedFor === d.template_type && failed && /* @__PURE__ */ jsx("div", { className: "mt-3 max-h-64 overflow-auto rounded border border-border bg-background", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-left", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-2 py-1", children: "Slug" }),
          /* @__PURE__ */ jsx("th", { className: "px-2 py-1", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-2 py-1", children: "Last error" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          failed.map((p) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
            /* @__PURE__ */ jsx("td", { className: "px-2 py-1 font-mono", children: p.slug }),
            /* @__PURE__ */ jsx("td", { className: "px-2 py-1", children: p.status }),
            /* @__PURE__ */ jsx("td", { className: "px-2 py-1 text-muted-foreground", children: p.last_error || "—" })
          ] }, p.slug)),
          failed.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 3, className: "px-2 py-3 text-center text-muted-foreground", children: "No pending pages." }) })
        ] })
      ] }) })
    ] }, d.template_type || "(none)")) })
  ] });
}
function SpanishEngineSection({
  spanish,
  onQueued
}) {
  const [count, setCount] = React.useState(100);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState(null);
  async function queue() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await queueSpanishCityBatch({
        data: {
          count
        }
      });
      setMsg(`Queued ${r.inserted} new Spanish city plan rows (skipped ${r.skipped} already covered).`);
      onQueued();
    } catch (e) {
      setMsg(e?.message || "Queue failed");
    } finally {
      setBusy(false);
    }
  }
  const queuedPct = spanish.cities_eligible > 0 ? Math.round(spanish.cities_with_es / spanish.cities_eligible * 100) : 0;
  return /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300", children: "Spanish content engine" }),
      /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
        queuedPct,
        "% city coverage"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Spanish pages" }),
        /* @__PURE__ */ jsxs("div", { className: "font-bold", children: [
          spanish.pages_published,
          "/",
          spanish.pages_total
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Pending" }),
        /* @__PURE__ */ jsx("div", { className: "font-bold", children: spanish.pages_pending })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Plan rows pending" }),
        /* @__PURE__ */ jsx("div", { className: "font-bold", children: spanish.plan_pending })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Cities w/ ES" }),
        /* @__PURE__ */ jsxs("div", { className: "font-bold", children: [
          spanish.cities_with_es,
          "/",
          spanish.cities_eligible
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-3 h-2 overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-emerald-500", style: {
      width: `${queuedPct}%`
    } }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground", children: "Cities to queue:" }),
      /* @__PURE__ */ jsx("input", { type: "number", min: 1, max: 500, value: count, onChange: (e) => setCount(Math.max(1, Math.min(500, Number(e.target.value) || 0))), className: "w-24 rounded border border-border bg-background px-2 py-1 text-sm" }),
      /* @__PURE__ */ jsx("button", { onClick: queue, disabled: busy, className: "rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50", children: busy ? "Queueing…" : "Generate Spanish city batch" }),
      /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Sorted by population, skips existing." })
    ] }),
    msg && /* @__PURE__ */ jsx("div", { className: "mt-2 text-xs", children: msg })
  ] });
}
export {
  AdminDashboard as component
};
