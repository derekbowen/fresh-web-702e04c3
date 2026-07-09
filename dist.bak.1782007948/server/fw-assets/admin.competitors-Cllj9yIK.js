import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { d as listCompetitorPages, s as scrapeCompetitorUrl, e as deleteCompetitor, h as compareCompetitorToPage } from "./admin-seo-tools.functions-DA1S_pz9.js";
import { A as AdminLayout } from "./admin-layout-DvQlFbdd.js";
import { Loader2, Plus, ExternalLink, GitCompare, Trash2 } from "lucide-react";
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
import "./auth-middleware-C3cX-s7a.js";
import "./createMiddleware-BvN2ghIY.js";
import "./router-Bk6RtsuF.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
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
function Competitors() {
  const [rows, setRows] = React.useState([]);
  const [url, setUrl] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState(null);
  const [q, setQ] = React.useState("");
  const [compareFor, setCompareFor] = React.useState(null);
  const [compareResult, setCompareResult] = React.useState(null);
  const [comparing, setComparing] = React.useState(false);
  const load = React.useCallback(async () => {
    const r = await listCompetitorPages({
      data: {
        q,
        limit: 200
      }
    });
    setRows(r.rows);
  }, [q]);
  React.useEffect(() => {
    load();
  }, [load]);
  async function add() {
    if (!url.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await scrapeCompetitorUrl({
        data: {
          url: url.trim()
        }
      });
      if (r.ok) {
        setMsg(`Scraped: ${r.word_count} words`);
        setUrl("");
        await load();
      } else setMsg(`Error: ${r.error}`);
    } catch (e) {
      setMsg(`Error: ${e?.message || "failed"}`);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id) {
    if (!confirm("Delete this competitor page?")) return;
    await deleteCompetitor({
      data: {
        id
      }
    });
    await load();
  }
  async function runCompare() {
    if (!compareFor) return;
    setComparing(true);
    setCompareResult(null);
    try {
      const r = await compareCompetitorToPage({
        data: {
          competitor_id: compareFor.id,
          our_url_path: compareFor.ourPath
        }
      });
      setCompareResult(r);
    } finally {
      setComparing(false);
    }
  }
  return /* @__PURE__ */ jsxs(AdminLayout, { title: "Competitor tracker", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold sm:text-3xl", children: "Competitor tracker" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Scrape competitor pages (Swimply, Giggster, Peerspace) and compare them to your pages. See word gaps and missing sections." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-muted-foreground", children: "Add competitor URL" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-col gap-2 sm:flex-row", children: [
        /* @__PURE__ */ jsx("input", { value: url, onChange: (e) => setUrl(e.target.value), placeholder: "https://swimply.com/pooldetails/123 or https://poolrentalnearme.com/l/your-listing/abc", className: "flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" }),
        /* @__PURE__ */ jsxs("button", { onClick: add, disabled: busy || !url.trim(), className: "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: [
          busy ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
          "Scrape"
        ] })
      ] }),
      msg && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: msg })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search competitors…", className: "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm sm:max-w-md" }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-2", children: [
      rows.length === 0 && /* @__PURE__ */ jsx("p", { className: "rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground", children: "No competitor pages yet. Add one above." }),
      rows.map((r) => /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-border bg-card p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            r.domain && /* @__PURE__ */ jsx("span", { className: "rounded-full bg-secondary px-2 py-0.5 text-xs font-medium", children: r.domain }),
            /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-secondary px-2 py-0.5 text-xs font-medium", children: [
              r.word_count,
              " words"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("a", { href: r.url, target: "_blank", rel: "noreferrer noopener", className: "mt-1 inline-flex items-center gap-1 break-all text-sm font-medium text-primary hover:underline", children: [
            r.url,
            " ",
            /* @__PURE__ */ jsx(ExternalLink, { className: "h-3 w-3 shrink-0" })
          ] }),
          r.title && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm font-semibold", children: r.title }),
          r.meta_description && /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs text-muted-foreground line-clamp-2", children: r.meta_description })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 items-center gap-2", children: [
          /* @__PURE__ */ jsxs("button", { onClick: () => {
            setCompareFor({
              id: r.id,
              ourPath: ""
            });
            setCompareResult(null);
          }, className: "inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold", children: [
            /* @__PURE__ */ jsx(GitCompare, { className: "h-3.5 w-3.5" }),
            " Compare"
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => remove(r.id), className: "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-destructive", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }) })
        ] })
      ] }) }, r.id))
    ] }),
    compareFor && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4", onClick: () => setCompareFor(null), children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-2xl rounded-t-2xl bg-card p-5 sm:rounded-2xl", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: "Compare to your page" }),
      /* @__PURE__ */ jsx("label", { className: "mt-3 block text-xs text-muted-foreground", children: "Your page URL path (e.g. /p/los-angeles-ca)" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-col gap-2 sm:flex-row", children: [
        /* @__PURE__ */ jsx("input", { value: compareFor.ourPath, onChange: (e) => setCompareFor((p) => p && {
          ...p,
          ourPath: e.target.value
        }), placeholder: "/p/los-angeles-ca", className: "flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono" }),
        /* @__PURE__ */ jsx("button", { onClick: runCompare, disabled: comparing || !compareFor.ourPath, className: "rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: comparing ? "Comparing…" : "Compare" })
      ] }),
      compareResult?.ok && /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-3 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border p-3", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase text-muted-foreground", children: "Yours" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 font-mono text-xs", children: compareResult.our.url_path }),
            /* @__PURE__ */ jsxs("p", { className: "mt-1", children: [
              compareResult.our.word_count,
              " words · ",
              compareResult.our.headings,
              " headings"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border p-3", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase text-muted-foreground", children: "Competitor" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 break-all text-xs", children: compareResult.competitor.url }),
            /* @__PURE__ */ jsxs("p", { className: "mt-1", children: [
              compareResult.competitor.word_count,
              " words · ",
              compareResult.competitor.headings,
              " headings"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: `rounded-lg p-3 text-sm ${compareResult.word_gap > 0 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`, children: [
          "Word gap: ",
          compareResult.word_gap > 0 ? `you're ${compareResult.word_gap} words behind` : `you're ahead by ${Math.abs(compareResult.word_gap)} words`
        ] }),
        compareResult.missing_sections?.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "text-xs font-semibold uppercase text-muted-foreground", children: [
            "Sections you don't cover (",
            compareResult.missing_sections.length,
            ")"
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-1", children: compareResult.missing_sections.map((s, i) => /* @__PURE__ */ jsxs("li", { className: "rounded bg-muted px-2 py-1 text-xs", children: [
            "#".repeat(s.level),
            " ",
            s.text
          ] }, i)) })
        ] })
      ] }),
      compareResult?.error && /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-destructive", children: compareResult.error }),
      /* @__PURE__ */ jsx("button", { onClick: () => setCompareFor(null), className: "mt-4 w-full rounded-full bg-secondary px-4 py-2 text-sm font-semibold", children: "Close" })
    ] }) })
  ] });
}
export {
  Competitors as component
};
