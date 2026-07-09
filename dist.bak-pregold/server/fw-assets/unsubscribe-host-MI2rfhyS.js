import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { useState } from "react";
import { a as Route } from "./router-DV0zB2xT.js";
import { c as createServerFn } from "../server.js";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
import "@tanstack/react-router";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
import "./auth-middleware-Bd-cw3tB.js";
import "./createMiddleware-BvN2ghIY.js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
import "./client-TSMcDHCK.js";
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
const unsubscribeHost = createServerFn({
  method: "POST"
}).inputValidator((d) => z.object({
  token: z.string().min(8).max(128)
}).parse(d)).handler(createSsrRpc("a41359f47a55a453303790c2acaded78dc2455792165ce029a3ba74e5c33de59"));
function Page() {
  const {
    token
  } = Route.useSearch();
  const [state, setState] = useState("idle");
  const [msg, setMsg] = useState("");
  async function confirm() {
    setState("loading");
    try {
      const r = await unsubscribeHost({
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
      setMsg("Something went wrong. Try again.");
      setState("error");
    }
  }
  return /* @__PURE__ */ jsxs("main", { style: {
    maxWidth: 480,
    margin: "80px auto",
    padding: 24,
    fontFamily: "system-ui, sans-serif"
  }, children: [
    /* @__PURE__ */ jsx("h1", { style: {
      fontSize: 24,
      fontWeight: 700,
      marginBottom: 12
    }, children: "Unsubscribe" }),
    !token ? /* @__PURE__ */ jsx("p", { children: "Missing unsubscribe token." }) : state === "done" || state === "error" ? /* @__PURE__ */ jsx("p", { children: msg }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("p", { style: {
        color: "#475569",
        marginBottom: 24
      }, children: "Stop receiving host update emails from Pool Rental Near Me?" }),
      /* @__PURE__ */ jsx("button", { onClick: confirm, disabled: state === "loading", style: {
        background: "#0c8a5e",
        color: "#fff",
        padding: "10px 18px",
        borderRadius: 8,
        border: 0,
        fontWeight: 600,
        cursor: "pointer"
      }, children: state === "loading" ? "Unsubscribing…" : "Yes, unsubscribe me" })
    ] })
  ] });
}
export {
  Page as component
};
