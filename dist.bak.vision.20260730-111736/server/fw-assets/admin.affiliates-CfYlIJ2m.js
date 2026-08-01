import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { A as AdminLayout } from "./admin-layout-C8fuK5rJ.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import { bB as setAffiliateTierOverride } from "./router-DotN2vF1.js";
import { a as listCoachingForAffiliate } from "./affiliate-coaching.functions-D64jMAcP.js";
import "@tanstack/react-router";
import "lucide-react";
import "./client-Dh5RMKgP.js";
import "@supabase/supabase-js";
import "./client.server-D5ro3rAQ.js";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "@tanstack/react-query";
import "./site-footer-defaults-asWdr-hi.js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
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
import "./renter-drip.server-C0_mcvap.js";
import "node:fs";
import "node:path";
import "./host-drip.server-BcWebfNA.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const listAffiliatesAdmin = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  status: z.enum(["all", "pending", "approved", "rejected", "paused"]).optional(),
  sort: z.enum(["recent", "gmv_30d", "approved_cents"]).optional()
}).parse(d ?? {})).handler(createSsrRpc("707d9fcbf0eebecad1123d43d393104954b187e2951258db1439eba92d63b0c4"));
const setAffiliateStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected", "paused"])
}).parse(d)).handler(createSsrRpc("1136c1e2a3e5c7fa3adc5c91c42e855af7e628e115e74a668a604fd0ddc6e778"));
const linkHostToAffiliate = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  affiliate_id: z.string().uuid(),
  sharetribe_user_id: z.string().trim().min(1).max(64),
  email_seen: z.string().email().max(255).optional().or(z.literal("")),
  display_name: z.string().trim().max(255).optional().or(z.literal(""))
}).parse(d)).handler(createSsrRpc("1ec90cb8fc6c7e8ee3c93cf145372313119e4042db1a3f8b8e63b5abbef9b8bc"));
const createAffiliatePayout = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  affiliate_id: z.string().uuid(),
  method: z.string().trim().max(40),
  reference: z.string().trim().max(255).optional().or(z.literal("")),
  notes: z.string().trim().max(1e3).optional().or(z.literal(""))
}).parse(d)).handler(createSsrRpc("33b2f4f724d94bdcc795607b98693af1b5cb518577c22521524c40261b1302b2"));
createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("bcfc1ff4d73b39006d25b11e6bfd943ef1c122364946cac1b2d546c8a9293c7b"));
function dollars(c) {
  return `$${(c / 100).toLocaleString(void 0, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}
const TIER_LABEL = {
  starter: "Starter",
  lead: "Lead",
  captain: "Captain"
};
const TIER_COLOR = {
  starter: "bg-muted text-foreground",
  lead: "bg-blue-500/20 text-blue-700",
  captain: "bg-amber-500/20 text-amber-700"
};
function AdminAffiliates() {
  const [rows, setRows] = React.useState([]);
  const [filter, setFilter] = React.useState("all");
  const [sort, setSort] = React.useState("recent");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState(null);
  const [linkOpen, setLinkOpen] = React.useState(null);
  const [payoutOpen, setPayoutOpen] = React.useState(null);
  const [coachingOpen, setCoachingOpen] = React.useState(null);
  const [tierOpen, setTierOpen] = React.useState(null);
  const load = React.useCallback(async () => {
    setBusy(true);
    try {
      const r = await listAffiliatesAdmin({
        data: {
          status: filter,
          sort
        }
      });
      setRows(r.rows);
    } finally {
      setBusy(false);
    }
  }, [filter, sort]);
  React.useEffect(() => {
    load();
  }, [load]);
  async function changeStatus(id, status) {
    setMsg(null);
    await setAffiliateStatus({
      data: {
        id,
        status
      }
    });
    setMsg(`Updated to ${status}.`);
    load();
  }
  const leaderboard = [...rows].filter((r) => r.status === "approved").sort((a, b) => b.gmv_30d_cents - a.gmv_30d_cents).slice(0, 10);
  return /* @__PURE__ */ jsx(AdminLayout, { children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl space-y-6 p-6", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Affiliates" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Approve applications, link Sharetribe hosts, override tier, record payouts." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxs("select", { value: sort, onChange: (e) => setSort(e.target.value), className: "rounded-lg border border-border bg-background px-3 py-2 text-sm", children: [
          /* @__PURE__ */ jsx("option", { value: "recent", children: "Sort: Recent" }),
          /* @__PURE__ */ jsx("option", { value: "gmv_30d", children: "Sort: 30d GMV" }),
          /* @__PURE__ */ jsx("option", { value: "approved_cents", children: "Sort: Approved $" })
        ] }),
        /* @__PURE__ */ jsxs("select", { value: filter, onChange: (e) => setFilter(e.target.value), className: "rounded-lg border border-border bg-background px-3 py-2 text-sm", children: [
          /* @__PURE__ */ jsx("option", { value: "all", children: "All" }),
          /* @__PURE__ */ jsx("option", { value: "pending", children: "Pending" }),
          /* @__PURE__ */ jsx("option", { value: "approved", children: "Approved" }),
          /* @__PURE__ */ jsx("option", { value: "paused", children: "Paused" }),
          /* @__PURE__ */ jsx("option", { value: "rejected", children: "Rejected" })
        ] })
      ] })
    ] }),
    msg && /* @__PURE__ */ jsx("div", { className: "rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm", children: msg }),
    leaderboard.length > 0 && /* @__PURE__ */ jsxs("section", { className: "rounded-xl border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold uppercase tracking-wide text-muted-foreground", children: "Top 10 by 30-day GMV" }),
      /* @__PURE__ */ jsx("ol", { className: "mt-3 space-y-1 text-sm", children: leaderboard.map((r, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("span", { className: "truncate", children: [
          /* @__PURE__ */ jsxs("span", { className: "mr-2 text-muted-foreground", children: [
            "#",
            i + 1
          ] }),
          r.full_name || r.email,
          " ",
          /* @__PURE__ */ jsx("span", { className: `ml-2 rounded-full px-2 py-0.5 text-xs ${TIER_COLOR[r.tier]}`, children: TIER_LABEL[r.tier] })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
          r.active_host_count,
          " active · ",
          dollars(r.gmv_30d_cents),
          " GMV"
        ] })
      ] }, r.id)) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-xl border border-border bg-card", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted/40 text-left", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Affiliate" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Code" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Tier" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Hosts" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Active" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "30d GMV" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Pending" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Approved" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Paid" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        busy && rows.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 11, className: "px-3 py-6 text-center text-muted-foreground", children: "Loading…" }) }),
        rows.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
          /* @__PURE__ */ jsxs("td", { className: "px-3 py-2", children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: r.full_name || "—" }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: r.email })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 font-mono text-xs", children: r.code }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx("span", { className: "rounded-full bg-muted px-2 py-0.5 text-xs", children: r.status }) }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxs("button", { onClick: () => setTierOpen(r), className: `rounded-full px-2 py-0.5 text-xs ${TIER_COLOR[r.tier]}`, title: r.tier_override ? "Manually overridden" : "Auto-computed", children: [
            TIER_LABEL[r.tier],
            r.tier_override ? " 🔒" : ""
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: r.referral_count }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: r.active_host_count }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: dollars(r.gmv_30d_cents) }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: dollars(r.pending_cents) }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: dollars(r.approved_cents) }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: dollars(r.paid_cents) }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap justify-end gap-2 text-xs", children: [
            r.status !== "approved" && /* @__PURE__ */ jsx("button", { onClick: () => changeStatus(r.id, "approved"), className: "rounded bg-primary px-2 py-1 text-primary-foreground", children: "Approve" }),
            r.status === "approved" && /* @__PURE__ */ jsx("button", { onClick: () => changeStatus(r.id, "paused"), className: "rounded border border-border px-2 py-1", children: "Pause" }),
            r.status !== "rejected" && /* @__PURE__ */ jsx("button", { onClick: () => changeStatus(r.id, "rejected"), className: "rounded border border-border px-2 py-1", children: "Reject" }),
            /* @__PURE__ */ jsx("button", { onClick: () => setLinkOpen(r), className: "rounded border border-border px-2 py-1", children: "Link host" }),
            /* @__PURE__ */ jsx("button", { onClick: () => setCoachingOpen(r), className: "rounded border border-border px-2 py-1", children: "Coaching log" }),
            /* @__PURE__ */ jsxs("button", { onClick: () => setPayoutOpen(r), disabled: r.approved_cents === 0, className: "rounded bg-green-600 px-2 py-1 text-white disabled:opacity-40", children: [
              "Pay ",
              dollars(r.approved_cents)
            ] })
          ] }) })
        ] }, r.id)),
        !busy && rows.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 11, className: "px-3 py-6 text-center text-muted-foreground", children: "No affiliates." }) })
      ] })
    ] }) }),
    linkOpen && /* @__PURE__ */ jsx(LinkHostDialog, { affiliate: linkOpen, onClose: () => setLinkOpen(null), onSaved: () => {
      setLinkOpen(null);
      load();
    } }),
    payoutOpen && /* @__PURE__ */ jsx(PayoutDialog, { affiliate: payoutOpen, onClose: () => setPayoutOpen(null), onSaved: () => {
      setPayoutOpen(null);
      load();
    } }),
    coachingOpen && /* @__PURE__ */ jsx(CoachingLogDrawer, { affiliate: coachingOpen, onClose: () => setCoachingOpen(null) }),
    tierOpen && /* @__PURE__ */ jsx(TierOverrideDialog, { affiliate: tierOpen, onClose: () => setTierOpen(null), onSaved: () => {
      setTierOpen(null);
      load();
    } })
  ] }) });
}
function Modal({
  children,
  onClose,
  wide
}) {
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", onClick: onClose, children: /* @__PURE__ */ jsx("div", { className: `w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[85vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-xl`, onClick: (e) => e.stopPropagation(), children }) });
}
function LinkHostDialog({
  affiliate,
  onClose,
  onSaved
}) {
  const [stId, setStId] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState(null);
  async function save() {
    setBusy(true);
    setErr(null);
    try {
      await linkHostToAffiliate({
        data: {
          affiliate_id: affiliate.id,
          sharetribe_user_id: stId.trim(),
          email_seen: email,
          display_name: name
        }
      });
      onSaved();
    } catch (e) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxs(Modal, { onClose, children: [
    /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "Link Sharetribe host" }),
    /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
      "Linking host to ",
      /* @__PURE__ */ jsx("strong", { children: affiliate.full_name || affiliate.email }),
      ". Find the user UUID in Sharetribe Console → Users."
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-3", children: [
      /* @__PURE__ */ jsx("input", { value: stId, onChange: (e) => setStId(e.target.value), placeholder: "Sharetribe user UUID", className: "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" }),
      /* @__PURE__ */ jsx("input", { value: email, onChange: (e) => setEmail(e.target.value), placeholder: "Host email (optional)", className: "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" }),
      /* @__PURE__ */ jsx("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "Display name (optional)", className: "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" }),
      err && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: err }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: onClose, className: "rounded border border-border px-3 py-1 text-sm", children: "Cancel" }),
        /* @__PURE__ */ jsx("button", { onClick: save, disabled: busy || !stId.trim(), className: "rounded bg-primary px-3 py-1 text-sm text-primary-foreground disabled:opacity-50", children: busy ? "Saving…" : "Link" })
      ] })
    ] })
  ] });
}
function PayoutDialog({
  affiliate,
  onClose,
  onSaved
}) {
  const [method, setMethod] = React.useState("paypal");
  const [reference, setReference] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState(null);
  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const r = await createAffiliatePayout({
        data: {
          affiliate_id: affiliate.id,
          method,
          reference,
          notes
        }
      });
      if (!r.ok) throw new Error("Failed");
      onSaved();
    } catch (e) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxs(Modal, { onClose, children: [
    /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "Record payout" }),
    /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
      "Paying ",
      /* @__PURE__ */ jsx("strong", { children: dollars(affiliate.approved_cents) }),
      " in approved commissions to",
      " ",
      affiliate.full_name || affiliate.email,
      "."
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-3", children: [
      /* @__PURE__ */ jsxs("select", { value: method, onChange: (e) => setMethod(e.target.value), className: "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm", children: [
        /* @__PURE__ */ jsx("option", { value: "paypal", children: "PayPal" }),
        /* @__PURE__ */ jsx("option", { value: "venmo", children: "Venmo" }),
        /* @__PURE__ */ jsx("option", { value: "ach", children: "ACH" }),
        /* @__PURE__ */ jsx("option", { value: "check", children: "Check" }),
        /* @__PURE__ */ jsx("option", { value: "other", children: "Other" })
      ] }),
      /* @__PURE__ */ jsx("input", { value: reference, onChange: (e) => setReference(e.target.value), placeholder: "Reference (tx id, check #)", className: "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" }),
      /* @__PURE__ */ jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), rows: 2, placeholder: "Notes (optional)", className: "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" }),
      err && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: err }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: onClose, className: "rounded border border-border px-3 py-1 text-sm", children: "Cancel" }),
        /* @__PURE__ */ jsx("button", { onClick: save, disabled: busy, className: "rounded bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-50", children: busy ? "Saving…" : "Record payout" })
      ] })
    ] })
  ] });
}
function CoachingLogDrawer({
  affiliate,
  onClose
}) {
  const [entries, setEntries] = React.useState(null);
  React.useEffect(() => {
    (async () => {
      const r = await listCoachingForAffiliate({
        data: {
          affiliate_id: affiliate.id
        }
      });
      setEntries(r.entries);
    })();
  }, [affiliate.id]);
  return /* @__PURE__ */ jsxs(Modal, { onClose, wide: true, children: [
    /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold", children: [
      "Coaching log — ",
      affiliate.full_name || affiliate.email
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "What this affiliate has done to support their crew. Empty log = they're recruiting but not coaching." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-2", children: [
      entries === null && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Loading…" }),
      entries && entries.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No coaching activity logged." }),
      entries?.map((e) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-background p-3 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx("span", { children: new Date(e.created_at).toLocaleString() }),
          e.template_used && /* @__PURE__ */ jsx("span", { className: "rounded bg-primary/10 px-2 py-0.5 text-primary", children: e.template_used })
        ] }),
        /* @__PURE__ */ jsx("pre", { className: "mt-2 whitespace-pre-wrap font-sans", children: e.note })
      ] }, e.id))
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-4 flex justify-end", children: /* @__PURE__ */ jsx("button", { onClick: onClose, className: "rounded border border-border px-3 py-1 text-sm", children: "Close" }) })
  ] });
}
function TierOverrideDialog({
  affiliate,
  onClose,
  onSaved
}) {
  const [tier, setTier] = React.useState(affiliate.tier);
  const [override, setOverride] = React.useState(affiliate.tier_override);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState(null);
  async function save() {
    setBusy(true);
    setErr(null);
    try {
      await setAffiliateTierOverride({
        data: {
          affiliate_id: affiliate.id,
          tier,
          override
        }
      });
      onSaved();
    } catch (e) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxs(Modal, { onClose, children: [
    /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold", children: [
      "Tier — ",
      affiliate.full_name || affiliate.email
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
      "Current: ",
      /* @__PURE__ */ jsx("span", { className: "font-semibold", children: TIER_LABEL[affiliate.tier] }),
      " ",
      affiliate.tier_override ? "(manually pinned)" : "(auto-computed)",
      "."
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-3", children: [
      /* @__PURE__ */ jsxs("select", { value: tier, onChange: (e) => setTier(e.target.value), className: "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm", children: [
        /* @__PURE__ */ jsx("option", { value: "starter", children: "Starter" }),
        /* @__PURE__ */ jsx("option", { value: "lead", children: "Lead Host" }),
        /* @__PURE__ */ jsx("option", { value: "captain", children: "Regional Captain" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", checked: override, onChange: (e) => setOverride(e.target.checked) }),
        "Pin this tier (don't let auto-recompute change it)"
      ] }),
      err && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: err }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: onClose, className: "rounded border border-border px-3 py-1 text-sm", children: "Cancel" }),
        /* @__PURE__ */ jsx("button", { onClick: save, disabled: busy, className: "rounded bg-primary px-3 py-1 text-sm text-primary-foreground disabled:opacity-50", children: busy ? "Saving…" : "Save" })
      ] })
    ] })
  ] });
}
export {
  AdminAffiliates as component
};
