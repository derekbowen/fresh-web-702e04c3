import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { A as AdminLayout } from "./admin-layout-BNp_05PW.js";
import { toast } from "sonner";
import { c as createSsrRpc } from "./cities.functions-XBYRqf13.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
import { c as createServerFn } from "../server.js";
import "@tanstack/react-router";
import "lucide-react";
import "./router-BvRNdW25.js";
import "./site-footer-defaults-C7gHxS5b.js";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
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
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
const getFollowupInbox = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  status: z.enum(["all", "new", "attempting", "connected", "no_response", "not_interested", "converted", "do_not_contact"]).optional(),
  source: z.enum(["all", "host_lead", "ig_lead", "social_lead", "provider_lead"]).optional(),
  sort: z.enum(["score", "newest", "next_action"]).optional(),
  limit: z.number().int().min(1).max(500).optional()
}).parse(d ?? {})).handler(createSsrRpc("8404956fca184665ffcbb34fcb5c220c619fd6f63755d8b24173d3685980daea"));
const updateFollowup = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "attempting", "connected", "no_response", "not_interested", "converted", "do_not_contact"]).optional(),
  next_action_at: z.string().nullable().optional(),
  notes: z.string().max(4e3).nullable().optional()
}).parse(d)).handler(createSsrRpc("febfe38c97fa3a15ae7724864767fb2d35205dd0336258ca6f98378fef8f4425"));
const logTouch = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  followup_id: z.string().uuid(),
  channel: z.enum(["sms", "call", "email", "dm", "note", "other"]),
  outcome: z.enum(["sent", "delivered", "replied", "bounced", "no_answer", "voicemail", "interested", "not_interested", "meeting_booked", "converted"]).nullable().optional(),
  body: z.string().max(4e3).nullable().optional()
}).parse(d)).handler(createSsrRpc("b26d8c3c8196e8f65dfee018911296dee203eb684fd3033fe75559316dda448d"));
const getTouches = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  followup_id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("f374c38bad61a2c47688980d05f1207efa58882bb1a89466e339d07ba040c76c"));
const aiScoreFollowup = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("2847a868ec2f518d61b90ae38ad0a6b05a42679e39885a7f28bc5472947122b4"));
const aiScoreUnscored = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  limit: z.number().int().min(1).max(50).optional()
}).parse(d ?? {})).handler(createSsrRpc("67d1a19e82f7379a1dc4cef9d75188a1cded1dc9e030cc32f8722d50c3c60038"));
const STATUSES = ["new", "attempting", "connected", "no_response", "not_interested", "converted", "do_not_contact"];
const STATUS_LABEL = {
  new: "New",
  attempting: "Attempting",
  connected: "Connected",
  no_response: "No response",
  not_interested: "Not interested",
  converted: "Converted",
  do_not_contact: "DNC"
};
const STATUS_COLOR = {
  new: "bg-blue-100 text-blue-800",
  attempting: "bg-amber-100 text-amber-900",
  connected: "bg-emerald-100 text-emerald-900",
  no_response: "bg-zinc-100 text-zinc-700",
  not_interested: "bg-rose-100 text-rose-800",
  converted: "bg-purple-100 text-purple-900",
  do_not_contact: "bg-red-200 text-red-900"
};
const SOURCE_LABEL = {
  host_lead: "Host form",
  ig_lead: "Instagram",
  social_lead: "Social",
  provider_lead: "Provider"
};
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(void 0, {
    month: "short",
    day: "numeric"
  });
}
function FollowupsPage() {
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sourceFilter, setSourceFilter] = React.useState("all");
  const [sort, setSort] = React.useState("score");
  const [openId, setOpenId] = React.useState(null);
  const inboxFn = useServerFn(getFollowupInbox);
  const qc = useQueryClient();
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["followups", statusFilter, sourceFilter, sort],
    queryFn: () => inboxFn({
      data: {
        status: statusFilter,
        source: sourceFilter,
        sort
      }
    })
  });
  const scoreUnscoredFn = useServerFn(aiScoreUnscored);
  const bulkScore = useMutation({
    mutationFn: () => scoreUnscoredFn({
      data: {
        limit: 10
      }
    }),
    onSuccess: (r) => {
      toast.success(`Scored ${r.processed} new lead${r.processed === 1 ? "" : "s"}`);
      qc.invalidateQueries({
        queryKey: ["followups"]
      });
    },
    onError: (e) => toast.error(e?.message ?? "Score failed")
  });
  const rows = data?.rows ?? [];
  const counts = React.useMemo(() => {
    const c = {
      all: rows.length
    };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);
  return /* @__PURE__ */ jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl space-y-5 p-6", children: [
      /* @__PURE__ */ jsxs("header", { className: "flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Follow-ups" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "One inbox for every lead. Track who you've reached, who's connected, and who needs a nudge." })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => bulkScore.mutate(), disabled: bulkScore.isPending, className: "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50", children: bulkScore.isPending ? "Scoring…" : "AI score 10 new" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1", children: [
          /* @__PURE__ */ jsxs(FilterChip, { active: statusFilter === "all", onClick: () => setStatusFilter("all"), children: [
            "All (",
            counts.all ?? 0,
            ")"
          ] }),
          STATUSES.map((s) => /* @__PURE__ */ jsxs(FilterChip, { active: statusFilter === s, onClick: () => setStatusFilter(s), children: [
            STATUS_LABEL[s],
            " (",
            counts[s] ?? 0,
            ")"
          ] }, s))
        ] }),
        /* @__PURE__ */ jsxs("select", { value: sourceFilter, onChange: (e) => setSourceFilter(e.target.value), className: "rounded-lg border border-border bg-card px-3 py-2 text-sm", children: [
          /* @__PURE__ */ jsx("option", { value: "all", children: "All sources" }),
          /* @__PURE__ */ jsx("option", { value: "host_lead", children: "Host form" }),
          /* @__PURE__ */ jsx("option", { value: "ig_lead", children: "Instagram" })
        ] }),
        /* @__PURE__ */ jsxs("select", { value: sort, onChange: (e) => setSort(e.target.value), className: "rounded-lg border border-border bg-card px-3 py-2 text-sm", children: [
          /* @__PURE__ */ jsx("option", { value: "score", children: "Sort: AI score" }),
          /* @__PURE__ */ jsx("option", { value: "newest", children: "Sort: Newest" }),
          /* @__PURE__ */ jsx("option", { value: "next_action", children: "Sort: Next action" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-xl border border-border bg-card", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Score" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Lead" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Source" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Last touch" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Next action" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Touches" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          isLoading && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 8, className: "px-3 py-8 text-center text-muted-foreground", children: "Loading…" }) }),
          !isLoading && rows.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 8, className: "px-3 py-8 text-center text-muted-foreground", children: "No leads match these filters." }) }),
          rows.map((r) => /* @__PURE__ */ jsx(Row, { row: r, onOpen: () => setOpenId(r.id) }, r.id))
        ] })
      ] }) })
    ] }),
    openId && /* @__PURE__ */ jsx(DetailDrawer, { followupId: openId, row: rows.find((r) => r.id === openId), onClose: () => setOpenId(null) })
  ] });
}
function FilterChip({
  active,
  onClick,
  children
}) {
  return /* @__PURE__ */ jsx("button", { onClick, className: `rounded-lg px-3 py-1.5 text-xs font-medium transition ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`, children });
}
function Row({
  row,
  onOpen
}) {
  const score = row.ai_score;
  return /* @__PURE__ */ jsxs("tr", { className: "border-b border-border last:border-0 hover:bg-muted/30", children: [
    /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: score == null ? /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "—" }) : /* @__PURE__ */ jsx("span", { title: row.ai_score_reason ?? "", className: `inline-flex h-7 w-9 items-center justify-center rounded-md text-xs font-bold ${score >= 70 ? "bg-emerald-100 text-emerald-900" : score >= 40 ? "bg-amber-100 text-amber-900" : "bg-zinc-100 text-zinc-700"}`, children: score }) }),
    /* @__PURE__ */ jsxs("td", { className: "px-3 py-2", children: [
      /* @__PURE__ */ jsx("div", { className: "font-medium text-foreground", children: row.display_name ?? row.lead_id.slice(0, 8) }),
      row.display_subtitle && /* @__PURE__ */ jsx("div", { className: "line-clamp-1 text-xs text-muted-foreground", children: row.display_subtitle })
    ] }),
    /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs text-muted-foreground", children: SOURCE_LABEL[row.source] ?? row.source }),
    /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx("span", { className: `rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[row.status]}`, children: STATUS_LABEL[row.status] }) }),
    /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs text-muted-foreground", children: fmtDate(row.last_touch_at) }),
    /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs text-muted-foreground", children: fmtDate(row.next_action_at) }),
    /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs", children: row.touch_count }),
    /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right", children: /* @__PURE__ */ jsx("button", { onClick: onOpen, className: "rounded-md border border-border px-3 py-1 text-xs font-medium hover:border-primary", children: "Open" }) })
  ] });
}
function DetailDrawer({
  followupId,
  row,
  onClose
}) {
  const qc = useQueryClient();
  const touchesFn = useServerFn(getTouches);
  const updateFn = useServerFn(updateFollowup);
  const logFn = useServerFn(logTouch);
  const scoreFn = useServerFn(aiScoreFollowup);
  const {
    data: touchesData
  } = useQuery({
    queryKey: ["touches", followupId],
    queryFn: () => touchesFn({
      data: {
        followup_id: followupId
      }
    })
  });
  const [channel, setChannel] = React.useState("note");
  const [outcome, setOutcome] = React.useState("");
  const [body, setBody] = React.useState("");
  const [notes, setNotes] = React.useState(row.notes ?? "");
  const [nextAction, setNextAction] = React.useState(row.next_action_at?.slice(0, 10) ?? "");
  const [status, setStatus] = React.useState(row.status);
  const log = useMutation({
    mutationFn: () => logFn({
      data: {
        followup_id: followupId,
        channel,
        outcome: outcome || null,
        body: body || null
      }
    }),
    onSuccess: () => {
      toast.success("Touch logged");
      setBody("");
      setOutcome("");
      qc.invalidateQueries({
        queryKey: ["touches", followupId]
      });
      qc.invalidateQueries({
        queryKey: ["followups"]
      });
    },
    onError: (e) => toast.error(e?.message ?? "Failed")
  });
  const save = useMutation({
    mutationFn: () => updateFn({
      data: {
        id: followupId,
        status,
        notes,
        next_action_at: nextAction ? new Date(nextAction).toISOString() : null
      }
    }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({
        queryKey: ["followups"]
      });
    },
    onError: (e) => toast.error(e?.message ?? "Failed")
  });
  const score = useMutation({
    mutationFn: () => scoreFn({
      data: {
        id: followupId
      }
    }),
    onSuccess: (r) => {
      if (r.ok) toast.success(`AI score: ${r.score}`);
      else toast.error(r.error ?? "Failed");
      qc.invalidateQueries({
        queryKey: ["followups"]
      });
    }
  });
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 flex", onClick: onClose, children: [
    /* @__PURE__ */ jsx("div", { className: "flex-1 bg-black/40" }),
    /* @__PURE__ */ jsxs("div", { onClick: (e) => e.stopPropagation(), className: "flex h-full w-full max-w-xl flex-col overflow-y-auto bg-background shadow-2xl", children: [
      /* @__PURE__ */ jsxs("header", { className: "flex items-start justify-between border-b border-border p-5", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: row.display_name ?? "Lead" }),
          row.display_subtitle && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: row.display_subtitle }),
          row.display_link && /* @__PURE__ */ jsx("a", { href: row.display_link, target: "_blank", rel: "noreferrer", className: "mt-1 block text-xs text-primary hover:underline", children: row.display_link })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: onClose, className: "rounded-md border border-border px-2 py-1 text-xs", children: "Close" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-5 p-5", children: [
        /* @__PURE__ */ jsxs("section", { className: "grid gap-3 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("label", { className: "block", children: [
            /* @__PURE__ */ jsx("span", { className: "mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Status" }),
            /* @__PURE__ */ jsx("select", { value: status, onChange: (e) => setStatus(e.target.value), className: "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm", children: STATUSES.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: STATUS_LABEL[s] }, s)) })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "block", children: [
            /* @__PURE__ */ jsx("span", { className: "mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Next action" }),
            /* @__PURE__ */ jsx("input", { type: "date", value: nextAction, onChange: (e) => setNextAction(e.target.value), className: "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("section", { children: [
          /* @__PURE__ */ jsx("span", { className: "mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Notes" }),
          /* @__PURE__ */ jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), rows: 3, className: "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm", placeholder: "Anything you want to remember about this lead…" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex gap-2", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => save.mutate(), disabled: save.isPending, className: "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50", children: save.isPending ? "Saving…" : "Save" }),
            /* @__PURE__ */ jsx("button", { onClick: () => score.mutate(), disabled: score.isPending, className: "rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:border-primary disabled:opacity-50", children: score.isPending ? "Scoring…" : "AI re-score" })
          ] }),
          row.ai_score_reason && /* @__PURE__ */ jsxs("p", { className: "mt-2 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("strong", { className: "text-foreground", children: [
              "AI (",
              row.ai_score,
              "):"
            ] }),
            " ",
            row.ai_score_reason
          ] })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "rounded-xl border border-border bg-muted/30 p-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "mb-2 text-sm font-bold", children: "Log a touch" }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-2 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("select", { value: channel, onChange: (e) => setChannel(e.target.value), className: "rounded-lg border border-border bg-card px-3 py-2 text-sm", children: [
              /* @__PURE__ */ jsx("option", { value: "sms", children: "SMS" }),
              /* @__PURE__ */ jsx("option", { value: "call", children: "Call" }),
              /* @__PURE__ */ jsx("option", { value: "email", children: "Email" }),
              /* @__PURE__ */ jsx("option", { value: "dm", children: "DM" }),
              /* @__PURE__ */ jsx("option", { value: "note", children: "Note" }),
              /* @__PURE__ */ jsx("option", { value: "other", children: "Other" })
            ] }),
            /* @__PURE__ */ jsxs("select", { value: outcome, onChange: (e) => setOutcome(e.target.value), className: "rounded-lg border border-border bg-card px-3 py-2 text-sm", children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "Outcome…" }),
              /* @__PURE__ */ jsx("option", { value: "sent", children: "Sent" }),
              /* @__PURE__ */ jsx("option", { value: "delivered", children: "Delivered" }),
              /* @__PURE__ */ jsx("option", { value: "replied", children: "Replied" }),
              /* @__PURE__ */ jsx("option", { value: "no_answer", children: "No answer" }),
              /* @__PURE__ */ jsx("option", { value: "voicemail", children: "Voicemail" }),
              /* @__PURE__ */ jsx("option", { value: "bounced", children: "Bounced" }),
              /* @__PURE__ */ jsx("option", { value: "interested", children: "Interested" }),
              /* @__PURE__ */ jsx("option", { value: "not_interested", children: "Not interested" }),
              /* @__PURE__ */ jsx("option", { value: "meeting_booked", children: "Meeting booked" }),
              /* @__PURE__ */ jsx("option", { value: "converted", children: "Converted" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("textarea", { value: body, onChange: (e) => setBody(e.target.value), rows: 2, placeholder: "What happened? (optional)", className: "mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" }),
          /* @__PURE__ */ jsx("button", { onClick: () => log.mutate(), disabled: log.isPending, className: "mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50", children: log.isPending ? "Logging…" : "Log touch" })
        ] }),
        /* @__PURE__ */ jsxs("section", { children: [
          /* @__PURE__ */ jsx("h3", { className: "mb-2 text-sm font-bold", children: "History" }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2", children: [
            (touchesData?.rows ?? []).map((t) => /* @__PURE__ */ jsxs("li", { className: "rounded-lg border border-border bg-card p-3 text-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx("strong", { className: "uppercase text-foreground", children: t.channel }),
                  t.outcome ? ` · ${t.outcome.replace(/_/g, " ")}` : ""
                ] }),
                /* @__PURE__ */ jsx("span", { children: new Date(t.occurred_at).toLocaleString() })
              ] }),
              t.body && /* @__PURE__ */ jsx("p", { className: "mt-1 whitespace-pre-wrap text-foreground", children: t.body })
            ] }, t.id)),
            (touchesData?.rows ?? []).length === 0 && /* @__PURE__ */ jsx("li", { className: "rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground", children: "No touches yet." })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  FollowupsPage as component
};
