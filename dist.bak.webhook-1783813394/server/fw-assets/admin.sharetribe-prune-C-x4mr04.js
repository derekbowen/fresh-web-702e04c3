import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { A as AdminLayout } from "./admin-layout-DJ-CGcVb.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import "@tanstack/react-router";
import "lucide-react";
import "./router-BmsL3Cd5.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
import "./client-Dh5RMKgP.js";
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
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
const previewSharetribePrune = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("0247f74e677fb3a8b3da9eaf70efdf262b47841de6ed97c23286ec41ac700f11"));
const executeSharetribePrune = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  confirm: z.literal("DELETE")
}).parse(d)).handler(createSsrRpc("558751776f24a095b0bbfad1dd5f86a27f253fc34f6dd6b1530c4aacc781993f"));
function SharetribePrunePage() {
  const [preview, setPreview] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState(null);
  async function runPreview() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await previewSharetribePrune();
      setPreview(r);
    } catch (e) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }
  async function runDelete() {
    if (!preview) return;
    if (!confirm(`Delete ${preview.pages.toDelete} "Become a host" pages? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      const r = await executeSharetribePrune({
        data: {
          confirm: "DELETE"
        }
      });
      setResult(`Deleted ${r.deleted} pages. Kept ${r.kept}. (${r.keysFound} Sharetribe city keys)`);
      setPreview(null);
    } catch (e) {
      setError(e?.message ?? String(e));
    } finally {
      setDeleting(false);
    }
  }
  return /* @__PURE__ */ jsx(AdminLayout, { children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl space-y-6 p-6", children: [
    /* @__PURE__ */ jsxs("header", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Prune Become-a-Host pages" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-muted-foreground", children: [
        "Pulls every listing from Sharetribe (live, all states), derives unique ",
        /* @__PURE__ */ jsx("code", { children: "city-state" }),
        ' keys, then shows which "Become a host" pages would be kept vs. deleted. Nothing changes until you click Delete.'
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsx("button", { type: "button", onClick: runPreview, disabled: loading, className: "rounded bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50", children: loading ? "Loading from Sharetribe…" : "Run preview" }),
      preview && preview.pages.toDelete > 0 && /* @__PURE__ */ jsx("button", { type: "button", onClick: runDelete, disabled: deleting, className: "rounded bg-destructive px-4 py-2 font-medium text-destructive-foreground disabled:opacity-50", children: deleting ? "Deleting…" : `Delete ${preview.pages.toDelete} pages` })
    ] }),
    error && /* @__PURE__ */ jsx("div", { className: "rounded border border-destructive bg-destructive/10 p-3 text-sm text-destructive", children: error }),
    result && /* @__PURE__ */ jsx("div", { className: "rounded border border-green-600 bg-green-50 p-3 text-sm text-green-900", children: result }),
    preview && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("section", { className: "rounded border p-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Sharetribe" }),
        /* @__PURE__ */ jsxs("ul", { className: "mt-2 text-sm", children: [
          /* @__PURE__ */ jsxs("li", { children: [
            "Listings scanned: ",
            preview.sharetribe.totalListings
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "Pages scanned: ",
            preview.sharetribe.pagesScanned
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "Unique city keys: ",
            preview.sharetribe.uniqueCityKeys
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "Listings without city/state:",
            " ",
            preview.sharetribe.skippedNoCity
          ] })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mt-2 text-xs text-muted-foreground", children: [
          "Sample keys:",
          " ",
          preview.sharetribe.sampleKeys.join(", ") || "(none)"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "rounded border p-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Content pages (host-acquisition)" }),
        /* @__PURE__ */ jsxs("ul", { className: "mt-2 text-sm", children: [
          /* @__PURE__ */ jsxs("li", { children: [
            "Total: ",
            preview.pages.total
          ] }),
          /* @__PURE__ */ jsxs("li", { className: "text-green-700", children: [
            "Keep: ",
            preview.pages.keep
          ] }),
          /* @__PURE__ */ jsxs("li", { className: "text-red-700", children: [
            "Delete: ",
            preview.pages.toDelete
          ] }),
          /* @__PURE__ */ jsxs("li", { className: "text-muted-foreground", children: [
            "Of which slug couldn't be parsed:",
            " ",
            preview.pages.unmatchedSlug
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 grid grid-cols-1 gap-4 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-green-700", children: "Keep samples" }),
            /* @__PURE__ */ jsxs("ul", { className: "mt-1 text-xs", children: [
              preview.pages.keepSamples.map((s) => /* @__PURE__ */ jsx("li", { children: s }, s)),
              preview.pages.keepSamples.length === 0 && /* @__PURE__ */ jsx("li", { children: "(none)" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-red-700", children: "Delete samples" }),
            /* @__PURE__ */ jsx("ul", { className: "mt-1 text-xs", children: preview.pages.deleteSamples.map((s) => /* @__PURE__ */ jsx("li", { children: s }, s)) })
          ] })
        ] })
      ] })
    ] })
  ] }) });
}
export {
  SharetribePrunePage as component
};
