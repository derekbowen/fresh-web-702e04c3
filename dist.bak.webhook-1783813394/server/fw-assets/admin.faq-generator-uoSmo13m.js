import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { useMutation } from "@tanstack/react-query";
import { A as AdminLayout } from "./admin-layout-DJ-CGcVb.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import "@tanstack/react-router";
import "lucide-react";
import "./router-BmsL3Cd5.js";
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
const previewFaqForUrl = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  url_path: z.string().min(1),
  count: z.number().int().min(3).max(10).default(6)
}).parse(d)).handler(createSsrRpc("efcac919d928c60fe8b8637f3b7f54ba8e59199ff6817a9ea662c1ca5bb22df1"));
const insertFaqIntoPage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  url_path: z.string().min(1),
  faqs: z.array(z.object({
    question: z.string().min(1),
    answer: z.string().min(1)
  })).min(1).max(15),
  replace_existing: z.boolean().default(true)
}).parse(d)).handler(createSsrRpc("81c00e8a07d3fb7c003cf18481c293adf6f4a30fd5fc4756485691bad365d4a9"));
const bulkGenerateFaqs = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  url_paths: z.array(z.string().min(1)).min(1).max(50),
  count: z.number().int().min(3).max(10).default(6),
  replace_existing: z.boolean().default(true),
  skip_if_has_faq: z.boolean().default(false),
  delay_ms: z.number().int().min(0).max(5e3).default(800)
}).parse(d)).handler(createSsrRpc("5011daf5605a661f03ac98f3377907106a189586626054c3dbbe10b0280ed173"));
function FaqGeneratorPage() {
  const [urlPath, setUrlPath] = React.useState("");
  const [count, setCount] = React.useState(6);
  const [replace, setReplace] = React.useState(true);
  const [preview, setPreview] = React.useState(null);
  const [editable, setEditable] = React.useState([]);
  const [insertMsg, setInsertMsg] = React.useState(null);
  const previewFn = useServerFn(previewFaqForUrl);
  const insertFn = useServerFn(insertFaqIntoPage);
  const previewMut = useMutation({
    mutationFn: () => previewFn({
      data: {
        url_path: urlPath.trim(),
        count
      }
    }),
    onSuccess: (res) => {
      setPreview(res);
      setEditable(res.faqs);
      setInsertMsg(null);
    }
  });
  const insertMut = useMutation({
    mutationFn: () => insertFn({
      data: {
        url_path: urlPath.trim(),
        faqs: editable,
        replace_existing: replace
      }
    }),
    onSuccess: (res) => {
      setInsertMsg(res.success ? "Inserted into page." : `Failed: ${res.error}`);
    }
  });
  const updateFaq = (i, patch) => setEditable((arr) => arr.map((x, idx) => idx === i ? {
    ...x,
    ...patch
  } : x));
  const removeFaq = (i) => setEditable((arr) => arr.filter((_, idx) => idx !== i));
  return /* @__PURE__ */ jsx(AdminLayout, { title: "FAQ generator", children: /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold", children: "AI FAQ generator" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Pull the top Google Search queries for a URL and turn them into a FAQ block, then insert it into the page." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4 space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-[1fr_auto_auto_auto]", children: [
        /* @__PURE__ */ jsx("input", { value: urlPath, onChange: (e) => setUrlPath(e.target.value), placeholder: "/p/los-angeles-ca", className: "rounded-md border border-input bg-background px-3 py-2 text-sm" }),
        /* @__PURE__ */ jsx("select", { value: count, onChange: (e) => setCount(Number(e.target.value)), className: "rounded-md border border-input bg-background px-3 py-2 text-sm", children: [3, 4, 5, 6, 7, 8, 9, 10].map((n) => /* @__PURE__ */ jsxs("option", { value: n, children: [
          n,
          " FAQs"
        ] }, n)) }),
        /* @__PURE__ */ jsxs("label", { className: "inline-flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: replace, onChange: (e) => setReplace(e.target.checked) }),
          "Replace existing"
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => previewMut.mutate(), disabled: !urlPath.trim() || previewMut.isPending, className: "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50", children: previewMut.isPending ? "Generating…" : "Generate preview" })
      ] }),
      previewMut.error && /* @__PURE__ */ jsx("div", { className: "text-sm text-destructive", children: previewMut.error.message }),
      preview?.error && /* @__PURE__ */ jsx("div", { className: "text-sm text-destructive", children: preview.error })
    ] }),
    preview && preview.queries.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsx("h2", { className: "mb-2 text-sm font-semibold", children: "Source queries (last 90 days)" }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5 text-xs", children: preview.queries.slice(0, 20).map((q) => /* @__PURE__ */ jsxs("span", { className: "rounded bg-muted px-2 py-1", children: [
        q.query,
        /* @__PURE__ */ jsxs("span", { className: "ml-1 text-muted-foreground", children: [
          "(",
          q.impressions,
          ")"
        ] })
      ] }, q.query)) })
    ] }),
    editable.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold", children: "Edit before insert" }),
      editable.map((f, i) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-3 space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("input", { value: f.question, onChange: (e) => updateFaq(i, {
            question: e.target.value
          }), className: "flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm font-medium" }),
          /* @__PURE__ */ jsx("button", { onClick: () => removeFaq(i), className: "rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted", children: "Remove" })
        ] }),
        /* @__PURE__ */ jsx("textarea", { value: f.answer, onChange: (e) => updateFaq(i, {
          answer: e.target.value
        }), rows: 3, className: "w-full rounded-md border border-input bg-background px-2 py-1 text-sm" })
      ] }, i)),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => insertMut.mutate(), disabled: insertMut.isPending, className: "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50", children: insertMut.isPending ? "Inserting…" : "Insert into page" }),
        insertMsg && /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: insertMsg })
      ] })
    ] }),
    preview?.markdown && /* @__PURE__ */ jsxs("details", { className: "rounded-lg border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsx("summary", { className: "cursor-pointer text-sm font-semibold", children: "Markdown preview" }),
      /* @__PURE__ */ jsx("pre", { className: "mt-3 overflow-x-auto rounded bg-muted p-3 text-xs", children: preview.markdown })
    ] }),
    preview?.jsonLd && /* @__PURE__ */ jsxs("details", { className: "rounded-lg border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsx("summary", { className: "cursor-pointer text-sm font-semibold", children: "FAQPage JSON-LD" }),
      /* @__PURE__ */ jsx("pre", { className: "mt-3 overflow-x-auto rounded bg-muted p-3 text-xs", children: preview.jsonLd })
    ] }),
    /* @__PURE__ */ jsx(BulkFaqSection, {})
  ] }) });
}
function BulkFaqSection() {
  const [text, setText] = React.useState("");
  const [count, setCount] = React.useState(6);
  const [replace, setReplace] = React.useState(true);
  const [skipExisting, setSkipExisting] = React.useState(true);
  const [result, setResult] = React.useState(null);
  const bulkFn = useServerFn(bulkGenerateFaqs);
  const bulkMut = useMutation({
    mutationFn: () => {
      const url_paths = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      return bulkFn({
        data: {
          url_paths,
          count,
          replace_existing: replace,
          skip_if_has_faq: skipExisting,
          delay_ms: 800
        }
      });
    },
    onSuccess: (res) => setResult(res)
  });
  const paths = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  return /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4 space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Bulk generate FAQs" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Paste up to 50 url_paths (one per line). For each page, this pulls top GSC queries, generates FAQs with AI, and inserts the block into the page body." })
    ] }),
    /* @__PURE__ */ jsx("textarea", { value: text, onChange: (e) => setText(e.target.value), rows: 6, placeholder: "/p/los-angeles-ca\n/p/dallas-tx\n/p/host-acquisition/jurupa-valley-ca", className: "w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 text-sm", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
        paths.length,
        " url_paths"
      ] }),
      /* @__PURE__ */ jsx("select", { value: count, onChange: (e) => setCount(Number(e.target.value)), className: "rounded-md border border-input bg-background px-2 py-1 text-sm", children: [3, 4, 5, 6, 7, 8, 9, 10].map((n) => /* @__PURE__ */ jsxs("option", { value: n, children: [
        n,
        " FAQs each"
      ] }, n)) }),
      /* @__PURE__ */ jsxs("label", { className: "inline-flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", checked: replace, onChange: (e) => setReplace(e.target.checked) }),
        "Replace existing FAQ"
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "inline-flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", checked: skipExisting, onChange: (e) => setSkipExisting(e.target.checked) }),
        "Skip pages that already have a FAQ"
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => bulkMut.mutate(), disabled: paths.length === 0 || bulkMut.isPending || paths.length > 50, className: "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50", children: bulkMut.isPending ? `Processing ${paths.length}…` : `Generate & insert (${paths.length})` })
    ] }),
    bulkMut.error && /* @__PURE__ */ jsx("div", { className: "text-sm text-destructive", children: bulkMut.error.message }),
    result && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
        /* @__PURE__ */ jsxs("span", { className: "font-medium text-emerald-600 dark:text-emerald-400", children: [
          result.inserted,
          " inserted"
        ] }),
        " • ",
        /* @__PURE__ */ jsxs("span", { className: "font-medium text-red-600 dark:text-red-400", children: [
          result.failed,
          " failed"
        ] }),
        " • ",
        /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
          result.total,
          " total"
        ] }),
        result.error && /* @__PURE__ */ jsx("span", { className: "ml-2 text-destructive", children: result.error })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded border border-border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-muted/40 text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "URL path" }),
          /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-right", children: "FAQs" }),
          /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-right", children: "Queries" }),
          /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "Note" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: result.results.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
          /* @__PURE__ */ jsx("td", { className: "px-2 py-1 font-mono", children: r.url_path }),
          /* @__PURE__ */ jsx("td", { className: "px-2 py-1", children: /* @__PURE__ */ jsx("span", { className: r.status === "inserted" ? "rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-700 dark:text-emerald-300" : r.status === "skipped" ? "rounded bg-muted px-2 py-0.5 text-muted-foreground" : "rounded bg-red-500/15 px-2 py-0.5 text-red-700 dark:text-red-300", children: r.status }) }),
          /* @__PURE__ */ jsx("td", { className: "px-2 py-1 text-right tabular-nums", children: r.faq_count ?? "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-2 py-1 text-right tabular-nums", children: r.queries ?? "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-2 py-1 text-muted-foreground", children: r.error ?? "" })
        ] }, r.url_path)) })
      ] }) })
    ] })
  ] });
}
export {
  FaqGeneratorPage as component
};
