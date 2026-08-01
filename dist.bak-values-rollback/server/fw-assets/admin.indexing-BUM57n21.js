import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { A as AdminLayout } from "./admin-layout-D-GLXJwf.js";
import { ba as getIndexingStats } from "./router-B2eXowiP.js";
import "lucide-react";
import "./client-Dh5RMKgP.js";
import "@supabase/supabase-js";
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
import "./auth-middleware-C3cX-s7a.js";
import "./createMiddleware-BvN2ghIY.js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
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
import "./renter-drip.server-JSvbm2ii.js";
import "node:fs";
import "node:path";
import "./host-drip.server-b0u8F2OF.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const SITEMAPS = ["/sitemap.xml", "/sitemap-index.xml", "/sitemap-default.xml", "/sitemap-static.xml", "/sitemap-recent-pages.xml", "/sitemap-pages-cities.xml", "/sitemap-pages-articles.xml", "/sitemap-pages-comparisons.xml", "/sitemap-pages-academy.xml", "/sitemap-pages-money.xml", "/sitemap-pages-host-acquisition.xml", "/sitemap-pages-event-guides.xml", "/sitemap-pages-swim-instructor.xml", "/sitemap-pages-spanish.xml", "/sitemap-pages-advocacy.xml", "/sitemap-directory.xml", "/sitemap-hub.xml"];
function Indexing() {
  const [s, setS] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    (async () => {
      try {
        setS(await getIndexingStats());
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  return /* @__PURE__ */ jsxs(AdminLayout, { title: "Sitemap & Indexing", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Sitemap & Indexing" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Sitemap inventory, recent indexing activity, and unresolved 404s." }),
    loading && /* @__PURE__ */ jsx("div", { className: "mt-8 text-center text-muted-foreground", children: "Loading…" }),
    s && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Published /p/*" }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 text-2xl font-bold", children: s.totalPublished.toLocaleString() })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Published last 24h" }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 text-2xl font-bold", children: s.recentlyPublished.toLocaleString() })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Unresolved 404s" }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 text-2xl font-bold text-red-600", children: s.unresolved404s.toLocaleString() })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Sitemap files" }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 text-2xl font-bold", children: SITEMAPS.length })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Sitemaps" }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3", children: SITEMAPS.map((path) => /* @__PURE__ */ jsxs("a", { href: path, target: "_blank", rel: "noreferrer", className: "flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm hover:bg-muted", children: [
          /* @__PURE__ */ jsx("code", { className: "text-xs", children: path }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Open ↗" })
        ] }, path)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Top template types (published)" }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 overflow-x-auto rounded-xl border border-border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-left text-xs uppercase", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Template" }),
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Pages" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: s.byTemplate.map((t) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 font-mono text-xs", children: t.template_type || "(none)" }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right", children: t.count.toLocaleString() })
          ] }, t.template_type || "(none)")) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Top unresolved 404s" }),
          /* @__PURE__ */ jsx(Link, { to: "/admin/missing-pages", className: "text-xs font-semibold text-primary hover:underline", children: "Manage all 404s →" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 overflow-x-auto rounded-xl border border-border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-left text-xs uppercase", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "URL" }),
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Hits" }),
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Last seen" })
          ] }) }),
          /* @__PURE__ */ jsxs("tbody", { children: [
            s.recent404s.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 font-mono text-xs", children: r.url_path }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right font-bold", children: r.hit_count }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right text-xs text-muted-foreground", children: new Date(r.last_seen_at).toLocaleString() })
            ] }, r.id)),
            s.recent404s.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 3, className: "px-3 py-6 text-center text-muted-foreground", children: "No unresolved 404s." }) })
          ] })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  Indexing as component
};
