import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { S as SiteHeader, e as SiteFooter } from "./router-HDJJ1Z-a.js";
import { s as submitPrivacyRequest } from "./privacy-requests.functions-ByXdv2ni.js";
import "@tanstack/react-router";
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
import "./auth-middleware-Bd-cw3tB.js";
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
import "./renter-drip.server-CRl7J1v1.js";
import "./emailit-DRsipvVx.js";
import "node:fs";
import "node:path";
import "./host-drip.server-DpHoRRhO.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const REQUEST_TYPES = [{
  value: "access",
  label: "Access — give me a copy of my data"
}, {
  value: "delete",
  label: "Delete — erase my data"
}, {
  value: "correct",
  label: "Correct — fix inaccurate data"
}, {
  value: "portability",
  label: "Portability — export in machine-readable format"
}, {
  value: "opt_out_sale_share",
  label: "Opt out of sale or sharing"
}, {
  value: "limit_sensitive",
  label: "Limit use of sensitive personal information"
}, {
  value: "appeal",
  label: "Appeal a previous decision"
}, {
  value: "other",
  label: "Other privacy question"
}];
const STATES = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"];
function PrivacyRequestPage() {
  const [requestType, setRequestType] = React.useState("access");
  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [stateCode, setStateCode] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [status, setStatus] = React.useState("idle");
  const [error, setError] = React.useState(null);
  const [gpc, setGpc] = React.useState(false);
  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      const res = await submitPrivacyRequest({
        data: {
          requestType,
          email: email.trim(),
          fullName: fullName.trim() || null,
          stateCode: stateCode || null,
          details: details.trim() || null,
          sourceUrl: typeof window !== "undefined" ? window.location.pathname + window.location.search : null
        }
      });
      setGpc(res.gpcDetected);
      setStatus("success");
      setEmail("");
      setFullName("");
      setStateCode("");
      setDetails("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col bg-background", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "Submit a privacy request" }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground", children: "We honor every US state privacy right, regardless of where you live. Global Privacy Control signals from your browser are detected automatically. We respond within 45 days (90 with notice for complex requests)." }),
      status === "success" ? /* @__PURE__ */ jsxs("div", { className: "mt-8 rounded-2xl border border-border bg-muted/30 p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground", children: "Got it." }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "We received your request. You will get a confirmation email at the address you provided, and a follow-up once we verify your identity." }),
        gpc && /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "We also detected a Global Privacy Control signal from your browser and have applied an opt-out of sale/sharing to your session." })
      ] }) : /* @__PURE__ */ jsxs("form", { onSubmit, className: "mt-8 space-y-5", children: [
        /* @__PURE__ */ jsxs("label", { className: "block", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground", children: "Request type" }),
          /* @__PURE__ */ jsx("select", { value: requestType, onChange: (e) => setRequestType(e.target.value), className: "mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground", required: true, children: REQUEST_TYPES.map((r) => /* @__PURE__ */ jsx("option", { value: r.value, children: r.label }, r.value)) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "block", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground", children: "Email" }),
          /* @__PURE__ */ jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground", required: true, maxLength: 255 })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "block", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground", children: "Full name (optional)" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: fullName, onChange: (e) => setFullName(e.target.value), className: "mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground", maxLength: 120 })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "block", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground", children: "State (optional)" }),
          /* @__PURE__ */ jsxs("select", { value: stateCode, onChange: (e) => setStateCode(e.target.value), className: "mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground", children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "— Select —" }),
            STATES.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: s }, s))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "block", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground", children: "Details (optional)" }),
          /* @__PURE__ */ jsx("textarea", { value: details, onChange: (e) => setDetails(e.target.value), rows: 4, maxLength: 4e3, className: "mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground" })
        ] }),
        error && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: error }),
        /* @__PURE__ */ jsx("button", { type: "submit", disabled: status === "submitting", className: "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50", children: status === "submitting" ? "Submitting…" : "Submit request" }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "By submitting, you agree we may contact you to verify your identity before fulfilling the request. See our",
          " ",
          /* @__PURE__ */ jsx("a", { href: "/p/privacy-policy", className: "underline", children: "privacy policy" }),
          " ",
          "for details."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  PrivacyRequestPage as component
};
