import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { s as supabase } from "./client-Dh5RMKgP.js";
import { b as getAdminIdentity } from "./admin-team.functions-cZJg65mA.js";
import { S as SiteHeader, e as SiteFooter } from "./router-BmsL3Cd5.js";
import { B as Button } from "./button-TjZkfKyC.js";
import "@supabase/supabase-js";
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
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
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
function NoAccessPage() {
  const [id, setId] = React.useState(null);
  const [err, setErr] = React.useState(null);
  React.useEffect(() => {
    void (async () => {
      try {
        const r = await getAdminIdentity();
        setId(r);
        if (r.isAdmin) {
          window.location.replace("/admin/dashboard");
        }
      } catch (e) {
        setErr(e?.message || "Failed to check access");
      }
    })();
  }, []);
  async function copy(v) {
    try {
      await navigator.clipboard.writeText(v);
    } catch {
    }
  }
  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth?redirect=%2Fadmin%2Fdashboard&mode=signin";
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsx("main", { className: "mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-12", children: /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Admin access required" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "You're signed in, but this account doesn't have admin access yet. Send the details below to an existing admin to be granted access." }),
      err && /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm", children: err }),
      id && /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-3 rounded-xl border border-border bg-background p-4 text-sm", children: [
        /* @__PURE__ */ jsx(Row, { label: "Signed in as", value: id.displayName || "—" }),
        /* @__PURE__ */ jsx(Row, { label: "Email", value: id.email || "—", onCopy: id.email ? () => copy(id.email) : void 0 }),
        /* @__PURE__ */ jsx(Row, { label: "User ID", value: id.userId || "—", mono: true, onCopy: id.userId ? () => copy(id.userId) : void 0 })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: signOut, children: "Sign in as a different account" }),
        /* @__PURE__ */ jsx(Link, { to: "/", className: "inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted", children: "Back to site" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function Row({
  label,
  value,
  mono,
  onCopy
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: label }),
      /* @__PURE__ */ jsx("div", { className: `mt-0.5 truncate ${mono ? "font-mono text-xs" : ""}`, children: value })
    ] }),
    onCopy && /* @__PURE__ */ jsx("button", { onClick: onCopy, className: "shrink-0 rounded border border-border bg-card px-2 py-1 text-xs font-medium hover:bg-muted", children: "Copy" })
  ] });
}
export {
  NoAccessPage as component
};
