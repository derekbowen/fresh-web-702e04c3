import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { A as AdminLayout } from "./admin-layout-CipWTHsV.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import "@tanstack/react-router";
import "lucide-react";
import "./router-BskH5uAy.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C6_J6kuR.js";
import "zod";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
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
import "./renter-drip.server-BUH95fZo.js";
import "node:fs";
import "node:path";
import "./host-drip.server-MvSzhhAo.js";
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
const checkLandingAcademyLinks = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("1a0db541b1be2cda73a67cbaec79a0e0ebeb9955bd5567ceac8e53436dbbd67e"));
function LandingLinkCheckPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await checkLandingAcademyLinks();
      setResults(res.results);
      setSummary({
        ok: res.ok,
        broken: res.broken,
        total: res.total,
        checkedAt: res.checkedAt
      });
    } catch (e) {
      setError(e?.message ?? "Failed to run check");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    run();
  }, []);
  return /* @__PURE__ */ jsx(AdminLayout, { title: "Landing page link check", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl space-y-6 p-6", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-foreground", children: "Landing page link check" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
          "Verifies every course and academy card on the landing page resolves to a published",
          /* @__PURE__ */ jsx("code", { className: "mx-1 rounded bg-muted px-1.5 py-0.5", children: "/p/{slug}" }),
          "page (so nginx forwards it to fresh-web instead of falling through to Sharetribe's 404)."
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: run, disabled: loading, className: "rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: loading ? "Checking…" : "Re-run" })
    ] }),
    error && /* @__PURE__ */ jsx("div", { className: "rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive", children: error }),
    summary && /* @__PURE__ */ jsxs("div", { className: "flex gap-3 text-sm", children: [
      /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-muted px-3 py-1 text-foreground", children: [
        "Total: ",
        summary.total
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-700", children: [
        "OK: ",
        summary.ok
      ] }),
      /* @__PURE__ */ jsxs("span", { className: `rounded-full px-3 py-1 ${summary.broken > 0 ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`, children: [
        "Broken: ",
        summary.broken
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-lg border border-border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Card" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "URL" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        results.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: r.ok ? /* @__PURE__ */ jsx("span", { className: "inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700", children: "200" }) : /* @__PURE__ */ jsx("span", { className: "inline-flex rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive", children: r.status === "missing" ? "404 (missing)" : "404 (unpublished)" }) }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-foreground", children: r.label }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx("a", { href: r.href, target: "_blank", rel: "noreferrer", className: "text-primary hover:underline", children: r.href }) })
        ] }, r.href)),
        !results.length && !loading && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 3, className: "px-3 py-6 text-center text-muted-foreground", children: "No results yet." }) })
      ] })
    ] }) })
  ] }) });
}
export {
  LandingLinkCheckPage as component
};
