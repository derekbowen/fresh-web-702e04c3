import { jsxs, jsx } from "react/jsx-runtime";
import { d as Route, S as SiteHeader, e as SiteFooter, r as resolveRedirect } from "./router-Bk6RtsuF.js";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { s as supabase } from "./client-Dh5RMKgP.js";
import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { c as createServerFn } from "../server.js";
import { B as Button } from "./button-TjZkfKyC.js";
import { I as Input } from "./input-C0QjszdI.js";
import { L as Label } from "./label-JU3yqRBo.js";
import { toast } from "sonner";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
import "./auth-middleware-C3cX-s7a.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "./client.server-D5ro3rAQ.js";
import "./states-UIdvqlKs.js";
import "./site-origin-DK0yY0Ip.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
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
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-label";
const lovableAuth = createLovableAuth();
const lovable = {
  auth: {
    signInWithOAuth: async (provider, opts) => {
      const result = await lovableAuth.signInWithOAuth(provider, {
        redirect_uri: opts?.redirect_uri,
        extraParams: {
          ...opts?.extraParams
        }
      });
      if (result.redirected) {
        return result;
      }
      if (result.error) {
        return result;
      }
      try {
        await supabase.auth.setSession(result.tokens);
      } catch (e) {
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
      return result;
    }
  }
};
const pinSignIn = createServerFn({
  method: "POST"
}).inputValidator((data) => z.object({
  pin: z.string().min(1).max(64)
}).parse(data)).handler(createSsrRpc("cddd0c30d68208abf4508c3c28044886f86f26543e0e3d3208423f3cb39b1bdd"));
function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState(search.mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setMode(search.mode), [search.mode]);
  useEffect(() => {
    let active = true;
    const go = async () => {
      const dest = await resolveRedirect(search.redirect);
      if (active) navigate({
        to: dest
      });
    };
    void supabase.auth.getUser().then(async ({
      data: data2
    }) => {
      if (!active) return;
      if (data2.user) {
        void go();
        return;
      }
      const {
        data: s
      } = await supabase.auth.getSession();
      if (s.session) {
        try {
          await supabase.auth.signOut();
        } catch {
        }
      }
    });
    const {
      data
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) void go();
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [navigate, search.redirect]);
  async function handleEmail(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (pin.trim()) {
        const res = await pinSignIn({
          data: {
            pin: pin.trim()
          }
        });
        if (res.ok) {
          const {
            error: otpErr
          } = await supabase.auth.verifyOtp({
            email: res.email,
            token: res.hashed_token,
            type: "magiclink"
          });
          if (otpErr) {
            toast.error("Sign-in failed. Try again.");
            return;
          }
          toast.success("Signed in.");
          navigate({
            to: "/admin/dashboard"
          });
          return;
        }
      }
      if (mode === "signup") {
        if (!fullName.trim()) {
          toast.error("Please enter your full name (used on your certificate).");
          return;
        }
        const {
          error
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${search.redirect}`,
            data: {
              full_name: fullName.trim(),
              display_name: fullName.trim()
            }
          }
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Check your email to confirm your account.");
      } else {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Signed in.");
        const dest = await resolveRedirect(search.redirect);
        navigate({
          to: dest
        });
      }
    } finally {
      setBusy(false);
    }
  }
  async function handleGoogle() {
    if (busy) return;
    setBusy(true);
    try {
      const callbackUrl = new URL("/auth", window.location.origin);
      callbackUrl.searchParams.set("redirect", search.redirect);
      callbackUrl.searchParams.set("mode", "signin");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: callbackUrl.toString()
      });
      if ("error" in result && result.error) {
        toast.error(result.error.message ?? "Google sign-in failed.");
        return;
      }
      if (!result.redirected) {
        toast.success("Signed in.");
        const dest = await resolveRedirect(search.redirect);
        navigate({
          to: dest
        });
      }
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsx("main", { className: "mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6", children: /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex gap-2", children: [
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setMode("signin"), className: `flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${mode === "signin" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`, children: "Sign in" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setMode("signup"), className: `flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${mode === "signup" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`, children: "Create account" })
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: mode === "signup" ? "Start learning" : "Welcome back" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: mode === "signup" ? "Track your progress and earn verifiable certificates." : "Pick up where you left off." }),
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: handleGoogle, disabled: busy, className: "mt-6 w-full", children: "Continue with Google" }),
      /* @__PURE__ */ jsxs("div", { className: "my-5 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-border" }),
        /* @__PURE__ */ jsx("span", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "or" }),
        /* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-border" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleEmail, className: "space-y-4", children: [
        mode === "signup" && /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "fullName", children: "Full name" }),
          /* @__PURE__ */ jsx(Input, { id: "fullName", type: "text", autoComplete: "name", value: fullName, onChange: (e) => setFullName(e.target.value), placeholder: "Jane Smith", required: true }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "This is the name printed on your certificate." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email" }),
          /* @__PURE__ */ jsx(Input, { id: "email", type: "email", autoComplete: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@example.com" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "pin", children: "PIN" }),
          /* @__PURE__ */ jsx(Input, { id: "pin", type: "text", inputMode: "numeric", autoComplete: "one-time-code", value: pin, onChange: (e) => setPin(e.target.value), placeholder: "••••••" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: "Password" }),
            mode === "signin" && /* @__PURE__ */ jsx(Link, { to: "/auth/reset-password", search: (prev) => prev, className: "text-xs text-muted-foreground hover:text-primary", children: "Forgot?" })
          ] }),
          /* @__PURE__ */ jsx(Input, { id: "password", type: "password", autoComplete: mode === "signup" ? "new-password" : "current-password", value: password, onChange: (e) => setPassword(e.target.value), minLength: mode === "signup" ? 8 : void 0 })
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: busy, className: "w-full", children: busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  AuthPage as component
};
