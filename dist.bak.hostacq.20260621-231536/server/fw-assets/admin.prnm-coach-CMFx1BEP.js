import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, Telescope, RotateCcw, Wrench, Check, ExternalLink, Send } from "lucide-react";
import { A as AdminLayout } from "./admin-layout-7nNRKAex.js";
import { g as getCoachRole, p as prnmCoachChat, s as setCoachRole } from "./admin-prnm-coach.functions-CMg0HTEh.js";
import "@tanstack/react-router";
import "./router-OI82CwOi.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
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
import "./client-Dh5RMKgP.js";
import "./states-UIdvqlKs.js";
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
import "./renter-drip.server-CZnPPh9d.js";
import "./emailit-DRsipvVx.js";
import "node:fs";
import "node:path";
import "./host-drip.server-Cdm15px5.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const ROLE_OPTIONS = [{
  value: "auto",
  label: "Auto-detect",
  hint: "By email"
}, {
  value: "ceo",
  label: "Derek (CEO)",
  hint: "Growth, revenue, SEO"
}, {
  value: "coo",
  label: "Brandon (COO)",
  hint: "Outreach, ops"
}, {
  value: "cs",
  label: "Michelle (CS)",
  hint: "Replies, follow-ups"
}];
function extractAdminRoutes(text) {
  const re = /\/admin\/[a-z0-9][a-z0-9-/]*/gi;
  const found = /* @__PURE__ */ new Set();
  for (const m of text.matchAll(re)) {
    const clean = m[0].replace(/[).,;:`'"]+$/, "").toLowerCase();
    if (clean !== "/admin" && clean !== "/admin/") found.add(clean);
  }
  return Array.from(found);
}
const ROUTE_LABELS = {
  "/admin/missing-pages": "Triage 404s",
  "/admin/page-auditor": "Audit a page",
  "/admin/listing-auditor": "Audit a listing",
  "/admin/keyword-opportunities": "Find keyword wins",
  "/admin/internal-links": "Add internal links",
  "/admin/seo-health": "Open SEO health",
  "/admin/content-pages": "Bulk-fix pages",
  "/admin/quick-page": "Build a new page",
  "/admin/generate-content": "Batch generate",
  "/admin/gsc-import": "Re-sync GSC",
  "/admin/competitor-radar": "Open competitor radar",
  "/admin/rank-tracker": "Open rank tracker",
  "/admin/indexing": "Open sitemap & indexing",
  "/admin/link-checker": "Run link checker",
  "/admin/leads": "Open leads pipeline",
  "/admin/ig-lead-hunter": "Hunt IG prospects",
  "/admin/contact-enricher": "Enrich contacts",
  "/admin/feature-requests": "Review feature requests",
  "/admin/sms": "Open SMS sequences"
};
const labelFor = (r) => ROUTE_LABELS[r] || `Open ${r}`;
const STARTER_PROMPTS = ["What's the single biggest opportunity right now?", "I have 30 minutes — what should I do?", "Which hosts need a follow-up today?", "Where am I leaking revenue?"];
function PrnmCoachPage() {
  const chat = useServerFn(prnmCoachChat);
  const fetchRole = useServerFn(getCoachRole);
  const persistRole = useServerFn(setCoachRole);
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [completed, setCompleted] = React.useState(/* @__PURE__ */ new Set());
  const [roleSel, setRoleSel] = React.useState("auto");
  const [activeRole, setActiveRole] = React.useState(null);
  const [roleSource, setRoleSource] = React.useState(null);
  const [detectedName, setDetectedName] = React.useState(null);
  const [detectedEmail, setDetectedEmail] = React.useState(null);
  const [roleReady, setRoleReady] = React.useState(false);
  const [lastTools, setLastTools] = React.useState([]);
  const [agentMode, setAgentMode] = React.useState(false);
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, loading]);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetchRole({
          data: {}
        });
        if (cancelled) return;
        setActiveRole(r.role);
        setRoleSource(r.source);
        setDetectedName(r.name);
        setDetectedEmail(r.email);
        setRoleSel(r.source === "auto" ? "auto" : r.role);
      } catch {
      } finally {
        if (!cancelled) setRoleReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  React.useEffect(() => {
    if (!roleReady) return;
    if (messages.length === 0) void send("Start. Look at my role's data, find the single highest-leverage thing for me to do today, and ask the first yes/no question.");
  }, [roleReady]);
  async function changeRole(next) {
    if (next === roleSel) return;
    setRoleSel(next);
    try {
      const r = await persistRole({
        data: {
          role: next === "auto" ? null : next
        }
      });
      setActiveRole(r.role);
      setRoleSource(r.source);
      setDetectedName(r.name);
      setDetectedEmail(r.email);
    } catch {
    }
    if (messages.length > 0) reset();
  }
  async function send(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    const next = [...messages, {
      role: "user",
      content: trimmed
    }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await chat({
        data: {
          messages: next,
          completedRoutes: Array.from(completed),
          roleOverride: roleSel === "auto" ? void 0 : roleSel,
          agentMode
        }
      });
      if (res.ok) {
        setMessages([...next, {
          role: "assistant",
          content: res.reply
        }]);
        setActiveRole(res.role);
        setLastTools(res.toolsUsed || []);
      } else {
        setError(res.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }
  function reset() {
    setMessages([]);
    setCompleted(/* @__PURE__ */ new Set());
    setError(null);
    setLastTools([]);
    setTimeout(() => void send("Start. Look at my role's data, find the single highest-leverage thing for me to do today, and ask the first yes/no question."), 50);
  }
  function answerYesNo(answer) {
    void send(answer);
  }
  function doItNow(route) {
    if (typeof window !== "undefined") window.open(route, "_blank", "noopener,noreferrer");
    setCompleted((prev) => {
      const n = new Set(prev);
      n.add(route);
      return n;
    });
    void send(`✅ Done — opened ${route} and started working on it. Mark complete and ask the next yes/no question for the next priority.`);
  }
  return /* @__PURE__ */ jsx(AdminLayout, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b px-4 py-3 gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-5 w-5 text-primary shrink-0" }),
        /* @__PURE__ */ jsx("h1", { className: "text-lg font-semibold", children: "PRNM Coach" }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground hidden sm:inline", children: "Platform advisor — pulls live data from leads, listings, SEO, support" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("select", { value: roleSel, onChange: (e) => void changeRole(e.target.value), className: "text-xs rounded-md border bg-background px-2 py-1.5", title: "Switch role", children: ROLE_OPTIONS.map((o) => /* @__PURE__ */ jsxs("option", { value: o.value, children: [
          o.label,
          " — ",
          o.hint
        ] }, o.value)) }),
        activeRole && /* @__PURE__ */ jsxs("span", { className: "text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium", title: `${roleSource === "override" ? "Manual override" : roleSource === "admin_set" ? "Set by admin" : "Auto-detected"}${detectedName ? ` · ${detectedName}` : ""}${detectedEmail ? ` · ${detectedEmail}` : ""}`, children: [
          activeRole.toUpperCase(),
          roleSource && roleSource !== "override" && /* @__PURE__ */ jsxs("span", { className: "ml-1 opacity-70 font-normal", children: [
            "(",
            roleSource === "auto" ? "auto" : "set",
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => setAgentMode((v) => !v), className: agentMode ? "text-xs flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2 py-1.5 font-medium" : "text-xs flex items-center gap-1 rounded-md border bg-background px-2 py-1.5 text-muted-foreground hover:text-foreground", title: agentMode ? "Agent mode ON — runs deeper multi-step research (slower, more thorough)" : "Turn on agent mode for deeper multi-step research", children: [
          /* @__PURE__ */ jsx(Telescope, { className: "h-3 w-3" }),
          " Agent ",
          agentMode ? "ON" : "OFF"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: reset, className: "text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground", children: [
          /* @__PURE__ */ jsx(RotateCcw, { className: "h-3 w-3" }),
          " Restart"
        ] })
      ] })
    ] }),
    lastTools.length > 0 && /* @__PURE__ */ jsxs("div", { className: "px-4 py-1.5 border-b bg-muted/30 text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap", children: [
      /* @__PURE__ */ jsx(Wrench, { className: "h-3 w-3" }),
      /* @__PURE__ */ jsx("span", { children: "Last turn used:" }),
      lastTools.map((t, i) => /* @__PURE__ */ jsx("code", { className: "px-1.5 py-0.5 rounded bg-background border text-[10px]", children: t }, i))
    ] }),
    /* @__PURE__ */ jsxs("div", { ref: scrollRef, className: "flex-1 overflow-y-auto px-4 py-6 space-y-4", children: [
      messages.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Loading your snapshot…" }),
      messages.map((m, i) => {
        const routes = m.role === "assistant" ? extractAdminRoutes(m.content) : [];
        return /* @__PURE__ */ jsx("div", { className: m.role === "user" ? "flex justify-end" : "flex justify-start", children: /* @__PURE__ */ jsx("div", { className: m.role === "user" ? "max-w-[80%] rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm" : "max-w-[85%] rounded-lg bg-muted px-4 py-3 text-sm space-y-3", children: m.role === "assistant" ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: "prose prose-sm dark:prose-invert max-w-none", children: /* @__PURE__ */ jsx(ReactMarkdown, { components: {
            a: ({
              href,
              children
            }) => /* @__PURE__ */ jsx("a", { href, className: "text-primary underline", target: href?.startsWith("/admin") ? void 0 : "_blank", children })
          }, children: m.content }) }),
          routes.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 pt-2 border-t border-border/40", children: routes.map((route) => {
            const isDone = completed.has(route);
            return /* @__PURE__ */ jsx("button", { onClick: () => !isDone && doItNow(route), disabled: isDone, className: isDone ? "inline-flex items-center gap-1.5 rounded-md bg-green-600/10 text-green-700 dark:text-green-400 px-3 py-1.5 text-xs font-medium cursor-default" : "inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 px-3 py-1.5 text-xs font-semibold", title: route, children: isDone ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Check, { className: "h-3 w-3" }),
              " Done — ",
              labelFor(route)
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(ExternalLink, { className: "h-3 w-3" }),
              " Do it now: ",
              labelFor(route)
            ] }) }, route);
          }) })
        ] }) : m.content }) }, i);
      }),
      loading && /* @__PURE__ */ jsx("div", { className: "flex justify-start", children: /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3 animate-pulse" }),
        agentMode ? "Agent mode — running deep multi-step research…" : "Thinking & querying data…"
      ] }) }),
      error && /* @__PURE__ */ jsx("div", { className: "rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive", children: error })
    ] }),
    messages.length > 0 && messages[messages.length - 1].role === "assistant" && !loading && /* @__PURE__ */ jsxs("div", { className: "flex gap-2 px-4 pb-2", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => answerYesNo("Yes"), className: "flex-1 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2", children: "Yes" }),
      /* @__PURE__ */ jsx("button", { onClick: () => answerYesNo("No"), className: "flex-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2", children: "No" }),
      /* @__PURE__ */ jsx("button", { onClick: () => void send("Why?"), className: "rounded-md border px-3 text-sm hover:bg-muted", children: "Why?" }),
      /* @__PURE__ */ jsx("button", { onClick: () => void send("Skip — show me a different priority"), className: "rounded-md border px-3 text-sm hover:bg-muted", children: "Skip" })
    ] }),
    messages.length <= 1 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 px-4 pb-2", children: STARTER_PROMPTS.map((p) => /* @__PURE__ */ jsx("button", { onClick: () => void send(p), className: "text-xs rounded-full border px-3 py-1 hover:bg-muted", children: p }, p)) }),
    /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
      e.preventDefault();
      void send(input);
    }, className: "flex gap-2 border-t p-3", children: [
      /* @__PURE__ */ jsx("input", { value: input, onChange: (e) => setInput(e.target.value), placeholder: "Ask anything — leads, listings, SEO, support, revenue…", className: "flex-1 rounded-md border px-3 py-2 text-sm bg-background", disabled: loading }),
      /* @__PURE__ */ jsxs("button", { type: "submit", disabled: loading || !input.trim(), className: "rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium disabled:opacity-50 flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" }),
        " Send"
      ] })
    ] })
  ] }) });
}
export {
  PrnmCoachPage as component
};
