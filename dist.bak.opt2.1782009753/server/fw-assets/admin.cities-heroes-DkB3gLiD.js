import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { c as createSsrRpc } from "./cities.functions-XBYRqf13.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
import { c as createServerFn } from "../server.js";
import { A as AdminLayout } from "./admin-layout-BNp_05PW.js";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "lucide-react";
import "./router-BvRNdW25.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
import "./client-Dh5RMKgP.js";
import "./states-UIdvqlKs.js";
import "./courses.server-Bfz1suZ4.js";
import "@lovable.dev/webhooks-js";
import "crypto";
import "@react-email/components";
import "./registry-Dn-QpeYo.js";
import "./_unsubscribe-footer-DXp0Y_3B.js";
import "@lovable.dev/email-js";
import "./reauthentication-CCohUDQL.js";
import "node:crypto";
import "./sms.server-BJah3xxU.js";
import "./sharetribe-mirror.server-D8Jwl9-L.js";
import "./sharetribe.server-BZ7y3aGI.js";
import "./listing-sync.server-C2GpYdIM.js";
import "./renter-drip.server-CBcoOJUi.js";
import "./emailit-DRsipvVx.js";
import "node:fs";
import "node:path";
import "./host-drip.server-LDeZNUHd.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const inputSchema = z.object({
  force: z.boolean().optional(),
  limit: z.number().int().positive().max(500).optional(),
  onlySlugs: z.array(z.string()).max(500).optional(),
  batchSize: z.number().int().positive().max(100).optional(),
  concurrency: z.number().int().positive().max(8).optional(),
  excludeSlugs: z.array(z.string()).max(1e4).optional(),
  maxDurationMs: z.number().int().positive().max(12e4).optional(),
  generateFallback: z.boolean().optional(),
  maxFallbacksPerBatch: z.number().int().positive().max(50).optional()
});
const runHeroBackfill = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => inputSchema.parse(data)).handler(createSsrRpc("1a5beb97f89a4ff75edde8c7f9e00a0e670cf3f7248931056faa67622874a406"));
function AdminHeroBackfillPage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [errMsg, setErrMsg] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [stoppedReason, setStoppedReason] = useState(null);
  const [autoContinue, setAutoContinue] = useState(false);
  const [batchSize, setBatchSize] = useState(25);
  const [concurrency, setConcurrency] = useState(2);
  const [forceMode, setForceMode] = useState(false);
  const [generateFallback, setGenerateFallback] = useState(true);
  const [maxFallbacksPerBatch, setMaxFallbacksPerBatch] = useState(10);
  const processedRef = useRef(/* @__PURE__ */ new Set());
  const stopRef = useRef(false);
  function reset() {
    processedRef.current = /* @__PURE__ */ new Set();
    setResults([]);
    setSummary(null);
    setRemaining(null);
    setStoppedReason(null);
    setErrMsg(null);
  }
  async function runBatch(force) {
    const excludeSlugs = force ? Array.from(processedRef.current) : void 0;
    try {
      const out = await runHeroBackfill({
        data: {
          force,
          batchSize,
          concurrency,
          excludeSlugs,
          generateFallback,
          maxFallbacksPerBatch
        }
      });
      setResults((prev) => [...prev, ...out.results]);
      out.processedSlugs.forEach((s) => processedRef.current.add(s));
      setSummary((prev) => {
        const next = {
          ...prev ?? {}
        };
        for (const [k, v] of Object.entries(out.summary)) {
          next[k] = (next[k] ?? 0) + v;
        }
        return next;
      });
      setRemaining(out.remaining);
      setStoppedReason(out.stoppedReason);
      return {
        remaining: out.remaining
      };
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : String(e));
      return null;
    }
  }
  async function startRun(force, continuous) {
    if (running) return;
    reset();
    setForceMode(force);
    setAutoContinue(continuous);
    stopRef.current = false;
    setRunning(true);
    try {
      while (true) {
        const out = await runBatch(force);
        if (!out) break;
        if (!continuous) break;
        if (stopRef.current) break;
        if (out.remaining <= 0) break;
        await new Promise((r) => setTimeout(r, 800));
      }
    } finally {
      setRunning(false);
      setAutoContinue(false);
    }
  }
  async function continueOneBatch() {
    if (running) return;
    setRunning(true);
    try {
      await runBatch(forceMode);
    } finally {
      setRunning(false);
    }
  }
  function stop() {
    stopRef.current = true;
  }
  useEffect(() => () => {
    stopRef.current = true;
  }, []);
  function downloadMissesCsv() {
    const misses = results.filter((r) => r.status !== "ok");
    const csv = "slug,name,status,source_url,error\n" + misses.map((r) => [r.slug, JSON.stringify(r.name), r.status, r.source_url, JSON.stringify(r.error ?? "")].join(",")).join("\n");
    const blob = new Blob([csv], {
      type: "text/csv"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "city-hero-misses.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return /* @__PURE__ */ jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", className: "text-sm text-muted-foreground hover:underline", children: "← Home" }),
      /* @__PURE__ */ jsx("h1", { className: "mt-2 text-3xl font-bold tracking-tight", children: "City hero image backfill" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-2 text-muted-foreground", children: [
        "Scrapes the source page for each city and saves the unique hero into the database. Admin only.",
        " ",
        /* @__PURE__ */ jsx(Link, { to: "/admin/cities-heroes-report", className: "text-primary hover:underline", children: "View per-city report →" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4", children: [
      /* @__PURE__ */ jsxs("label", { className: "block text-xs", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Batch size" }),
        /* @__PURE__ */ jsx("input", { type: "number", min: 1, max: 100, value: batchSize, disabled: running, onChange: (e) => setBatchSize(Math.max(1, Math.min(100, Number(e.target.value) || 1))), className: "mt-1 w-full rounded-md border border-border bg-card px-2 py-1.5" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "block text-xs", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Concurrency" }),
        /* @__PURE__ */ jsx("input", { type: "number", min: 1, max: 8, value: concurrency, disabled: running, onChange: (e) => setConcurrency(Math.max(1, Math.min(8, Number(e.target.value) || 1))), className: "mt-1 w-full rounded-md border border-border bg-card px-2 py-1.5" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "block text-xs", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Max AI fallbacks / batch" }),
        /* @__PURE__ */ jsx("input", { type: "number", min: 0, max: 50, value: maxFallbacksPerBatch, disabled: running || !generateFallback, onChange: (e) => setMaxFallbacksPerBatch(Math.max(0, Math.min(50, Number(e.target.value) || 0))), className: "mt-1 w-full rounded-md border border-border bg-card px-2 py-1.5 disabled:opacity-50" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-xs", children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", checked: generateFallback, disabled: running, onChange: (e) => setGenerateFallback(e.target.checked) }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Generate AI hero on miss" }),
          /* @__PURE__ */ jsx("span", { className: "block text-muted-foreground", children: "When scrape can't find an image, generate one and upload it." })
        ] })
      ] }),
      remaining !== null && /* @__PURE__ */ jsxs("div", { className: "col-span-2 rounded-md border border-border bg-card p-2 text-xs", children: [
        /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: "Remaining" }),
        /* @__PURE__ */ jsx("div", { className: "text-lg font-semibold", children: remaining }),
        stoppedReason && /* @__PURE__ */ jsxs("div", { className: "text-[10px] uppercase tracking-wide text-muted-foreground", children: [
          "last stop: ",
          stoppedReason
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3", children: [
      /* @__PURE__ */ jsx("button", { disabled: running, onClick: () => startRun(false, false), className: "inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: running && !autoContinue ? "Running…" : "Run one batch (missing)" }),
      /* @__PURE__ */ jsx("button", { disabled: running, onClick: () => startRun(false, true), className: "inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: running && autoContinue ? "Auto-running…" : "Run until done (missing)" }),
      /* @__PURE__ */ jsx("button", { disabled: running, onClick: () => startRun(true, true), className: "inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-50", children: "Force re-scrape (until done)" }),
      !running && remaining !== null && remaining > 0 && /* @__PURE__ */ jsx("button", { onClick: continueOneBatch, className: "inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary", children: "Continue next batch" }),
      running && autoContinue && /* @__PURE__ */ jsx("button", { onClick: stop, className: "inline-flex items-center justify-center rounded-full border border-destructive/40 bg-destructive/10 px-5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/20", children: "Stop after current batch" }),
      results.length > 0 && /* @__PURE__ */ jsx("button", { onClick: downloadMissesCsv, className: "inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary", children: "Download misses CSV" })
    ] }),
    errMsg && /* @__PURE__ */ jsx("div", { className: "mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive", children: errMsg }),
    summary && /* @__PURE__ */ jsx("div", { className: "mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4", children: Object.entries(summary).map(([k, v]) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: v }),
      /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: k })
    ] }, k)) }),
    results.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-8 overflow-hidden rounded-lg border border-border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-secondary/40 text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "City" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Source" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Hero / error" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border", children: results.map((r) => /* @__PURE__ */ jsxs("tr", { className: "align-top", children: [
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2 font-mono text-xs", children: /* @__PURE__ */ jsx("span", { className: r.status === "ok" ? "text-emerald-600" : r.status === "generated" ? "text-sky-600" : r.status === "miss" ? "text-amber-600" : "text-destructive", children: r.status }) }),
        /* @__PURE__ */ jsxs("td", { className: "px-3 py-2", children: [
          /* @__PURE__ */ jsx("div", { className: "font-medium", children: r.name }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: r.slug })
        ] }),
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs", children: r.source_url ? /* @__PURE__ */ jsx("a", { href: r.source_url, target: "_blank", rel: "noreferrer", className: "text-primary hover:underline", children: r.source_url.replace("https://www.", "") }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "—" }) }),
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs", children: r.hero_url ? /* @__PURE__ */ jsxs("a", { href: r.hero_url, target: "_blank", rel: "noreferrer", className: "break-all text-primary hover:underline", children: [
          r.hero_url.slice(0, 80),
          "…"
        ] }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: r.error ?? "—" }) })
      ] }, r.slug)) })
    ] }) })
  ] });
}
export {
  AdminHeroBackfillPage as component
};
