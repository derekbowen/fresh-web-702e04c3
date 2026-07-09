import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { A as AdminLayout } from "./admin-layout-BNp_05PW.js";
import { c as createSsrRpc } from "./cities.functions-XBYRqf13.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
import { c as createServerFn } from "../server.js";
import { Wand2, Loader2, CheckCircle2, ExternalLink, AlertTriangle } from "lucide-react";
import "@tanstack/react-router";
import "./router-BvRNdW25.js";
import "./site-footer-defaults-C7gHxS5b.js";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
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
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
const scanAndProposeRepairs = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  urlContains: z.string().trim().max(200).optional(),
  maxPages: z.number().int().min(10).max(500).default(150),
  maxBroken: z.number().int().min(5).max(200).default(60)
}).parse(d ?? {})).handler(createSsrRpc("9957e929b9677e89fcf02bcd43c52ee0b9896ffdd44eb5ce7b41658cf75f4598"));
const applyRepair = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  pageId: z.string().uuid(),
  href: z.string().min(1).max(2e3),
  newHref: z.string().min(1).max(2e3)
}).parse(d)).handler(createSsrRpc("b04f312bdb34677b651e0138987d6a6c4adacba1bf2680a12d3cff356c2a5d91"));
function confColor(c) {
  if (c >= 80) return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (c >= 50) return "bg-amber-100 text-amber-800 border-amber-300";
  return "bg-rose-100 text-rose-800 border-rose-300";
}
function LinkAutoRepair() {
  const qc = useQueryClient();
  const scan = useServerFn(scanAndProposeRepairs);
  const apply = useServerFn(applyRepair);
  const [urlContains, setUrlContains] = React.useState("");
  const [maxPages, setMaxPages] = React.useState(150);
  const [minConf, setMinConf] = React.useState(60);
  const [rowState, setRowState] = React.useState({});
  const [overrides, setOverrides] = React.useState({});
  const scanQ = useQuery({
    queryKey: ["link-auto-repair", urlContains, maxPages],
    queryFn: () => scan({
      data: {
        urlContains: urlContains || void 0,
        maxPages,
        maxBroken: 80
      }
    }),
    enabled: false,
    staleTime: Infinity,
    retry: false
  });
  const applyM = useMutation({
    mutationFn: async (p) => {
      setRowState((s) => ({
        ...s,
        [p.id]: {
          status: "applying"
        }
      }));
      const r = await apply({
        data: {
          pageId: p.pageId,
          href: p.href,
          newHref: p.newHref
        }
      });
      if (!r.ok) throw new Error(r.error);
      return r;
    },
    onSuccess: (_r, v) => setRowState((s) => ({
      ...s,
      [v.id]: {
        status: "fixed"
      }
    })),
    onError: (e, v) => setRowState((s) => ({
      ...s,
      [v.id]: {
        status: "error",
        msg: e.message
      }
    }))
  });
  const proposals = scanQ.data?.proposals || [];
  const rowKey = (p, i) => `${p.page_id}::${i}::${p.href}`;
  async function fixAll() {
    for (let i = 0; i < proposals.length; i++) {
      const p = proposals[i];
      const id = rowKey(p, i);
      const target = overrides[id] || p.proposed_href;
      if (!target) {
        setRowState((s) => ({
          ...s,
          [id]: {
            status: "skipped",
            msg: "No proposal"
          }
        }));
        continue;
      }
      if (p.confidence < minConf && !overrides[id]) {
        setRowState((s) => ({
          ...s,
          [id]: {
            status: "skipped",
            msg: `Below ${minConf}% confidence`
          }
        }));
        continue;
      }
      if (rowState[id]?.status === "fixed") continue;
      try {
        await applyM.mutateAsync({
          id,
          pageId: p.page_id,
          href: p.href,
          newHref: target
        });
      } catch {
      }
    }
  }
  const stats = React.useMemo(() => {
    const total = proposals.length;
    const proposed = proposals.filter((p) => p.proposed_href).length;
    const high = proposals.filter((p) => p.confidence >= 80).length;
    const fixed = Object.values(rowState).filter((s) => s.status === "fixed").length;
    return {
      total,
      proposed,
      high,
      fixed
    };
  }, [proposals, rowState]);
  return /* @__PURE__ */ jsx(AdminLayout, { children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-7xl space-y-6 p-4", children: [
    /* @__PURE__ */ jsx("header", { className: "flex items-center justify-between gap-4", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h1", { className: "flex items-center gap-2 text-2xl font-bold text-foreground", children: [
        /* @__PURE__ */ jsx(Wand2, { className: "h-6 w-6 text-primary" }),
        " Broken-link auto-repair"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Scans /p/* pages for broken internal links, asks AI to pick the best replacement, applies in one click." })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { className: "rounded-lg border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-4", children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "mb-1 block font-medium", children: "URL contains" }),
          /* @__PURE__ */ jsx("input", { value: urlContains, onChange: (e) => setUrlContains(e.target.value), placeholder: "(optional) e.g. los-angeles", className: "w-full rounded border border-border bg-background px-3 py-2 text-sm" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "block text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "mb-1 block font-medium", children: "Pages to scan" }),
          /* @__PURE__ */ jsx("input", { type: "number", min: 10, max: 500, value: maxPages, onChange: (e) => setMaxPages(Math.max(10, Math.min(500, Number(e.target.value) || 150))), className: "w-full rounded border border-border bg-background px-3 py-2 text-sm" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "block text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "mb-1 block font-medium", children: "Auto-fix min confidence" }),
          /* @__PURE__ */ jsx("input", { type: "number", min: 0, max: 100, value: minConf, onChange: (e) => setMinConf(Math.max(0, Math.min(100, Number(e.target.value) || 60))), className: "w-full rounded border border-border bg-background px-3 py-2 text-sm" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-end gap-2", children: /* @__PURE__ */ jsxs("button", { onClick: () => {
          setRowState({});
          setOverrides({});
          qc.removeQueries({
            queryKey: ["link-auto-repair"]
          });
          scanQ.refetch();
        }, disabled: scanQ.isFetching, className: "inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50", children: [
          scanQ.isFetching ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Wand2, { className: "h-4 w-4" }),
          scanQ.isFetching ? "Scanning…" : "Scan & propose"
        ] }) })
      ] }),
      scanQ.data && /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Scanned ",
          /* @__PURE__ */ jsx("b", { className: "text-foreground", children: scanQ.data.scanned_pages }),
          " pages"
        ] }),
        /* @__PURE__ */ jsx("span", { children: "•" }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("b", { className: "text-foreground", children: stats.total }),
          " broken links"
        ] }),
        /* @__PURE__ */ jsx("span", { children: "•" }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("b", { className: "text-foreground", children: stats.proposed }),
          " with AI proposal"
        ] }),
        /* @__PURE__ */ jsx("span", { children: "•" }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("b", { className: "text-emerald-700", children: stats.high }),
          " high-confidence"
        ] }),
        /* @__PURE__ */ jsx("span", { children: "•" }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("b", { className: "text-emerald-700", children: stats.fixed }),
          " applied"
        ] })
      ] }),
      scanQ.data?.error && /* @__PURE__ */ jsx("div", { className: "mt-3 rounded border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive", children: scanQ.data.error })
    ] }),
    proposals.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Tip: edit a proposed URL inline to override the AI pick before applying." }),
      /* @__PURE__ */ jsxs("button", { onClick: fixAll, disabled: applyM.isPending, className: "inline-flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4" }),
        "Fix all ≥ ",
        minConf,
        "% confidence"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
      proposals.map((p, i) => {
        const id = rowKey(p, i);
        const st = rowState[id];
        const target = overrides[id] ?? (p.proposed_href || "");
        return /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
                /* @__PURE__ */ jsx("span", { className: "rounded bg-muted px-2 py-0.5 font-mono", children: p.page_url }),
                p.page_title && /* @__PURE__ */ jsx("span", { className: "truncate", children: p.page_title })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2 text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Broken:" }),
                /* @__PURE__ */ jsx("code", { className: "rounded bg-rose-50 px-2 py-0.5 font-mono text-rose-700 line-through", children: p.href }),
                /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                  '— "',
                  p.label,
                  '"'
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: `rounded border px-2 py-1 text-xs font-medium ${confColor(p.confidence)}`, children: [
              p.confidence,
              "% ",
              p.proposed_href ? "match" : "no fit"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-muted-foreground", children: "Proposed replacement" }),
              /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("input", { value: target, onChange: (e) => setOverrides((o) => ({
                  ...o,
                  [id]: e.target.value
                })), placeholder: "/p/...", className: "w-full rounded border border-border bg-background px-3 py-2 font-mono text-sm" }),
                target && /* @__PURE__ */ jsxs("a", { href: target, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-1 rounded border border-border px-2 py-2 text-xs text-muted-foreground hover:bg-muted", children: [
                  /* @__PURE__ */ jsx(ExternalLink, { className: "h-3 w-3" }),
                  " open"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
                "Reason: ",
                p.reason
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex items-end gap-2", children: st?.status === "fixed" ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4" }),
              " Fixed"
            ] }) : st?.status === "error" ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded bg-rose-100 px-3 py-2 text-sm font-medium text-rose-800", title: st.msg, children: [
              /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }),
              " Error"
            ] }) : /* @__PURE__ */ jsxs("button", { disabled: !target || st?.status === "applying", onClick: () => applyM.mutate({
              id,
              pageId: p.page_id,
              href: p.href,
              newHref: target
            }), className: "inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50", children: [
              st?.status === "applying" ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Wand2, { className: "h-4 w-4" }),
              "Apply fix"
            ] }) })
          ] }),
          p.candidates.length > 1 && /* @__PURE__ */ jsxs("details", { className: "mt-3", children: [
            /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer text-xs text-muted-foreground hover:text-foreground", children: [
              "Other candidates (",
              p.candidates.length,
              ")"
            ] }),
            /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-1 text-xs", children: p.candidates.map((c) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("button", { onClick: () => setOverrides((o) => ({
                ...o,
                [id]: c.url_path
              })), className: "rounded border border-border px-2 py-0.5 font-mono hover:bg-muted", children: c.url_path }),
              c.title && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                "— ",
                c.title
              ] })
            ] }, c.url_path)) })
          ] }),
          st?.status === "error" && st.msg && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-rose-700", children: st.msg })
        ] }, id);
      }),
      scanQ.data && proposals.length === 0 && !scanQ.isFetching && /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-center text-sm text-emerald-800", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "mx-auto mb-2 h-6 w-6" }),
        "No broken /p/ links found in this scan range. Nice."
      ] })
    ] })
  ] }) });
}
export {
  LinkAutoRepair as component
};
