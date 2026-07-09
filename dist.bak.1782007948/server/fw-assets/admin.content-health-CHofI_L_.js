import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { A as AdminLayout } from "./admin-layout-DvQlFbdd.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import "@tanstack/react-router";
import "lucide-react";
import "./router-Bk6RtsuF.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
import "./states-UIdvqlKs.js";
import "./site-origin-DK0yY0Ip.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
import "./client-Dh5RMKgP.js";
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
import "./renter-drip.server-DkMf2kRj.js";
import "./emailit-DRsipvVx.js";
import "node:fs";
import "node:path";
import "./host-drip.server-Dv1yKbNa.js";
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
const Input = z.object({
  minLength: z.number().int().min(0).max(1e4).default(500),
  limit: z.number().int().min(1).max(5e3).default(1e3),
  onlyInSitemap: z.boolean().default(false)
});
const scanContentHealth = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => Input.parse(d ?? {})).handler(createSsrRpc("8ed0cf74651f06db30d5a4b78b6c221c4e58f8c48a1beeb1c2d6358aa324401d"));
const PROD_ORIGIN = "https://www.poolrentalnearme.com";
function ContentHealthPage() {
  const [minLength, setMinLength] = useState(500);
  const [onlyInSitemap, setOnlyInSitemap] = useState(false);
  const [filter, setFilter] = useState("all");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await scanContentHealth({
        data: {
          minLength,
          limit: 5e3,
          onlyInSitemap
        }
      });
      setReport(res);
    } catch (e) {
      setErr(e?.message ?? "Scan failed");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  const visible = useMemo(() => {
    if (!report) return [];
    return filter === "all" ? report.rows : report.rows.filter((r) => r.reason === filter);
  }, [report, filter]);
  const exportCsv = () => {
    if (!report) return;
    const header = ["url_path", "reason", "body_len", "locale", "template_type", "in_sitemap", "title"];
    const escape = (v) => {
      const s = v == null ? "" : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = [header.join(",")];
    for (const r of visible) {
      lines.push([r.url_path, r.reason, r.body_len, r.locale, r.template_type ?? "", r.in_sitemap, r.title ?? ""].map(escape).join(","));
    }
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `content-health-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return /* @__PURE__ */ jsx(AdminLayout, { title: "Content health", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl space-y-6 p-6", children: [
    /* @__PURE__ */ jsxs("header", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-foreground", children: "Content health" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
        "Scans published ",
        /* @__PURE__ */ jsx("code", { className: "rounded bg-muted px-1 py-0.5", children: "content_pages" }),
        " for missing, blank, or thin ",
        /* @__PURE__ */ jsx("code", { className: "rounded bg-muted px-1 py-0.5", children: "body_markdown" }),
        ". Live URLs listed below render an empty body to real visitors."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end gap-4 rounded-lg border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsxs("label", { className: "text-sm", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-1 font-medium text-foreground", children: "Thin threshold (chars)" }),
        /* @__PURE__ */ jsx("input", { type: "number", min: 0, max: 1e4, value: minLength, onChange: (e) => setMinLength(Number(e.target.value) || 0), className: "w-32 rounded-md border border-input bg-background px-3 py-1.5 text-sm" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", checked: onlyInSitemap, onChange: (e) => setOnlyInSitemap(e.target.checked) }),
        "Only pages in sitemap"
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: load, disabled: loading, className: "rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: loading ? "Scanning…" : "Re-scan" }),
      /* @__PURE__ */ jsx("button", { onClick: exportCsv, disabled: !report || visible.length === 0, className: "rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-50", children: "Export CSV" })
    ] }),
    err && /* @__PURE__ */ jsx("div", { className: "rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive", children: err }),
    report && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-4", children: [
        /* @__PURE__ */ jsx(Stat, { label: "Published", value: report.totalPublished }),
        /* @__PURE__ */ jsx(Stat, { label: "Affected", value: report.totalAffected, tone: "warn" }),
        /* @__PURE__ */ jsx(Stat, { label: "Missing / blank", value: report.byReason.missing + report.byReason.blank, tone: "bad" }),
        /* @__PURE__ */ jsx(Stat, { label: `Thin (<${report.minLength})`, value: report.byReason.thin })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: ["all", "missing", "blank", "thin"].map((f) => /* @__PURE__ */ jsxs("button", { onClick: () => setFilter(f), className: `rounded-md border px-3 py-1.5 text-xs font-medium ${filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted"}`, children: [
        f,
        f !== "all" && /* @__PURE__ */ jsxs("span", { className: "ml-1 opacity-70", children: [
          "(",
          report.byReason[f],
          ")"
        ] })
      ] }, f)) }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-lg border border-border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-muted text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "URL" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Reason" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Body" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Locale" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Template" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Sitemap" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          visible.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "px-3 py-6 text-center text-muted-foreground", children: "No affected pages." }) }),
          visible.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
            /* @__PURE__ */ jsxs("td", { className: "px-3 py-2", children: [
              /* @__PURE__ */ jsx("a", { href: `${PROD_ORIGIN}${r.url_path}`, target: "_blank", rel: "noreferrer", className: "text-primary hover:underline", children: r.url_path }),
              r.title && /* @__PURE__ */ jsx("div", { className: "truncate text-xs text-muted-foreground", children: r.title })
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx(ReasonPill, { reason: r.reason }) }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 tabular-nums", children: r.body_len }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: r.locale }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs text-muted-foreground", children: r.template_type || "—" }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs", children: r.in_sitemap ? "yes" : "no" })
          ] }, r.id))
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
        "Scanned at ",
        new Date(report.ranAt).toLocaleString(),
        " · showing ",
        visible.length,
        " of",
        " ",
        report.totalAffected,
        " affected"
      ] })
    ] })
  ] }) });
}
function Stat({
  label,
  value,
  tone
}) {
  const color = tone === "bad" ? "text-destructive" : tone === "warn" ? "text-amber-600 dark:text-amber-400" : "text-foreground";
  return /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: `mt-1 text-2xl font-bold ${color}`, children: value.toLocaleString() })
  ] });
}
function ReasonPill({
  reason
}) {
  const styles = reason === "missing" ? "bg-destructive/15 text-destructive" : reason === "blank" ? "bg-destructive/15 text-destructive" : "bg-amber-500/15 text-amber-700 dark:text-amber-300";
  return /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${styles}`, children: reason });
}
export {
  ContentHealthPage as component
};
