import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { a$ as Route, b0 as adminReviewPlanRequest } from "./router-BPpbotmS.js";
import { A as AdminLayout } from "./admin-layout-Ql_EyRxP.js";
import "@tanstack/react-query";
import "./site-footer-defaults-Brwu0BKb.js";
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
import "./renter-drip.server-CFIkIdnw.js";
import "node:fs";
import "node:path";
import "./host-drip.server-BAToYGOj.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
function fmt(d) {
  return d ? new Date(d).toLocaleString() : "—";
}
function AdminPlanRequestsPage() {
  const initial = Route.useLoaderData();
  const [requests, setRequests] = useState(initial.requests);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState({});
  async function act(id, action) {
    setBusy(id);
    setError("");
    try {
      await adminReviewPlanRequest({
        data: {
          id,
          action,
          admin_notes: notes[id]
        }
      });
      if (action === "delete") {
        setRequests((rs) => rs.filter((r) => r.id !== id));
      } else {
        setRequests((rs) => rs.map((r) => r.id === id ? {
          ...r,
          status: action === "approve" ? "approved" : "rejected",
          reviewed_at: (/* @__PURE__ */ new Date()).toISOString(),
          admin_notes: notes[id] ?? r.admin_notes
        } : r));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }
  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");
  return /* @__PURE__ */ jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsx("div", { className: "mb-6 flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Link, { to: "/admin/dashboard", className: "text-sm text-primary underline", children: "← Admin" }),
      /* @__PURE__ */ jsx("h1", { className: "mt-2 text-3xl font-bold", children: "Plan & payment requests" })
    ] }) }),
    error && /* @__PURE__ */ jsx("div", { className: "mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-900", children: error }),
    /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold", children: [
      "Pending (",
      pending.length,
      ")"
    ] }),
    /* @__PURE__ */ jsxs("ul", { className: "mt-3 space-y-3", children: [
      pending.length === 0 && /* @__PURE__ */ jsx("li", { className: "text-sm text-muted-foreground", children: "Nothing pending." }),
      pending.map((r) => /* @__PURE__ */ jsxs("li", { className: "rounded-2xl border bg-card p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsx("a", { href: `/providers/${r.provider_slug}`, className: "font-semibold text-primary underline", children: r.provider_slug }),
          /* @__PURE__ */ jsx("span", { className: "rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 capitalize", children: r.requested_plan }),
          /* @__PURE__ */ jsxs("span", { className: "text-sm", children: [
            "$",
            r.amount_usd ?? "—"
          ] }),
          /* @__PURE__ */ jsx("span", { className: "ml-auto text-xs text-muted-foreground", children: fmt(r.created_at) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 grid gap-1 text-sm sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Requester:" }),
            " ",
            r.requester_name,
            " <",
            r.requester_email,
            ">",
            r.requester_phone ? ` · ${r.requester_phone}` : ""
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Payment:" }),
            " ",
            r.payment_method || "—",
            " · ",
            r.payment_reference || "no reference"
          ] }),
          r.notes && /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
            /* @__PURE__ */ jsx("strong", { children: "Notes:" }),
            " ",
            r.notes
          ] })
        ] }),
        /* @__PURE__ */ jsx("textarea", { placeholder: "Admin notes (optional)", value: notes[r.id] ?? "", onChange: (e) => setNotes({
          ...notes,
          [r.id]: e.target.value
        }), rows: 2, className: "mt-3 w-full rounded-lg border px-3 py-2 text-sm" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx("button", { disabled: busy === r.id, onClick: () => act(r.id, "approve"), className: "rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50", children: "Approve & apply plan" }),
          /* @__PURE__ */ jsx("button", { disabled: busy === r.id, onClick: () => act(r.id, "reject"), className: "rounded-full border px-4 py-1.5 text-sm font-semibold disabled:opacity-50", children: "Reject" }),
          /* @__PURE__ */ jsx("button", { disabled: busy === r.id, onClick: () => act(r.id, "delete"), className: "ml-auto rounded-full px-4 py-1.5 text-sm font-semibold text-rose-700 disabled:opacity-50", children: "Delete" })
        ] })
      ] }, r.id))
    ] }),
    /* @__PURE__ */ jsxs("h2", { className: "mt-10 text-lg font-semibold", children: [
      "Reviewed (",
      reviewed.length,
      ")"
    ] }),
    /* @__PURE__ */ jsx("ul", { className: "mt-3 space-y-2", children: reviewed.map((r) => /* @__PURE__ */ jsxs("li", { className: "flex flex-wrap items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm", children: [
      /* @__PURE__ */ jsx("a", { href: `/providers/${r.provider_slug}`, className: "font-semibold text-primary underline", children: r.provider_slug }),
      /* @__PURE__ */ jsx("span", { className: "capitalize", children: r.requested_plan }),
      /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-semibold ${r.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`, children: r.status }),
      /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
        "$",
        r.amount_usd ?? "—"
      ] }),
      /* @__PURE__ */ jsx("span", { className: "ml-auto text-xs text-muted-foreground", children: fmt(r.reviewed_at) }),
      /* @__PURE__ */ jsx("button", { onClick: () => act(r.id, "delete"), className: "text-xs text-rose-700 underline", children: "delete" })
    ] }, r.id)) })
  ] });
}
export {
  AdminPlanRequestsPage as component
};
