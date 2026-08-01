import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import { A as AdminLayout } from "./admin-layout-Ck0iqDJo.js";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "lucide-react";
import "./router-BTf4C8qB.js";
import "@tanstack/react-query";
import "./site-footer-defaults-asWdr-hi.js";
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
import "./renter-drip.server-C0Ma8t5O.js";
import "node:fs";
import "node:path";
import "./host-drip.server-DDQBE_qt.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const InputSchema = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(500).optional().default(""),
  topic: z.string().trim().min(10).max(2e3),
  model: z.string().default("openai/gpt-5"),
  slug: z.string().trim().max(120).optional()
});
const createQuickPage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => InputSchema.parse(data)).handler(createSsrRpc("6e24de7ef6d339e17bf95efce33b48a08578b3996719284c47681b6dc45414ca"));
function AdminQuickPage() {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [model, setModel] = React.useState("openai/gpt-5");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const res = await createQuickPage({
        data: {
          title,
          description,
          topic,
          model
        }
      });
      setResult({
        page: res.page,
        words: res.words
      });
      setTitle("");
      setDescription("");
      setTopic("");
    } catch (err) {
      setError(err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };
  const canSubmit = title.trim().length >= 3 && topic.trim().length >= 10 && !busy;
  return /* @__PURE__ */ jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Quick Page Builder" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-muted-foreground", children: [
          "Type a title and what the page should be about. We'll write it on-brand and publish it at ",
          /* @__PURE__ */ jsxs("code", { children: [
            "/p/",
            `{slug}`
          ] }),
          " instantly."
        ] })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/admin/dashboard", className: "shrink-0 text-sm text-muted-foreground hover:underline", children: "← Dashboard" })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "mt-8 space-y-5 rounded-2xl border border-border bg-card p-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium", children: [
          "Title ",
          /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
        ] }),
        /* @__PURE__ */ jsx("input", { type: "text", value: title, onChange: (e) => setTitle(e.target.value), placeholder: "e.g. The host's guide to weekend pricing", className: "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm", maxLength: 140, required: true }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "The H1 and basis for the URL slug." })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium", children: [
          "Short description ",
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "(optional)" })
        ] }),
        /* @__PURE__ */ jsx("input", { type: "text", value: description, onChange: (e) => setDescription(e.target.value), placeholder: "One line — what's the gist?", className: "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm", maxLength: 500 })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium", children: [
          "What should this page be about? ",
          /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
        ] }),
        /* @__PURE__ */ jsx("textarea", { value: topic, onChange: (e) => setTopic(e.target.value), placeholder: "Tell us the angle, audience, and any specifics to cover. We'll handle SEO, structure, and PRNM brand voice automatically.", className: "mt-1 min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm", maxLength: 2e3, required: true }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
          topic.length,
          "/2000 characters. The more specific, the better."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium", children: "Model" }),
        /* @__PURE__ */ jsxs("select", { value: model, onChange: (e) => setModel(e.target.value), className: "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm", children: [
          /* @__PURE__ */ jsx("option", { value: "openai/gpt-5", children: "GPT-5 (best quality)" }),
          /* @__PURE__ */ jsx("option", { value: "openai/gpt-5-mini", children: "GPT-5 mini (faster)" }),
          /* @__PURE__ */ jsx("option", { value: "google/gemini-2.5-pro", children: "Gemini 2.5 Pro" }),
          /* @__PURE__ */ jsx("option", { value: "google/gemini-3-flash-preview", children: "Gemini 2.5 Flash (fastest)" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "submit", disabled: !canSubmit, className: "w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: busy ? "Writing & publishing…" : "Generate & publish page" })
    ] }),
    error && /* @__PURE__ */ jsx("div", { className: "mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive", children: error }),
    result && /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-2xl border border-green-500/40 bg-green-500/10 p-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-sm font-semibold", children: [
        "✓ Published — ",
        result.words.toLocaleString(),
        " words"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-1 font-mono text-xs", children: result.page.url_path }),
      /* @__PURE__ */ jsx("a", { href: result.page.url_path, target: "_blank", rel: "noreferrer", className: "mt-3 inline-block rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted", children: "View page →" })
    ] })
  ] });
}
export {
  AdminQuickPage as component
};
