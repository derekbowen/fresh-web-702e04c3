import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { l as listTrackedKeywords, a as addTrackedKeyword, r as runSerpCheck, d as deleteTrackedKeyword } from "./admin-weapons.functions-diYup3aA.js";
import { A as AdminLayout } from "./admin-layout-B2eMXHXP.js";
import { TrendingUp, Plus, Loader2, RefreshCw, Trash2, Minus, TrendingDown } from "lucide-react";
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
import "./router-BEu57YoG.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
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
import "./renter-drip.server-DJqUcyMM.js";
import "node:fs";
import "node:path";
import "./host-drip.server-BfIDzqiI.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
function RankTracker() {
  const [rows, setRows] = React.useState([]);
  const [kw, setKw] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [busy, setBusy] = React.useState(null);
  const [msg, setMsg] = React.useState(null);
  const load = React.useCallback(async () => {
    const r = await listTrackedKeywords();
    setRows(r.rows);
  }, []);
  React.useEffect(() => {
    load();
  }, [load]);
  async function add() {
    if (!kw.trim()) return;
    const r = await addTrackedKeyword({
      data: {
        keyword: kw.trim(),
        target_url_path: target.trim() || void 0
      }
    });
    if (r.ok) {
      setKw("");
      setTarget("");
      await load();
    } else setMsg(r.error);
  }
  async function checkAll() {
    setBusy("all");
    setMsg(null);
    try {
      const r = await runSerpCheck({
        data: {
          limit: 20
        }
      });
      if (r?.ok === false) {
        setMsg(`Error: ${r.error}`);
        return;
      }
      const found = (r.results || []).filter((x) => x.position != null).length;
      const errs = (r.results || []).filter((x) => x.error).slice(0, 2).map((x) => `${x.keyword}: ${x.error}`).join(" | ");
      setMsg(`Checked ${r.results?.length ?? 0} keywords, ${found} ranked.${errs ? " " + errs : ""}`);
      await load();
    } finally {
      setBusy(null);
    }
  }
  async function checkOne(id) {
    setBusy(id);
    try {
      await runSerpCheck({
        data: {
          id
        }
      });
      await load();
    } finally {
      setBusy(null);
    }
  }
  async function remove(id) {
    if (!confirm("Stop tracking this keyword?")) return;
    await deleteTrackedKeyword({
      data: {
        id
      }
    });
    await load();
  }
  function deltaIcon(curr, prev) {
    if (curr == null || prev == null) return /* @__PURE__ */ jsx(Minus, { className: "h-3.5 w-3.5 text-muted-foreground" });
    if (curr < prev) return /* @__PURE__ */ jsx(TrendingUp, { className: "h-3.5 w-3.5 text-emerald-600" });
    if (curr > prev) return /* @__PURE__ */ jsx(TrendingDown, { className: "h-3.5 w-3.5 text-destructive" });
    return /* @__PURE__ */ jsx(Minus, { className: "h-3.5 w-3.5 text-muted-foreground" });
  }
  return /* @__PURE__ */ jsxs(AdminLayout, { title: "Rank Tracker", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsxs("h1", { className: "flex items-center gap-2 text-2xl font-bold sm:text-3xl", children: [
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-6 w-6 text-primary" }),
        " SERP Rank Tracker"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Daily Google position checks for your priority keywords. Win/loss arrows show movement since the last check." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: "Track a new keyword" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-2 grid gap-2 sm:grid-cols-3", children: [
        /* @__PURE__ */ jsx("input", { value: kw, onChange: (e) => setKw(e.target.value), placeholder: "pool rental austin", className: "rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2" }),
        /* @__PURE__ */ jsx("input", { value: target, onChange: (e) => setTarget(e.target.value), placeholder: "/p/austin-tx (optional)", className: "rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono" }),
        /* @__PURE__ */ jsxs("button", { onClick: add, className: "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground sm:col-span-3", children: [
          /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
          " Add keyword"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold", children: [
        "Tracked keywords (",
        rows.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: checkAll, disabled: busy === "all", className: "inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: [
        busy === "all" ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4" }),
        "Check 20 oldest"
      ] })
    ] }),
    msg && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: msg }),
    /* @__PURE__ */ jsx("div", { className: "mt-3 overflow-hidden rounded-2xl border border-border bg-card", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left", children: "Keyword" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left", children: "Target" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-center", children: "Now" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-center", children: "Prev" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left", children: "Last check" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-border", children: [
        rows.map((r) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 font-medium", children: r.keyword }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 font-mono text-xs text-muted-foreground", children: r.target_url_path || "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-center", children: /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1.5", children: [
            deltaIcon(r.last_position, r.previous_position),
            /* @__PURE__ */ jsx("span", { className: `font-bold ${r.last_position == null ? "text-muted-foreground" : r.last_position <= 3 ? "text-emerald-600" : r.last_position <= 10 ? "text-foreground" : "text-muted-foreground"}`, children: r.last_position ?? "—" })
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-center text-xs text-muted-foreground", children: r.previous_position ?? "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs text-muted-foreground", children: r.last_checked_at ? new Date(r.last_checked_at).toLocaleString() : "never" }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-1.5", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => checkOne(r.id), disabled: busy === r.id, className: "rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold disabled:opacity-50", children: busy === r.id ? "…" : "Recheck" }),
            /* @__PURE__ */ jsx("button", { onClick: () => remove(r.id), className: "rounded-full border border-border p-1.5 text-destructive", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3" }) })
          ] }) })
        ] }, r.id)),
        rows.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "p-8 text-center text-sm text-muted-foreground", children: "No keywords tracked yet." }) })
      ] })
    ] }) })
  ] });
}
export {
  RankTracker as component
};
