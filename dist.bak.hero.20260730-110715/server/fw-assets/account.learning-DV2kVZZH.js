import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { s as supabase } from "./client-Dh5RMKgP.js";
import { bC as listMyLearning, bD as listMyProgress, S as SiteHeader, bE as ACADEMY_HUB_PATH, h as coursePath, e as SiteFooter } from "./router-BTf4C8qB.js";
import { B as Button } from "./button-TjZkfKyC.js";
import { P as Progress } from "./progress-BRG1z6ZI.js";
import "@supabase/supabase-js";
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
import "./auth-middleware-C3cX-s7a.js";
import "./createMiddleware-BvN2ghIY.js";
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
import "./renter-drip.server-C0Ma8t5O.js";
import "node:fs";
import "node:path";
import "./host-drip.server-DDQBE_qt.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-progress";
function MyLearningPage() {
  const [rows, setRows] = useState(null);
  const [progress, setProgress] = useState(/* @__PURE__ */ new Map());
  const [err, setErr] = useState(null);
  useEffect(() => {
    void Promise.all([listMyLearning({
      data: void 0
    }), listMyProgress({
      data: void 0
    })]).then(([l, p]) => {
      setRows(l.rows);
      const m = /* @__PURE__ */ new Map();
      for (const r of p.rows) m.set(r.course_slug, r);
      setProgress(m);
    }).catch((e) => setErr(e instanceof Error ? e.message : String(e)));
  }, []);
  const completed = (rows ?? []).filter((r) => r.completed_at);
  const inProgress = (rows ?? []).filter((r) => !r.completed_at);
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "My learning" }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: async () => {
          await supabase.auth.signOut();
          window.location.href = "/";
        }, children: "Sign out" })
      ] }),
      err && /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive", children: err }),
      /* @__PURE__ */ jsxs("section", { className: "mt-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-foreground", children: "Completed" }),
        completed.length === 0 ? /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "No completions yet." }) : /* @__PURE__ */ jsx("ul", { className: "mt-3 grid gap-3 sm:grid-cols-2", children: completed.map((r) => /* @__PURE__ */ jsxs("li", { className: "rounded-2xl border border-border bg-card p-4 shadow-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold text-foreground", children: r.course_title ?? r.course_slug }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
            "Completed ",
            r.completed_at ? new Date(r.completed_at).toLocaleDateString() : ""
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-3 flex gap-2", children: r.certificate_uid && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Button, { asChild: true, size: "sm", children: /* @__PURE__ */ jsx("a", { href: `/api/certificates/${r.certificate_uid}.pdf`, target: "_blank", rel: "noreferrer", children: "Download certificate" }) }),
            /* @__PURE__ */ jsx(Button, { asChild: true, size: "sm", variant: "outline", children: /* @__PURE__ */ jsx(Link, { to: "/verify/$uid", params: {
              uid: r.certificate_uid
            }, children: "Verify" }) })
          ] }) })
        ] }, r.course_slug)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-10", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-foreground", children: "In progress" }),
        inProgress.length === 0 ? /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-muted-foreground", children: [
          "You aren't enrolled in any active courses.",
          " ",
          /* @__PURE__ */ jsx("a", { href: ACADEMY_HUB_PATH, className: "text-primary hover:underline", children: "Browse Learn with Fred" }),
          "."
        ] }) : /* @__PURE__ */ jsx("ul", { className: "mt-3 grid gap-3 sm:grid-cols-2", children: inProgress.map((r) => {
          const p = progress.get(r.course_slug);
          const pct = p?.progress_pct ?? 0;
          return /* @__PURE__ */ jsxs("li", { className: "rounded-2xl border border-border bg-card p-4 shadow-sm", children: [
            /* @__PURE__ */ jsx("div", { className: "font-semibold text-foreground", children: r.course_title ?? r.course_slug }),
            /* @__PURE__ */ jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
              "Enrolled ",
              r.enrolled_at ? new Date(r.enrolled_at).toLocaleDateString() : ""
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "mb-1 flex items-center justify-between text-xs text-muted-foreground", children: [
                /* @__PURE__ */ jsx("span", { children: "Progress" }),
                /* @__PURE__ */ jsxs("span", { className: "font-medium text-foreground", children: [
                  pct,
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsx(Progress, { value: pct, "aria-label": `${pct}% complete` })
            ] }),
            /* @__PURE__ */ jsx(Button, { asChild: true, size: "sm", variant: "outline", className: "mt-3", children: /* @__PURE__ */ jsx("a", { href: coursePath(r.course_slug), children: "Continue course" }) })
          ] }, r.course_slug);
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  MyLearningPage as component
};
