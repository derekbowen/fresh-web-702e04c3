import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { toast } from "sonner";
import { bb as adminImportGscRows } from "./router-BPpbotmS.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import { A as AdminLayout } from "./admin-layout-Ql_EyRxP.js";
import "@tanstack/react-query";
import "./site-footer-defaults-Brwu0BKb.js";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
import "./client-Dh5RMKgP.js";
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
import "./renter-drip.server-CFIkIdnw.js";
import "node:fs";
import "node:path";
import "./host-drip.server-BAToYGOj.js";
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
const syncSchema = z.object({
  days: z.number().int().min(1).max(30).default(3),
  rowLimit: z.number().int().min(100).max(1e5).default(25e3)
});
const adminRunGscSync = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => syncSchema.parse(data ?? {})).handler(createSsrRpc("f476018b04f2d7a0f0a3163e46d30f2fc47c34eba8f4f157fc5f525b161d41ff"));
const adminGetGscSyncOverview = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("c7fe898fb220570bb3c24dd39ad9f69efa9eda82e05ee2b4c513ebe4b6c5b3f1"));
function GscImport() {
  const getOverview = useServerFn(adminGetGscSyncOverview);
  const runSync = useServerFn(adminRunGscSync);
  const [csv, setCsv] = React.useState("");
  const [parsed, setParsed] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [fileName, setFileName] = React.useState(null);
  const [overview, setOverview] = React.useState(null);
  React.useEffect(() => {
    let cancelled = false;
    getOverview().then((data) => {
      if (!cancelled) setOverview(data);
    }).catch(() => {
      if (!cancelled) setOverview(null);
    });
    return () => {
      cancelled = true;
    };
  }, [getOverview]);
  async function handleFiles(files) {
    if (!files || !files.length) return;
    const file = files[0];
    setFileName(file.name);
    setResult(null);
    try {
      if (/\.zip$/i.test(file.name) || file.type === "application/zip") {
        const {
          unzipSync,
          strFromU8
        } = await import("fflate");
        const buf = new Uint8Array(await file.arrayBuffer());
        const entries = unzipSync(buf);
        const names = Object.keys(entries);
        const pick = names.find((n) => /pages\.csv$/i.test(n)) || names.find((n) => /\.csv$/i.test(n));
        if (!pick) {
          alert("No CSV found inside ZIP");
          return;
        }
        setCsv(strFromU8(entries[pick]));
      } else {
        setCsv(await file.text());
      }
      setTimeout(() => parse(), 0);
    } catch (e) {
      alert(e?.message || "Failed to read file");
    }
  }
  function parse() {
    setResult(null);
    const lines = csv.split(/\r?\n/).filter((l) => l.trim());
    if (!lines.length) {
      setParsed([]);
      return;
    }
    const header = lines[0].toLowerCase().split(/[\t,]/).map((h) => h.trim().replace(/^"|"$/g, ""));
    const idx = {
      page: header.findIndex((h) => h === "page" || h === "url" || h === "top pages"),
      impr: header.findIndex((h) => h.includes("impression")),
      clicks: header.findIndex((h) => h.includes("click")),
      pos: header.findIndex((h) => h.includes("position"))
    };
    if (idx.page < 0 || idx.impr < 0) {
      alert("CSV needs at least Page/URL and Impressions columns");
      return;
    }
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(/\t|,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.trim().replace(/^"|"$/g, ""));
      const url = cells[idx.page] ?? "";
      const mProv = url.match(/\/providers\/([^/?#]+)/);
      const mPage = url.match(/\/p\/([^?#]+)/);
      if (!mProv && !mPage) continue;
      const slug = (mProv ? mProv[1] : mPage[1]).replace(/\/$/, "");
      rows.push({
        slug,
        kind: mProv ? "provider" : "page",
        impressions: Number(cells[idx.impr]?.replace(/[,%]/g, "")) || 0,
        clicks: idx.clicks >= 0 ? Number(cells[idx.clicks]?.replace(/[,%]/g, "")) || 0 : 0,
        position: idx.pos >= 0 ? Number(cells[idx.pos]?.replace(/[,%]/g, "")) || null : null
      });
    }
    setParsed(rows);
  }
  async function submit() {
    if (!parsed.length) return;
    setBusy(true);
    try {
      const r = await adminImportGscRows({
        data: {
          rows: parsed
        }
      });
      setResult({
        updated: r.updated,
        total: r.total
      });
    } catch (e) {
      alert(e?.message || "Import failed");
    } finally {
      setBusy(false);
    }
  }
  async function syncNow() {
    setSyncing(true);
    try {
      const r = await runSync({
        data: {
          days: 3,
          rowLimit: 25e3
        }
      });
      if (!r.ok) {
        toast.error(r.error || "Search Console sync failed");
      } else {
        toast.success(`Synced ${r.pagesSynced} page rows and ${r.queriesSynced} query rows`);
      }
      setOverview(await getOverview());
    } catch (e) {
      toast.error(e?.message || "Search Console sync failed");
    } finally {
      setSyncing(false);
    }
  }
  return /* @__PURE__ */ jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Google Search Console sync" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Automatically pull clicks, impressions, CTR, and average position for poolrentalnearme.com." })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/admin/directory", className: "text-sm text-primary hover:underline", children: "← Directory" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-2xl border border-border bg-card p-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Automatic sync" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            "Runs nightly and can be started manually here. Last run: ",
            overview?.latestRun?.started_at ? new Date(overview.latestRun.started_at).toLocaleString() : "never",
            "."
          ] }),
          overview?.latestRun?.error && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-red-600", children: overview.latestRun.error })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: syncNow, disabled: syncing, className: "rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: syncing ? "Syncing…" : "Sync now" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-3 text-sm sm:grid-cols-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-background p-3", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "Status" }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 font-semibold", children: overview?.latestRun?.status ?? "Not synced" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-background p-3", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "Page rows" }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 font-semibold", children: (overview?.dailyRows ?? 0).toLocaleString() })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-background p-3", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "Query rows" }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 font-semibold", children: (overview?.queryRows ?? 0).toLocaleString() })
        ] })
      ] }),
      !overview?.configured && /* @__PURE__ */ jsx("p", { className: "mt-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm", children: "Add the Search Console service account JSON secret before sync can run." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-2xl border border-border bg-card p-5", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Manual CSV fallback" }),
      /* @__PURE__ */ jsx("p", { className: "mb-4 text-sm text-muted-foreground", children: "Use this only if the automatic sync needs a one-off backfill." }),
      /* @__PURE__ */ jsxs("label", { className: "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center hover:bg-secondary/40 cursor-pointer", children: [
        /* @__PURE__ */ jsx("input", { type: "file", accept: ".csv,.tsv,.zip,text/csv,text/tab-separated-values,application/zip", className: "hidden", onChange: (e) => handleFiles(e.target.files) }),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold", children: "Upload CSV, TSV, or ZIP" }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Drag a Google Search Console export here, or click to browse. ZIPs are auto-extracted (Pages.csv)." }),
        fileName && /* @__PURE__ */ jsxs("span", { className: "mt-1 text-xs text-primary", children: [
          "Loaded: ",
          fileName
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground mb-1", children: "Or paste CSV / TSV" }),
        /* @__PURE__ */ jsx("textarea", { value: csv, onChange: (e) => setCsv(e.target.value), placeholder: "Page,Clicks,Impressions,CTR,Position\nhttps://example.com/providers/some-pool-co,12,340,3.5%,8.2", rows: 8, className: "w-full rounded-lg border border-border bg-background p-3 font-mono text-xs" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("button", { onClick: parse, className: "rounded-full bg-secondary px-5 py-2 text-sm font-semibold", children: "Parse" }),
        /* @__PURE__ */ jsx("button", { onClick: submit, disabled: busy || !parsed.length, className: "rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: busy ? "Importing…" : `Import ${parsed.length} rows` }),
        result && /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
          "Updated ",
          result.updated,
          " / ",
          result.total
        ] })
      ] })
    ] }),
    parsed.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mt-6", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold", children: [
        "Preview (",
        parsed.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 overflow-x-auto rounded-2xl border border-border bg-card", children: [
        /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-secondary text-xs uppercase", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "p-2 text-left", children: "Slug" }),
            /* @__PURE__ */ jsx("th", { className: "p-2 text-right", children: "Impressions" }),
            /* @__PURE__ */ jsx("th", { className: "p-2 text-right", children: "Clicks" }),
            /* @__PURE__ */ jsx("th", { className: "p-2 text-right", children: "Position" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: parsed.slice(0, 50).map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
            /* @__PURE__ */ jsx("td", { className: "p-2 font-mono text-xs", children: r.slug }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-right", children: r.impressions }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-right", children: r.clicks }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-right", children: r.position?.toFixed(1) ?? "—" })
          ] }, r.slug)) })
        ] }),
        parsed.length > 50 && /* @__PURE__ */ jsxs("p", { className: "p-2 text-xs text-muted-foreground", children: [
          "…and ",
          parsed.length - 50,
          " more"
        ] })
      ] })
    ] })
  ] });
}
export {
  GscImport as component
};
