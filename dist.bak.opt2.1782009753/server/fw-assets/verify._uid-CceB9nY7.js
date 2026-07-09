import { jsxs, jsx } from "react/jsx-runtime";
import { g as Route, S as SiteHeader, h as coursePath, e as SiteFooter } from "./router-BvRNdW25.js";
import "@tanstack/react-router";
import "react";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
import "./cities.functions-XBYRqf13.js";
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
import "./auth-middleware-rMMNsPLB.js";
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
function VerifyPage() {
  const {
    cert
  } = Route.useLoaderData();
  const revoked = !!cert.revoked_at;
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsx("main", { className: "mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6", children: /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-8 shadow-sm", children: [
      /* @__PURE__ */ jsx("div", { className: `inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${revoked ? "bg-destructive/15 text-destructive" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"}`, children: revoked ? "✗ Revoked" : "✓ Verified" }),
      /* @__PURE__ */ jsxs("h1", { className: "mt-4 text-2xl font-bold tracking-tight text-foreground", children: [
        "Certificate ",
        cert.certificate_uid
      ] }),
      /* @__PURE__ */ jsxs("dl", { className: "mt-6 grid gap-4 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-muted-foreground", children: "Awarded to" }),
          /* @__PURE__ */ jsx("dd", { className: "text-base font-semibold text-foreground", children: cert.learner_name })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-muted-foreground", children: "Course" }),
          /* @__PURE__ */ jsx("dd", { className: "text-base text-foreground", children: /* @__PURE__ */ jsx("a", { href: coursePath(cert.course_slug), className: "hover:text-primary hover:underline", children: cert.course_title }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-muted-foreground", children: "Completed on" }),
          /* @__PURE__ */ jsx("dd", { className: "text-base text-foreground", children: new Date(cert.completed_at).toLocaleDateString() })
        ] }),
        revoked && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-muted-foreground", children: "Revoked on" }),
          /* @__PURE__ */ jsxs("dd", { className: "text-base text-foreground", children: [
            new Date(cert.revoked_at).toLocaleDateString(),
            cert.revoke_reason ? ` — ${cert.revoke_reason}` : ""
          ] })
        ] })
      ] }),
      !revoked && /* @__PURE__ */ jsx("a", { href: `/api/certificates/${cert.certificate_uid}.pdf`, target: "_blank", rel: "noreferrer", className: "mt-8 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-glow", children: "Download PDF certificate" })
    ] }) }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  VerifyPage as component
};
