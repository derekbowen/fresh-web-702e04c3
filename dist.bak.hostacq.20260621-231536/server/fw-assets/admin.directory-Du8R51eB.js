import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { bg as adminListPendingProviders, bh as adminGenerateProviderContent, bi as adminListProvidersMissingAI, bj as adminUpdateProvider } from "./router-OI82CwOi.js";
import { A as AdminLayout } from "./admin-layout-7nNRKAex.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
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
import "lucide-react";
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
import "./renter-drip.server-CZnPPh9d.js";
import "./emailit-DRsipvVx.js";
import "node:fs";
import "node:path";
import "./host-drip.server-Cdm15px5.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const DAY = 864e5;
function planBucket(p) {
  const now = Date.now();
  const fUntil = p.featured_until ? new Date(p.featured_until).getTime() : 0;
  const pUntil = p.listing_paid_until ? new Date(p.listing_paid_until).getTime() : 0;
  if (p.is_featured && fUntil > now) return "featured_active";
  if (pUntil > now) return "paid_active";
  if (fUntil && fUntil <= now || pUntil && pUntil <= now) return "expired";
  return "free";
}
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString() : "—";
}
function fmtRelative(d) {
  if (!d) return "";
  const diff = new Date(d).getTime() - Date.now();
  const days = Math.round(diff / DAY);
  if (days === 0) return "today";
  if (days > 0) return `in ${days}d`;
  return `${-days}d ago`;
}
function AdminDirectory() {
  const [rows, setRows] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(null);
  const [filter, setFilter] = React.useState("pending");
  const [planFilter, setPlanFilter] = React.useState("all");
  const [sort, setSort] = React.useState("newest");
  const [search, setSearch] = React.useState("");
  const [bulkRunning, setBulkRunning] = React.useState(false);
  const [bulkTotal, setBulkTotal] = React.useState(0);
  const [bulkDone, setBulkDone] = React.useState(0);
  const [bulkCurrent, setBulkCurrent] = React.useState("");
  const [bulkResults, setBulkResults] = React.useState([]);
  const bulkAbort = React.useRef({
    stop: false
  });
  const pageSize = 50;
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminListPendingProviders({
        data: {
          page,
          pageSize,
          status: filter,
          search
        }
      });
      setRows(r.providers);
      setTotal(r.total);
    } finally {
      setLoading(false);
    }
  }, [page, filter, search]);
  React.useEffect(() => {
    void load();
  }, [load]);
  React.useEffect(() => {
    setPage(1);
  }, [filter, search]);
  async function act(id, action) {
    setBusy(id + action);
    try {
      await adminUpdateProvider({
        data: {
          id,
          action
        }
      });
      await load();
    } catch (e) {
      alert(e?.message || "Failed");
    } finally {
      setBusy(null);
    }
  }
  const runBulk = React.useCallback(async (targets) => {
    setBulkRunning(true);
    setBulkResults([]);
    setBulkDone(0);
    setBulkCurrent("");
    setBulkTotal(targets.length);
    bulkAbort.current.stop = false;
    try {
      for (const p of targets) {
        if (bulkAbort.current.stop) break;
        setBulkCurrent(`${p.name}${p.city ? ` — ${p.city}, ${p.state_code}` : ""}`);
        const t0 = Date.now();
        try {
          await adminGenerateProviderContent({
            data: {
              id: p.id
            }
          });
          setBulkResults((prev) => [...prev, {
            id: p.id,
            name: p.name,
            ok: true,
            ms: Date.now() - t0
          }]);
        } catch (e) {
          setBulkResults((prev) => [...prev, {
            id: p.id,
            name: p.name,
            ok: false,
            error: e?.message || "Failed",
            ms: Date.now() - t0
          }]);
        }
        setBulkDone((n) => n + 1);
        await new Promise((r) => setTimeout(r, 600));
      }
      setBulkCurrent("");
      await load();
    } finally {
      setBulkRunning(false);
    }
  }, [load]);
  const now = Date.now();
  const visible = React.useMemo(() => {
    let list = rows;
    if (planFilter !== "all") {
      list = list.filter((r) => {
        if (planFilter === "expiring_soon") {
          const f = r.featured_until ? new Date(r.featured_until).getTime() : 0;
          const p = r.listing_paid_until ? new Date(r.listing_paid_until).getTime() : 0;
          const soon = (t) => t > now && t - now < 30 * DAY;
          return soon(f) || soon(p);
        }
        return planBucket(r) === planFilter;
      });
    }
    const cmp = {
      newest: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      name: (a, b) => (a.name || "").localeCompare(b.name || ""),
      paid_until: (a, b) => (b.listing_paid_until ? new Date(b.listing_paid_until).getTime() : 0) - (a.listing_paid_until ? new Date(a.listing_paid_until).getTime() : 0),
      featured_until: (a, b) => (b.featured_until ? new Date(b.featured_until).getTime() : 0) - (a.featured_until ? new Date(a.featured_until).getTime() : 0)
    };
    return [...list].sort(cmp[sort]);
  }, [rows, planFilter, sort, now]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return /* @__PURE__ */ jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Directory moderation" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Review and approve provider submissions." })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/admin/dashboard", className: "text-sm text-primary hover:underline", children: "← Dashboard" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [
      ["pending", "approved", "rejected", "all"].map((f) => /* @__PURE__ */ jsx("button", { onClick: () => setFilter(f), className: `rounded-full px-3 py-1 text-xs font-semibold ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`, children: f }, f)),
      /* @__PURE__ */ jsx(Link, { to: "/admin/scrape-import", className: "rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold hover:bg-secondary", children: "+ Scrape URL" }),
      /* @__PURE__ */ jsx(Link, { to: "/admin/gsc-import", className: "rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold hover:bg-secondary", children: "↑ Import GSC" }),
      /* @__PURE__ */ jsx("button", { onClick: async () => {
        const limStr = prompt("How many providers to generate AI content for? (1-50)", "10");
        const limit = Math.max(1, Math.min(50, parseInt(limStr || "10", 10) || 10));
        const {
          providers
        } = await adminListProvidersMissingAI({
          data: {
            limit
          }
        });
        if (providers.length === 0) {
          alert("No published providers are missing AI content.");
          return;
        }
        await runBulk(providers.map((p) => ({
          id: p.id,
          name: p.name,
          city: p.city,
          state_code: p.state_code
        })));
      }, disabled: bulkRunning, className: "rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold disabled:opacity-50", children: bulkRunning ? `Generating ${bulkDone}/${bulkTotal}…` : "✨ Bulk Gen AI" }),
      bulkRunning && /* @__PURE__ */ jsx("button", { onClick: () => {
        bulkAbort.current.stop = true;
      }, className: "rounded-full border border-border bg-card px-3 py-1 text-xs", children: "Stop" }),
      /* @__PURE__ */ jsx("button", { onClick: load, className: "ml-auto rounded-full bg-card border border-border px-3 py-1 text-xs", children: "Refresh" })
    ] }),
    (bulkRunning || bulkResults.length > 0) && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-lg border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-sm font-semibold", children: [
          "Bulk AI generation — ",
          bulkDone,
          "/",
          bulkTotal,
          bulkResults.length > 0 && /* @__PURE__ */ jsxs("span", { className: "ml-2 text-xs font-normal text-muted-foreground", children: [
            bulkResults.filter((r) => r.ok).length,
            " ok · ",
            bulkResults.filter((r) => !r.ok).length,
            " failed"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          !bulkRunning && bulkResults.some((r) => !r.ok) && /* @__PURE__ */ jsxs("button", { onClick: () => {
            const failed = bulkResults.filter((r) => !r.ok).map((r) => ({
              id: r.id,
              name: r.name
            }));
            void runBulk(failed);
          }, className: "rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold", children: [
            "↻ Retry failed (",
            bulkResults.filter((r) => !r.ok).length,
            ")"
          ] }),
          !bulkRunning && bulkResults.length > 0 && /* @__PURE__ */ jsx("button", { onClick: () => {
            setBulkResults([]);
            setBulkDone(0);
            setBulkTotal(0);
          }, className: "text-xs text-muted-foreground hover:underline", children: "Clear" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-primary transition-all", style: {
        width: `${bulkTotal ? bulkDone / bulkTotal * 100 : 0}%`
      } }) }),
      bulkCurrent && /* @__PURE__ */ jsxs("p", { className: "mt-2 text-xs text-muted-foreground", children: [
        "Current: ",
        bulkCurrent
      ] }),
      bulkResults.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-3 max-h-72 overflow-auto rounded border border-border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs", children: [
        /* @__PURE__ */ jsx("thead", { className: "sticky top-0 bg-secondary text-secondary-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "Provider" }),
          /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-right", children: "Time" }),
          /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "Error" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: bulkResults.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
          /* @__PURE__ */ jsx("td", { className: "px-2 py-1", children: r.name }),
          /* @__PURE__ */ jsx("td", { className: "px-2 py-1", children: /* @__PURE__ */ jsx("span", { className: r.ok ? "text-green-600" : "text-destructive", children: r.ok ? "✓ ok" : "✗ failed" }) }),
          /* @__PURE__ */ jsxs("td", { className: "px-2 py-1 text-right text-muted-foreground", children: [
            (r.ms / 1e3).toFixed(1),
            "s"
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-2 py-1 text-destructive", children: r.error || "" })
        ] }, r.id)) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold uppercase text-muted-foreground", children: "Plan:" }),
      [["all", "All"], ["featured_active", "Featured active"], ["paid_active", "Paid active"], ["expiring_soon", "Expiring ≤30d"], ["expired", "Expired"], ["free", "Free"]].map(([key, label]) => /* @__PURE__ */ jsx("button", { onClick: () => setPlanFilter(key), className: `rounded-full px-3 py-1 text-xs font-semibold ${planFilter === key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`, children: label }, key))
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsx("input", { type: "search", value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search name, slug, city, email…", className: "flex-1 min-w-[200px] rounded-lg border border-border bg-card px-3 py-1.5 text-sm" }),
      /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold uppercase text-muted-foreground", children: "Sort:" }),
      /* @__PURE__ */ jsxs("select", { value: sort, onChange: (e) => setSort(e.target.value), className: "rounded-lg border border-border bg-card px-3 py-1.5 text-sm", children: [
        /* @__PURE__ */ jsx("option", { value: "newest", children: "Newest" }),
        /* @__PURE__ */ jsx("option", { value: "name", children: "Name (A–Z)" }),
        /* @__PURE__ */ jsx("option", { value: "paid_until", children: "Paid until (latest)" }),
        /* @__PURE__ */ jsx("option", { value: "featured_until", children: "Featured until (latest)" })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: total > 0 ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}` : "0" })
    ] }),
    loading ? /* @__PURE__ */ jsx("p", { className: "mt-8 text-sm text-muted-foreground", children: "Loading…" }) : /* @__PURE__ */ jsxs("ul", { className: "mt-6 space-y-3", children: [
      visible.map((p) => /* @__PURE__ */ jsx("li", { className: "rounded-2xl border border-border bg-card p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: p.name }),
            /* @__PURE__ */ jsx(Badge, { tone: p.submission_status === "pending" ? "warn" : p.submission_status === "approved" ? "ok" : "danger", children: p.submission_status }),
            p.is_published && /* @__PURE__ */ jsx(Badge, { tone: "ok", children: "published" }),
            p.is_featured && /* @__PURE__ */ jsx(Badge, { tone: "primary", children: "featured" }),
            p.plan && p.plan !== "free" && /* @__PURE__ */ jsx(Badge, { children: p.plan })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: [p.primary_category, [p.city, p.state_code].filter(Boolean).join(", ")].filter(Boolean).join(" · ") }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-2xl text-sm text-muted-foreground line-clamp-3", children: p.description }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground", children: [
            p.email && /* @__PURE__ */ jsxs("span", { children: [
              "📧 ",
              p.email
            ] }),
            p.phone && /* @__PURE__ */ jsxs("span", { children: [
              "📞 ",
              p.phone
            ] }),
            p.website_url && /* @__PURE__ */ jsx("a", { href: p.website_url, target: "_blank", rel: "noreferrer", className: "text-primary hover:underline", children: "🔗 site" }),
            /* @__PURE__ */ jsxs("a", { href: `/p/pool-pros/${p.slug}`, target: "_blank", rel: "noreferrer", className: "text-primary hover:underline", children: [
              "/p/pool-pros/",
              p.slug
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap gap-3 text-xs", children: [
            /* @__PURE__ */ jsx(TimestampPill, { label: "Paid until", value: p.listing_paid_until, activeClass: "text-green-700" }),
            /* @__PURE__ */ jsx(TimestampPill, { label: "Featured until", value: p.featured_until, activeClass: "text-primary" }),
            (p.gsc_impressions || p.gsc_clicks) && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", title: p.gsc_updated_at ? `Updated ${new Date(p.gsc_updated_at).toLocaleString()}` : void 0, children: [
              "GSC: ",
              p.gsc_impressions ?? 0,
              " impr · ",
              p.gsc_clicks ?? 0,
              " clk",
              p.gsc_position ? ` · pos ${Number(p.gsc_position).toFixed(1)}` : ""
            ] }),
            p.ai_content_generated_at && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "AI ✓" }),
            p.source_type && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
              "src: ",
              p.source_type
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          p.submission_status === "pending" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Btn, { onClick: () => act(p.id, "approve"), busy: busy === p.id + "approve", tone: "ok", children: "Approve & publish" }),
            /* @__PURE__ */ jsx(Btn, { onClick: () => act(p.id, "reject"), busy: busy === p.id + "reject", tone: "danger", children: "Reject" })
          ] }),
          p.submission_status === "approved" && /* @__PURE__ */ jsxs(Fragment, { children: [
            p.is_published ? /* @__PURE__ */ jsx(Btn, { onClick: () => act(p.id, "unpublish"), busy: busy === p.id + "unpublish", children: "Unpublish" }) : /* @__PURE__ */ jsx(Btn, { onClick: () => act(p.id, "publish"), busy: busy === p.id + "publish", tone: "ok", children: "Publish" }),
            /* @__PURE__ */ jsx(Btn, { onClick: () => act(p.id, "mark_paid"), busy: busy === p.id + "mark_paid", tone: "ok", children: "Mark paid ($5/yr)" }),
            p.listing_paid_until && /* @__PURE__ */ jsx(Btn, { onClick: () => act(p.id, "mark_unpaid"), busy: busy === p.id + "mark_unpaid", children: "Mark unpaid" }),
            p.is_featured ? /* @__PURE__ */ jsx(Btn, { onClick: () => act(p.id, "unfeature"), busy: busy === p.id + "unfeature", children: "Unfeature" }) : /* @__PURE__ */ jsx(Btn, { onClick: () => act(p.id, "feature"), busy: busy === p.id + "feature", tone: "primary", children: "Feature ($25/yr)" })
          ] }),
          /* @__PURE__ */ jsx(Btn, { onClick: async () => {
            setBusy(p.id + "ai");
            try {
              await adminGenerateProviderContent({
                data: {
                  id: p.id
                }
              });
              await load();
            } catch (e) {
              alert(e?.message || "AI failed");
            } finally {
              setBusy(null);
            }
          }, busy: busy === p.id + "ai", tone: "primary", children: p.ai_content_generated_at ? "↻ Regen AI" : "✨ Gen AI content" }),
          /* @__PURE__ */ jsx(Btn, { onClick: () => {
            if (confirm("Delete this listing?")) act(p.id, "delete");
          }, busy: busy === p.id + "delete", tone: "danger", children: "Delete" })
        ] })
      ] }) }, p.id)),
      visible.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Nothing here." })
    ] }),
    totalPages > 1 && /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-center justify-center gap-2", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page <= 1, className: "rounded-lg border border-border bg-card px-3 py-1.5 text-sm disabled:opacity-40", children: "← Prev" }),
      /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
        "Page ",
        page,
        " / ",
        totalPages
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page >= totalPages, className: "rounded-lg border border-border bg-card px-3 py-1.5 text-sm disabled:opacity-40", children: "Next →" })
    ] })
  ] });
}
function Badge({
  children,
  tone
}) {
  const cls = tone === "ok" ? "bg-green-500/15 text-green-700" : tone === "warn" ? "bg-yellow-500/15 text-yellow-700" : tone === "danger" ? "bg-red-500/15 text-red-700" : tone === "primary" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground";
  return /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${cls}`, children });
}
function TimestampPill({
  label,
  value,
  activeClass
}) {
  const [copied, setCopied] = React.useState(false);
  const isActive = !!value && new Date(value) > /* @__PURE__ */ new Date();
  const iso = value ? new Date(value).toISOString() : "";
  async function copy() {
    if (!iso) return;
    try {
      await navigator.clipboard.writeText(iso);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
    }
  }
  return /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 ${isActive ? activeClass : "text-muted-foreground"}`, children: [
    /* @__PURE__ */ jsxs("span", { title: iso || "—", children: [
      label,
      ": ",
      fmtDate(value),
      value && /* @__PURE__ */ jsxs("span", { className: "ml-1 opacity-70", children: [
        "(",
        fmtRelative(value),
        ")"
      ] })
    ] }),
    value && /* @__PURE__ */ jsx("button", { type: "button", onClick: copy, title: `Copy ISO-8601: ${iso}`, className: "rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono hover:bg-secondary", children: copied ? "✓" : "copy" })
  ] });
}
function Btn({
  children,
  onClick,
  busy,
  tone
}) {
  const cls = tone === "ok" ? "bg-green-600 text-white" : tone === "danger" ? "bg-red-600 text-white" : tone === "primary" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground";
  return /* @__PURE__ */ jsx("button", { onClick, disabled: busy, className: `rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${cls}`, children: busy ? "…" : children });
}
export {
  AdminDirectory as component
};
