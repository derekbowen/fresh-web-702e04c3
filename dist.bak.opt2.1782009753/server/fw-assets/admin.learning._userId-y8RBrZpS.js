import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { bR as Route, bS as adminGetLearnerDetail } from "./router-BvRNdW25.js";
import { A as AdminLayout } from "./admin-layout-BNp_05PW.js";
import { P as Progress } from "./progress-BRG1z6ZI.js";
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
import "@radix-ui/react-progress";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
function LearnerDetailPage() {
  const {
    userId
  } = Route.useParams();
  const [detail, setDetail] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    void adminGetLearnerDetail({
      data: {
        user_id: userId
      }
    }).then(setDetail).catch((e) => setErr(e instanceof Error ? e.message : String(e)));
  }, [userId]);
  return /* @__PURE__ */ jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsx(Link, { to: "/admin/learning", className: "text-sm text-primary hover:underline", children: "← Back to learning admin" }),
    /* @__PURE__ */ jsx("h1", { className: "mt-2 text-2xl font-bold tracking-tight text-foreground", children: detail?.profile?.full_name || detail?.profile?.display_name || "Learner" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: userId }),
    err && /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive", children: err }),
    !detail ? /* @__PURE__ */ jsx("p", { className: "mt-6 text-sm text-muted-foreground", children: "Loading…" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("section", { className: "mt-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-foreground", children: "Course progress" }),
        detail.progress.length === 0 ? /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "No active courses." }) : /* @__PURE__ */ jsx("ul", { className: "mt-3 grid gap-3", children: detail.progress.map((p) => /* @__PURE__ */ jsxs("li", { className: "rounded-2xl border border-border bg-card p-4 shadow-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium text-foreground", children: p.course_title ?? p.course_slug }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
              Math.round((p.total_seconds_spent ?? 0) / 60),
              " min spent"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Progress, { value: p.progress_pct, className: "flex-1" }),
            /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium text-foreground", children: [
              p.progress_pct,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 text-xs text-muted-foreground", children: [
            "Started",
            " ",
            p.started_at ? new Date(p.started_at).toLocaleDateString() : "—",
            " · Last activity",
            " ",
            p.last_activity_at ? new Date(p.last_activity_at).toLocaleString() : "—",
            p.completed_at && /* @__PURE__ */ jsxs(Fragment, { children: [
              " ",
              "· Completed",
              " ",
              new Date(p.completed_at).toLocaleDateString()
            ] })
          ] })
        ] }, p.course_slug)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-10", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-foreground", children: "Certificates" }),
        detail.completions.length === 0 ? /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "No certificates issued." }) : /* @__PURE__ */ jsx("ul", { className: "mt-3 grid gap-2", children: detail.completions.map((c) => /* @__PURE__ */ jsxs("li", { className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium text-foreground", children: c.course_title }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
              c.certificate_uid,
              " · Issued",
              " ",
              new Date(c.completed_at).toLocaleDateString(),
              c.revoked_at && /* @__PURE__ */ jsx("span", { className: "ml-2 rounded bg-destructive/10 px-2 py-0.5 text-destructive", children: "Revoked" })
            ] })
          ] }),
          /* @__PURE__ */ jsx(Link, { to: "/verify/$uid", params: {
            uid: c.certificate_uid
          }, className: "text-primary hover:underline", children: "Verify" })
        ] }, c.certificate_uid)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-10", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-foreground", children: "Recent events" }),
        detail.events.length === 0 ? /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "No events recorded." }) : /* @__PURE__ */ jsx("ol", { className: "mt-3 space-y-1 text-xs", children: detail.events.map((e) => /* @__PURE__ */ jsxs("li", { className: "flex items-baseline gap-3 border-b border-border/60 pb-1", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground tabular-nums", children: new Date(e.created_at).toLocaleString() }),
          /* @__PURE__ */ jsx("span", { className: "rounded bg-muted px-1.5 py-0.5 font-mono text-foreground", children: e.event_type }),
          /* @__PURE__ */ jsx("span", { className: "text-foreground", children: e.course_slug })
        ] }, e.id)) })
      ] })
    ] })
  ] });
}
export {
  LearnerDetailPage as component
};
