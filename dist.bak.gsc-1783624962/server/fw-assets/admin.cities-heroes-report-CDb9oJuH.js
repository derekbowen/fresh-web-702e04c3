import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { A as AdminLayout } from "./admin-layout-fwIJkCGX.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import "lucide-react";
import "./router-Bw8GQi9C.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
import "zod";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
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
import "./renter-drip.server-CMz_M9Zp.js";
import "node:fs";
import "node:path";
import "./host-drip.server-nBw4NS9X.js";
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
const getHeroBackfillReport = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("c1dba8f5e92bc0ed980fbdb68bbaeb3c1a68efe10d7d9c4f7900968ec161cd91"));
function HeroReportPage() {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState(null);
  const [filter, setFilter] = useState("failing");
  const [search, setSearch] = useState("");
  async function load() {
    setLoading(true);
    setErrMsg(null);
    try {
      const out = await getHeroBackfillReport();
      setRows(out.rows);
      setTotals(out.totals);
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "error" && r.error === 0) return false;
      if (filter === "miss" && r.miss === 0) return false;
      if (filter === "skipped" && r.skipped === 0) return false;
      if (filter === "missing_hero" && r.has_hero) return false;
      if (filter === "failing" && r.last_status === "ok") return false;
      if (q) {
        const hay = `${r.city_slug} ${r.city_name ?? ""} ${r.state_code ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, filter, search]);
  function downloadCsv(scope) {
    const list = scope === "visible" ? visible : rows.filter((r) => r.last_status && r.last_status !== "ok");
    const header = "city_slug,city_name,state_code,has_hero,last_status,ok,miss,skipped,error,last_source_url,last_error,last_ran_at\n";
    const csv = header + list.map((r) => [r.city_slug, JSON.stringify(r.city_name ?? ""), r.state_code ?? "", r.has_hero ? "1" : "0", r.last_status ?? "", r.ok, r.miss, r.skipped, r.error, JSON.stringify(r.last_source_url ?? ""), JSON.stringify(r.last_error ?? ""), r.last_ran_at ?? ""].join(",")).join("\n");
    const blob = new Blob([csv], {
      type: "text/csv"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = scope === "visible" ? "hero-report-filtered.csv" : "hero-report-failing.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  function copyFailingSlugs() {
    const slugs = rows.filter((r) => r.last_status && r.last_status !== "ok").map((r) => r.city_slug);
    navigator.clipboard.writeText(slugs.join("\n"));
  }
  return /* @__PURE__ */ jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsx(Link, { to: "/admin/cities-heroes", className: "text-sm text-muted-foreground hover:underline", children: "← Hero backfill" }),
      /* @__PURE__ */ jsx("h1", { className: "mt-2 text-3xl font-bold tracking-tight", children: "City hero backfill report" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-2 text-muted-foreground", children: [
        "Per-city counts of ok / miss / skipped / error from",
        /* @__PURE__ */ jsx("code", { className: "mx-1 rounded bg-secondary px-1", children: "cities_hero_backfill_log" }),
        ". Use the filters to find cities to reprocess."
      ] })
    ] }),
    errMsg && /* @__PURE__ */ jsx("div", { className: "mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive", children: errMsg }),
    totals && /* @__PURE__ */ jsx("div", { className: "mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7", children: [["cities", totals.cities], ["ok", totals.ok], ["miss", totals.miss], ["skipped", totals.skipped], ["error", totals.error], ["missing hero", totals.missingHero], ["last run failing", totals.lastFailing]].map(([k, v]) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-3 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "text-xl font-bold", children: v }),
      /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wide text-muted-foreground", children: k })
    ] }, String(k))) }),
    /* @__PURE__ */ jsxs("div", { className: "mb-4 flex flex-wrap items-center gap-3", children: [
      /* @__PURE__ */ jsxs("select", { value: filter, onChange: (e) => setFilter(e.target.value), className: "rounded-md border border-border bg-card px-3 py-1.5 text-sm", children: [
        /* @__PURE__ */ jsx("option", { value: "failing", children: "Last run failing" }),
        /* @__PURE__ */ jsx("option", { value: "error", children: "Has any error" }),
        /* @__PURE__ */ jsx("option", { value: "miss", children: "Has any miss" }),
        /* @__PURE__ */ jsx("option", { value: "skipped", children: "Has any skipped" }),
        /* @__PURE__ */ jsx("option", { value: "missing_hero", children: "Missing hero in DB" }),
        /* @__PURE__ */ jsx("option", { value: "all", children: "All cities" })
      ] }),
      /* @__PURE__ */ jsx("input", { type: "search", value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search slug, name, state…", className: "min-w-[220px] flex-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm" }),
      /* @__PURE__ */ jsx("button", { onClick: load, disabled: loading, className: "rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium hover:bg-secondary disabled:opacity-50", children: loading ? "Loading…" : "Refresh" }),
      /* @__PURE__ */ jsx("button", { onClick: () => downloadCsv("visible"), className: "rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium hover:bg-secondary", children: "Download filtered CSV" }),
      /* @__PURE__ */ jsx("button", { onClick: () => downloadCsv("all_failing"), className: "rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90", children: "Download all failing" }),
      /* @__PURE__ */ jsx("button", { onClick: copyFailingSlugs, className: "rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium hover:bg-secondary", children: "Copy failing slugs" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-lg border border-border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-secondary/40 text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "City" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Last" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "ok" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "miss" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "skip" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "err" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Hero" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Last error / source" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-border", children: [
        visible.map((r) => /* @__PURE__ */ jsxs("tr", { className: "align-top", children: [
          /* @__PURE__ */ jsxs("td", { className: "px-3 py-2", children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: r.city_name ?? r.city_slug }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
              r.city_slug,
              r.state_code ? ` · ${r.state_code.toUpperCase()}` : ""
            ] })
          ] }),
          /* @__PURE__ */ jsxs("td", { className: "px-3 py-2 font-mono text-xs", children: [
            /* @__PURE__ */ jsx("span", { className: r.last_status === "ok" ? "text-emerald-600" : r.last_status === "miss" ? "text-amber-600" : "text-destructive", children: r.last_status ?? "—" }),
            r.last_ran_at && /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: new Date(r.last_ran_at).toLocaleString() })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right tabular-nums", children: r.ok }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right tabular-nums", children: r.miss }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right tabular-nums", children: r.skipped }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right tabular-nums", children: r.error }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs", children: r.has_hero ? /* @__PURE__ */ jsx("span", { className: "text-emerald-600", children: "yes" }) : /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "no" }) }),
          /* @__PURE__ */ jsxs("td", { className: "px-3 py-2 text-xs", children: [
            r.last_error && /* @__PURE__ */ jsx("div", { className: "text-destructive line-clamp-2", children: r.last_error }),
            r.last_source_url && /* @__PURE__ */ jsx("a", { href: r.last_source_url, target: "_blank", rel: "noreferrer", className: "break-all text-primary hover:underline", children: r.last_source_url.replace("https://www.", "") })
          ] })
        ] }, r.city_slug)),
        !loading && visible.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 8, className: "px-3 py-8 text-center text-sm text-muted-foreground", children: "No rows match this filter." }) })
      ] })
    ] }) })
  ] });
}
export {
  HeroReportPage as component
};
