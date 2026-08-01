import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { s as supabase } from "./client-Dh5RMKgP.js";
import { u as checkAdminRole } from "./router-Bw8GQi9C.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import { A as AdminLayout } from "./admin-layout-fwIJkCGX.js";
import "@supabase/supabase-js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
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
import "./renter-drip.server-CMz_M9Zp.js";
import "node:fs";
import "node:path";
import "./host-drip.server-nBw4NS9X.js";
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
const InputSchema = z.object({
  action: z.enum(["start", "status", "preflight", "resume-paused"]).default("start"),
  count: z.number().int().min(1).max(10).default(10),
  tier: z.enum(["T1 (200k+)", "T2 (75k–199k)", "T3 (25k–74k)", "T4 (10k–24k)", "longtail"]).optional(),
  stateCode: z.string().length(2).optional(),
  warmOnly: z.boolean().default(false),
  model: z.string().default("google/gemini-3-flash-preview"),
  dryRun: z.boolean().default(false),
  slugs: z.array(z.string()).optional(),
  onlyStaleValidator: z.boolean().default(false)
});
const generateContentBatch = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => InputSchema.parse(data)).handler(createSsrRpc("0e6ca0e8afcbf004b1e376ebfc6b975e1d5efe4352b22af22609a9b82afb745d"));
const getGenerateStats = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("1048a77fafa7fe9958dacf0267ae980fd895aea9e5a03b611d64bc0f9dfb94b6"));
function useAdminGate() {
  const navigate = useNavigate();
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!data.user) {
        navigate({
          to: "/auth",
          search: {
            redirect: "/admin/generate-content",
            mode: "signin"
          }
        });
        return;
      }
      const {
        isAdmin
      } = await checkAdminRole();
      if (cancelled) return;
      if (!isAdmin) {
        navigate({
          to: "/admin/no-access"
        });
        return;
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);
  return ready;
}
function GenerateContentPage() {
  const ready = useAdminGate();
  if (!ready) {
    return /* @__PURE__ */ jsx(AdminLayout, { children: /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Checking admin access…" }) });
  }
  return /* @__PURE__ */ jsx(GenerateContentPageInner, {});
}
function GenerateContentPageInner() {
  const getErrorMessage = (e) => e instanceof Error ? e.message : String(e);
  const [count, setCount] = React.useState(10);
  const [tier, setTier] = React.useState("T1 (200k+)");
  const [stateCode, setStateCode] = React.useState("");
  const [warmOnly, setWarmOnly] = React.useState(false);
  const [model, setModel] = React.useState("google/gemini-3-flash-preview");
  const [busy, setBusy] = React.useState(false);
  const [dryRun, setDryRun] = React.useState(false);
  const [autoLoop, setAutoLoop] = React.useState(true);
  const [maxBatches, setMaxBatches] = React.useState(10);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [preflight, setPreflight] = React.useState({
    status: "idle",
    details: null
  });
  const [progress, setProgress] = React.useState({
    batch: 0,
    inserted: 0,
    failed: 0,
    pages: []
  });
  const pollTimerRef = React.useRef(null);
  const stopRef = React.useRef(false);
  const autoRunRef = React.useRef({
    active: false,
    nextBatch: 1,
    maxBatches: 0,
    totalInserted: 0,
    totalFailed: 0,
    pages: []
  });
  const [log, setLog] = React.useState([]);
  const logIdRef = React.useRef(0);
  const ENDPOINT = `${"https://ptfjspcphskifoseidut.supabase.co"}/functions/v1/generate-content-batch`;
  const appendLog = React.useCallback((entry) => {
    setLog((prev) => [{
      ...entry,
      id: ++logIdRef.current,
      at: (/* @__PURE__ */ new Date()).toISOString()
    }, ...prev].slice(0, 50));
  }, []);
  const callEdge = React.useCallback(async (action, extra) => {
    const started = performance.now();
    try {
      const res = await generateContentBatch({
        data: {
          action,
          count,
          tier: tier || void 0,
          stateCode: stateCode.trim() || void 0,
          warmOnly,
          model,
          dryRun,
          slugs: extra?.slugs
        }
      });
      const response = res;
      const durationMs = Math.round(performance.now() - started);
      const summary = action === "preflight" ? response.ok ? "Setup verified" : `Preflight failed: ${response.aiError ?? "see details"}` : action === "status" ? `Status: ${response.pendingSlugs?.length ?? 0} pending, ${response.inserted ?? 0} inserted` : response.queued ? `Queued ${response.attempted ?? 0} page(s) for background generation` : `Returned ${response.inserted ?? 0}/${response.attempted ?? 0} inserted`;
      appendLog({
        action,
        endpoint: ENDPOINT,
        durationMs,
        ok: Boolean(response.ok ?? response.queued),
        httpStatus: 200,
        summary,
        response
      });
      return response;
    } catch (e) {
      const durationMs = Math.round(performance.now() - started);
      const message = getErrorMessage(e);
      const statusMatch = message.match(/(\b[45]\d{2}\b)/);
      appendLog({
        action,
        endpoint: ENDPOINT,
        durationMs,
        ok: false,
        httpStatus: statusMatch ? Number(statusMatch[1]) : void 0,
        summary: `Failure: ${message.slice(0, 200)}`,
        error: message
      });
      throw e;
    }
  }, [ENDPOINT, appendLog, count, dryRun, model, stateCode, tier, warmOnly]);
  React.useEffect(() => {
    return () => {
      if (pollTimerRef.current) window.clearTimeout(pollTimerRef.current);
    };
  }, []);
  const runOnce = async (action = "start", slugs) => {
    return await callEdge(action, {
      slugs
    });
  };
  const finishAutoBatch = async (status) => {
    const runState = autoRunRef.current;
    const inserted = status?.inserted ?? 0;
    const attempted = status?.attempted ?? 0;
    const failed = Math.max(0, attempted - inserted);
    const nextPages = [...runState.pages, ...status?.pages ?? []].slice(-100);
    runState.totalInserted += inserted;
    runState.totalFailed += failed;
    runState.pages = nextPages;
    setProgress({
      batch: Math.max(0, runState.nextBatch - 1),
      inserted: runState.totalInserted,
      failed: runState.totalFailed,
      pages: nextPages
    });
    if (stopRef.current || runState.nextBatch > runState.maxBatches || attempted === 0) {
      runState.active = false;
      setBusy(false);
      return;
    }
    const res = await runOnce("start");
    setResult(res);
    runState.nextBatch += 1;
    if (res?.queued && res?.pendingSlugs?.length) {
      scheduleStatusPoll(res.pendingSlugs);
      return;
    }
    await finishAutoBatch(res);
  };
  const scheduleStatusPoll = (slugs) => {
    if (pollTimerRef.current) window.clearTimeout(pollTimerRef.current);
    pollTimerRef.current = window.setTimeout(async () => {
      try {
        const status = await runOnce("status", slugs);
        setResult(status);
        const pending = status?.pendingSlugs ?? [];
        if (pending.length > 0 && !stopRef.current) {
          scheduleStatusPoll(pending);
        } else if (autoRunRef.current.active) {
          await finishAutoBatch(status);
        } else {
          setBusy(false);
        }
      } catch (e) {
        setError(getErrorMessage(e));
        setBusy(false);
      }
    }, 5e3);
  };
  const runPreflight = React.useCallback(async () => {
    setPreflight({
      status: "checking",
      details: null
    });
    setError(null);
    try {
      const res = await callEdge("preflight");
      setPreflight({
        status: res?.ok ? "ok" : "failed",
        details: res
      });
      return Boolean(res?.ok);
    } catch (e) {
      setPreflight({
        status: "failed",
        details: {
          error: getErrorMessage(e)
        }
      });
      setError(getErrorMessage(e));
      return false;
    }
  }, [callEdge]);
  React.useEffect(() => {
    runPreflight();
  }, [runPreflight]);
  const [stats, setStats] = React.useState(null);
  const [statsLoading, setStatsLoading] = React.useState(false);
  const refreshStats = React.useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await getGenerateStats();
      setStats(res);
    } catch (e) {
      console.error("[stats] failed", e);
    } finally {
      setStatsLoading(false);
    }
  }, []);
  React.useEffect(() => {
    refreshStats();
  }, [refreshStats]);
  React.useEffect(() => {
    if (!busy) return;
    const t = window.setInterval(refreshStats, 8e3);
    return () => window.clearInterval(t);
  }, [busy, refreshStats]);
  const COST_PER_PAGE_USD = {
    "google/gemini-3-flash-preview": 0.012,
    "google/gemini-2.5-pro": 0.09,
    "google/gemini-3.1-pro-preview": 0.12
  };
  const perPageCost = COST_PER_PAGE_USD[model] ?? 0.02;
  const plannedPages = autoLoop ? count * maxBatches : count;
  const estCost = perPageCost * plannedPages;
  const run = async () => {
    if (preflight.status !== "ok") {
      const ok = await runPreflight();
      if (!ok) return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress({
      batch: 0,
      inserted: 0,
      failed: 0,
      pages: []
    });
    stopRef.current = false;
    autoRunRef.current = {
      active: autoLoop,
      nextBatch: 1,
      maxBatches,
      totalInserted: 0,
      totalFailed: 0,
      pages: []
    };
    let keepsPolling = false;
    try {
      if (!autoLoop) {
        const res = await runOnce();
        setResult(res);
        if (res?.queued && res?.pendingSlugs?.length) {
          keepsPolling = true;
          scheduleStatusPoll(res.pendingSlugs);
          return;
        }
      } else {
        const res = await runOnce();
        setResult(res);
        autoRunRef.current.nextBatch = 2;
        if (res?.queued && res?.pendingSlugs?.length) {
          keepsPolling = true;
          scheduleStatusPoll(res.pendingSlugs);
          return;
        }
        keepsPolling = true;
        await finishAutoBatch(res);
      }
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      if (!keepsPolling) setBusy(false);
    }
  };
  const stop = () => {
    stopRef.current = true;
  };
  return /* @__PURE__ */ jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Generate from Content Plan" }),
    /* @__PURE__ */ jsxs("p", { className: "mt-2 text-muted-foreground", children: [
      "Pulls pending rows from ",
      /* @__PURE__ */ jsx("code", { children: "content_plan" }),
      " (3,286 prioritized pages), generates each one with Gemini using its own H1, keywords, and uniqueness angle, validates internal links + FAQ, then inserts into ",
      /* @__PURE__ */ jsx("code", { children: "content_pages" }),
      ". No SQL copy-paste, no doorway pages."
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-lg border border-border bg-card p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Queue & recent activity" }),
        /* @__PURE__ */ jsx("button", { onClick: refreshStats, disabled: statsLoading, className: "rounded-md border border-input px-3 py-1.5 text-xs font-medium disabled:opacity-50", children: statsLoading ? "Refreshing…" : "Refresh" })
      ] }),
      !stats && !statsLoading && /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "No data yet." }),
      stats?.error && /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-destructive", children: stats.error }),
      stats?.ok && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-3 sm:grid-cols-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-muted/30 p-3", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Generated" }),
            /* @__PURE__ */ jsx("div", { className: "mt-1 text-2xl font-semibold", children: stats.totals.generated.toLocaleString() }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: stats.totals.total > 0 ? `${Math.round(stats.totals.generated / stats.totals.total * 100)}% of plan` : "" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-muted/30 p-3", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Pending" }),
            /* @__PURE__ */ jsx("div", { className: "mt-1 text-2xl font-semibold", children: stats.totals.pending.toLocaleString() }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: plannedPages > 0 && stats.totals.pending > 0 ? `${Math.ceil(stats.totals.pending / plannedPages)} runs at current size` : "" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-muted/30 p-3", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Paused (auto)" }),
            /* @__PURE__ */ jsx("div", { className: "mt-1 text-2xl font-semibold text-amber-600", children: stats.totals.paused.toLocaleString() }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Failed 3+ times — won't retry until resumed" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-muted/30 p-3", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Plan total" }),
            /* @__PURE__ */ jsx("div", { className: "mt-1 text-2xl font-semibold", children: stats.totals.total.toLocaleString() })
          ] })
        ] }),
        stats.pendingByTier.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs font-medium uppercase text-muted-foreground", children: "Pending by tier" }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 flex flex-wrap gap-2 text-xs", children: stats.pendingByTier.map((t) => /* @__PURE__ */ jsxs("span", { className: "rounded-full border border-border bg-background px-2 py-1 font-mono", children: [
            t.tier,
            ": ",
            t.n
          ] }, t.tier)) })
        ] }),
        stats.totals.paused > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 dark:bg-amber-950/30", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs font-medium uppercase text-amber-900 dark:text-amber-200", children: "Paused queue" }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx("button", { onClick: async () => {
                if (!confirm(`Resume only paused rows from older validator versions (current: ${stats.pausedByValidator.find((v) => v.version !== "(pre-tracking)")?.version ?? "v2-faq8-2026-05-09"})?`)) return;
                const res = await generateContentBatch({
                  data: {
                    action: "resume-paused",
                    onlyStaleValidator: true
                  }
                });
                alert(`Resumed ${res.resumed ?? 0} stale rows back to pending.`);
                refreshStats();
              }, className: "rounded-md border border-amber-400 bg-background px-3 py-1.5 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/40", children: "Resume stale-validator only" }),
              /* @__PURE__ */ jsx("button", { onClick: async () => {
                if (!confirm(`Resume ALL ${stats.totals.paused} paused rows back to pending? They will be retried on the next run.`)) return;
                const res = await generateContentBatch({
                  data: {
                    action: "resume-paused"
                  }
                });
                alert(`Resumed ${res.resumed ?? 0} rows back to pending.`);
                refreshStats();
              }, className: "rounded-md border border-amber-500 bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600", children: "Resume all paused" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-3 lg:grid-cols-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-amber-900 dark:text-amber-200", children: "By tier" }),
              /* @__PURE__ */ jsx("div", { className: "mt-1 flex flex-wrap gap-1 text-xs", children: stats.pausedByTier.map((t) => /* @__PURE__ */ jsxs("span", { className: "rounded-full border border-amber-300 bg-background px-2 py-0.5 font-mono", children: [
                t.tier,
                ": ",
                t.n
              ] }, t.tier)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-amber-900 dark:text-amber-200", children: "By validator version" }),
              /* @__PURE__ */ jsx("div", { className: "mt-1 flex flex-wrap gap-1 text-xs", children: stats.pausedByValidator.map((v) => /* @__PURE__ */ jsxs("span", { className: "rounded-full border border-amber-300 bg-background px-2 py-0.5 font-mono", children: [
                v.version,
                ": ",
                v.n
              ] }, v.version)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-amber-900 dark:text-amber-200", children: "Top failure reasons" }),
              /* @__PURE__ */ jsx("ul", { className: "mt-1 space-y-0.5 text-xs", children: stats.topPausedReasons.map((r) => /* @__PURE__ */ jsxs("li", { className: "flex justify-between gap-2", children: [
                /* @__PURE__ */ jsx("span", { children: r.reason }),
                /* @__PURE__ */ jsx("span", { className: "font-mono text-muted-foreground", children: r.n })
              ] }, r.reason)) })
            ] })
          ] })
        ] }),
        stats.perDay.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs font-medium uppercase text-muted-foreground", children: "Inserts per day (last 14d)" }),
          /* @__PURE__ */ jsx("ul", { className: "mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4", children: stats.perDay.map((d) => /* @__PURE__ */ jsxs("li", { className: "flex justify-between font-mono", children: [
            /* @__PURE__ */ jsx("span", { children: d.day }),
            /* @__PURE__ */ jsx("span", { children: d.n })
          ] }, d.day)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-4 lg:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs font-medium uppercase text-muted-foreground", children: "Last 20 inserted (proof)" }),
            stats.recentInserts.length === 0 ? /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: "Nothing inserted yet." }) : /* @__PURE__ */ jsx("ul", { className: "mt-2 max-h-64 space-y-1 overflow-auto text-xs", children: stats.recentInserts.map((p) => /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsxs("a", { href: `/p/${p.slug}`, target: "_blank", rel: "noreferrer", className: "text-primary hover:underline", children: [
                "/p/",
                p.slug
              ] }),
              /* @__PURE__ */ jsx("span", { className: "ml-2 text-muted-foreground", children: new Date(p.created_at).toLocaleString() })
            ] }, p.slug)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs font-medium uppercase text-muted-foreground", children: "Recent rejections (with attempt count)" }),
            stats.recentErrors.length === 0 ? /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: "No recent errors." }) : /* @__PURE__ */ jsx("ul", { className: "mt-2 max-h-64 space-y-2 overflow-auto text-xs", children: stats.recentErrors.map((e) => /* @__PURE__ */ jsxs("li", { className: "rounded border border-border bg-muted/20 p-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "font-mono", children: e.slug }),
                /* @__PURE__ */ jsxs("span", { className: `rounded px-1.5 py-0.5 text-[10px] font-medium ${e.status === "paused" ? "bg-amber-200 text-amber-900" : "bg-muted text-muted-foreground"}`, children: [
                  e.status,
                  " · attempt ",
                  e.attempts
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-1 text-muted-foreground", children: e.error })
            ] }, e.slug)) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-4 rounded-lg border border-border bg-card p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium", children: "Pages this run" }),
          /* @__PURE__ */ jsx("input", { type: "number", min: 1, max: 10, value: count, onChange: (e) => setCount(Math.min(10, Math.max(1, Number(e.target.value) || 1))), className: "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium", children: "Priority tier" }),
          /* @__PURE__ */ jsxs("select", { value: tier, onChange: (e) => setTier(e.target.value), className: "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm", children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Any" }),
            /* @__PURE__ */ jsx("option", { value: "T1 (200k+)", children: "T1 — 200k+ (128 pending)" }),
            /* @__PURE__ */ jsx("option", { value: "T2 (75k–199k)", children: "T2 — 75k–199k" }),
            /* @__PURE__ */ jsx("option", { value: "T3 (25k–74k)", children: "T3 — 25k–74k" }),
            /* @__PURE__ */ jsx("option", { value: "T4 (10k–24k)", children: "T4 — 10k–24k" }),
            /* @__PURE__ */ jsx("option", { value: "longtail", children: "Long-tails (host/trust)" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium", children: "State code (optional)" }),
          /* @__PURE__ */ jsx("input", { type: "text", maxLength: 2, value: stateCode, onChange: (e) => setStateCode(e.target.value.toUpperCase()), placeholder: "TX", className: "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm uppercase" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium", children: "Model" }),
          /* @__PURE__ */ jsxs("select", { value: model, onChange: (e) => setModel(e.target.value), className: "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm", children: [
            /* @__PURE__ */ jsx("option", { value: "google/gemini-3-flash-preview", children: "Gemini 3 Flash Preview" }),
            /* @__PURE__ */ jsx("option", { value: "google/gemini-2.5-pro", children: "Gemini 2.5 Pro" }),
            /* @__PURE__ */ jsx("option", { value: "google/gemini-3.1-pro-preview", children: "Gemini 3.1 Pro Preview" }),
            /* @__PURE__ */ jsx("option", { value: "google/gemini-3-flash-preview", children: "Gemini 2.5 Flash" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4", children: [
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: warmOnly, onChange: (e) => setWarmOnly(e.target.checked) }),
          "Warm-climate cities only"
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: dryRun, onChange: (e) => setDryRun(e.target.checked) }),
          "Dry run (validate only)"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end gap-4 border-t border-border pt-4", children: [
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm font-medium", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: autoLoop, onChange: (e) => setAutoLoop(e.target.checked) }),
          "Auto-loop up to 100 pages"
        ] }),
        autoLoop && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs text-muted-foreground", children: "Max batches" }),
          /* @__PURE__ */ jsx("input", { type: "number", min: 1, max: 10, value: maxBatches, onChange: (e) => setMaxBatches(Math.min(10, Math.max(1, Number(e.target.value) || 1))), className: "mt-1 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-muted/30 p-4 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
            "Setup check:",
            " ",
            preflight.status === "checking" && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Verifying backend…" }),
            preflight.status === "ok" && /* @__PURE__ */ jsx("span", { className: "text-green-600", children: "✓ Ready to generate" }),
            preflight.status === "failed" && /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "✗ Not ready" }),
            preflight.status === "idle" && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Not run yet" })
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: runPreflight, disabled: preflight.status === "checking" || busy, className: "rounded-md border border-input px-3 py-1.5 text-xs font-medium disabled:opacity-50", children: preflight.status === "checking" ? "Checking…" : "Re-check setup" })
        ] }),
        preflight.details && /* @__PURE__ */ jsxs("ul", { className: "mt-3 space-y-1 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxs("li", { children: [
            "Edge function:",
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-mono", children: preflight.details.edgeFunction ?? "unreachable" })
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "Admin auth:",
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-mono", children: preflight.details.adminAuth ?? "unknown" })
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "LOVABLE_API_KEY:",
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-mono", children: preflight.details.lovableApiKey ?? "missing" })
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "AI gateway:",
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-mono", children: preflight.details.aiGateway ?? "unknown" }),
            preflight.details.aiError && /* @__PURE__ */ jsxs("span", { className: "ml-1 text-destructive", children: [
              "— ",
              preflight.details.aiError
            ] })
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "Pending plan rows:",
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-mono", children: preflight.details.pendingPlanRows ?? "?" })
          ] }),
          preflight.details.error && /* @__PURE__ */ jsx("li", { className: "text-destructive", children: preflight.details.error })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: run, disabled: busy || preflight.status !== "ok", className: "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50", title: preflight.status !== "ok" ? "Run the setup check first" : void 0, children: busy ? autoLoop ? `Looping… batch ${progress.batch}/${maxBatches}` : result?.queued ? "Generating in background…" : "Starting generation…" : autoLoop ? `Auto-generate up to ${count * maxBatches} pages` : dryRun ? `Generate & Validate ${count} page(s)` : `Generate & Insert ${count} page(s)` }),
        busy && autoLoop && /* @__PURE__ */ jsx("button", { onClick: stop, className: "rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive", children: "Stop after this batch" }),
        /* @__PURE__ */ jsxs("div", { className: "ml-auto self-center text-xs text-muted-foreground", children: [
          "Est. spend this run: ",
          /* @__PURE__ */ jsxs("span", { className: "font-mono", children: [
            "$",
            estCost.toFixed(2)
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "ml-1", children: [
            "(",
            plannedPages,
            " page",
            plannedPages === 1 ? "" : "s",
            " × ~$",
            perPageCost.toFixed(3),
            ")"
          ] })
        ] })
      ] }),
      error && /* @__PURE__ */ jsx("div", { className: "rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive", children: error })
    ] }),
    autoLoop && progress.batch > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-lg border border-border bg-card p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Auto-loop progress" }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
          "Batch ",
          progress.batch,
          " · ",
          progress.inserted,
          " inserted · ",
          progress.failed,
          " failed"
        ] })
      ] }),
      /* @__PURE__ */ jsx("ul", { className: "mt-4 max-h-96 space-y-1 overflow-auto text-xs", children: progress.pages.map((p) => /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsxs("a", { href: `/p/${p.slug}`, target: "_blank", rel: "noreferrer", className: "text-primary hover:underline", children: [
          "/p/",
          p.slug
        ] }),
        /* @__PURE__ */ jsx("span", { className: "ml-2 text-muted-foreground", children: p.title })
      ] }, p.slug)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-lg border border-border bg-card p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Run log" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            log.length,
            " entr",
            log.length === 1 ? "y" : "ies"
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => setLog([]), disabled: log.length === 0, className: "rounded-md border border-input px-2 py-1 disabled:opacity-50", children: "Clear" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-muted-foreground break-all", children: [
        "Endpoint: ",
        /* @__PURE__ */ jsx("code", { children: ENDPOINT })
      ] }),
      log.length === 0 ? /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm text-muted-foreground", children: "No calls yet. Run the setup check or start a generation to see entries here." }) : /* @__PURE__ */ jsx("ul", { className: "mt-4 space-y-3", children: log.map((e) => /* @__PURE__ */ jsxs("li", { className: `rounded-md border p-3 text-sm ${e.ok ? "border-border bg-background" : "border-destructive/40 bg-destructive/5"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: `rounded px-2 py-0.5 text-xs font-mono ${e.ok ? "bg-green-500/10 text-green-700" : "bg-destructive/10 text-destructive"}`, children: e.ok ? "OK" : "FAIL" }),
          /* @__PURE__ */ jsx("span", { className: "rounded bg-muted px-2 py-0.5 text-xs font-mono uppercase", children: e.action }),
          typeof e.httpStatus === "number" && /* @__PURE__ */ jsxs("span", { className: "rounded bg-muted px-2 py-0.5 text-xs font-mono", children: [
            "HTTP ",
            e.httpStatus
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
            new Date(e.at).toLocaleTimeString(),
            " · ",
            e.durationMs,
            "ms"
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-2", children: e.summary }),
        /* @__PURE__ */ jsxs("details", { className: "mt-2", children: [
          /* @__PURE__ */ jsx("summary", { className: "cursor-pointer text-xs text-muted-foreground", children: e.error ? "Error details" : "Response payload" }),
          /* @__PURE__ */ jsx("pre", { className: "mt-2 max-h-64 overflow-auto rounded bg-muted/50 p-2 text-xs", children: e.error ? e.error : JSON.stringify(e.response ?? null, null, 2) })
        ] })
      ] }, e.id)) })
    ] }),
    result && (() => {
      const validationErrors = result.validationErrors ?? [];
      const pages = result.pages ?? [];
      return /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-lg border border-border bg-card p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: result.ok ? "✓ Success" : "✗ Issues" }),
          /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
            result.inserted ?? 0,
            " inserted / ",
            result.attempted,
            " attempted"
          ] })
        ] }),
        validationErrors.length > 0 && /* @__PURE__ */ jsxs("details", { className: "mt-3", open: true, children: [
          /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer text-sm font-medium text-destructive", children: [
            validationErrors.length,
            " validation note(s) — click to see per-slug failure reason"
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-1 rounded border border-destructive/30 bg-destructive/5 p-3 text-xs text-foreground", children: validationErrors.map((e, i) => /* @__PURE__ */ jsxs("li", { className: "font-mono", children: [
            "• ",
            e
          ] }, i)) })
        ] }),
        /* @__PURE__ */ jsx("ul", { className: "mt-4 space-y-2", children: pages.map((p) => /* @__PURE__ */ jsxs("li", { className: "text-sm", children: [
          /* @__PURE__ */ jsxs("a", { href: `/p/${p.slug}`, target: "_blank", rel: "noreferrer", className: "text-primary hover:underline", children: [
            "/p/",
            p.slug
          ] }),
          /* @__PURE__ */ jsx("span", { className: "ml-2 text-muted-foreground", children: p.title })
        ] }, p.slug)) })
      ] });
    })()
  ] });
}
export {
  GenerateContentPage as component
};
