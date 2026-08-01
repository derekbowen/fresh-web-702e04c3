import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { b5 as adminGetCourseSummary, b6 as adminListLearners } from "./router-CKC3KRbd.js";
import { A as AdminLayout } from "./admin-layout-CDM94Hwn.js";
import { P as Progress } from "./progress-BRG1z6ZI.js";
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
import "./auth-middleware-Bd-cw3tB.js";
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
import "./renter-drip.server-BojrhpHE.js";
import "node:fs";
import "node:path";
import "./host-drip.server-BKqTDlWn.js";
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
function AdminLearningPage() {
  const [summary, setSummary] = useState(null);
  const [learners, setLearners] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    void Promise.all([adminGetCourseSummary({
      data: void 0
    }), adminListLearners({
      data: void 0
    })]).then(([s, l]) => {
      setSummary(s.rows);
      setLearners(l.rows);
    }).catch((e) => setErr(e instanceof Error ? e.message : String(e)));
  }, []);
  const totalEnroll = (summary ?? []).reduce((a, r) => a + r.enrollments, 0);
  const totalComplete = (summary ?? []).reduce((a, r) => a + r.completions, 0);
  const completionRate = totalEnroll > 0 ? Math.round(totalComplete / totalEnroll * 100) : 0;
  return /* @__PURE__ */ jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Learning admin" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Aggregate course progress and per-learner activity." }),
    err && /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive", children: err }),
    /* @__PURE__ */ jsxs("section", { className: "mt-8 grid gap-4 sm:grid-cols-3", children: [
      /* @__PURE__ */ jsx(Stat, { label: "Enrollments", value: totalEnroll }),
      /* @__PURE__ */ jsx(Stat, { label: "Completions", value: totalComplete }),
      /* @__PURE__ */ jsx(Stat, { label: "Completion rate", value: `${completionRate}%` })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "mt-10", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-foreground", children: "By course" }),
      !summary ? /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Loading…" }) : summary.length === 0 ? /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "No course activity yet." }) : /* @__PURE__ */ jsx("div", { className: "mt-3 overflow-x-auto rounded-2xl border border-border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2", children: "Course" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2", children: "Enrolled" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2", children: "Completed" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2", children: "Avg progress" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: summary.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-2 font-medium text-foreground", children: [
            r.course_title ?? r.course_slug,
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: r.course_slug })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-foreground", children: r.enrollments }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-foreground", children: r.completions }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Progress, { value: r.avg_progress_pct, className: "w-32" }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-foreground", children: [
              r.avg_progress_pct,
              "%"
            ] })
          ] }) })
        ] }, r.course_slug)) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "mt-10", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-foreground", children: "Learners" }),
      !learners ? /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Loading…" }) : learners.length === 0 ? /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "No learners yet." }) : /* @__PURE__ */ jsx("div", { className: "mt-3 overflow-x-auto rounded-2xl border border-border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2", children: "Learner" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2", children: "Enrolled" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2", children: "Completed" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2", children: "Last activity" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: learners.map((l) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-2 font-medium text-foreground", children: [
            l.full_name || l.display_name || "Unnamed",
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
              l.user_id.slice(0, 8),
              "…"
            ] })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-foreground", children: l.enrollments }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-foreground", children: l.completions }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-muted-foreground", children: l.last_activity_at ? new Date(l.last_activity_at).toLocaleString() : "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-right", children: /* @__PURE__ */ jsx(Link, { to: "/admin/learning/$userId", params: {
            userId: l.user_id
          }, className: "text-primary hover:underline", children: "View" }) })
        ] }, l.user_id)) })
      ] }) })
    ] })
  ] });
}
function Stat({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-4 shadow-sm", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "mt-1 text-2xl font-bold text-foreground", children: value })
  ] });
}
export {
  AdminLearningPage as component
};
