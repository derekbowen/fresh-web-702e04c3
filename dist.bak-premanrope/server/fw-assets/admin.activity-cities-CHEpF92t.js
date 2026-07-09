import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { s as supabase } from "./client-TSMcDHCK.js";
import { u as checkAdminRole } from "./router-B7ZiUt1j.js";
import { A as AdminLayout } from "./admin-layout-CB2q0yk1.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import "@supabase/supabase-js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
import "./client.server-D5ro3rAQ.js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
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
import "./renter-drip.server-69Dq0r1C.js";
import "node:fs";
import "node:path";
import "./host-drip.server-d8aCbPyC.js";
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
const ACTIVITY_KEYS = ["pool-party", "baby-shower", "birthday-party", "hot-tub", "dog-friendly"];
const generateSchema = z.object({
  activity: z.enum(ACTIVITY_KEYS),
  citySlugs: z.array(z.string().min(1).max(100)).min(1).max(50),
  model: z.string().optional(),
  dryRun: z.boolean().optional()
});
const generateActivityCityPages = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => generateSchema.parse(d)).handler(createSsrRpc("77af1e716826287656d2a5dc901011dde9ac6dda8ae791e04cb4ee33bf00c134"));
const publishSchema = z.object({
  slugs: z.array(z.string().min(1).max(120)).min(1).max(500)
});
const publishActivityCityPages = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => publishSchema.parse(d)).handler(createSsrRpc("b1bfeb895e6ac2c2231125d6203153722014eb2b68936d39e5d318e0e8495041"));
const listActivityCityPages = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("2ef71572ad0ac4a359f6da5c1ae3b7639762743900d45c81daec4fc08394f640"));
const listCandidateCities = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  limit: z.number().int().min(1).max(200).optional()
}).parse(d ?? {})).handler(createSsrRpc("be2248961e4c5abd692de933ed04e6fe11491f46c92897347902e6a51cfc6bc4"));
function useAdminGate() {
  const navigate = useNavigate();
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!data.user) {
        navigate({
          to: "/auth",
          search: {
            redirect: "/admin/activity-cities",
            mode: "signin"
          }
        });
        return;
      }
      const {
        isAdmin
      } = await checkAdminRole();
      if (cancelled) return;
      if (!isAdmin) {
        navigate({
          to: "/admin/no-access"
        });
        return;
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);
  return ready;
}
const PILOT_CITY_SLUGS = ["los-angeles-ca", "new-york-ny", "houston-tx", "miami-fl", "phoenix-az", "san-diego-ca", "chicago-il", "dallas-tx", "austin-tx"];
function ActivityCitiesAdmin() {
  const ready = useAdminGate();
  if (!ready) {
    return /* @__PURE__ */ jsx(AdminLayout, { children: /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Checking admin access…" }) });
  }
  return /* @__PURE__ */ jsx(ActivityCitiesInner, {});
}
function ActivityCitiesInner() {
  const [activities, setActivities] = React.useState([]);
  const [rows, setRows] = React.useState([]);
  const [cities, setCities] = React.useState([]);
  const [activity, setActivity] = React.useState("pool-party");
  const [selectedCities, setSelectedCities] = React.useState(PILOT_CITY_SLUGS);
  const [busy, setBusy] = React.useState(false);
  const [results, setResults] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [dryRun, setDryRun] = React.useState(false);
  const refresh = React.useCallback(async () => {
    try {
      const list = await listActivityCityPages();
      setActivities(list.activities);
      setRows(list.rows);
      const c = await listCandidateCities({
        data: {
          limit: 50
        }
      });
      setCities(c.cities);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);
  React.useEffect(() => {
    void refresh();
  }, [refresh]);
  const toggleCity = (slug) => {
    setSelectedCities((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);
  };
  const runGenerate = async () => {
    setBusy(true);
    setError(null);
    setResults([]);
    try {
      const res = await generateActivityCityPages({
        data: {
          activity,
          citySlugs: selectedCities,
          dryRun
        }
      });
      setResults(res.pages);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const publishAllDrafts = async () => {
    const draftSlugs = rows.filter((r) => r.status === "draft").map((r) => r.slug);
    if (draftSlugs.length === 0) return;
    if (!confirm(`Publish ${draftSlugs.length} draft pages?`)) return;
    setBusy(true);
    try {
      await publishActivityCityPages({
        data: {
          slugs: draftSlugs
        }
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const draftCount = rows.filter((r) => r.status === "draft").length;
  const publishedCount = rows.filter((r) => r.status === "published").length;
  return /* @__PURE__ */ jsx(AdminLayout, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxs("header", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Activity-modifier city pages" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
        "Generate /p/",
        `{activity}-{city-state}`,
        " pages targeting Swimply's long-tail queries (pool party, baby shower, birthday party, hot tub, dog-friendly)."
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 flex gap-4 text-xs", children: [
        /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-muted px-3 py-1", children: [
          rows.length,
          " total"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-amber-500/10 px-3 py-1 text-amber-700 dark:text-amber-300", children: [
          draftCount,
          " drafts"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-300", children: [
          publishedCount,
          " published"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "rounded-lg border border-border bg-card p-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Generate batch" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium", children: "Activity" }),
          /* @__PURE__ */ jsx("select", { value: activity, onChange: (e) => setActivity(e.target.value), className: "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm", children: activities.map((a) => /* @__PURE__ */ jsxs("option", { value: a.key, children: [
            a.label,
            " (",
            a.slugPrefix,
            "*)"
          ] }, a.key)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("label", { className: "text-sm font-medium", children: [
              "Cities (",
              selectedCities.length,
              " selected)"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2 text-xs", children: [
              /* @__PURE__ */ jsx("button", { onClick: () => setSelectedCities(PILOT_CITY_SLUGS), className: "rounded border border-border px-2 py-1 hover:bg-muted", children: "Pilot 9" }),
              /* @__PURE__ */ jsx("button", { onClick: () => setSelectedCities(cities.map((c) => c.slug)), className: "rounded border border-border px-2 py-1 hover:bg-muted", children: "All" }),
              /* @__PURE__ */ jsx("button", { onClick: () => setSelectedCities([]), className: "rounded border border-border px-2 py-1 hover:bg-muted", children: "Clear" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 grid max-h-64 grid-cols-2 gap-1 overflow-y-auto rounded-md border border-border bg-background p-2 text-xs sm:grid-cols-3", children: cities.map((c) => /* @__PURE__ */ jsxs("label", { className: "flex cursor-pointer items-center gap-2 px-2 py-1 hover:bg-muted", children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: selectedCities.includes(c.slug), onChange: () => toggleCity(c.slug) }),
            /* @__PURE__ */ jsxs("span", { children: [
              c.name,
              ", ",
              c.state_code
            ] })
          ] }, c.slug)) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: dryRun, onChange: (e) => setDryRun(e.target.checked) }),
          "Dry run (skip AI call & insert; preview slugs only)"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsx("button", { onClick: runGenerate, disabled: busy || selectedCities.length === 0, className: "rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: busy ? "Generating…" : `Generate ${selectedCities.length} page${selectedCities.length === 1 ? "" : "s"}` }),
          /* @__PURE__ */ jsxs("button", { onClick: publishAllDrafts, disabled: busy || draftCount === 0, className: "rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50", children: [
            "Publish ",
            draftCount,
            " drafts"
          ] })
        ] }),
        error && /* @__PURE__ */ jsx("div", { className: "rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300", children: error })
      ] })
    ] }),
    results.length > 0 && /* @__PURE__ */ jsxs("section", { className: "rounded-lg border border-border bg-card p-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Latest run" }),
      /* @__PURE__ */ jsx("ul", { className: "mt-3 divide-y divide-border text-sm", children: results.map((r) => /* @__PURE__ */ jsxs("li", { className: "py-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between", children: [
          /* @__PURE__ */ jsxs("a", { href: `/p/${r.slug}`, target: "_blank", rel: "noreferrer", className: "font-mono text-xs text-primary hover:underline", children: [
            "/p/",
            r.slug
          ] }),
          /* @__PURE__ */ jsxs("span", { className: `rounded-full px-2 py-0.5 text-xs ${r.status === "inserted" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : r.status === "skipped_exists" ? "bg-muted text-muted-foreground" : r.status === "dry_run" ? "bg-sky-500/15 text-sky-700 dark:text-sky-300" : "bg-red-500/15 text-red-700 dark:text-red-300"}`, children: [
            r.status,
            r.wordCount ? ` · ${r.wordCount}w` : ""
          ] })
        ] }),
        r.seoTitle && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-foreground/80", children: r.seoTitle }),
        r.error && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-red-600", children: r.error })
      ] }, r.slug)) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "rounded-lg border border-border bg-card p-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "All activity-city pages" }),
      rows.length === 0 ? /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "None yet. Generate your first batch above." }) : /* @__PURE__ */ jsx("ul", { className: "mt-3 divide-y divide-border text-sm", children: rows.map((r) => /* @__PURE__ */ jsxs("li", { className: "py-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("a", { href: `/p/${r.slug}`, target: "_blank", rel: "noreferrer", className: "truncate font-mono text-xs text-primary hover:underline", children: [
            "/p/",
            r.slug
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-xs", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
              r.word_count,
              "w"
            ] }),
            /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 ${r.status === "published" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/15 text-amber-700 dark:text-amber-300"}`, children: r.status })
          ] })
        ] }),
        r.seo_title && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-foreground/70", children: r.seo_title })
      ] }, r.slug)) })
    ] })
  ] }) });
}
export {
  ActivityCitiesAdmin as component
};
