import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { e as listCompetitorSites, f as listNewCompetitorUrls, g as listHostMatches, h as getEnrichmentSpend, i as detectCityGaps, j as addCompetitorSite, k as deleteCompetitorSite, m as acknowledgeCompetitorUrls, n as classifyCompetitorUrls, o as runCompetitorScan, s as scrapeCompetitorUrlRow, p as runHostMatchOne, q as createCounterPageFromGap, t as generateCompetitorDigest, u as runValidatorSelfTests, v as reportFalsePositive, w as enrichHostMatchOne, x as updateHostMatchStatus } from "./admin-weapons.functions-1XoHogUG.js";
import { A as AdminLayout } from "./admin-layout-9iu79rRE.js";
import { Radar, Loader2, Plus, Trash2, MapPin, FileText, Target, Check, Tags, RefreshCw, ExternalLink, Eye, Sparkles, DollarSign, FlaskConical, AlertTriangle, Mail, Phone, ChevronDown, X } from "lucide-react";
import "./cities.functions-DKA5O9eJ.js";
import "../server.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router";
import "@tanstack/react-router/ssr/server";
import "zod";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
import "./auth-middleware-Bd-cw3tB.js";
import "./createMiddleware-BvN2ghIY.js";
import "./router-DV0zB2xT.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
import "./client-TSMcDHCK.js";
import "./transactional-email.server-BoL6nxoQ.js";
import "@react-email/components";
import "./_unsubscribe-footer-DXp0Y_3B.js";
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
import "./renter-drip.server-CKJB2seY.js";
import "node:fs";
import "node:path";
import "./host-drip.server-CJ5RKG29.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
function CompetitorRadar() {
  const [sites, setSites] = React.useState([]);
  const [newRows, setNewRows] = React.useState([]);
  const [matches, setMatches] = React.useState([]);
  const [matchStatus, setMatchStatus] = React.useState("new");
  const [tab, setTab] = React.useState("feed");
  const [kindFilter, setKindFilter] = React.useState("");
  const [includeListings, setIncludeListings] = React.useState(false);
  const [domain, setDomain] = React.useState("");
  const [sitemap, setSitemap] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [scanning, setScanning] = React.useState(false);
  const [classifying, setClassifying] = React.useState(false);
  const [matchingId, setMatchingId] = React.useState(null);
  const [enrichingId, setEnrichingId] = React.useState(null);
  const [spend, setSpend] = React.useState(null);
  const [msg, setMsg] = React.useState(null);
  const [showAck, setShowAck] = React.useState(false);
  const [expandedMatch, setExpandedMatch] = React.useState(null);
  const [testReport, setTestReport] = React.useState(null);
  const [runningTests, setRunningTests] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(null);
  const [gaps, setGaps] = React.useState([]);
  const [gapsLoading, setGapsLoading] = React.useState(false);
  const [creatingGap, setCreatingGap] = React.useState(null);
  const [digest, setDigest] = React.useState(null);
  const [digestDays, setDigestDays] = React.useState(7);
  const [digestLoading, setDigestLoading] = React.useState(false);
  async function flagFalsePositive(id) {
    const reason = prompt("Why is this a false positive? (optional, helps train the filter)") ?? "";
    const r = await reportFalsePositive({
      data: {
        match_id: id,
        reason: reason || void 0
      }
    });
    if (r.ok) {
      setMsg("Logged as false positive — filter will improve.");
      await load();
    } else setMsg(`Failed: ${r.error}`);
  }
  async function runTests() {
    setRunningTests(true);
    try {
      const r = await runValidatorSelfTests();
      setTestReport(r.results);
      setMsg(r.allPassed ? "✅ All validator self-tests passed" : "⚠️ Some validator tests failed — see report below");
    } finally {
      setRunningTests(false);
    }
  }
  const load = React.useCallback(async () => {
    setLoadError(null);
    try {
      const [s, n, m, sp] = await Promise.all([listCompetitorSites().catch((e) => {
        console.error("listCompetitorSites failed:", e);
        return {
          rows: []
        };
      }), listNewCompetitorUrls({
        data: {
          onlyUnacknowledged: !showAck,
          limit: 300,
          kind: kindFilter || void 0,
          excludeListings: !includeListings
        }
      }).catch((e) => {
        console.error("listNewCompetitorUrls failed:", e);
        return {
          rows: []
        };
      }), listHostMatches({
        data: {
          status: matchStatus,
          minConfidence: 40,
          limit: 200
        }
      }).catch((e) => {
        console.error("listHostMatches failed:", e);
        return {
          rows: []
        };
      }), getEnrichmentSpend().catch(() => null)]);
      setSites(Array.isArray(s?.rows) ? s.rows : []);
      setNewRows(Array.isArray(n?.rows) ? n.rows : []);
      setMatches(Array.isArray(m?.rows) ? m.rows : []);
      setSpend(sp);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [showAck, matchStatus, kindFilter, includeListings]);
  React.useEffect(() => {
    load();
  }, [load]);
  async function classifyAll() {
    setClassifying(true);
    setMsg(null);
    try {
      const r = await classifyCompetitorUrls({
        data: {
          force: false,
          limit: 5e3
        }
      });
      setMsg(`Classified ${r.updated}/${r.total} URLs.`);
      await load();
    } catch (e) {
      setMsg(e?.message || "classify failed");
    } finally {
      setClassifying(false);
    }
  }
  async function loadGaps() {
    setGapsLoading(true);
    try {
      const r = await detectCityGaps({
        data: {
          minCompetitors: 1
        }
      });
      setGaps(Array.isArray(r?.rows) ? r.rows : []);
    } finally {
      setGapsLoading(false);
    }
  }
  React.useEffect(() => {
    if (tab === "gaps" && gaps.length === 0) loadGaps();
  }, [tab]);
  async function createCounter(g) {
    const key = `${g.city_slug}|${g.state_code || ""}`;
    setCreatingGap(key);
    try {
      const r = await createCounterPageFromGap({
        data: {
          city_slug: g.city_slug,
          state_code: g.state_code,
          competitor_url: g.competitor_urls[0]?.url
        }
      });
      setMsg(r.ok ? `Draft created at ${r.url_path}` : `Failed: ${r.error}`);
      if (r.ok) await loadGaps();
    } finally {
      setCreatingGap(null);
    }
  }
  async function loadDigest() {
    setDigestLoading(true);
    setDigest(null);
    try {
      const r = await generateCompetitorDigest({
        data: {
          days: digestDays
        }
      });
      setDigest(r.digest || "_(empty)_");
    } catch (e) {
      setDigest(`Error: ${e?.message || "digest failed"}`);
    } finally {
      setDigestLoading(false);
    }
  }
  async function findHostFor(id) {
    setMatchingId(id);
    try {
      const r = await runHostMatchOne({
        data: {
          competitor_url_id: id
        }
      });
      setMsg(r.ok ? `Matcher: ${r.inserted} candidate(s) found${r.reason ? ` (${r.reason})` : ""}` : `Matcher failed: ${r.reason}`);
      await load();
    } finally {
      setMatchingId(null);
    }
  }
  async function setStatus(id, status) {
    await updateHostMatchStatus({
      data: {
        id,
        status
      }
    });
    await load();
  }
  async function enrich(id) {
    setEnrichingId(id);
    try {
      const r = await enrichHostMatchOne({
        data: {
          match_id: id
        }
      });
      setMsg(r.ok ? `Enriched (${r.tier_reached}): ${r.emails_found} email(s), ${r.phones_found} phone(s), $${(r.cost_usd || 0).toFixed(2)}${r.reason ? ` — ${r.reason}` : ""}` : `Enrich failed: ${r.reason}`);
      await load();
    } finally {
      setEnrichingId(null);
    }
  }
  async function add() {
    if (!domain.trim() || !sitemap.trim()) return;
    const r = await addCompetitorSite({
      data: {
        domain: domain.trim(),
        sitemap_url: sitemap.trim(),
        label: label.trim() || void 0
      }
    });
    if (r.ok) {
      setDomain("");
      setSitemap("");
      setLabel("");
      await load();
    } else setMsg(r.error);
  }
  async function scan() {
    setScanning(true);
    setMsg(null);
    try {
      const r = await runCompetitorScan({
        data: {}
      });
      const total = r.results?.reduce((a, b) => a + (b.new_count || 0), 0) || 0;
      setMsg(`Scan done. ${total} new pages discovered.`);
      await load();
    } catch (e) {
      setMsg(e?.message || "scan failed");
    } finally {
      setScanning(false);
    }
  }
  async function ackOne(id) {
    await acknowledgeCompetitorUrls({
      data: {
        ids: [id]
      }
    });
    await load();
  }
  async function ackAll() {
    if (!newRows.length) return;
    await acknowledgeCompetitorUrls({
      data: {
        ids: newRows.map((r) => r.id)
      }
    });
    await load();
  }
  async function scrapeRow(id) {
    await scrapeCompetitorUrlRow({
      data: {
        id
      }
    });
    await load();
  }
  async function removeSite(id) {
    if (!confirm("Delete this competitor site and all tracked URLs?")) return;
    await deleteCompetitorSite({
      data: {
        id
      }
    });
    await load();
  }
  return /* @__PURE__ */ jsxs(AdminLayout, { title: "Competitor Radar", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsxs("h1", { className: "flex items-center gap-2 text-2xl font-bold sm:text-3xl", children: [
        /* @__PURE__ */ jsx(Radar, { className: "h-6 w-6 text-primary" }),
        " Competitor Radar"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Monitor competitor sitemaps daily. The moment Swimply, Giggster, or Peerspace ship a new page, it shows up here." })
    ] }),
    loading && /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
      " Loading competitor radar…"
    ] }),
    loadError && !loading && /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-start justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        "Failed to load: ",
        loadError
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => {
        setLoading(true);
        load();
      }, className: "rounded-full border border-destructive/40 px-3 py-1 text-xs font-semibold", children: "Retry" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: "Track a new competitor sitemap" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-2 grid gap-2 sm:grid-cols-3", children: [
        /* @__PURE__ */ jsx("input", { value: domain, onChange: (e) => setDomain(e.target.value), placeholder: "swimply.com", className: "rounded-lg border border-border bg-background px-3 py-2 text-sm" }),
        /* @__PURE__ */ jsx("input", { value: sitemap, onChange: (e) => setSitemap(e.target.value), placeholder: "https://swimply.com/sitemap.xml", className: "rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2" }),
        /* @__PURE__ */ jsx("input", { value: label, onChange: (e) => setLabel(e.target.value), placeholder: "Label (optional)", className: "rounded-lg border border-border bg-background px-3 py-2 text-sm" }),
        /* @__PURE__ */ jsxs("button", { onClick: add, className: "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground sm:col-span-2", children: [
          /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
          " Add site"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-2 md:grid-cols-2", children: [
      sites.map((s) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-2xl border border-border bg-card p-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("p", { className: "truncate text-sm font-semibold", children: s.label || s.domain }),
          /* @__PURE__ */ jsx("p", { className: "truncate text-xs text-muted-foreground", children: s.sitemap_url }),
          /* @__PURE__ */ jsxs("p", { className: "mt-0.5 text-xs text-muted-foreground", children: [
            s.last_url_count,
            " URLs · ",
            s.last_checked_at ? `checked ${new Date(s.last_checked_at).toLocaleString()}` : "never checked"
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => removeSite(s.id), className: "ml-2 rounded-full border border-border p-2 text-destructive", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }) })
      ] }, s.id)),
      sites.length === 0 && /* @__PURE__ */ jsx("p", { className: "rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground md:col-span-2", children: "No competitors tracked yet. Add Swimply, Giggster, Peerspace above." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap gap-2 border-b border-border", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => setTab("feed"), className: `px-4 py-2 text-sm font-semibold ${tab === "feed" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`, children: "New pages" }),
      /* @__PURE__ */ jsxs("button", { onClick: () => setTab("gaps"), className: `px-4 py-2 text-sm font-semibold ${tab === "gaps" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`, children: [
        /* @__PURE__ */ jsx(MapPin, { className: "mr-1 inline h-3.5 w-3.5" }),
        " City gaps"
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => setTab("digest"), className: `px-4 py-2 text-sm font-semibold ${tab === "digest" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`, children: [
        /* @__PURE__ */ jsx(FileText, { className: "mr-1 inline h-3.5 w-3.5" }),
        " Intel digest"
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => setTab("matches"), className: `px-4 py-2 text-sm font-semibold ${tab === "matches" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`, children: [
        /* @__PURE__ */ jsx(Target, { className: "mr-1 inline h-3.5 w-3.5" }),
        " Host matches (",
        matches.length,
        ")"
      ] })
    ] }),
    tab === "feed" && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: showAck ? "All competitor URLs" : "🚨 New pages discovered" }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxs("select", { value: kindFilter, onChange: (e) => setKindFilter(e.target.value), className: "rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold", children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "All kinds" }),
            /* @__PURE__ */ jsx("option", { value: "city_page", children: "City pages" }),
            /* @__PURE__ */ jsx("option", { value: "blog", children: "Blog" }),
            /* @__PURE__ */ jsx("option", { value: "category", children: "Category" }),
            /* @__PURE__ */ jsx("option", { value: "feature", children: "Feature" }),
            /* @__PURE__ */ jsx("option", { value: "listing", children: "Listings" }),
            /* @__PURE__ */ jsx("option", { value: "other", children: "Other" })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold", children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: includeListings, onChange: (e) => setIncludeListings(e.target.checked) }),
            "Include listings"
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => setShowAck((s) => !s), className: "rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold", children: showAck ? "Show new only" : "Show all" }),
          !showAck && newRows.length > 0 && /* @__PURE__ */ jsxs("button", { onClick: ackAll, className: "rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold", children: [
            /* @__PURE__ */ jsx(Check, { className: "mr-1 inline h-3 w-3" }),
            " Acknowledge all"
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: classifyAll, disabled: classifying, className: "inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50", children: [
            classifying ? /* @__PURE__ */ jsx(Loader2, { className: "h-3 w-3 animate-spin" }) : /* @__PURE__ */ jsx(Tags, { className: "h-3 w-3" }),
            "Classify all"
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: scan, disabled: scanning, className: "inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: [
            scanning ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4" }),
            scanning ? "Scanning…" : "Scan now"
          ] })
        ] })
      ] }),
      msg && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: msg }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-2", children: [
        newRows.length === 0 && /* @__PURE__ */ jsx("p", { className: "rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground", children: showAck ? "No URLs tracked yet. Run a scan." : "Nothing new since the last scan. You're caught up. 🎯" }),
        newRows.map((r) => /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-border bg-card p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1.5", children: [
              r.domain && /* @__PURE__ */ jsx("span", { className: "rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold", children: r.domain }),
              /* @__PURE__ */ jsx("span", { className: "rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary", children: new Date(r.first_seen_at).toLocaleDateString() }),
              r.kind && /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.kind === "city_page" ? "bg-emerald-100 text-emerald-800" : r.kind === "blog" ? "bg-sky-100 text-sky-800" : r.kind === "listing" ? "bg-muted text-muted-foreground" : "bg-secondary"}`, children: r.kind.replace("_", " ") }),
              r.word_count != null && /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold", children: [
                r.word_count,
                " words"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { href: r.url, target: "_blank", rel: "noreferrer noopener", className: "mt-1 inline-flex items-center gap-1 break-all text-sm font-medium text-primary hover:underline", children: [
              r.url,
              " ",
              /* @__PURE__ */ jsx(ExternalLink, { className: "h-3 w-3 shrink-0" })
            ] }),
            r.title && /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs text-muted-foreground line-clamp-1", children: r.title })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 flex-wrap gap-1.5", children: [
            !r.scraped_at && /* @__PURE__ */ jsxs("button", { onClick: () => scrapeRow(r.id), className: "inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold", children: [
              /* @__PURE__ */ jsx(Eye, { className: "h-3 w-3" }),
              " Scrape"
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: () => findHostFor(r.id), disabled: matchingId === r.id, className: "inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary disabled:opacity-50", children: [
              matchingId === r.id ? /* @__PURE__ */ jsx(Loader2, { className: "h-3 w-3 animate-spin" }) : /* @__PURE__ */ jsx(Target, { className: "h-3 w-3" }),
              "Find host"
            ] }),
            !r.acknowledged && /* @__PURE__ */ jsxs("button", { onClick: () => ackOne(r.id), className: "inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold", children: [
              /* @__PURE__ */ jsx(Check, { className: "h-3 w-3" }),
              " Got it"
            ] })
          ] })
        ] }) }, r.id))
      ] })
    ] }),
    tab === "gaps" && /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-3 flex flex-wrap items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: "Cities competitors cover that we don't" }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
            'Detected from classified competitor URLs. Click "Create draft" to spawn a content_pages draft at /p/',
            `{slug}`,
            "."
          ] })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: loadGaps, disabled: gapsLoading, className: "inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: [
          gapsLoading ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4" }),
          gapsLoading ? "Scanning…" : "Refresh"
        ] })
      ] }),
      msg && /* @__PURE__ */ jsx("p", { className: "mb-2 text-xs text-muted-foreground", children: msg }),
      gaps.length === 0 && !gapsLoading && /* @__PURE__ */ jsx("p", { className: "rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground", children: 'No gaps detected yet. Run "Classify all" on the New pages tab first so we can extract city slugs.' }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2", children: gaps.map((g) => {
        const key = `${g.city_slug}|${g.state_code || ""}`;
        return /* @__PURE__ */ jsx("div", { className: `rounded-2xl border p-3 ${g.has_our_page ? "border-border bg-muted/30" : "border-emerald-200 bg-emerald-50/40"}`, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1.5", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-sm font-bold", children: [
                g.city_slug.replace(/-/g, " "),
                g.state_code ? `, ${g.state_code}` : ""
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold", children: [
                g.competitor_urls.length,
                " competitor URL",
                g.competitor_urls.length === 1 ? "" : "s"
              ] }),
              g.has_our_page ? /* @__PURE__ */ jsx("span", { className: "rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white", children: "we have it" }) : /* @__PURE__ */ jsx("span", { className: "rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white", children: "GAP" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-1 flex flex-wrap gap-2 text-[11px]", children: g.competitor_urls.slice(0, 3).map((u) => /* @__PURE__ */ jsxs("a", { href: u.url, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-1 break-all text-primary hover:underline", children: [
              /* @__PURE__ */ jsx(ExternalLink, { className: "h-3 w-3 shrink-0" }),
              u.domain || u.url
            ] }, u.url)) })
          ] }),
          !g.has_our_page && /* @__PURE__ */ jsxs("button", { onClick: () => createCounter(g), disabled: creatingGap === key, className: "inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50", children: [
            creatingGap === key ? /* @__PURE__ */ jsx(Loader2, { className: "h-3 w-3 animate-spin" }) : /* @__PURE__ */ jsx(Plus, { className: "h-3 w-3" }),
            "Create draft"
          ] })
        ] }) }, key);
      }) })
    ] }),
    tab === "digest" && /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-3 flex flex-wrap items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: "Competitor intel digest" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "AI summary of what competitors shipped recently, with suggested actions." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("select", { value: digestDays, onChange: (e) => setDigestDays(Number(e.target.value)), className: "rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold", children: [
            /* @__PURE__ */ jsx("option", { value: 3, children: "Last 3 days" }),
            /* @__PURE__ */ jsx("option", { value: 7, children: "Last 7 days" }),
            /* @__PURE__ */ jsx("option", { value: 14, children: "Last 14 days" }),
            /* @__PURE__ */ jsx("option", { value: 30, children: "Last 30 days" })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: loadDigest, disabled: digestLoading, className: "inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: [
            digestLoading ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }),
            digestLoading ? "Analyzing…" : "Generate digest"
          ] })
        ] })
      ] }),
      !digest && !digestLoading && /* @__PURE__ */ jsx("p", { className: "rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground", children: 'Click "Generate digest" to summarize recent competitor activity.' }),
      digest && /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-border bg-card p-4", children: /* @__PURE__ */ jsx("pre", { className: "whitespace-pre-wrap break-words text-sm leading-relaxed", children: digest }) })
    ] }),
    tab === "matches" && /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      spend && /* @__PURE__ */ jsxs("div", { className: "mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 text-xs", children: [
        /* @__PURE__ */ jsx(DollarSign, { className: "h-4 w-4 text-primary" }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsxs("strong", { children: [
            "$",
            spend.today_spend_usd.toFixed(2)
          ] }),
          " / $",
          spend.daily_cap_usd,
          " today"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
          "· ",
          spend.today_calls,
          " calls, ",
          spend.today_hits,
          " hits"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
          "· ",
          /* @__PURE__ */ jsxs("strong", { children: [
            "$",
            spend.month_spend_usd.toFixed(2)
          ] }),
          " month-to-date (target $",
          spend.monthly_target_usd,
          ")"
        ] }),
        spend.today_spend_usd >= spend.daily_cap_usd && /* @__PURE__ */ jsx("span", { className: "rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800", children: "Cap hit — paid tiers paused" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-3 flex flex-wrap items-center gap-2", children: [
        ["new", "review", "contacted", "converted", "dismissed", "all"].map((s) => /* @__PURE__ */ jsx("button", { onClick: () => setMatchStatus(s), className: `rounded-full px-3 py-1.5 text-xs font-semibold ${matchStatus === s ? "bg-primary text-primary-foreground" : "bg-secondary"} ${s === "review" ? "ring-1 ring-amber-400" : ""}`, children: s === "review" ? "🔍 Review queue" : s }, s)),
        /* @__PURE__ */ jsxs("button", { onClick: runTests, disabled: runningTests, className: "ml-auto inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50", children: [
          runningTests ? /* @__PURE__ */ jsx(Loader2, { className: "h-3 w-3 animate-spin" }) : /* @__PURE__ */ jsx(FlaskConical, { className: "h-3 w-3" }),
          "Run validator tests"
        ] })
      ] }),
      testReport && /* @__PURE__ */ jsxs("div", { className: "mb-3 rounded-2xl border border-border bg-card p-3 text-xs", children: [
        /* @__PURE__ */ jsxs("p", { className: "mb-2 font-semibold", children: [
          "Validator self-test report (",
          testReport.filter((t) => t.pass).length,
          "/",
          testReport.length,
          " passed)"
        ] }),
        /* @__PURE__ */ jsx("ul", { className: "space-y-1", children: testReport.map((t, i) => /* @__PURE__ */ jsxs("li", { className: t.pass ? "text-emerald-700" : "text-destructive", children: [
          t.pass ? "✅" : "❌",
          " ",
          t.name,
          " — ",
          t.rejected ? "rejected" : "accepted",
          " (expected ",
          t.expectReject ? "reject" : "accept",
          ")",
          t.reason ? ` · ${t.reason}` : ""
        ] }, i)) })
      ] }),
      matches.length === 0 && /* @__PURE__ */ jsxs("p", { className: "rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground", children: [
        matchStatus === "review" ? "Review queue empty — nothing flagged for manual audit." : "No matches yet. The agent runs automatically on every new competitor URL discovered by the daily scan, or click ",
        matchStatus !== "review" && /* @__PURE__ */ jsx("strong", { children: "Find host" }),
        matchStatus !== "review" && " on a URL above to run it manually."
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2", children: matches.map((m) => /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-border bg-card p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1.5", children: [
            /* @__PURE__ */ jsxs("span", { title: m.candidate_evidence || "", className: `rounded-full px-2 py-0.5 text-[10px] font-bold ${m.match_confidence >= 90 ? "bg-emerald-100 text-emerald-800" : m.match_confidence >= 85 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`, children: [
              "Confidence: ",
              m.match_confidence,
              "%"
            ] }),
            m.status === "review" && /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700", children: [
              /* @__PURE__ */ jsx(AlertTriangle, { className: "mr-0.5 inline h-2.5 w-2.5" }),
              "review"
            ] }),
            m.domain && /* @__PURE__ */ jsx("span", { className: "rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold", children: m.domain }),
            m.candidate_source && /* @__PURE__ */ jsx("span", { className: "rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary", children: m.candidate_source }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground", children: new Date(m.created_at).toLocaleDateString() })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm font-bold", children: [
            m.candidate_name || m.candidate_business_name || "Unknown",
            m.host_first_name && /* @__PURE__ */ jsxs("span", { className: "ml-2 text-xs font-normal text-muted-foreground", children: [
              "(listing host: ",
              m.host_first_name,
              m.host_city && `, ${m.host_city}`,
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 flex flex-wrap gap-3 text-xs", children: [
            m.candidate_email && /* @__PURE__ */ jsxs("a", { href: `mailto:${m.candidate_email}`, className: "inline-flex items-center gap-1 text-primary hover:underline", children: [
              /* @__PURE__ */ jsx(Mail, { className: "h-3 w-3" }),
              m.candidate_email
            ] }),
            m.candidate_phone && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Phone, { className: "h-3 w-3" }),
              m.candidate_phone
            ] }),
            m.candidate_website && /* @__PURE__ */ jsxs("a", { href: m.candidate_website, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-1 text-primary hover:underline", children: [
              /* @__PURE__ */ jsx(ExternalLink, { className: "h-3 w-3" }),
              "website"
            ] }),
            m.candidate_social_url && /* @__PURE__ */ jsxs("a", { href: m.candidate_social_url, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-1 text-primary hover:underline", children: [
              /* @__PURE__ */ jsx(ExternalLink, { className: "h-3 w-3" }),
              "social"
            ] })
          ] }),
          m.candidate_evidence && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: m.candidate_evidence }),
          m.enriched_at && /* @__PURE__ */ jsxs("div", { className: "mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white", children: [
                "enriched · ",
                m.enriched_tier
              ] }),
              m.revenue_signal_score != null && m.revenue_signal_score > 0 && /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800", children: [
                "revenue ",
                m.revenue_signal_score
              ] }),
              m.enrichment_cost_usd != null && m.enrichment_cost_usd > 0 && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-muted-foreground", children: [
                "$",
                Number(m.enrichment_cost_usd).toFixed(2)
              ] })
            ] }),
            (m.enriched_emails?.length || 0) > 0 && /* @__PURE__ */ jsx("div", { className: "mt-1 flex flex-wrap gap-2", children: m.enriched_emails.map((e) => /* @__PURE__ */ jsxs("a", { href: `mailto:${e}`, className: "inline-flex items-center gap-1 text-primary hover:underline", children: [
              /* @__PURE__ */ jsx(Mail, { className: "h-3 w-3" }),
              e
            ] }, e)) }),
            (m.enriched_phones?.length || 0) > 0 && /* @__PURE__ */ jsx("div", { className: "mt-1 flex flex-wrap gap-2", children: m.enriched_phones.map((p) => /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Phone, { className: "h-3 w-3" }),
              p
            ] }, p)) }),
            (m.enriched_socials?.length || 0) > 0 && /* @__PURE__ */ jsx("div", { className: "mt-1 flex flex-wrap gap-2", children: m.enriched_socials.slice(0, 4).map((u) => /* @__PURE__ */ jsxs("a", { href: u, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-1 text-primary hover:underline", children: [
              /* @__PURE__ */ jsx(ExternalLink, { className: "h-3 w-3" }),
              new URL(u).hostname.replace("www.", "")
            ] }, u)) }),
            m.property_address && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-[11px] text-muted-foreground", children: [
              "📍 ",
              m.property_address
            ] }),
            m.revenue_signal_notes && /* @__PURE__ */ jsx("p", { className: "mt-1 text-[11px] text-muted-foreground", children: m.revenue_signal_notes })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2 text-[11px]", children: [
            /* @__PURE__ */ jsxs("button", { onClick: () => setExpandedMatch(expandedMatch === m.id ? null : m.id), className: "inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground hover:text-foreground", children: [
              /* @__PURE__ */ jsx(ChevronDown, { className: `h-3 w-3 transition-transform ${expandedMatch === m.id ? "rotate-180" : ""}` }),
              " Why this match?"
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: () => flagFalsePositive(m.id), className: "inline-flex items-center gap-1 rounded-full border border-destructive/40 px-2 py-0.5 text-destructive hover:bg-destructive/5", children: [
              /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3 w-3" }),
              " False positive — improve filter"
            ] }),
            m.enrichment_cost_usd != null && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
              "Spent: $",
              Number(m.enrichment_cost_usd || 0).toFixed(2)
            ] })
          ] }),
          expandedMatch === m.id && /* @__PURE__ */ jsxs("div", { className: "mt-2 rounded-lg border border-border bg-muted/30 p-2 text-[11px]", children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold", children: "Validation breakdown" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground whitespace-pre-wrap break-words", children: m.candidate_evidence || "No evidence recorded." }),
            /* @__PURE__ */ jsxs("p", { className: "mt-2 text-muted-foreground", children: [
              "Source domain: ",
              /* @__PURE__ */ jsx("code", { children: m.domain || "—" }),
              " · Listing host: ",
              m.host_first_name || "—",
              ", ",
              m.host_city || "—",
              " ",
              m.host_state || ""
            ] })
          ] }),
          /* @__PURE__ */ jsx("a", { href: m.competitor_url, target: "_blank", rel: "noreferrer", className: "mt-1 inline-flex items-center gap-1 break-all text-[11px] text-muted-foreground hover:underline", children: m.competitor_url })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 flex-col gap-1", children: [
          /* @__PURE__ */ jsxs("button", { onClick: () => enrich(m.id), disabled: enrichingId === m.id, className: "inline-flex items-center justify-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary disabled:opacity-50", children: [
            enrichingId === m.id ? /* @__PURE__ */ jsx(Loader2, { className: "h-3 w-3 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3" }),
            m.enriched_at ? "Re-enrich" : "Enrich"
          ] }),
          m.status === "new" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("button", { onClick: () => setStatus(m.id, "contacted"), className: "rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold", children: "Mark contacted" }),
            /* @__PURE__ */ jsx("button", { onClick: () => setStatus(m.id, "converted"), className: "rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white", children: "Converted" }),
            /* @__PURE__ */ jsxs("button", { onClick: () => setStatus(m.id, "dismissed"), className: "rounded-full border border-border px-3 py-1 text-[11px] font-semibold text-muted-foreground", children: [
              /* @__PURE__ */ jsx(X, { className: "mr-1 inline h-2.5 w-2.5" }),
              "Dismiss"
            ] })
          ] }),
          m.status !== "new" && /* @__PURE__ */ jsx("span", { className: "rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold", children: m.status })
        ] })
      ] }) }, m.id)) })
    ] })
  ] });
}
export {
  CompetitorRadar as component
};
