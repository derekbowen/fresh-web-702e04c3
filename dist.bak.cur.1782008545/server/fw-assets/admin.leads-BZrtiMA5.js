import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { A as AdminLayout } from "./admin-layout-t-rTeeWB.js";
import { b7 as listLeads, b8 as updateLeadStatus } from "./router-HDJJ1Z-a.js";
import "@tanstack/react-router";
import "lucide-react";
import "./client-Dh5RMKgP.js";
import "@supabase/supabase-js";
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
import "./auth-middleware-Bd-cw3tB.js";
import "./createMiddleware-BvN2ghIY.js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
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
import "./renter-drip.server-CRl7J1v1.js";
import "./emailit-DRsipvVx.js";
import "node:fs";
import "node:path";
import "./host-drip.server-DpHoRRhO.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const STATUSES = ["all", "new", "contacted", "closed"];
function LeadInbox() {
  const [status, setStatus] = React.useState("all");
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(null);
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setRows((await listLeads({
        data: {
          status,
          limit: 200
        }
      })).rows);
    } finally {
      setLoading(false);
    }
  }, [status]);
  React.useEffect(() => {
    void load();
  }, [load]);
  async function setLead(id, s) {
    await updateLeadStatus({
      data: {
        id,
        status: s
      }
    });
    setRows((rs) => rs.map((r) => r.id === id ? {
      ...r,
      status: s
    } : r));
    if (open?.id === id) setOpen({
      ...open,
      status: s
    });
  }
  return /* @__PURE__ */ jsxs(AdminLayout, { title: "Lead Inbox", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Lead Inbox" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Provider leads triage." }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 flex gap-2", children: STATUSES.map((s) => /* @__PURE__ */ jsx("button", { onClick: () => setStatus(s), className: `rounded-full border px-3 py-1.5 text-sm capitalize ${status === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`, children: s }, s)) }),
    /* @__PURE__ */ jsx("div", { className: "mt-4 text-sm text-muted-foreground", children: loading ? "Loading…" : `${rows.length} leads` }),
    /* @__PURE__ */ jsx("div", { className: "mt-3 overflow-x-auto rounded-xl border border-border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-left text-xs uppercase", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "When" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Name" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Email" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Company" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "City" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        rows.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border hover:bg-muted/30 cursor-pointer", onClick: () => setOpen(r), children: [
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs text-muted-foreground", children: new Date(r.created_at).toLocaleString() }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 font-medium", children: r.name }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx("a", { href: `mailto:${r.email}`, onClick: (e) => e.stopPropagation(), className: "hover:underline", children: r.email }) }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: r.company || /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "—" }) }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs", children: [r.city, r.state_code].filter(Boolean).join(", ") || "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx("span", { className: `rounded px-2 py-0.5 text-xs font-bold ${r.status === "new" ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300" : r.status === "contacted" ? "bg-blue-500/20 text-blue-700 dark:text-blue-300" : "bg-green-500/20 text-green-700 dark:text-green-300"}`, children: r.status }) }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right text-xs", children: "View →" })
        ] }, r.id)),
        !loading && rows.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "px-3 py-8 text-center text-muted-foreground", children: "No leads." }) })
      ] })
    ] }) }),
    open && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", onClick: () => setOpen(null), children: /* @__PURE__ */ jsxs("div", { className: "max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold", children: open.name }),
      /* @__PURE__ */ jsxs("dl", { className: "mt-4 space-y-2 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-xs uppercase text-muted-foreground", children: "Email" }),
          /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx("a", { href: `mailto:${open.email}`, className: "hover:underline", children: open.email }) })
        ] }),
        open.phone && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-xs uppercase text-muted-foreground", children: "Phone" }),
          /* @__PURE__ */ jsx("dd", { children: open.phone })
        ] }),
        open.company && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-xs uppercase text-muted-foreground", children: "Company" }),
          /* @__PURE__ */ jsx("dd", { children: open.company })
        ] }),
        open.website && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-xs uppercase text-muted-foreground", children: "Website" }),
          /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx("a", { href: open.website, target: "_blank", rel: "noreferrer", className: "hover:underline", children: open.website }) })
        ] }),
        (open.city || open.state_code) && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-xs uppercase text-muted-foreground", children: "Location" }),
          /* @__PURE__ */ jsx("dd", { children: [open.city, open.state_code].filter(Boolean).join(", ") })
        ] }),
        open.source_path && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-xs uppercase text-muted-foreground", children: "Source" }),
          /* @__PURE__ */ jsx("dd", { className: "font-mono text-xs", children: open.source_path })
        ] }),
        open.message && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-xs uppercase text-muted-foreground", children: "Message" }),
          /* @__PURE__ */ jsx("dd", { className: "whitespace-pre-wrap rounded bg-muted/50 p-3", children: open.message })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-6 flex gap-2", children: ["new", "contacted", "closed"].map((s) => /* @__PURE__ */ jsx("button", { onClick: () => setLead(open.id, s), className: `flex-1 rounded-md border px-3 py-2 text-sm font-medium capitalize ${open.status === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`, children: s }, s)) }),
      /* @__PURE__ */ jsx("button", { onClick: () => setOpen(null), className: "mt-3 w-full rounded-md border border-border px-3 py-2 text-sm", children: "Close" })
    ] }) })
  ] });
}
export {
  LeadInbox as component
};
