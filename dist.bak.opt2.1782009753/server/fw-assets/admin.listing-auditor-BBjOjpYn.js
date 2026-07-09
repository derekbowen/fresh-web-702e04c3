import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { c as createSsrRpc } from "./cities.functions-XBYRqf13.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
import { c as createServerFn } from "../server.js";
import { A as AdminLayout } from "./admin-layout-BNp_05PW.js";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, Lightbulb, DollarSign, Camera, Mail, Trash2 } from "lucide-react";
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
import "@tanstack/react-router";
import "@tanstack/react-router/ssr/server";
import "./router-BvRNdW25.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
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
import "./renter-drip.server-CBcoOJUi.js";
import "./emailit-DRsipvVx.js";
import "node:fs";
import "node:path";
import "./host-drip.server-LDeZNUHd.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const auditListing = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  listing_url: z.string().min(5).max(500),
  host_email: z.string().email().max(255).optional().or(z.literal("")),
  host_name: z.string().max(120).optional().or(z.literal("")),
  send_email: z.boolean().default(false)
}).parse(d)).handler(createSsrRpc("99e9cc7e516ac2c4cf98a1361b7697dead878f774e22434dd718b63a40237628"));
const emailListingAudit = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  override_email: z.string().email().max(255).optional()
}).parse(d)).handler(createSsrRpc("874bb6bc79cad05ffdf9e4f0c598bbc51182e9450ccf01dad73a36034c7f07af"));
const listListingAudits = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  limit: z.number().int().min(5).max(200).default(40)
}).parse(d ?? {})).handler(createSsrRpc("9d7c5e251bb8725c981dc1834adcda2d30c40cea59e6819fa62f01252949f7b8"));
const deleteListingAudit = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("0e4cc244fd0e40108cd4f9679777bdebb4418c334199cb89f852d2c839ce5d52"));
function scoreColor(s) {
  if (s == null) return "text-muted-foreground";
  if (s >= 80) return "text-emerald-600";
  if (s >= 60) return "text-amber-600";
  return "text-destructive";
}
function ListingAuditor() {
  const [url, setUrl] = React.useState("");
  const [hostEmail, setHostEmail] = React.useState("");
  const [hostName, setHostName] = React.useState("");
  const [sendNow, setSendNow] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [current, setCurrent] = React.useState(null);
  const [history, setHistory] = React.useState([]);
  const [msg, setMsg] = React.useState(null);
  const [err, setErr] = React.useState(null);
  const load = React.useCallback(async () => {
    const r = await listListingAudits({
      data: {
        limit: 40
      }
    });
    setHistory(r.rows);
  }, []);
  React.useEffect(() => {
    load();
  }, [load]);
  async function run() {
    if (!url.trim()) {
      setErr("Paste a listing URL first");
      return;
    }
    if (sendNow && !hostEmail.trim()) {
      setErr("Add a host email or untick 'send to host'");
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    setCurrent(null);
    try {
      const r = await auditListing({
        data: {
          listing_url: url.trim(),
          host_email: hostEmail.trim() || void 0,
          host_name: hostName.trim() || void 0,
          send_email: sendNow
        }
      });
      if (r.ok) {
        setCurrent(r.audit);
        await load();
        if (sendNow) {
          if (r.email?.sent) setMsg(`Audit complete and emailed to ${r.audit.host_email}`);
          else setMsg(`Audit complete. Email failed: ${r.email?.error || "unknown"}`);
        } else {
          setMsg("Audit complete.");
        }
      } else setErr(r.error || "audit failed");
    } catch (e) {
      setErr(e?.message || "failed");
    } finally {
      setBusy(false);
    }
  }
  async function resend(row) {
    const target = prompt("Send report to email:", row.host_email || "");
    if (!target) return;
    const r = await emailListingAudit({
      data: {
        id: row.id,
        override_email: target
      }
    });
    if (r.ok) {
      setMsg(`Sent to ${target}`);
      await load();
    } else setErr(r.error || "send failed");
  }
  async function remove(id) {
    if (!confirm("Delete this audit?")) return;
    await deleteListingAudit({
      data: {
        id
      }
    });
    if (current?.id === id) setCurrent(null);
    await load();
  }
  return /* @__PURE__ */ jsxs(AdminLayout, { title: "Listing Auditor", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsxs("h1", { className: "flex items-center gap-2 text-2xl font-bold sm:text-3xl", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-6 w-6 text-primary" }),
        " Listing Auditor"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Paste a marketplace pool listing URL. AI grades the listing 0-100 and emails the host a report with photo, pricing, and copy fixes." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-muted-foreground", children: "Listing URL" }),
      /* @__PURE__ */ jsx("input", { value: url, onChange: (e) => setUrl(e.target.value), placeholder: "https://swimply.com/pooldetails/1234 or /l/abc123", className: "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-2 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-muted-foreground", children: "Host email (optional)" }),
          /* @__PURE__ */ jsx("input", { value: hostEmail, onChange: (e) => setHostEmail(e.target.value), placeholder: "host@example.com", type: "email", className: "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-muted-foreground", children: "Host name (optional)" }),
          /* @__PURE__ */ jsx("input", { value: hostName, onChange: (e) => setHostName(e.target.value), placeholder: "Sarah", className: "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "mt-3 flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", checked: sendNow, onChange: (e) => setSendNow(e.target.checked) }),
        "Email the report to the host as soon as it's ready"
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: run, disabled: busy, className: "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: [
        busy ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }),
        busy ? "Auditing…" : "Audit listing"
      ] }),
      err && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-destructive", children: err }),
      msg && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-emerald-600", children: msg })
    ] }),
    current && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-2xl border border-border bg-card p-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("p", { className: "truncate font-semibold", children: current.listing_title || "Listing" }),
          /* @__PURE__ */ jsx("a", { href: current.listing_url, target: "_blank", rel: "noreferrer", className: "block truncate font-mono text-xs text-muted-foreground hover:underline", children: current.listing_url }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm", children: current.summary }),
          current.host_email && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
            "Host: ",
            current.host_name || "—",
            " · ",
            current.host_email,
            " ·",
            " ",
            current.emailed_at ? `emailed ${new Date(current.emailed_at).toLocaleString()}` : current.email_status || "not emailed"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: `text-right ${scoreColor(current.score)}`, children: [
          /* @__PURE__ */ jsx("div", { className: "text-4xl font-bold leading-none", children: current.score ?? "—" }),
          /* @__PURE__ */ jsx("div", { className: "text-[10px] font-bold uppercase tracking-wider", children: "Score" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-3 sm:grid-cols-3", children: [
        /* @__PURE__ */ jsx(Section, { title: "Strengths", icon: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4 text-emerald-600" }), items: current.strengths }),
        /* @__PURE__ */ jsx(Section, { title: "Weaknesses", icon: /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4 text-amber-600" }), items: current.weaknesses }),
        /* @__PURE__ */ jsx(Section, { title: "Recommendations", icon: /* @__PURE__ */ jsx(Lightbulb, { className: "h-4 w-4 text-primary" }), items: current.recommendations })
      ] }),
      (current.pricing_notes || current.photo_notes) && /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-3 sm:grid-cols-2", children: [
        current.pricing_notes && /* @__PURE__ */ jsx(Note, { title: "Pricing", icon: /* @__PURE__ */ jsx(DollarSign, { className: "h-4 w-4" }), text: current.pricing_notes }),
        current.photo_notes && /* @__PURE__ */ jsx(Note, { title: "Photos", icon: /* @__PURE__ */ jsx(Camera, { className: "h-4 w-4" }), text: current.photo_notes })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-4 flex justify-end gap-2", children: /* @__PURE__ */ jsxs("button", { onClick: () => resend(current), className: "inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold", children: [
        /* @__PURE__ */ jsx(Mail, { className: "h-3.5 w-3.5" }),
        " Send to host"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold", children: [
        "Recent audits (",
        history.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-2 space-y-1.5", children: [
        history.length === 0 && /* @__PURE__ */ jsx("p", { className: "rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground", children: "No audits yet." }),
        history.map((h) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3", children: [
          /* @__PURE__ */ jsxs("button", { onClick: () => setCurrent(h), className: "flex-1 min-w-0 text-left", children: [
            /* @__PURE__ */ jsx("p", { className: "truncate font-medium text-sm", children: h.listing_title || h.listing_url }),
            /* @__PURE__ */ jsxs("p", { className: "truncate text-xs text-muted-foreground", children: [
              h.host_email || "no host email",
              " · ",
              h.emailed_at ? `emailed ${new Date(h.emailed_at).toLocaleDateString()}` : h.email_status || "not emailed"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: `text-xl font-bold ${scoreColor(h.score)}`, children: h.score ?? "—" }),
            /* @__PURE__ */ jsx("button", { onClick: () => resend(h), className: "rounded-full bg-secondary p-1.5", title: "Email host", children: /* @__PURE__ */ jsx(Mail, { className: "h-3.5 w-3.5" }) }),
            /* @__PURE__ */ jsx("button", { onClick: () => remove(h.id), className: "rounded-full border border-border p-1.5 text-destructive", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }) })
          ] })
        ] }, h.id))
      ] })
    ] })
  ] });
}
function Section({
  title,
  icon,
  items
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border p-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground", children: [
      icon,
      " ",
      title
    ] }),
    /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-1.5 text-sm", children: items?.length ? items.map((it, i) => /* @__PURE__ */ jsxs("li", { className: "leading-snug", children: [
      "• ",
      it
    ] }, i)) : /* @__PURE__ */ jsx("li", { className: "text-xs text-muted-foreground", children: "None" }) })
  ] });
}
function Note({
  title,
  icon,
  text
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border p-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground", children: [
      icon,
      " ",
      title
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mt-1.5 text-sm leading-snug", children: text })
  ] });
}
export {
  ListingAuditor as component
};
