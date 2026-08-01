import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import { A as AdminLayout } from "./admin-layout-C8fuK5rJ.js";
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
import "@tanstack/react-router";
import "@tanstack/react-router/ssr/server";
import "lucide-react";
import "./router-DotN2vF1.js";
import "@tanstack/react-query";
import "./site-footer-defaults-asWdr-hi.js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
import "./client-Dh5RMKgP.js";
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
import "./renter-drip.server-C0_mcvap.js";
import "node:fs";
import "node:path";
import "./host-drip.server-BcWebfNA.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const scrapeContentPage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  id: z.string().uuid()
}).parse(data)).handler(createSsrRpc("cc1a925af565cc8102a84bede880710eec0177183540050f638284898ec31e7b"));
const nextPendingPage = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  template_type: z.string().default("host_acq_city")
}).parse(data ?? {})).handler(createSsrRpc("968dc7cf943a155cb3041dcf7f9252a4fb3b76bf149b5b3809fad848722e54a4"));
const scrapeProgress = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  template_type: z.string().default("host_acq_city")
}).parse(data ?? {})).handler(createSsrRpc("d9befc9af4bef82f33cfb13162df09215c0864231dd75749925ed8df5ae72b4a"));
function AdminContentMigration() {
  const [templateType, setTemplateType] = React.useState("host_acq_city");
  const [next, setNext] = React.useState(null);
  const [scraped, setScraped] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [progress, setProgress] = React.useState(null);
  const [autoRun, setAutoRun] = React.useState(false);
  const loadProgress = React.useCallback(async () => {
    try {
      const p = await scrapeProgress({
        data: {
          template_type: templateType
        }
      });
      setProgress(p);
    } catch {
    }
  }, [templateType]);
  const loadNext = React.useCallback(async () => {
    setError(null);
    setScraped(null);
    setBusy(true);
    try {
      const res = await nextPendingPage({
        data: {
          template_type: templateType
        }
      });
      setNext(res.page);
    } catch (e) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }, [templateType]);
  React.useEffect(() => {
    void loadNext();
    void loadProgress();
  }, [loadNext, loadProgress]);
  React.useEffect(() => {
    if (!autoRun && !busy) return;
    const id = setInterval(() => {
      void loadProgress();
    }, 3e3);
    return () => clearInterval(id);
  }, [autoRun, busy, loadProgress]);
  const runScrape = React.useCallback(async () => {
    if (!next?.id) return;
    setError(null);
    setBusy(true);
    try {
      const res = await scrapeContentPage({
        data: {
          id: next.id
        }
      });
      setScraped(res.page);
      void loadProgress();
      try {
        const nextRes = await nextPendingPage({
          data: {
            template_type: templateType
          }
        });
        setNext(nextRes.page);
      } catch {
      }
    } catch (e) {
      setError(e?.message ?? String(e));
      setAutoRun(false);
    } finally {
      setBusy(false);
    }
  }, [next?.id, templateType, loadProgress]);
  React.useEffect(() => {
    if (!autoRun || busy) return;
    if (!next?.id) {
      setAutoRun(false);
      return;
    }
    void runScrape();
  }, [autoRun, busy, next?.id, runScrape]);
  return /* @__PURE__ */ jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Content migration scraper" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Pulls one pending row at a time via Firecrawl so you can review before bulk-running." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "template_type:" }),
      /* @__PURE__ */ jsxs("select", { value: templateType, onChange: (e) => setTemplateType(e.target.value), className: "rounded border border-border bg-background px-2 py-1 text-sm", children: [
        /* @__PURE__ */ jsx("option", { value: "host_acq_city", children: "host_acq_city" }),
        /* @__PURE__ */ jsx("option", { value: "event_guide", children: "event_guide" }),
        /* @__PURE__ */ jsx("option", { value: "resource", children: "resource" })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: loadNext, disabled: busy, className: "rounded-full border border-border px-4 py-1.5 text-sm", children: "Reload next" }),
      /* @__PURE__ */ jsx("button", { onClick: () => setAutoRun((v) => !v), disabled: !next?.id && !autoRun, className: `rounded-full px-4 py-1.5 text-sm font-semibold ${autoRun ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`, children: autoRun ? "Stop auto-run" : "Auto-run all" })
    ] }),
    progress && /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
        /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
          "Progress: ",
          progress.scraped,
          " / ",
          progress.total
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
          progress.pending,
          " pending",
          progress.total > 0 && ` · ${Math.round(progress.scraped / progress.total * 100)}%`
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-2 h-3 w-full overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsx("div", { className: `h-full bg-primary transition-all duration-500 ${autoRun ? "animate-pulse" : ""}`, style: {
        width: `${progress.total > 0 ? Math.min(100, progress.scraped / progress.total * 100) : 0}%`
      } }) })
    ] }),
    error && /* @__PURE__ */ jsx("div", { className: "mt-4 rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive", children: error }),
    next ? /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-2xl border border-border p-5", children: [
      /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Next pending" }),
      /* @__PURE__ */ jsx("div", { className: "mt-1 font-mono text-sm", children: next.url_path }),
      /* @__PURE__ */ jsx("a", { href: next.source_url, target: "_blank", rel: "noreferrer", className: "mt-1 block text-xs text-primary underline", children: next.source_url }),
      /* @__PURE__ */ jsx("button", { onClick: runScrape, disabled: busy, className: "mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground", children: busy ? "Scraping…" : "Scrape this page" })
    ] }) : /* @__PURE__ */ jsxs("p", { className: "mt-6 text-sm text-muted-foreground", children: [
      "No pending rows for ",
      templateType,
      "."
    ] }),
    scraped && /* @__PURE__ */ jsxs("div", { className: "mt-8 rounded-2xl border border-border p-5", children: [
      /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Scraped result" }),
      /* @__PURE__ */ jsx("div", { className: "mt-1 font-semibold", children: scraped.title }),
      /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: scraped.seo_description }),
      /* @__PURE__ */ jsxs("details", { className: "mt-3", children: [
        /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer text-sm", children: [
          "body_markdown (",
          scraped.body_markdown?.length ?? 0,
          " chars)"
        ] }),
        /* @__PURE__ */ jsx("pre", { className: "mt-2 max-h-96 overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap", children: scraped.body_markdown })
      ] }),
      /* @__PURE__ */ jsxs("details", { className: "mt-3", children: [
        /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer text-sm", children: [
          "raw_html (",
          scraped.raw_html?.length ?? 0,
          " chars)"
        ] }),
        /* @__PURE__ */ jsx("pre", { className: "mt-2 max-h-96 overflow-auto rounded bg-muted p-3 text-xs", children: scraped.raw_html?.slice(0, 5e3) })
      ] })
    ] })
  ] });
}
export {
  AdminContentMigration as component
};
