import { jsx, jsxs } from "react/jsx-runtime";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import * as React from "react";
import { Sparkles, Loader2, RefreshCw, CheckCircle2, Circle, ExternalLink, RotateCcw, X } from "lucide-react";
import { A as AdminLayout } from "./admin-layout-Ql_EyRxP.js";
import { g as getCoachRole, l as listOpportunities, a as generateOpportunities, m as markOpportunity } from "./admin-prnm-coach.functions-CMg0HTEh.js";
import "@tanstack/react-router";
import "./router-BPpbotmS.js";
import "@tanstack/react-query";
import "./site-footer-defaults-Brwu0BKb.js";
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
import "@supabase/supabase-js";
import "./auth-middleware-C3cX-s7a.js";
import "./createMiddleware-BvN2ghIY.js";
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
const ROLE_TABS = [{
  value: "ceo",
  label: "CEO",
  sub: "Derek — strategy & growth"
}, {
  value: "coo",
  label: "COO",
  sub: "Brandon — outreach & ops"
}, {
  value: "cs",
  label: "CS",
  sub: "Michelle — replies & follow-ups"
}];
const IMPACT_STYLE = {
  high: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  low: "bg-muted text-muted-foreground border-border"
};
const EFFORT_STYLE = {
  quick: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  medium: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  deep: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
};
function OpportunitiesPage() {
  const fetchRole = useServerFn(getCoachRole);
  const list = useServerFn(listOpportunities);
  const generate = useServerFn(generateOpportunities);
  const mark = useServerFn(markOpportunity);
  const [activeRole, setActiveRole] = React.useState("ceo");
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [showCompleted, setShowCompleted] = React.useState(true);
  const [error, setError] = React.useState(null);
  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetchRole({
          data: {}
        });
        setActiveRole(r.role);
      } catch {
      }
    })();
  }, []);
  const refresh = React.useCallback(async (role) => {
    setLoading(true);
    setError(null);
    try {
      const r = await list({
        data: {
          role,
          includeCompleted: true
        }
      });
      if (r.ok) setItems(r.items);
      else setError(r.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [list]);
  React.useEffect(() => {
    void refresh(activeRole);
  }, [activeRole, refresh]);
  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const r = await generate({
        data: {
          role: activeRole
        }
      });
      if (!r.ok) setError(r.error);
      else await refresh(activeRole);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }
  async function toggleDone(opp) {
    const next = opp.completed_at ? "reopen" : "complete";
    setItems((prev) => prev.map((x) => x.id === opp.id ? {
      ...x,
      completed_at: next === "complete" ? (/* @__PURE__ */ new Date()).toISOString() : null
    } : x));
    try {
      await mark({
        data: {
          id: opp.id,
          action: next
        }
      });
    } catch {
      void refresh(activeRole);
    }
  }
  async function dismiss(opp) {
    setItems((prev) => prev.filter((x) => x.id !== opp.id));
    try {
      await mark({
        data: {
          id: opp.id,
          action: "dismiss"
        }
      });
    } catch {
      void refresh(activeRole);
    }
  }
  const open = items.filter((i) => !i.completed_at);
  const done = items.filter((i) => !!i.completed_at);
  return /* @__PURE__ */ jsx(AdminLayout, { children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-4 py-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4 mb-4 flex-wrap", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-semibold flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "h-6 w-6 text-primary" }),
          " Today's opportunities"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "High-impact actions tailored to your role. Generated by the PRNM Coach from live platform data." })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: handleGenerate, disabled: generating, className: "inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-50", children: [
        generating ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4" }),
        generating ? "Researching live data…" : open.length > 0 ? "Regenerate list" : "Generate priorities"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex gap-1 border-b mb-4 overflow-x-auto", children: ROLE_TABS.map((t) => /* @__PURE__ */ jsxs("button", { onClick: () => setActiveRole(t.value), className: activeRole === t.value ? "px-4 py-2 text-sm font-medium border-b-2 border-primary text-foreground" : "px-4 py-2 text-sm text-muted-foreground hover:text-foreground border-b-2 border-transparent", children: [
      t.label,
      /* @__PURE__ */ jsx("span", { className: "ml-2 text-xs opacity-70", children: t.sub })
    ] }, t.value)) }),
    error && /* @__PURE__ */ jsx("div", { className: "rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive mb-4", children: error }),
    loading && items.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground py-12 text-center", children: "Loading…" }),
    !loading && open.length === 0 && done.length === 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-dashed py-12 text-center space-y-2", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
        "No opportunities yet for ",
        ROLE_TABS.find((t) => t.value === activeRole)?.label,
        "."
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
        "Click ",
        /* @__PURE__ */ jsx("strong", { children: "Generate priorities" }),
        " to have the Coach research live data."
      ] })
    ] }),
    open.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wide", children: [
        "Open · ",
        open.length
      ] }),
      open.map((opp) => /* @__PURE__ */ jsx(OppCard, { opp, onToggle: toggleDone, onDismiss: dismiss }, opp.id))
    ] }),
    done.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-8 space-y-3", children: [
      /* @__PURE__ */ jsxs("button", { onClick: () => setShowCompleted((v) => !v), className: "text-sm font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground flex items-center gap-2", children: [
        "Done · ",
        done.length,
        " ",
        showCompleted ? "▾" : "▸"
      ] }),
      showCompleted && done.map((opp) => /* @__PURE__ */ jsx(OppCard, { opp, onToggle: toggleDone, onDismiss: dismiss }, opp.id))
    ] })
  ] }) });
}
function OppCard({
  opp,
  onToggle,
  onDismiss
}) {
  const done = !!opp.completed_at;
  return /* @__PURE__ */ jsxs("div", { className: done ? "rounded-lg border bg-muted/40 px-4 py-3 flex gap-3 opacity-70" : "rounded-lg border bg-card px-4 py-3 flex gap-3 hover:border-primary/40 transition-colors", children: [
    /* @__PURE__ */ jsx("button", { onClick: () => onToggle(opp), className: "mt-0.5 shrink-0", title: done ? "Mark as not done" : "Mark as done", children: done ? /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5 text-emerald-600" }) : /* @__PURE__ */ jsx(Circle, { className: "h-5 w-5 text-muted-foreground hover:text-primary" }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
        /* @__PURE__ */ jsx("h3", { className: done ? "font-medium line-through" : "font-medium", children: opp.title }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [
          /* @__PURE__ */ jsx("span", { className: `text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded border ${IMPACT_STYLE[opp.impact]}`, children: opp.impact }),
          /* @__PURE__ */ jsx("span", { className: `text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded border ${EFFORT_STYLE[opp.effort]}`, children: opp.effort })
        ] })
      ] }),
      opp.why && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: opp.why }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-2", children: [
        opp.action_route && /* @__PURE__ */ jsxs("a", { href: opp.action_route, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1 text-xs font-medium", children: [
          /* @__PURE__ */ jsx(ExternalLink, { className: "h-3 w-3" }),
          opp.action_label || "Open tool"
        ] }),
        done ? /* @__PURE__ */ jsxs("button", { onClick: () => onToggle(opp), className: "inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground", children: [
          /* @__PURE__ */ jsx(RotateCcw, { className: "h-3 w-3" }),
          " Reopen"
        ] }) : /* @__PURE__ */ jsxs("button", { onClick: () => onDismiss(opp), className: "inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground", title: "Hide this from the list", children: [
          /* @__PURE__ */ jsx(X, { className: "h-3 w-3" }),
          " Dismiss"
        ] })
      ] })
    ] })
  ] });
}
export {
  OpportunitiesPage as component
};
