import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { useQuery } from "@tanstack/react-query";
import { A as AdminLayout } from "./admin-layout-B2eMXHXP.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import "@tanstack/react-router";
import "lucide-react";
import "./router-BEu57YoG.js";
import "./site-footer-defaults-C7gHxS5b.js";
import "zod";
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
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
const getDeliverabilityStats = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((input) => ({
  range: input?.range ?? "7d"
})).handler(createSsrRpc("f0cb6905eba0f5a089b7ee924350d6940cd8f2fe75fa831e7675c6a2fda59397"));
const getDeliverabilityLog = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((input) => ({
  range: input?.range ?? "7d",
  status: input?.status ?? "all",
  template: input?.template ?? "all",
  q: input?.q?.trim().toLowerCase() ?? "",
  limit: Math.min(input?.limit ?? 200, 500)
})).handler(createSsrRpc("52fde4b573c10d1d9329a5933b8294b9b35a104e6107454152742daaca53a71a"));
const getSuppressions = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((input) => ({
  q: input?.q?.trim().toLowerCase() ?? "",
  reason: input?.reason ?? "all",
  limit: Math.min(input?.limit ?? 200, 500)
})).handler(createSsrRpc("b8a1e1921902dbf68a352ddcb5fec294660a93a020c1d0d903b32895277262a4"));
const removeSuppression = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => {
  const email = input?.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email");
  return {
    email
  };
}).handler(createSsrRpc("b1eb7b860b1766661e5a8669dc1c357ae0d312f2b36cf54cebb37048275ccef8"));
const addSuppression = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => {
  const email = input?.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email");
  const reason = input?.reason ?? "unsubscribe";
  return {
    email,
    reason
  };
}).handler(createSsrRpc("340f36031167a774ec1f65a5247288e23ddeecae00c8ffe95200abacbe56c6bd"));
function Pill({
  active,
  onClick,
  children
}) {
  return /* @__PURE__ */ jsx("button", { onClick, className: `rounded-md px-3 py-1.5 text-sm border ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"}`, children });
}
function StatusBadge({
  status
}) {
  const map = {
    sent: "bg-green-500/15 text-green-600 border-green-500/30",
    pending: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    failed: "bg-red-500/15 text-red-600 border-red-500/30",
    dlq: "bg-red-500/15 text-red-600 border-red-500/30",
    bounced: "bg-orange-500/15 text-orange-600 border-orange-500/30",
    complained: "bg-purple-500/15 text-purple-600 border-purple-500/30",
    suppressed: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30"
  };
  const cls = map[status] ?? "bg-muted text-muted-foreground border-border";
  return /* @__PURE__ */ jsx("span", { className: `inline-block rounded border px-2 py-0.5 text-xs ${cls}`, children: status });
}
function DeliverabilityPage() {
  const [range, setRange] = React.useState("7d");
  const [tab, setTab] = React.useState("overview");
  const statsFn = useServerFn(getDeliverabilityStats);
  const statsQ = useQuery({
    queryKey: ["deliv-stats", range],
    queryFn: () => statsFn({
      data: {
        range
      }
    }),
    staleTime: 3e4
  });
  const s = statsQ.data?.stats;
  const deliveryRate = s && s.total > 0 ? Math.round(s.sent / s.total * 100) : 0;
  const bounceRate = s && s.sent + s.bounced > 0 ? (s.bounced / (s.sent + s.bounced) * 100).toFixed(2) : "0.00";
  const complaintRate = s && s.sent > 0 ? (s.complained / s.sent * 100).toFixed(3) : "0.000";
  return /* @__PURE__ */ jsxs(AdminLayout, { title: "Email deliverability", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Email deliverability" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Send health, bounces, complaints, and suppression list." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(Pill, { active: range === "24h", onClick: () => setRange("24h"), children: "24h" }),
        /* @__PURE__ */ jsx(Pill, { active: range === "7d", onClick: () => setRange("7d"), children: "7 days" }),
        /* @__PURE__ */ jsx(Pill, { active: range === "30d", onClick: () => setRange("30d"), children: "30 days" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-2 md:grid-cols-4 gap-3", children: [
      /* @__PURE__ */ jsx(Metric, { label: "Delivery rate", value: `${deliveryRate}%`, hint: `${s?.sent ?? 0} of ${s?.total ?? 0} sent`, good: deliveryRate >= 97 }),
      /* @__PURE__ */ jsx(Metric, { label: "Bounce rate", value: `${bounceRate}%`, hint: "Keep below 2%", good: Number(bounceRate) < 2 }),
      /* @__PURE__ */ jsx(Metric, { label: "Complaint rate", value: `${complaintRate}%`, hint: "Keep below 0.1%", good: Number(complaintRate) < 0.1 }),
      /* @__PURE__ */ jsx(Metric, { label: "Suppression hits", value: String(s?.suppressed ?? 0), hint: "Blocked before send" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm", children: [
      /* @__PURE__ */ jsx(MiniStat, { label: "Total", value: s?.total ?? 0 }),
      /* @__PURE__ */ jsx(MiniStat, { label: "Sent", value: s?.sent ?? 0, tone: "green" }),
      /* @__PURE__ */ jsx(MiniStat, { label: "Bounced", value: s?.bounced ?? 0, tone: "orange" }),
      /* @__PURE__ */ jsx(MiniStat, { label: "Complained", value: s?.complained ?? 0, tone: "purple" }),
      /* @__PURE__ */ jsx(MiniStat, { label: "Failed", value: s?.failed ?? 0, tone: "red" }),
      /* @__PURE__ */ jsx(MiniStat, { label: "Pending", value: s?.pending ?? 0, tone: "blue" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 flex gap-2 border-b border-border", children: ["overview", "log", "suppressed"].map((t) => /* @__PURE__ */ jsx("button", { onClick: () => setTab(t), className: `px-3 py-2 text-sm capitalize ${tab === t ? "border-b-2 border-primary font-semibold" : "text-muted-foreground"}`, children: t === "log" ? "Send log" : t === "suppressed" ? "Suppression list" : "By template" }, t)) }),
    tab === "overview" && /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-md border border-border bg-card overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-left text-xs uppercase", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Template" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Sent" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Bounced" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Failed" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Bounce %" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        (s?.byTemplate ?? []).map((t) => {
          const tot = t.sent + t.bounced;
          const br = tot > 0 ? (t.bounced / tot * 100).toFixed(1) : "0.0";
          return /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 font-mono text-xs", children: t.template }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right", children: t.sent }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right", children: t.bounced }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right", children: t.failed }),
            /* @__PURE__ */ jsxs("td", { className: "px-3 py-2 text-right", children: [
              br,
              "%"
            ] })
          ] }, t.template);
        }),
        !s?.byTemplate?.length && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "px-3 py-6 text-center text-muted-foreground", children: "No sends in this window." }) })
      ] })
    ] }) }),
    tab === "log" && /* @__PURE__ */ jsx(SendLog, { range }),
    tab === "suppressed" && /* @__PURE__ */ jsx(SuppressionList, {})
  ] });
}
function Metric({
  label,
  value,
  hint,
  good
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card p-3", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: `text-2xl font-bold ${good === void 0 ? "" : good ? "text-green-600" : "text-orange-600"}`, children: value }),
    hint && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-1", children: hint })
  ] });
}
function MiniStat({
  label,
  value,
  tone
}) {
  const toneCls = {
    green: "text-green-600",
    red: "text-red-600",
    orange: "text-orange-600",
    purple: "text-purple-600",
    blue: "text-blue-600"
  };
  return /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card p-2", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: `text-lg font-semibold ${tone ? toneCls[tone] : ""}`, children: value })
  ] });
}
function SendLog({
  range
}) {
  const [status, setStatus] = React.useState("all");
  const [template, setTemplate] = React.useState("all");
  const [q, setQ] = React.useState("");
  const fn = useServerFn(getDeliverabilityLog);
  const {
    data,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ["deliv-log", range, status, template, q],
    queryFn: () => fn({
      data: {
        range,
        status,
        template,
        q
      }
    }),
    staleTime: 3e4
  });
  const rows = data?.rows ?? [];
  const templates = data?.templates ?? [];
  return /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 mb-3", children: [
      /* @__PURE__ */ jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search recipient…", className: "rounded-md border border-border bg-card px-3 py-1.5 text-sm" }),
      /* @__PURE__ */ jsxs("select", { value: status, onChange: (e) => setStatus(e.target.value), className: "rounded-md border border-border bg-card px-3 py-1.5 text-sm", children: [
        /* @__PURE__ */ jsx("option", { value: "all", children: "All statuses" }),
        /* @__PURE__ */ jsx("option", { value: "sent", children: "Sent" }),
        /* @__PURE__ */ jsx("option", { value: "failed", children: "Failed" }),
        /* @__PURE__ */ jsx("option", { value: "dlq", children: "DLQ" }),
        /* @__PURE__ */ jsx("option", { value: "bounced", children: "Bounced" }),
        /* @__PURE__ */ jsx("option", { value: "complained", children: "Complained" }),
        /* @__PURE__ */ jsx("option", { value: "suppressed", children: "Suppressed" }),
        /* @__PURE__ */ jsx("option", { value: "pending", children: "Pending" })
      ] }),
      /* @__PURE__ */ jsxs("select", { value: template, onChange: (e) => setTemplate(e.target.value), className: "rounded-md border border-border bg-card px-3 py-1.5 text-sm", children: [
        /* @__PURE__ */ jsx("option", { value: "all", children: "All templates" }),
        templates.map((t) => /* @__PURE__ */ jsx("option", { value: t, children: t }, t))
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => refetch(), className: "rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted", children: isFetching ? "Loading…" : "Refresh" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "rounded-md border border-border bg-card overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-left text-xs uppercase", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "When" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Template" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Recipient" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Error" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        rows.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 whitespace-nowrap text-xs", children: new Date(r.created_at).toLocaleString() }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 font-mono text-xs", children: r.template_name }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: r.recipient_email }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx(StatusBadge, { status: r.status }) }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs text-muted-foreground max-w-md truncate", title: r.error_message ?? "", children: r.error_message ?? "" })
        ] }, (r.message_id ?? "") + r.created_at)),
        !rows.length && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "px-3 py-6 text-center text-muted-foreground", children: "No matching rows." }) })
      ] })
    ] }) })
  ] });
}
function SuppressionList() {
  const [q, setQ] = React.useState("");
  const [reason, setReason] = React.useState("all");
  const [newEmail, setNewEmail] = React.useState("");
  const listFn = useServerFn(getSuppressions);
  const removeFn = useServerFn(removeSuppression);
  const addFn = useServerFn(addSuppression);
  const {
    data,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ["suppressions", q, reason],
    queryFn: () => listFn({
      data: {
        q,
        reason
      }
    }),
    staleTime: 3e4
  });
  const rows = data?.rows ?? [];
  const counts = data?.counts ?? {};
  async function handleRemove(email) {
    if (!confirm(`Remove ${email} from suppression? They will receive future emails.`)) return;
    const res = await removeFn({
      data: {
        email
      }
    });
    if (!res.ok) alert(res.error ?? "Failed");
    refetch();
  }
  async function handleAdd() {
    if (!newEmail.trim()) return;
    const res = await addFn({
      data: {
        email: newEmail,
        reason: "unsubscribe"
      }
    });
    if (!res.ok) alert(res.error ?? "Failed");
    setNewEmail("");
    refetch();
  }
  return /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3 mb-3 text-sm", children: [
      /* @__PURE__ */ jsx(MiniStat, { label: "Bounces", value: counts.bounce ?? 0, tone: "orange" }),
      /* @__PURE__ */ jsx(MiniStat, { label: "Complaints", value: counts.complaint ?? 0, tone: "purple" }),
      /* @__PURE__ */ jsx(MiniStat, { label: "Unsubscribes", value: counts.unsubscribe ?? 0, tone: "blue" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 mb-3", children: [
      /* @__PURE__ */ jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search email…", className: "rounded-md border border-border bg-card px-3 py-1.5 text-sm" }),
      /* @__PURE__ */ jsxs("select", { value: reason, onChange: (e) => setReason(e.target.value), className: "rounded-md border border-border bg-card px-3 py-1.5 text-sm", children: [
        /* @__PURE__ */ jsx("option", { value: "all", children: "All reasons" }),
        /* @__PURE__ */ jsx("option", { value: "bounce", children: "Bounce" }),
        /* @__PURE__ */ jsx("option", { value: "complaint", children: "Complaint" }),
        /* @__PURE__ */ jsx("option", { value: "unsubscribe", children: "Unsubscribe" })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => refetch(), className: "rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted", children: isFetching ? "Loading…" : "Refresh" }),
      /* @__PURE__ */ jsxs("div", { className: "ml-auto flex gap-2", children: [
        /* @__PURE__ */ jsx("input", { value: newEmail, onChange: (e) => setNewEmail(e.target.value), placeholder: "Manually suppress email…", className: "rounded-md border border-border bg-card px-3 py-1.5 text-sm w-64" }),
        /* @__PURE__ */ jsx("button", { onClick: handleAdd, className: "rounded-md border border-border bg-primary text-primary-foreground px-3 py-1.5 text-sm", children: "Suppress" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "rounded-md border border-border bg-card overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-left text-xs uppercase", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Email" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Reason" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Added" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Action" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        rows.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: r.email }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx(StatusBadge, { status: r.reason }) }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs", children: new Date(r.created_at).toLocaleString() }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right", children: /* @__PURE__ */ jsx("button", { onClick: () => handleRemove(r.email), className: "rounded border border-border bg-card px-2 py-1 text-xs hover:bg-muted", children: "Unsuppress" }) })
        ] }, r.email)),
        !rows.length && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "px-3 py-6 text-center text-muted-foreground", children: "No suppressions." }) })
      ] })
    ] }) })
  ] });
}
export {
  DeliverabilityPage as component
};
