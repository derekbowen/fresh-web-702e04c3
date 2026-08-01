import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { A as AdminLayout } from "./admin-layout-BAYjOizo.js";
import { C as Card } from "./card-DK4TJU2r.js";
import { B as Button } from "./button-TjZkfKyC.js";
import { I as Input } from "./input-C0QjszdI.js";
import { B as Badge } from "./badge-DyfXZgLs.js";
import { toast } from "sonner";
import { Sparkles, ExternalLink } from "lucide-react";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-Bd-cw3tB.js";
import { c as createServerFn } from "../server.js";
import "@tanstack/react-router";
import "./router-DnjagyeS.js";
import "./site-footer-defaults-asWdr-hi.js";
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
import "./renter-drip.server-D2A63B6b.js";
import "node:fs";
import "node:path";
import "./host-drip.server-CML6Wr0O.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
const critiquePage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  url_path: z.string().min(1).max(300)
}).parse(d)).handler(createSsrRpc("eb7f45cf7231968d6499839e78df0ebb147a673f66ab51b5fa428bcdf9f49891"));
function ScoreBar({
  score,
  label
}) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-destructive";
  return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
      /* @__PURE__ */ jsx("span", { children: label }),
      /* @__PURE__ */ jsx("span", { className: "font-mono", children: score })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "h-2 rounded bg-muted overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: `h-full ${color}`, style: {
      width: `${score}%`
    } }) })
  ] });
}
function copyTo(text) {
  navigator.clipboard?.writeText(text);
  toast.success("Copied");
}
function SeoCriticPage() {
  const fn = useServerFn(critiquePage);
  const [path, setPath] = useState("/p/");
  const [data, setData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const run = useMutation({
    mutationFn: (p) => fn({
      data: {
        url_path: p
      }
    }),
    onSuccess: (r) => {
      if (r?.ok && r.critique) {
        setData(r.critique);
        setSuggestions([]);
      } else {
        setData(null);
        setSuggestions(r?.suggestions ?? []);
        toast.error(r?.error || "Failed");
      }
    },
    onError: (e) => toast.error(e?.message || "Failed")
  });
  return /* @__PURE__ */ jsx(AdminLayout, { children: /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto p-6 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "size-7 text-primary" }),
        "AI SEO Critic"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "One-click critique: title/meta, intent match, internal-link gaps, voice rules." })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "p-4 space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(Input, { placeholder: "/p/your-slug", value: path, onChange: (e) => setPath(e.target.value), onKeyDown: (e) => {
          if (e.key === "Enter") run.mutate(path);
        } }),
        /* @__PURE__ */ jsx(Button, { onClick: () => run.mutate(path), disabled: run.isPending, children: run.isPending ? "Critiquing…" : "Critique page" })
      ] }),
      suggestions.length > 0 && /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
        /* @__PURE__ */ jsx("div", { className: "text-muted-foreground mb-1", children: "Did you mean:" }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: suggestions.map((s) => /* @__PURE__ */ jsx("button", { className: "text-xs px-2 py-1 border rounded hover:bg-muted", onClick: () => {
          setPath(s.url_path);
          run.mutate(s.url_path);
        }, children: s.url_path }, s.url_path)) })
      ] })
    ] }),
    data && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(Card, { className: "p-5 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: data.url_path }),
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: data.overall.one_liner })
          ] }),
          /* @__PURE__ */ jsxs("a", { href: data.url_path, target: "_blank", rel: "noreferrer", className: "text-sm text-primary inline-flex items-center gap-1 shrink-0", children: [
            "View ",
            /* @__PURE__ */ jsx(ExternalLink, { className: "size-3" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-4 gap-3", children: [
          /* @__PURE__ */ jsx(ScoreBar, { score: data.overall.score, label: "Overall" }),
          /* @__PURE__ */ jsx(ScoreBar, { score: data.meta_review.score, label: "Title & meta" }),
          /* @__PURE__ */ jsx(ScoreBar, { score: data.intent.score, label: "Intent match" }),
          /* @__PURE__ */ jsx(ScoreBar, { score: data.voice.score, label: "Voice" })
        ] }),
        data.overall.top_actions.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium mb-1", children: "Top actions" }),
          /* @__PURE__ */ jsx("ol", { className: "list-decimal pl-5 space-y-1 text-sm", children: data.overall.top_actions.map((a, i) => /* @__PURE__ */ jsx("li", { children: a }, i)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "p-5 space-y-3", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: "Title & meta" }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm space-y-1", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
              "Current title (",
              (data.title || "").length,
              "):"
            ] }),
            " ",
            data.title || "(none)"
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
              "Current meta (",
              (data.meta || "").length,
              "):"
            ] }),
            " ",
            data.meta || "(none)"
          ] })
        ] }),
        data.meta_review.issues.length > 0 && /* @__PURE__ */ jsx("ul", { className: "list-disc pl-5 text-sm space-y-0.5", children: data.meta_review.issues.map((i, k) => /* @__PURE__ */ jsx("li", { children: i }, k)) }),
        data.meta_review.rewrites.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Suggested rewrites" }),
          data.meta_review.rewrites.map((r, i) => /* @__PURE__ */ jsxs("div", { className: "border rounded p-3 space-y-1 bg-muted/30", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
              /* @__PURE__ */ jsx("strong", { children: "Title" }),
              " (",
              r.title.length,
              "): ",
              r.title
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
              /* @__PURE__ */ jsx("strong", { children: "Meta" }),
              " (",
              r.meta.length,
              "): ",
              r.meta
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => copyTo(r.title), children: "Copy title" }),
              /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => copyTo(r.meta), children: "Copy meta" })
            ] })
          ] }, i))
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "p-5 space-y-3", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: "Intent match" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm", children: data.intent.verdict }),
        data.intent.missing_topics.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Topics to add" }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 mt-1", children: data.intent.missing_topics.map((t, i) => /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: t }, i)) })
        ] }),
        data.intent.top_queries.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium mb-1", children: "Top queries (90d)" }),
          /* @__PURE__ */ jsx("div", { className: "text-xs grid grid-cols-1 md:grid-cols-2 gap-1", children: data.intent.top_queries.map((q, i) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-b py-0.5", children: [
            /* @__PURE__ */ jsx("span", { className: "truncate", children: q.query }),
            /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground ml-2", children: [
              q.impressions,
              " · pos ",
              q.position?.toFixed?.(1) ?? "?"
            ] })
          ] }, i)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "p-5 space-y-3", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: "Internal links" }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
          "Pages currently linking in: ",
          data.internal_links.incoming_count
        ] }),
        data.internal_links.suggest_link_to.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Add links FROM this page →" }),
          /* @__PURE__ */ jsx("ul", { className: "text-sm space-y-1", children: data.internal_links.suggest_link_to.map((l, i) => /* @__PURE__ */ jsxs("li", { className: "flex justify-between gap-2 border-b py-1", children: [
            /* @__PURE__ */ jsx("a", { href: l.url_path, target: "_blank", rel: "noreferrer", className: "text-primary truncate", children: l.url_path }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs ml-2 shrink-0", children: l.reason })
          ] }, i)) })
        ] }),
        data.internal_links.suggest_link_from.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Add links TO this page from →" }),
          /* @__PURE__ */ jsx("ul", { className: "text-sm space-y-1", children: data.internal_links.suggest_link_from.map((l, i) => /* @__PURE__ */ jsxs("li", { className: "flex justify-between gap-2 border-b py-1", children: [
            /* @__PURE__ */ jsx("a", { href: l.url_path, target: "_blank", rel: "noreferrer", className: "text-primary truncate", children: l.url_path }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs ml-2 shrink-0 italic", children: [
              '"',
              l.anchor,
              '"'
            ] })
          ] }, i)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "p-5 space-y-3", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: "Voice & style" }),
        data.voice.issues.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-sm text-emerald-600", children: "No regex hits." }),
        data.voice.issues.length > 0 && /* @__PURE__ */ jsx("ul", { className: "text-sm space-y-1", children: data.voice.issues.map((v, i) => /* @__PURE__ */ jsxs("li", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "shrink-0", children: v.where }),
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("strong", { children: v.kind }),
            " — ",
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: v.example })
          ] })
        ] }, i)) }),
        data.voice.ai_notes.length > 0 && /* @__PURE__ */ jsx("ul", { className: "list-disc pl-5 text-sm space-y-0.5", children: data.voice.ai_notes.map((n, i) => /* @__PURE__ */ jsx("li", { children: n }, i)) })
      ] })
    ] })
  ] }) });
}
export {
  SeoCriticPage as component
};
