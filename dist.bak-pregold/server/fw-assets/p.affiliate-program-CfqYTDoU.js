import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { S as SiteHeader, e as SiteFooter } from "./router-DV0zB2xT.js";
import { s as supabase } from "./client-TSMcDHCK.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { c as createServerFn } from "../server.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
import "./auth-middleware-Bd-cw3tB.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "./client.server-D5ro3rAQ.js";
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
import "./renter-drip.server-CKJB2seY.js";
import "node:fs";
import "node:path";
import "./host-drip.server-CJ5RKG29.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
const ApplySchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  audience: z.string().trim().max(1e3).optional().or(z.literal("")),
  promo_plan: z.string().trim().max(2e3).optional().or(z.literal(""))
});
const applyAsAffiliate = createServerFn({
  method: "POST"
}).inputValidator((d) => ApplySchema.parse(d)).handler(createSsrRpc("7703e29797da4d1ec9552c00bdd63705cbb7d8be411edbefae7a8417956aa515"));
function ApplyPage() {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const [sent, setSent] = React.useState(null);
  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    try {
      const res = await applyAsAffiliate({
        data: {
          full_name: String(fd.get("full_name") || ""),
          email,
          phone: String(fd.get("phone") || ""),
          audience: String(fd.get("audience") || ""),
          promo_plan: String(fd.get("promo_plan") || "")
        }
      });
      if (!res.ok) {
        setErr(res.error || "Something went wrong. Try again or email referrals@poolrentalnearme.com.");
        setBusy(false);
        return;
      }
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/p/affiliate-dashboard` : void 0;
      const {
        error: otpErr
      } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: false
        }
      });
      if (otpErr) {
        setErr("We saved your application but couldn't send the sign-in email. Try again in a minute or contact referrals@poolrentalnearme.com.");
        setBusy(false);
        return;
      }
      setSent({
        email,
        alreadyExists: !!res.alreadyExists
      });
      setBusy(false);
    } catch (e2) {
      setErr(e2?.message || "Submission failed.");
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col bg-background", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-2xl px-4 py-16", children: [
      /* @__PURE__ */ jsx(Link, { to: "/p/affiliate", className: "text-sm text-primary underline-offset-4 hover:underline", children: "← Back to the referral program" }),
      /* @__PURE__ */ jsx("h1", { className: "mt-4 text-3xl font-bold text-foreground sm:text-4xl", children: "Create your affiliate account" }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground", children: "Earn 5% of every booking, for the lifetime of every host you bring to Pool Rental Near Me. No password to remember — we email you a one-tap sign-in link." }),
      sent ? /* @__PURE__ */ jsxs("div", { className: "mt-8 rounded-2xl border border-border bg-card p-8 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl", children: "✉️" }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold text-foreground", children: "Check your email" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-3 text-muted-foreground", children: [
          "We sent a sign-in link to ",
          /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: sent.email }),
          ". Tap it from your phone or laptop and you'll land straight in your affiliate dashboard."
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm text-muted-foreground", children: sent.alreadyExists ? "Looks like you've applied before — that's fine, the link signs you in to your existing dashboard." : "Your application is in. Approval usually takes under 2 business days." }),
        /* @__PURE__ */ jsxs("p", { className: "mt-6 text-xs text-muted-foreground", children: [
          "Didn't get it? Check spam, or",
          " ",
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setSent(null), className: "text-primary underline-offset-4 hover:underline", children: "resend the link" }),
          "."
        ] })
      ] }) : /* @__PURE__ */ jsxs("form", { onSubmit, className: "mt-8 space-y-4 rounded-2xl border border-border bg-card p-6", children: [
        /* @__PURE__ */ jsx(Field, { label: "Full name", name: "full_name", required: true, maxLength: 120, autoComplete: "name" }),
        /* @__PURE__ */ jsx(Field, { label: "Email", name: "email", type: "email", required: true, maxLength: 255, autoComplete: "email" }),
        /* @__PURE__ */ jsx(Field, { label: "Phone (optional)", name: "phone", maxLength: 40, autoComplete: "tel" }),
        /* @__PURE__ */ jsx(TextArea, { label: "Who's your audience?", name: "audience", placeholder: "e.g. pool owners in San Diego county, friends in real estate, my YouTube channel", maxLength: 1e3 }),
        /* @__PURE__ */ jsx(TextArea, { label: "How will you promote it?", name: "promo_plan", placeholder: "e.g. door hangers in HOA, IG reels, partner with pool service companies", maxLength: 2e3 }),
        err && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: err }),
        /* @__PURE__ */ jsx("button", { type: "submit", disabled: busy, className: "inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:opacity-60", children: busy ? "Sending your sign-in link..." : "Apply & email me a sign-in link" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "By submitting you agree to receive program updates by email. Unsubscribe anytime." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function Field({
  label,
  name,
  type = "text",
  required,
  maxLength,
  minLength,
  autoComplete,
  hint
}) {
  return /* @__PURE__ */ jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground", children: label }),
    /* @__PURE__ */ jsx("input", { name, type, required, maxLength, minLength, autoComplete, className: "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" }),
    hint && /* @__PURE__ */ jsx("span", { className: "mt-1 block text-xs text-muted-foreground", children: hint })
  ] });
}
function TextArea({
  label,
  name,
  placeholder,
  maxLength
}) {
  return /* @__PURE__ */ jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground", children: label }),
    /* @__PURE__ */ jsx("textarea", { name, rows: 3, placeholder, maxLength, className: "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" })
  ] });
}
export {
  ApplyPage as component
};
