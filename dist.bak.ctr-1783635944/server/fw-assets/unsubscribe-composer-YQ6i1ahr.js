import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { useState } from "react";
import { b as Route } from "./router-BEu57YoG.js";
import { c as createServerFn } from "../server.js";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
import "@tanstack/react-router";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
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
import "./renter-drip.server-DJqUcyMM.js";
import "node:fs";
import "node:path";
import "./host-drip.server-BfIDzqiI.js";
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
const unsubscribeComposer = createServerFn({
  method: "POST"
}).inputValidator((d) => z.object({
  token: z.string().min(8).max(512)
}).parse(d)).handler(createSsrRpc("fb8c0612cbfc1cf047b1536b4331437017d1a14ee5f681e1af97162f21ea9ee7"));
function Page() {
  const {
    token
  } = Route.useSearch();
  const [state, setState] = useState("idle");
  const [msg, setMsg] = useState("");
  async function confirm() {
    setState("loading");
    try {
      const r = await unsubscribeComposer({
        data: {
          token
        }
      });
      if (r.ok) {
        setMsg(r.already ? `${r.email} is already unsubscribed.` : `Unsubscribed ${r.email}.`);
        setState("done");
      } else {
        setMsg("That unsubscribe link is invalid or expired.");
        setState("error");
      }
    } catch {
      setMsg("Something went wrong. Please try again.");
      setState("error");
    }
  }
  return /* @__PURE__ */ jsxs("main", { className: "mx-auto max-w-md p-8", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold mb-3", children: "Unsubscribe" }),
    state === "idle" && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("p", { className: "text-slate-600 mb-4", children: "Click to unsubscribe from Pool Rental Near Me emails." }),
      /* @__PURE__ */ jsx("button", { onClick: confirm, className: "px-4 py-2 rounded bg-sky-600 text-white", children: "Confirm unsubscribe" })
    ] }),
    state === "loading" && /* @__PURE__ */ jsx("p", { children: "Working…" }),
    (state === "done" || state === "error") && /* @__PURE__ */ jsx("p", { className: state === "error" ? "text-red-600" : "text-emerald-700", children: msg })
  ] });
}
export {
  Page as component
};
