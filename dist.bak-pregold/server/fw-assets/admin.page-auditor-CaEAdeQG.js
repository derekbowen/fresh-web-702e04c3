import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { b as listRecentAudits, c as auditPage } from "./admin-weapons.functions-1XoHogUG.js";
import { A as AdminLayout } from "./admin-layout-9iu79rRE.js";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";
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
function scoreColor(s) {
  if (s == null) return "text-muted-foreground";
  if (s >= 80) return "text-emerald-600";
  if (s >= 60) return "text-amber-600";
  return "text-destructive";
}
function PageAuditor() {
  const [path, setPath] = React.useState("/p/");
  const [busy, setBusy] = React.useState(false);
  const [current, setCurrent] = React.useState(null);
  const [history, setHistory] = React.useState([]);
  const [err, setErr] = React.useState(null);
  const [suggestions, setSuggestions] = React.useState([]);
  const load = React.useCallback(async () => {
    const r = await listRecentAudits({
      data: {
        limit: 30
      }
    });
    setHistory(r.rows);
  }, []);
  React.useEffect(() => {
    load();
  }, [load]);
  async function run(overridePath) {
    const target = (overridePath ?? path).trim();
    if (!target.startsWith("/") && !/^https?:\/\//i.test(target)) {
      setErr("Path must start with / (or be a full URL)");
      return;
    }
    if (overridePath) setPath(overridePath);
    setBusy(true);
    setErr(null);
    setCurrent(null);
    setSuggestions([]);
    try {
      const r = await auditPage({
        data: {
          url_path: target
        }
      });
      if (r.ok) {
        setCurrent(r.audit);
        await load();
      } else {
        setErr(r.error || "audit failed");
        if (Array.isArray(r.suggestions)) setSuggestions(r.suggestions);
      }
    } catch (e) {
      setErr(e?.message || "failed");
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxs(AdminLayout, { title: "AI Page Auditor", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsxs("h1", { className: "flex items-center gap-2 text-2xl font-bold sm:text-3xl", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-6 w-6 text-primary" }),
        " AI Page Auditor"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Score any /p/ page 0-100 against top-ranking competitors. Get strengths, weaknesses, and exact recommendations." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-muted-foreground", children: "Page URL path" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-col gap-2 sm:flex-row", children: [
        /* @__PURE__ */ jsx("input", { value: path, onChange: (e) => setPath(e.target.value), placeholder: "/p/austin-tx", onKeyDown: (e) => {
          if (e.key === "Enter") run();
        }, className: "flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono" }),
        /* @__PURE__ */ jsxs("button", { onClick: () => run(), disabled: busy, className: "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: [
          busy ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }),
          busy ? "Auditing…" : "Audit page"
        ] })
      ] }),
      err && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-destructive", children: err }),
      suggestions.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-3 rounded-lg border border-border bg-muted/30 p-3", children: [
        /* @__PURE__ */ jsx("p", { className: "mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "Did you mean?" }),
        /* @__PURE__ */ jsx("ul", { className: "space-y-1", children: suggestions.map((s) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("button", { onClick: () => run(s.url_path), className: "group flex w-full items-center justify-between gap-3 rounded px-2 py-1 text-left text-xs hover:bg-muted", children: [
          /* @__PURE__ */ jsx("span", { className: "font-mono group-hover:underline", children: s.url_path }),
          /* @__PURE__ */ jsxs("span", { className: "shrink-0 text-[10px] text-muted-foreground", children: [
            s.title || "—",
            " · ",
            s.status
          ] })
        ] }) }, s.url_path)) })
      ] })
    ] }),
    current && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-2xl border border-border bg-card p-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-mono text-xs text-muted-foreground", children: current.url_path }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm", children: current.summary })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: `text-right ${scoreColor(current.score)}`, children: [
          /* @__PURE__ */ jsx("div", { className: "text-4xl font-bold leading-none", children: current.score ?? "—" }),
          /* @__PURE__ */ jsx("div", { className: "text-[10px] font-bold uppercase tracking-wider", children: "Score" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-3 sm:grid-cols-3", children: [
        /* @__PURE__ */ jsx(Section, { title: "Strengths", icon: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4 text-emerald-600" }), items: current.strengths }),
        /* @__PURE__ */ jsx(Section, { title: "Weaknesses", icon: /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4 text-amber-600" }), items: current.weaknesses }),
        /* @__PURE__ */ jsx(Section, { title: "Recommendations", icon: /* @__PURE__ */ jsx(Lightbulb, { className: "h-4 w-4 text-primary" }), items: current.recommendations })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: "Recent audits" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-2 space-y-1.5", children: [
        history.length === 0 && /* @__PURE__ */ jsx("p", { className: "rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground", children: "No audits yet." }),
        history.map((h) => /* @__PURE__ */ jsxs("button", { onClick: () => setCurrent(h), className: "flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-left hover:bg-muted/40", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx("p", { className: "truncate font-mono text-xs", children: h.url_path }),
            /* @__PURE__ */ jsx("p", { className: "truncate text-xs text-muted-foreground", children: h.summary })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 items-center gap-3", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: new Date(h.audited_at).toLocaleDateString() }),
            /* @__PURE__ */ jsx("span", { className: `text-xl font-bold ${scoreColor(h.score)}`, children: h.score ?? "—" })
          ] })
        ] }, h.id))
      ] })
    ] })
  ] });
}
function Section({
  title,
  icon,
  items
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border p-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground", children: [
      icon,
      " ",
      title
    ] }),
    /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-1.5 text-sm", children: items?.length ? items.map((it, i) => /* @__PURE__ */ jsxs("li", { className: "leading-snug", children: [
      "• ",
      it
    ] }, i)) : /* @__PURE__ */ jsx("li", { className: "text-xs text-muted-foreground", children: "None" }) })
  ] });
}
export {
  PageAuditor as component
};
