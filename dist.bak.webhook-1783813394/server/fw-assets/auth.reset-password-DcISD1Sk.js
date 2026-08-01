import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { s as supabase } from "./client-Dh5RMKgP.js";
import { S as SiteHeader, e as SiteFooter } from "./router-BmsL3Cd5.js";
import { B as Button } from "./button-TjZkfKyC.js";
import { I as Input } from "./input-C0QjszdI.js";
import { L as Label } from "./label-JU3yqRBo.js";
import { toast } from "sonner";
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
import "./renter-drip.server-Bp6Mhaag.js";
import "node:fs";
import "node:path";
import "./host-drip.server-Js7RHpjT.js";
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
import "@radix-ui/react-label";
function ResetPasswordPage() {
  const navigate = useNavigate();
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const url = new URL(window.location.href);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (url.searchParams.get("type") === "recovery" || hash.get("type") === "recovery") {
      setHasRecoverySession(true);
      return;
    }
    void supabase.auth.getSession().then(({
      data
    }) => {
      if (data.session) setHasRecoverySession(true);
    });
  }, []);
  async function sendResetEmail(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const {
        error
      } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      if (error) toast.error(error.message);
      else toast.success("Check your email for a reset link.");
    } finally {
      setBusy(false);
    }
  }
  async function setPassword(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const {
        error
      } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password updated.");
      navigate({
        to: "/account/learning"
      });
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsx("main", { className: "mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6", children: /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: hasRecoverySession ? "Set a new password" : "Reset your password" }),
      hasRecoverySession ? /* @__PURE__ */ jsxs("form", { onSubmit: setPassword, className: "mt-6 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "newPassword", children: "New password" }),
          /* @__PURE__ */ jsx(Input, { id: "newPassword", type: "password", autoComplete: "new-password", minLength: 8, value: newPassword, onChange: (e) => setNewPassword(e.target.value), required: true })
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: busy, className: "w-full", children: busy ? "Saving…" : "Update password" })
      ] }) : /* @__PURE__ */ jsxs("form", { onSubmit: sendResetEmail, className: "mt-6 space-y-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Enter the email associated with your account and we'll send a reset link." }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email" }),
          /* @__PURE__ */ jsx(Input, { id: "email", type: "email", autoComplete: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true })
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: busy, className: "w-full", children: busy ? "Sending…" : "Send reset link" }),
        /* @__PURE__ */ jsx("p", { className: "text-center text-sm text-muted-foreground", children: /* @__PURE__ */ jsx(Link, { to: "/auth", search: {
          redirect: "/account/learning",
          mode: "signin"
        }, className: "hover:text-primary", children: "Back to sign in" }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  ResetPasswordPage as component
};
