import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { toast } from "sonner";
import {
  getFollowupInbox,
  updateFollowup,
  logTouch,
  getTouches,
  aiScoreFollowup,
  aiScoreUnscored,
  type FollowupRow,
  type FollowupStatus,
  type TouchChannel,
  type TouchOutcome,
} from "@/lib/lead-followups.functions";

export const Route = createFileRoute("/admin/follow-ups")({
  component: FollowupsPage,
});

const STATUSES: FollowupStatus[] = [
  "new",
  "attempting",
  "connected",
  "no_response",
  "not_interested",
  "converted",
  "do_not_contact",
];

const STATUS_LABEL: Record<FollowupStatus, string> = {
  new: "New",
  attempting: "Attempting",
  connected: "Connected",
  no_response: "No response",
  not_interested: "Not interested",
  converted: "Converted",
  do_not_contact: "DNC",
};

const STATUS_COLOR: Record<FollowupStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  attempting: "bg-amber-100 text-amber-900",
  connected: "bg-emerald-100 text-emerald-900",
  no_response: "bg-zinc-100 text-zinc-700",
  not_interested: "bg-rose-100 text-rose-800",
  converted: "bg-purple-100 text-purple-900",
  do_not_contact: "bg-red-200 text-red-900",
};

const SOURCE_LABEL: Record<string, string> = {
  host_lead: "Host form",
  ig_lead: "Instagram",
  social_lead: "Social",
  provider_lead: "Provider",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function FollowupsPage() {
  const [statusFilter, setStatusFilter] = React.useState<"all" | FollowupStatus>("all");
  const [sourceFilter, setSourceFilter] = React.useState<"all" | "host_lead" | "ig_lead">("all");
  const [sort, setSort] = React.useState<"score" | "newest" | "next_action">("score");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const inboxFn = useServerFn(getFollowupInbox);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["followups", statusFilter, sourceFilter, sort],
    queryFn: () => inboxFn({ data: { status: statusFilter, source: sourceFilter, sort } }),
  });

  const scoreUnscoredFn = useServerFn(aiScoreUnscored);
  const bulkScore = useMutation({
    mutationFn: () => scoreUnscoredFn({ data: { limit: 10 } }),
    onSuccess: (r) => {
      toast.success(`Scored ${r.processed} new lead${r.processed === 1 ? "" : "s"}`);
      qc.invalidateQueries({ queryKey: ["followups"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Score failed"),
  });

  const rows = data?.rows ?? [];
  const counts = React.useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-5 p-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Follow-ups</h1>
            <p className="text-sm text-muted-foreground">
              One inbox for every lead. Track who you've reached, who's connected, and who needs a nudge.
            </p>
          </div>
          <button
            onClick={() => bulkScore.mutate()}
            disabled={bulkScore.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
          >
            {bulkScore.isPending ? "Scoring…" : "AI score 10 new"}
          </button>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1">
            <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
              All ({counts.all ?? 0})
            </FilterChip>
            {STATUSES.map((s) => (
              <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                {STATUS_LABEL[s]} ({counts[s] ?? 0})
              </FilterChip>
            ))}
          </div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as any)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="all">All sources</option>
            <option value="host_lead">Host form</option>
            <option value="ig_lead">Instagram</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="score">Sort: AI score</option>
            <option value="newest">Sort: Newest</option>
            <option value="next_action">Sort: Next action</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Lead</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Last touch</th>
                <th className="px-3 py-2">Next action</th>
                <th className="px-3 py-2">Touches</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                    No leads match these filters.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <Row key={r.id} row={r} onOpen={() => setOpenId(r.id)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {openId && (
        <DetailDrawer
          followupId={openId}
          row={rows.find((r) => r.id === openId)!}
          onClose={() => setOpenId(null)}
        />
      )}
    </AdminLayout>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Row({ row, onOpen }: { row: FollowupRow; onOpen: () => void }) {
  const score = row.ai_score;
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30">
      <td className="px-3 py-2">
        {score == null ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <span
            title={row.ai_score_reason ?? ""}
            className={`inline-flex h-7 w-9 items-center justify-center rounded-md text-xs font-bold ${
              score >= 70 ? "bg-emerald-100 text-emerald-900" : score >= 40 ? "bg-amber-100 text-amber-900" : "bg-zinc-100 text-zinc-700"
            }`}
          >
            {score}
          </span>
        )}
      </td>
      <td className="px-3 py-2">
        <div className="font-medium text-foreground">{row.display_name ?? row.lead_id.slice(0, 8)}</div>
        {row.display_subtitle && (
          <div className="line-clamp-1 text-xs text-muted-foreground">{row.display_subtitle}</div>
        )}
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">{SOURCE_LABEL[row.source] ?? row.source}</td>
      <td className="px-3 py-2">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[row.status]}`}>
          {STATUS_LABEL[row.status]}
        </span>
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">{fmtDate(row.last_touch_at)}</td>
      <td className="px-3 py-2 text-xs text-muted-foreground">{fmtDate(row.next_action_at)}</td>
      <td className="px-3 py-2 text-xs">{row.touch_count}</td>
      <td className="px-3 py-2 text-right">
        <button
          onClick={onOpen}
          className="rounded-md border border-border px-3 py-1 text-xs font-medium hover:border-primary"
        >
          Open
        </button>
      </td>
    </tr>
  );
}

function DetailDrawer({
  followupId,
  row,
  onClose,
}: {
  followupId: string;
  row: FollowupRow;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const touchesFn = useServerFn(getTouches);
  const updateFn = useServerFn(updateFollowup);
  const logFn = useServerFn(logTouch);
  const scoreFn = useServerFn(aiScoreFollowup);

  const { data: touchesData } = useQuery({
    queryKey: ["touches", followupId],
    queryFn: () => touchesFn({ data: { followup_id: followupId } }),
  });

  const [channel, setChannel] = React.useState<TouchChannel>("note");
  const [outcome, setOutcome] = React.useState<TouchOutcome | "">("");
  const [body, setBody] = React.useState("");
  const [notes, setNotes] = React.useState(row.notes ?? "");
  const [nextAction, setNextAction] = React.useState(row.next_action_at?.slice(0, 10) ?? "");
  const [status, setStatus] = React.useState<FollowupStatus>(row.status);

  const log = useMutation({
    mutationFn: () =>
      logFn({
        data: {
          followup_id: followupId,
          channel,
          outcome: (outcome || null) as TouchOutcome | null,
          body: body || null,
        },
      }),
    onSuccess: () => {
      toast.success("Touch logged");
      setBody("");
      setOutcome("");
      qc.invalidateQueries({ queryKey: ["touches", followupId] });
      qc.invalidateQueries({ queryKey: ["followups"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const save = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          id: followupId,
          status,
          notes,
          next_action_at: nextAction ? new Date(nextAction).toISOString() : null,
        },
      }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["followups"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const score = useMutation({
    mutationFn: () => scoreFn({ data: { id: followupId } }),
    onSuccess: (r) => {
      if (r.ok) toast.success(`AI score: ${r.score}`);
      else toast.error(r.error ?? "Failed");
      qc.invalidateQueries({ queryKey: ["followups"] });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/40" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-background shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-border p-5">
          <div>
            <h2 className="text-lg font-bold">{row.display_name ?? "Lead"}</h2>
            {row.display_subtitle && <p className="text-sm text-muted-foreground">{row.display_subtitle}</p>}
            {row.display_link && (
              <a href={row.display_link} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-primary hover:underline">
                {row.display_link}
              </a>
            )}
          </div>
          <button onClick={onClose} className="rounded-md border border-border px-2 py-1 text-xs">Close</button>
        </header>

        <div className="space-y-5 p-5">
          {/* Status + AI score */}
          <section className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FollowupStatus)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next action</span>
              <input
                type="date"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              />
            </label>
          </section>

          {/* Notes */}
          <section>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              placeholder="Anything you want to remember about this lead…"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => save.mutate()}
                disabled={save.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {save.isPending ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => score.mutate()}
                disabled={score.isPending}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:border-primary disabled:opacity-50"
              >
                {score.isPending ? "Scoring…" : "AI re-score"}
              </button>
            </div>
            {row.ai_score_reason && (
              <p className="mt-2 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                <strong className="text-foreground">AI ({row.ai_score}):</strong> {row.ai_score_reason}
              </p>
            )}
          </section>

          {/* Log a touch */}
          <section className="rounded-xl border border-border bg-muted/30 p-4">
            <h3 className="mb-2 text-sm font-bold">Log a touch</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as TouchChannel)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="sms">SMS</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="dm">DM</option>
                <option value="note">Note</option>
                <option value="other">Other</option>
              </select>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as TouchOutcome | "")}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="">Outcome…</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="replied">Replied</option>
                <option value="no_answer">No answer</option>
                <option value="voicemail">Voicemail</option>
                <option value="bounced">Bounced</option>
                <option value="interested">Interested</option>
                <option value="not_interested">Not interested</option>
                <option value="meeting_booked">Meeting booked</option>
                <option value="converted">Converted</option>
              </select>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={2}
              placeholder="What happened? (optional)"
              className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            />
            <button
              onClick={() => log.mutate()}
              disabled={log.isPending}
              className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {log.isPending ? "Logging…" : "Log touch"}
            </button>
          </section>

          {/* Touch history */}
          <section>
            <h3 className="mb-2 text-sm font-bold">History</h3>
            <ul className="space-y-2">
              {(touchesData?.rows ?? []).map((t) => (
                <li key={t.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      <strong className="uppercase text-foreground">{t.channel}</strong>
                      {t.outcome ? ` · ${t.outcome.replace(/_/g, " ")}` : ""}
                    </span>
                    <span>{new Date(t.occurred_at).toLocaleString()}</span>
                  </div>
                  {t.body && <p className="mt-1 whitespace-pre-wrap text-foreground">{t.body}</p>}
                </li>
              ))}
              {(touchesData?.rows ?? []).length === 0 && (
                <li className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  No touches yet.
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
