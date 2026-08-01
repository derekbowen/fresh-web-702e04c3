import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { aZ as adminListScrapeJobs, a_ as adminScrapeProviderUrl } from "./router-DotN2vF1.js";
import { A as AdminLayout } from "./admin-layout-C8fuK5rJ.js";
import "@tanstack/react-query";
import "./site-footer-defaults-asWdr-hi.js";
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
import "./renter-drip.server-C0_mcvap.js";
import "node:fs";
import "node:path";
import "./host-drip.server-BcWebfNA.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
function ScrapeImport() {
  const [urls, setUrls] = React.useState("");
  const [running, setRunning] = React.useState(false);
  const [progress, setProgress] = React.useState({
    done: 0,
    total: 0
  });
  const [results, setResults] = React.useState([]);
  const [jobs, setJobs] = React.useState([]);
  const refresh = React.useCallback(async () => {
    const r = await adminListScrapeJobs();
    setJobs(r.jobs);
  }, []);
  React.useEffect(() => {
    void refresh();
  }, [refresh]);
  async function run() {
    const list = urls.split(/\r?\n/).map((s) => s.trim()).filter((s) => /^https?:\/\//i.test(s));
    if (!list.length) {
      alert("Paste one or more URLs");
      return;
    }
    setRunning(true);
    setProgress({
      done: 0,
      total: list.length
    });
    const out = [];
    for (let i = 0; i < list.length; i++) {
      const u = list[i];
      setProgress({
        done: i,
        total: list.length,
        last: u
      });
      try {
        const res = await adminScrapeProviderUrl({
          data: {
            url: u,
            autoCreate: true
          }
        });
        out.push({
          url: u,
          ok: true,
          providerId: res.providerId,
          count: res.count ?? (res.providerId ? 1 : 0)
        });
      } catch (e) {
        out.push({
          url: u,
          ok: false,
          error: e?.message || String(e)
        });
      }
      setResults([...out]);
    }
    setProgress({
      done: list.length,
      total: list.length
    });
    setRunning(false);
    void refresh();
  }
  return /* @__PURE__ */ jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Scrape directory URLs" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Paste Yelp, Google Maps, BBB, Angi, Houzz, Thumbtack listing URLs. Each becomes a pending provider." })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/admin/directory", className: "text-sm text-primary hover:underline", children: "← Directory" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-2xl border border-border bg-card p-5", children: [
      /* @__PURE__ */ jsx("textarea", { value: urls, onChange: (e) => setUrls(e.target.value), placeholder: "https://www.yelp.com/biz/example\nhttps://www.google.com/maps/place/...", rows: 8, className: "w-full rounded-lg border border-border bg-background p-3 font-mono text-xs" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("button", { onClick: run, disabled: running, className: "rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: running ? `Scraping ${progress.done}/${progress.total}…` : "Scrape & create pending providers" }),
        progress.last && running && /* @__PURE__ */ jsx("span", { className: "truncate text-xs text-muted-foreground", children: progress.last })
      ] })
    ] }),
    results.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mt-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Run results" }),
      /* @__PURE__ */ jsx("ul", { className: "mt-3 space-y-1.5 text-sm", children: results.map((r) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: r.ok ? "text-green-600" : "text-red-600", children: r.ok ? "✓" : "✗" }),
        /* @__PURE__ */ jsx("span", { className: "truncate", children: r.url }),
        r.ok && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
          "— ",
          r.count ?? 0,
          " provider",
          (r.count ?? 0) === 1 ? "" : "s"
        ] }),
        r.error && /* @__PURE__ */ jsxs("span", { className: "text-xs text-red-600", children: [
          "— ",
          r.error
        ] })
      ] }, r.url)) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "mt-8", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Recent scrape jobs" }),
      /* @__PURE__ */ jsxs("ul", { className: "mt-3 divide-y divide-border rounded-2xl border border-border bg-card", children: [
        jobs.map((j) => /* @__PURE__ */ jsxs("li", { className: "flex flex-wrap items-center gap-3 p-3 text-xs", children: [
          /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 font-bold uppercase ${j.status === "success" ? "bg-green-500/15 text-green-700" : j.status === "failed" ? "bg-red-500/15 text-red-700" : "bg-yellow-500/15 text-yellow-700"}`, children: j.status }),
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: j.source_type }),
          /* @__PURE__ */ jsx("span", { className: "truncate flex-1", children: j.source_url }),
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: new Date(j.created_at).toLocaleString() }),
          j.error && /* @__PURE__ */ jsx("span", { className: "basis-full text-red-600", children: j.error })
        ] }, j.id)),
        jobs.length === 0 && /* @__PURE__ */ jsx("li", { className: "p-4 text-sm text-muted-foreground", children: "No jobs yet." })
      ] })
    ] })
  ] });
}
export {
  ScrapeImport as component
};
