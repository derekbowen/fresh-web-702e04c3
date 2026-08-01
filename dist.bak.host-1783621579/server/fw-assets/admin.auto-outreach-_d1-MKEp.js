import { jsx, jsxs } from "react/jsx-runtime";
import { A as AdminLayout } from "./admin-layout-CipWTHsV.js";
import { B as Button } from "./button-TjZkfKyC.js";
import "react";
import "@tanstack/react-router";
import "lucide-react";
import "./router-BskH5uAy.js";
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
import "@supabase/supabase-js";
import "./auth-middleware-C3cX-s7a.js";
import "./createMiddleware-BvN2ghIY.js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
import "./client-TSMcDHCK.js";
import "./transactional-email.server-BoL6nxoQ.js";
import "@react-email/components";
import "./_unsubscribe-footer-DXp0Y_3B.js";
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
const SplitErrorComponent = ({
  error,
  reset
}) => /* @__PURE__ */ jsx(AdminLayout, { children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto p-6 space-y-3", children: [
  /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Auto-outreach" }),
  /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: "Something went wrong loading this page." }),
  /* @__PURE__ */ jsx("pre", { className: "text-xs bg-muted p-3 rounded overflow-auto whitespace-pre-wrap", children: String(error?.message || error) }),
  /* @__PURE__ */ jsx(Button, { onClick: () => reset(), children: "Try again" })
] }) });
export {
  SplitErrorComponent as errorComponent
};
