import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { bz as Route, bA as adminReviewProviderClaim } from "./router-Bk6RtsuF.js";
import { A as AdminLayout } from "./admin-layout-DvQlFbdd.js";
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
import "./states-UIdvqlKs.js";
import "./site-origin-DK0yY0Ip.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
import "./client-Dh5RMKgP.js";
import "lucide-react";
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
import "./renter-drip.server-DkMf2kRj.js";
import "./emailit-DRsipvVx.js";
import "node:fs";
import "node:path";
import "./host-drip.server-Dv1yKbNa.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
function AdminClaimsPage() {
  const initial = Route.useLoaderData();
  const [claims, setClaims] = useState(initial.claims);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  async function act(id, action, apply_proposed = false) {
    setBusyId(id);
    setError("");
    try {
      await adminReviewProviderClaim({
        data: {
          id,
          action,
          apply_proposed
        }
      });
      if (action === "delete") {
        setClaims((cs) => cs.filter((c) => c.id !== id));
      } else {
        setClaims((cs) => cs.map((c) => c.id === id ? {
          ...c,
          status: action === "approve" ? "approved" : "rejected",
          reviewed_at: (/* @__PURE__ */ new Date()).toISOString()
        } : c));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }
  const pending = claims.filter((c) => c.status === "pending");
  const reviewed = claims.filter((c) => c.status !== "pending");
  return /* @__PURE__ */ jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsxs("header", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight text-foreground", children: "Listing Claims" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
          pending.length,
          " pending • ",
          reviewed.length,
          " reviewed"
        ] })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/admin/dashboard", className: "text-sm font-medium text-primary hover:underline", children: "← Back to dashboard" })
    ] }),
    error && /* @__PURE__ */ jsx("p", { className: "mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive", children: error }),
    /* @__PURE__ */ jsx(Section, { title: "Pending review", claims: pending, busyId, act }),
    /* @__PURE__ */ jsx(Section, { title: "Reviewed", claims: reviewed, busyId, act, compact: true })
  ] });
}
function Section({
  title,
  claims,
  busyId,
  act,
  compact = false
}) {
  if (claims.length === 0) return null;
  return /* @__PURE__ */ jsxs("section", { className: "mt-10", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-foreground", children: title }),
    /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-4", children: claims.map((c) => /* @__PURE__ */ jsxs("article", { className: `rounded-2xl border bg-card p-5 ${compact ? "border-border/50 opacity-80" : "border-border"}`, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("a", { href: `/p/pool-pros/${c.provider_slug}`, target: "_blank", rel: "noreferrer", className: "font-semibold text-foreground hover:text-primary", children: c.provider_slug }),
            /* @__PURE__ */ jsx(StatusBadge, { status: c.status })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
            "Claimer: ",
            /* @__PURE__ */ jsx("strong", { children: c.claimer_name }),
            " (",
            c.claimer_role || "—",
            ") · ",
            c.claimer_email,
            c.claimer_phone && ` · ${c.claimer_phone}`
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
            "Submitted ",
            new Date(c.created_at).toLocaleString()
          ] })
        ] }),
        !compact && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => act(c.id, "approve", true), disabled: busyId === c.id, className: "rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50", children: "Approve + apply edits" }),
          /* @__PURE__ */ jsx("button", { onClick: () => act(c.id, "approve", false), disabled: busyId === c.id, className: "rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold hover:bg-muted/50 disabled:opacity-50", children: "Approve only" }),
          /* @__PURE__ */ jsx("button", { onClick: () => act(c.id, "reject"), disabled: busyId === c.id, className: "rounded-full border border-destructive/40 px-4 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50", children: "Reject" }),
          /* @__PURE__ */ jsx("button", { onClick: () => act(c.id, "delete"), disabled: busyId === c.id, className: "rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50", children: "Delete" })
        ] })
      ] }),
      (c.business_email || c.business_phone || c.business_website) && /* @__PURE__ */ jsxs("p", { className: "mt-3 text-xs text-muted-foreground", children: [
        "Business contact: ",
        [c.business_email, c.business_phone, c.business_website].filter(Boolean).join(" · ")
      ] }),
      c.verification_notes && /* @__PURE__ */ jsxs("div", { className: "mt-3 rounded-lg bg-muted/50 p-3 text-sm text-foreground", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-muted-foreground", children: "Verification" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 whitespace-pre-line", children: c.verification_notes })
      ] }),
      c.proposed_updates && Object.keys(c.proposed_updates).length > 0 && /* @__PURE__ */ jsxs("details", { className: "mt-3", children: [
        /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer text-xs font-medium text-primary", children: [
          "Proposed updates (",
          Object.keys(c.proposed_updates).length,
          ")"
        ] }),
        /* @__PURE__ */ jsx("pre", { className: "mt-2 overflow-x-auto rounded-lg bg-muted/50 p-3 text-xs text-foreground", children: JSON.stringify(c.proposed_updates, null, 2) })
      ] })
    ] }, c.id)) })
  ] });
}
function StatusBadge({
  status
}) {
  const cls = status === "approved" ? "bg-emerald-100 text-emerald-800" : status === "rejected" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800";
  return /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${cls}`, children: status });
}
export {
  AdminClaimsPage as component
};
