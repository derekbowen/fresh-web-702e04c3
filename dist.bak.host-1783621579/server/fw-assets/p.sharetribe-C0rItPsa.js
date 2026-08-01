import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { s as supabase } from "./client-TSMcDHCK.js";
import { u as checkAdminRole, S as SiteHeader, e as SiteFooter } from "./router-BskH5uAy.js";
import { B as Button } from "./button-TjZkfKyC.js";
import "@supabase/supabase-js";
import "@tanstack/react-query";
import "./site-footer-defaults-C6_J6kuR.js";
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
import "./renter-drip.server-BUH95fZo.js";
import "node:fs";
import "node:path";
import "./host-drip.server-MvSzhhAo.js";
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
function SharetribeLoginGate() {
  const [status, setStatus] = React.useState("checking");
  const [email, setEmail] = React.useState(null);
  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const {
        data
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!data.user) {
        setStatus("signed_out");
        return;
      }
      setEmail(data.user.email ?? null);
      try {
        const r = await checkAdminRole();
        if (cancelled) return;
        if (r.isAdmin) {
          window.location.replace("/admin/sharetribe");
        } else {
          setStatus("no_access");
        }
      } catch {
        if (!cancelled) setStatus("no_access");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  async function signOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsx("main", { className: "mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-12", children: /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Marketplace dashboard" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Sign in to view the Sharetribe marketplace dashboard for poolrentalnearme.com." }),
      status === "checking" && /* @__PURE__ */ jsx("p", { className: "mt-6 text-sm text-muted-foreground", children: "Checking your access…" }),
      status === "signed_out" && /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-3", children: [
        /* @__PURE__ */ jsx(Link, { to: "/auth", search: {
          redirect: "/admin/sharetribe",
          mode: "signin"
        }, className: "inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90", children: "Sign in to continue" }),
        /* @__PURE__ */ jsx(Link, { to: "/auth", search: {
          redirect: "/admin/sharetribe",
          mode: "signup"
        }, className: "inline-flex w-full items-center justify-center rounded-md border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-muted", children: "Create an account" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "After creating an account, ask an existing admin to grant you access." })
      ] }),
      status === "no_access" && /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm", children: [
          "You're signed in as ",
          /* @__PURE__ */ jsx("span", { className: "font-mono", children: email }),
          ", but this account doesn't have access to the marketplace dashboard yet. Send your email to an existing admin to be granted access."
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: signOut, children: "Sign in as a different account" }),
          /* @__PURE__ */ jsx(Link, { to: "/", className: "inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted", children: "Back to site" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  SharetribeLoginGate as component
};
