import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { S as SiteHeader, e as SiteFooter, I as SITE_URL } from "./router-DV0zB2xT.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-Bd-cw3tB.js";
import { c as createServerFn } from "../server.js";
import { l as logCoachingActivity } from "./affiliate-coaching.functions-BYV2m0Ay.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
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
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
const getAffiliateDashboard = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("86168ccdee1dbdef8bdf4c447f92da1b1dde0709bb182a5f1e3421609b6e7ae5"));
const PayoutMethodSchema = z.object({
  payout_method: z.enum(["paypal", "venmo", "ach", "check"]),
  payout_details: z.record(z.string(), z.string().max(500))
});
const updateMyPayoutMethod = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => PayoutMethodSchema.parse(d)).handler(createSsrRpc("3bf8803c3fa924d600291acba2efb5c3f4a9d72a5064b455e273f1489467657f"));
const COACHING_TEMPLATES = [
  {
    id: "nextdoor-post",
    label: "Nextdoor post",
    channel: "nextdoor",
    body: `Hey neighbors — I just opened up my backyard pool for private hourly bookings on Pool Rental Near Me. $60/hour, fully insured, families only. If you're hunting for a way to cool off without the public-pool chaos, here's my listing: [paste your listing URL]`
  },
  {
    id: "facebook-group",
    label: "Facebook group post",
    channel: "facebook",
    body: `Just got my pool listed for private hourly rentals through Pool Rental Near Me. It's like Airbnb but for pools — I keep 90% of every booking and the $2M liability insurance is included. Book your group, a kid's party, or a date night here: [paste your listing URL]`
  },
  {
    id: "text-a-friend",
    label: "Text a friend",
    channel: "text",
    body: `Hey! Just opened my pool for private hourly bookings. $60/hr, two-hour minimum. If you know anyone with kids or want to do a pool party, send them my way: [paste your listing URL]`
  },
  {
    id: "instagram-story",
    label: "Instagram story script",
    channel: "instagram",
    body: `Story 1: photo of pool + "My backyard is now bookable by the hour 👇" + swipe-up sticker. Story 2: "$60/hr, fully insured, book here ↓" with link sticker pointing to your listing URL.`
  }
];
function dollars(c) {
  return `$${(c / 100).toLocaleString(void 0, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}
function dollarsShort(c) {
  return `$${Math.round(c / 100).toLocaleString()}`;
}
function AffiliatePage() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [coachingHost, setCoachingHost] = React.useState(null);
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const d = await getAffiliateDashboard();
      setData(d);
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => {
    load();
  }, [load]);
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col bg-background", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto w-full max-w-5xl flex-1 px-4 py-10", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-foreground", children: "Affiliate dashboard" }),
      loading && /* @__PURE__ */ jsx("p", { className: "mt-6 text-sm text-muted-foreground", children: "Loading…" }),
      !loading && !data?.affiliate && /* @__PURE__ */ jsxs("div", { className: "mt-8 rounded-2xl border border-border bg-card p-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "You're not in the affiliate program yet" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Apply with the same email you used to sign in. We'll review and email you when your link is live." }),
        /* @__PURE__ */ jsx(Link, { to: "/p/affiliate-program", className: "mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground", children: "Apply now" })
      ] }),
      !loading && data?.affiliate && data.affiliate.status !== "approved" && /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm", children: [
        "Your status is ",
        /* @__PURE__ */ jsx("strong", { children: data.affiliate.status }),
        ". Your referral link will activate once we approve your application."
      ] }),
      !loading && data?.affiliate && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(TierBlock, { tier: data.affiliate.tier, progress: data.tier_progress }),
        /* @__PURE__ */ jsx(LinkBox, { code: data.affiliate.code, disabled: data.affiliate.status !== "approved" }),
        /* @__PURE__ */ jsx(HowYouEarn, {}),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5", children: [
          /* @__PURE__ */ jsx(Stat, { label: "Clicks", value: data.totals.clicks.toString() }),
          /* @__PURE__ */ jsx(Stat, { label: "Hosts", value: data.totals.referred_hosts.toString() }),
          /* @__PURE__ */ jsx(Stat, { label: "Active", value: data.totals.active_hosts.toString(), hint: "3+ bookings, last 60d" }),
          /* @__PURE__ */ jsx(Stat, { label: "Pending", value: dollars(data.totals.pending_cents) }),
          /* @__PURE__ */ jsx(Stat, { label: "Paid", value: dollars(data.totals.paid_cents) })
        ] }),
        /* @__PURE__ */ jsx(PayoutMethodForm, { method: data.affiliate.payout_method, details: data.affiliate.payout_details, onSaved: load }),
        /* @__PURE__ */ jsx(Section, { title: "Your crew", children: data.crew.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No referred hosts yet. Share your link, then check back here to coach the hosts you bring in." }) : /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: data.crew.map((h) => /* @__PURE__ */ jsx(CrewCard, { host: h, onCoach: () => setCoachingHost(h) }, h.id)) }) }),
        /* @__PURE__ */ jsx(Section, { title: "Commission history", children: data.commissions.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No commissions yet." }) : /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "text-left text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "py-2", children: "Date" }),
            /* @__PURE__ */ jsx("th", { children: "Type" }),
            /* @__PURE__ */ jsx("th", { children: "Listing" }),
            /* @__PURE__ */ jsx("th", { children: "Booking" }),
            /* @__PURE__ */ jsx("th", { children: "You earn" }),
            /* @__PURE__ */ jsx("th", { children: "Status" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: data.commissions.map((c) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
            /* @__PURE__ */ jsx("td", { className: "py-2", children: new Date(c.booking_date).toLocaleDateString() }),
            /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(KindPill, { kind: c.kind }) }),
            /* @__PURE__ */ jsx("td", { children: c.listing_title || "—" }),
            /* @__PURE__ */ jsx("td", { children: dollars(c.booking_gross_cents) }),
            /* @__PURE__ */ jsx("td", { className: "font-medium", children: dollars(c.commission_cents) }),
            /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(StatusPill, { status: c.status }) })
          ] }, c.id)) })
        ] }) }),
        /* @__PURE__ */ jsx(Section, { title: "Payouts", children: data.payouts.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No payouts yet." }) : /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "text-left text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "py-2", children: "Date" }),
            /* @__PURE__ */ jsx("th", { children: "Method" }),
            /* @__PURE__ */ jsx("th", { children: "Reference" }),
            /* @__PURE__ */ jsx("th", { children: "Total" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: data.payouts.map((p) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
            /* @__PURE__ */ jsx("td", { className: "py-2", children: new Date(p.paid_at).toLocaleDateString() }),
            /* @__PURE__ */ jsx("td", { children: p.method || "—" }),
            /* @__PURE__ */ jsx("td", { className: "text-muted-foreground", children: p.reference || "—" }),
            /* @__PURE__ */ jsx("td", { className: "font-medium", children: dollars(p.total_cents) })
          ] }, p.id)) })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {}),
    coachingHost && /* @__PURE__ */ jsx(CoachingDialog, { host: coachingHost, onClose: () => setCoachingHost(null), onSaved: () => {
      setCoachingHost(null);
    } })
  ] });
}
const TIER_LABEL = {
  starter: "Starter",
  lead: "Lead Host",
  captain: "Regional Captain"
};
function TierBlock({
  tier,
  progress
}) {
  return /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-2xl border border-border bg-card p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Your tier" }),
        /* @__PURE__ */ jsx("div", { className: "mt-1 text-2xl font-bold text-foreground", children: TIER_LABEL[tier] })
      ] }),
      progress.next && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
        "Next tier: ",
        /* @__PURE__ */ jsx("span", { className: "font-semibold text-foreground", children: TIER_LABEL[progress.next] })
      ] })
    ] }),
    progress.next === "lead" && /* @__PURE__ */ jsx(ProgressBar, { label: `${progress.active_hosts_current}/${progress.active_hosts_required} active hosts → Lead Host`, value: progress.active_hosts_current, max: progress.active_hosts_required }),
    progress.next === "captain" && /* @__PURE__ */ jsx(ProgressBar, { label: `${dollarsShort(progress.gmv30_current_cents)} / ${dollarsShort(progress.gmv30_required_cents)} crew GMV in last 30d → Regional Captain`, value: progress.gmv30_current_cents, max: progress.gmv30_required_cents }),
    !progress.next && /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "You're at the top tier. Keep your crew active to stay there." })
  ] });
}
function ProgressBar({
  label,
  value,
  max
}) {
  const pct = Math.min(100, Math.round(value / max * 100));
  return /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "mt-1 h-2 w-full overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-primary transition-all", style: {
      width: `${pct}%`
    } }) })
  ] });
}
function HowYouEarn() {
  return /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold uppercase tracking-wide text-primary", children: "How you earn" }),
    /* @__PURE__ */ jsxs("ol", { className: "mt-3 space-y-2 text-sm", children: [
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Host's 1st booking" }),
        " → you get a ",
        /* @__PURE__ */ jsx("strong", { children: "$100 activation bonus" })
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Host's 3rd booking" }),
        " → unlocks ",
        /* @__PURE__ */ jsx("strong", { children: "5% recurring" }),
        " on every booking after that"
      ] }),
      /* @__PURE__ */ jsx("li", { children: "Host goes 60 days without a booking → commissions pause; resume on next booking" })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-muted-foreground", children: "Your job isn't just to sign hosts up. Coach them. Tell them to post on Nextdoor, in Facebook groups, to their friends. Hosts who get to 3 bookings are the ones who pay you forever." })
  ] });
}
function CrewCard({
  host,
  onCoach
}) {
  const dotColor = host.status === "active" ? "bg-green-500" : host.status === "warming" ? "bg-yellow-500" : host.status === "dormant" ? "bg-red-500" : "bg-muted-foreground";
  const statusLabel = {
    active: "Active",
    warming: `Warming (${host.completed_bookings_count}/3 bookings)`,
    dormant: "Dormant — needs coaching",
    new: "Signed up — no bookings yet"
  }[host.status];
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-background p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: `h-2 w-2 rounded-full ${dotColor}` }),
          /* @__PURE__ */ jsx("span", { className: "truncate font-medium", children: host.display_name || host.email_seen || "(host)" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: statusLabel })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-right text-xs", children: [
        /* @__PURE__ */ jsx("div", { className: "font-semibold text-foreground", children: dollars(host.total_earned_cents) }),
        /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: "earned" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3 grid grid-cols-3 gap-2 text-xs", children: [
      /* @__PURE__ */ jsx(Mini, { label: "Bookings", value: host.completed_bookings_count.toString() }),
      /* @__PURE__ */ jsx(Mini, { label: "GMV", value: dollarsShort(host.total_gross_cents) }),
      /* @__PURE__ */ jsx(Mini, { label: "Last booking", value: host.last_booking_at ? new Date(host.last_booking_at).toLocaleDateString() : "—" })
    ] }),
    /* @__PURE__ */ jsx("button", { onClick: onCoach, className: "mt-3 w-full rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground", children: "Log coaching activity" })
  ] });
}
function Mini({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded bg-muted/40 p-2", children: [
    /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "mt-0.5 font-medium", children: value })
  ] });
}
function CoachingDialog({
  host,
  onClose,
  onSaved
}) {
  const [template, setTemplate] = React.useState(null);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState(null);
  async function save() {
    if (!note.trim()) {
      setErr("Add a short note about what you did.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await logCoachingActivity({
        data: {
          referral_id: host.id,
          note: note.trim(),
          template_used: template?.id ?? null
        }
      });
      onSaved();
    } catch (e) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }
  function pickTemplate(t) {
    setTemplate(t);
    setNote(`Sent ${t.label} to ${host.display_name || "host"}:

${t.body}`);
  }
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold", children: [
      "Coach ",
      host.display_name || host.email_seen || "this host"
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Pick a script to send them, or write your own note about what you did." }),
    /* @__PURE__ */ jsx("div", { className: "mt-4 grid grid-cols-2 gap-2", children: COACHING_TEMPLATES.map((t) => /* @__PURE__ */ jsxs("button", { onClick: () => pickTemplate(t), className: `rounded-lg border px-3 py-2 text-left text-xs ${template?.id === t.id ? "border-primary bg-primary/10" : "border-border bg-background"}`, children: [
      /* @__PURE__ */ jsx("div", { className: "font-semibold", children: t.label }),
      /* @__PURE__ */ jsx("div", { className: "text-muted-foreground capitalize", children: t.channel })
    ] }, t.id)) }),
    /* @__PURE__ */ jsx("textarea", { value: note, onChange: (e) => setNote(e.target.value), rows: 8, placeholder: "What did you do to help this host? (e.g. 'Texted Sarah the Nextdoor script — she posted it 3pm Friday')", className: "mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm", maxLength: 2e3 }),
    err && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-destructive", children: err }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 flex justify-end gap-2", children: [
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "rounded border border-border px-3 py-1 text-sm", children: "Cancel" }),
      /* @__PURE__ */ jsx("button", { onClick: save, disabled: busy, className: "rounded bg-primary px-3 py-1 text-sm text-primary-foreground disabled:opacity-50", children: busy ? "Saving…" : "Log activity" })
    ] })
  ] }) });
}
function Stat({
  label,
  value,
  hint
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-4", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "mt-1 text-xl font-semibold text-foreground", children: value }),
    hint && /* @__PURE__ */ jsx("div", { className: "mt-0.5 text-[10px] text-muted-foreground", children: hint })
  ] });
}
function Section({
  title,
  children
}) {
  return /* @__PURE__ */ jsxs("section", { className: "mt-8 rounded-2xl border border-border bg-card p-6", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-foreground", children: title }),
    /* @__PURE__ */ jsx("div", { className: "mt-4 overflow-x-auto", children })
  ] });
}
function StatusPill({
  status
}) {
  const map = {
    pending: "bg-yellow-500/20 text-yellow-700",
    approved: "bg-blue-500/20 text-blue-700",
    paid: "bg-green-500/20 text-green-700",
    reversed: "bg-red-500/20 text-red-700"
  };
  return /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${map[status] || "bg-muted text-foreground"}`, children: status });
}
function KindPill({
  kind
}) {
  return /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${kind === "activation_bonus" ? "bg-amber-500/20 text-amber-700" : "bg-primary/15 text-primary"}`, children: kind === "activation_bonus" ? "Activation bonus" : "Recurring 5%" });
}
function LinkBox({
  code,
  disabled
}) {
  const url = `${SITE_URL}/?ref=${code}`;
  const [copied, setCopied] = React.useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-6", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Your referral link" }),
    /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-3", children: [
      /* @__PURE__ */ jsx("code", { className: "flex-1 break-all rounded-lg bg-background px-3 py-2 text-sm", children: url }),
      /* @__PURE__ */ jsx("button", { disabled, onClick: async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }, className: "rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: copied ? "Copied!" : "Copy" })
    ] })
  ] });
}
function PayoutMethodForm({
  method,
  details,
  onSaved
}) {
  const [m, setM] = React.useState(method || "paypal");
  const [handle, setHandle] = React.useState(details.handle || details.email || "");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState(null);
  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await updateMyPayoutMethod({
        data: {
          payout_method: m,
          payout_details: {
            handle
          }
        }
      });
      setMsg(res.ok ? "Saved." : "Could not save.");
      if (res.ok) onSaved();
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxs("section", { className: "mt-8 rounded-2xl border border-border bg-card p-6", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-foreground", children: "Payout method" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "How you want to be paid out. We process payouts monthly." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-3 sm:grid-cols-[160px_1fr_auto]", children: [
      /* @__PURE__ */ jsxs("select", { value: m, onChange: (e) => setM(e.target.value), className: "rounded-lg border border-border bg-background px-3 py-2 text-sm", children: [
        /* @__PURE__ */ jsx("option", { value: "paypal", children: "PayPal" }),
        /* @__PURE__ */ jsx("option", { value: "venmo", children: "Venmo" }),
        /* @__PURE__ */ jsx("option", { value: "ach", children: "ACH (US bank)" }),
        /* @__PURE__ */ jsx("option", { value: "check", children: "Mailed check" })
      ] }),
      /* @__PURE__ */ jsx("input", { value: handle, onChange: (e) => setHandle(e.target.value), placeholder: m === "ach" ? "Bank account info" : m === "check" ? "Mailing address" : "Email or @handle", className: "rounded-lg border border-border bg-background px-3 py-2 text-sm", maxLength: 500 }),
      /* @__PURE__ */ jsx("button", { onClick: save, disabled: busy, className: "rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60", children: busy ? "Saving…" : "Save" })
    ] }),
    msg && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: msg })
  ] });
}
export {
  AffiliatePage as component
};
