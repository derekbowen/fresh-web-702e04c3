import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { A as AdminLayout } from "./admin-layout-Ck0iqDJo.js";
import { aW as listSeoIssues, aP as getSeoJobStatus, aX as enqueueSeoFixJobs, aR as cancelQueuedSeoJobs, aY as aiFixContentPage } from "./router-BTf4C8qB.js";
import "lucide-react";
import "./client-Dh5RMKgP.js";
import "@supabase/supabase-js";
import "@tanstack/react-query";
import "./site-footer-defaults-asWdr-hi.js";
import "./cities.functions-DKA5O9eJ.js";
import "../server.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "zod";
import "./client.server-D5ro3rAQ.js";
import "./auth-middleware-C3cX-s7a.js";
import "./createMiddleware-BvN2ghIY.js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
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
import "./renter-drip.server-C0Ma8t5O.js";
import "node:fs";
import "node:path";
import "./host-drip.server-DDQBE_qt.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const KINDS = [{
  id: "thin",
  label: "Thin pages (<500 words)",
  fixMode: "full",
  fixLabel: "Expand body"
}, {
  id: "empty",
  label: "Empty body",
  fixMode: "full",
  fixLabel: "Generate body"
}, {
  id: "missing_meta",
  label: "Missing meta description",
  fixMode: "meta_only",
  fixLabel: "Generate meta"
}, {
  id: "title_is_slug",
  label: "Title is just slug",
  fixMode: "title_only",
  fixLabel: "Rewrite title"
}];
function SeoHealth() {
  const [kindId, setKindId] = React.useState("thin");
  const kind = KINDS.find((k) => k.id === kindId);
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState(/* @__PURE__ */ new Set());
  const [results, setResults] = React.useState({});
  const [running, setRunning] = React.useState(false);
  const [progress, setProgress] = React.useState({
    done: 0,
    total: 0,
    current: ""
  });
  React.useRef(false);
  const [batchId, setBatchId] = React.useState(null);
  const [jobs, setJobs] = React.useState({});
  const [summary, setSummary] = React.useState({
    queued: 0,
    processing: 0,
    done: 0,
    failed: 0,
    cancelled: 0
  });
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await listSeoIssues({
        data: {
          kind: kindId,
          limit: 200
        }
      });
      setRows(r.rows);
      setSelected(/* @__PURE__ */ new Set());
    } finally {
      setLoading(false);
    }
  }, [kindId]);
  React.useEffect(() => {
    void load();
  }, [load]);
  React.useEffect(() => {
    if (!batchId && rows.length === 0) return;
    let cancelled = false;
    let timer;
    const tick = async () => {
      const pageIds = rows.map((r) => r.id);
      try {
        const r = await getSeoJobStatus({
          data: batchId ? {
            batchId
          } : {
            pageIds
          }
        });
        if (cancelled) return;
        const map = {};
        for (const j of r.jobs) map[j.page_id] = j;
        setJobs(map);
        setSummary(r.summary);
      } catch {
      }
      const stillRunning = Object.values(jobs).some((j) => j.status === "queued" || j.status === "processing");
      timer = setTimeout(tick, stillRunning || batchId ? 3e3 : 8e3);
    };
    void tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [batchId, rows.length]);
  function toggle(id) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function toggleAll() {
    setSelected((s) => s.size === rows.length ? /* @__PURE__ */ new Set() : new Set(rows.map((r) => r.id)));
  }
  async function fixOne(row) {
    const t0 = Date.now();
    try {
      const res = await aiFixContentPage({
        data: {
          id: row.id,
          mode: kind.fixMode
        }
      });
      return {
        id: row.id,
        ok: !!res.ok,
        error: res.error,
        newWords: res.newWords,
        ms: Date.now() - t0
      };
    } catch (e) {
      return {
        id: row.id,
        ok: false,
        error: e?.message || "Failed",
        ms: Date.now() - t0
      };
    }
  }
  async function enqueueBatch(targets) {
    if (!targets.length) return;
    const res = await enqueueSeoFixJobs({
      data: {
        pageIds: targets.map((t) => t.id),
        mode: kind.fixMode
      }
    });
    if (res.ok) {
      setBatchId(res.batchId);
      setJobs((prev) => {
        const next = {
          ...prev
        };
        for (const t of targets) {
          next[t.id] = {
            id: "pending",
            page_id: t.id,
            mode: kind.fixMode,
            status: "queued",
            attempts: 0,
            result: null,
            error: null,
            batch_id: res.batchId,
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            finished_at: null
          };
        }
        return next;
      });
    }
  }
  async function cancelBatch() {
    if (!batchId) return;
    await cancelQueuedSeoJobs({
      data: {
        batchId
      }
    });
    setBatchId(null);
  }
  return /* @__PURE__ */ jsxs(AdminLayout, { title: "SEO Health", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "SEO Health" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Drill into published /p/* pages with quality issues, then fix them with AI." })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/admin/generate-content", className: "shrink-0 text-xs font-semibold text-primary hover:underline", children: "Open Generate content →" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 flex flex-wrap gap-2", children: KINDS.map((k) => /* @__PURE__ */ jsx("button", { onClick: () => setKindId(k.id), disabled: running, className: `rounded-full border px-3 py-1.5 text-sm ${kindId === k.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"} disabled:opacity-50`, children: k.label }, k.id)) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3", children: [
      /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", checked: rows.length > 0 && selected.size === rows.length, onChange: toggleAll }),
        "Select all (",
        rows.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
        "· ",
        selected.size,
        " selected"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "ml-auto flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => enqueueBatch(rows.filter((r) => selected.has(r.id))), disabled: selected.size === 0, className: "rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: [
          "⚡ Queue ",
          kind.fixLabel,
          " (",
          selected.size,
          ")"
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => enqueueBatch(rows.slice(0, 10)), disabled: rows.length === 0, className: "rounded-md border border-primary px-3 py-1.5 text-sm font-semibold text-primary disabled:opacity-50", children: "Queue first 10" }),
        summary.failed > 0 && /* @__PURE__ */ jsxs("button", { onClick: () => {
          const failedPageIds = new Set(Object.values(jobs).filter((j) => j.status === "failed").map((j) => j.page_id));
          void enqueueBatch(rows.filter((r) => failedPageIds.has(r.id)));
        }, className: "rounded-md border border-yellow-500 px-3 py-1.5 text-sm font-semibold text-yellow-700 dark:text-yellow-300", children: [
          "Retry failed (",
          summary.failed,
          ")"
        ] }),
        batchId && (summary.queued > 0 || summary.processing > 0) && /* @__PURE__ */ jsx("button", { onClick: cancelBatch, className: "rounded-md border border-red-500 px-3 py-1.5 text-sm font-semibold text-red-600", children: "Cancel queue" })
      ] })
    ] }),
    summary.queued + summary.processing + summary.done + summary.failed > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-3 rounded-lg border border-border bg-card p-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 text-xs", children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Background queue" }),
        /* @__PURE__ */ jsxs("span", { className: "rounded bg-muted px-2 py-0.5", children: [
          "⏳ Queued ",
          summary.queued
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "rounded bg-blue-500/20 px-2 py-0.5 text-blue-700 dark:text-blue-300", children: [
          "⚙ Processing ",
          summary.processing
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "rounded bg-green-500/20 px-2 py-0.5 text-green-700 dark:text-green-300", children: [
          "✓ Done ",
          summary.done
        ] }),
        summary.failed > 0 && /* @__PURE__ */ jsxs("span", { className: "rounded bg-red-500/20 px-2 py-0.5 text-red-700 dark:text-red-300", children: [
          "✗ Failed ",
          summary.failed
        ] }),
        /* @__PURE__ */ jsx("span", { className: "ml-auto text-muted-foreground", children: "Worker runs every minute. UI auto-refreshes." })
      ] }),
      (() => {
        const total = summary.queued + summary.processing + summary.done + summary.failed;
        const done = summary.done + summary.failed;
        const pct = total ? Math.round(done / total * 100) : 0;
        return /* @__PURE__ */ jsx("div", { className: "mt-2 h-2 overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-primary transition-all", style: {
          width: `${pct}%`
        } }) });
      })()
    ] }),
    running && /* @__PURE__ */ jsx("div", { className: "mt-3 rounded-lg border border-border bg-card p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        "Fixing ",
        progress.current,
        "…"
      ] }),
      /* @__PURE__ */ jsxs("span", { children: [
        progress.done,
        " / ",
        progress.total
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "mt-3 overflow-x-auto rounded-xl border border-border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-left text-xs uppercase", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "w-8 px-3 py-2" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "URL" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Title" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Template" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Words" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Result" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        rows.map((r) => {
          const res = results[r.id];
          const job = jobs[r.id];
          return /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx("input", { type: "checkbox", checked: selected.has(r.id), onChange: () => toggle(r.id) }) }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 font-mono text-xs", children: /* @__PURE__ */ jsx("a", { href: r.url_path || "#", target: "_blank", rel: "noreferrer", className: "hover:underline", children: r.url_path }) }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 max-w-xs truncate", children: r.title || /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "—" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs text-muted-foreground", children: r.template_type || "—" }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right", children: r.words.toLocaleString() }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs", children: job ? job.status === "queued" ? /* @__PURE__ */ jsx("span", { className: "rounded bg-muted px-1.5 py-0.5 font-bold", children: "⏳ Queued" }) : job.status === "processing" ? /* @__PURE__ */ jsx("span", { className: "rounded bg-blue-500/20 px-1.5 py-0.5 font-bold text-blue-700 dark:text-blue-300", children: "⚙ Processing" }) : job.status === "done" ? /* @__PURE__ */ jsxs("span", { className: "rounded bg-green-500/20 px-1.5 py-0.5 font-bold text-green-700 dark:text-green-300", children: [
              "✓ ",
              job.result?.newWords ? `${job.result.newWords}w` : "ok"
            ] }) : job.status === "failed" ? /* @__PURE__ */ jsxs("span", { className: "rounded bg-red-500/20 px-1.5 py-0.5 font-bold text-red-700 dark:text-red-300", title: job.error || "", children: [
              "✗ ",
              (job.error || "").slice(0, 40)
            ] }) : /* @__PURE__ */ jsx("span", { className: "rounded bg-muted px-1.5 py-0.5", children: "Cancelled" }) : !res ? /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "—" }) : res.ok ? /* @__PURE__ */ jsxs("span", { className: "rounded bg-green-500/20 px-1.5 py-0.5 font-bold text-green-700 dark:text-green-300", children: [
              "✓ ",
              res.newWords ? `${res.newWords}w` : "ok"
            ] }) : /* @__PURE__ */ jsxs("span", { className: "rounded bg-red-500/20 px-1.5 py-0.5 font-bold text-red-700 dark:text-red-300", title: res.error, children: [
              "✗ ",
              (res.error || "").slice(0, 40)
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right", children: /* @__PURE__ */ jsx("button", { disabled: running, onClick: async () => {
              setRunning(true);
              setProgress({
                done: 0,
                total: 1,
                current: r.url_path || ""
              });
              const out = await fixOne(r);
              setResults((prev) => ({
                ...prev,
                [r.id]: out
              }));
              setProgress({
                done: 1,
                total: 1,
                current: r.url_path || ""
              });
              setRunning(false);
              void load();
            }, className: "rounded border border-border px-2 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50", children: "✨ Fix now" }) })
          ] }, r.id);
        }),
        !loading && rows.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "px-3 py-8 text-center text-muted-foreground", children: "No issues 🎉" }) })
      ] })
    ] }) })
  ] });
}
export {
  SeoHealth as component
};
