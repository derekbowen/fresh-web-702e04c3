import * as React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin-layout";
import {
  getDeliverabilityStats,
  getDeliverabilityLog,
  getSuppressions,
  removeSuppression,
  addSuppression,
} from "@/server/email-deliverability.functions";

export const Route = createFileRoute("/admin/email-deliverability")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: "/admin/email-deliverability", mode: "signin" } });
    }
  },
  head: () => ({
    meta: [
      { title: "Email deliverability — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: DeliverabilityPage,
});

type Range = "24h" | "7d" | "30d";
type Tab = "overview" | "log" | "suppressed";

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm border ${
        active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    sent: "bg-green-500/15 text-green-600 border-green-500/30",
    pending: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    failed: "bg-red-500/15 text-red-600 border-red-500/30",
    dlq: "bg-red-500/15 text-red-600 border-red-500/30",
    bounced: "bg-orange-500/15 text-orange-600 border-orange-500/30",
    complained: "bg-purple-500/15 text-purple-600 border-purple-500/30",
    suppressed: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  };
  const cls = map[status] ?? "bg-muted text-muted-foreground border-border";
  return <span className={`inline-block rounded border px-2 py-0.5 text-xs ${cls}`}>{status}</span>;
}

function DeliverabilityPage() {
  const [range, setRange] = React.useState<Range>("7d");
  const [tab, setTab] = React.useState<Tab>("overview");

  const statsFn = useServerFn(getDeliverabilityStats);
  const statsQ = useQuery({
    queryKey: ["deliv-stats", range],
    queryFn: () => statsFn({ data: { range } }),
    staleTime: 30_000,
  });
  const s = statsQ.data?.stats;
  const deliveryRate = s && s.total > 0 ? Math.round((s.sent / s.total) * 100) : 0;
  const bounceRate = s && s.sent + s.bounced > 0 ? ((s.bounced / (s.sent + s.bounced)) * 100).toFixed(2) : "0.00";
  const complaintRate = s && s.sent > 0 ? ((s.complained / s.sent) * 100).toFixed(3) : "0.000";

  return (
    <AdminLayout title="Email deliverability">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Email deliverability</h1>
          <p className="text-sm text-muted-foreground">
            Send health, bounces, complaints, and suppression list.
          </p>
        </div>
        <div className="flex gap-2">
          <Pill active={range === "24h"} onClick={() => setRange("24h")}>24h</Pill>
          <Pill active={range === "7d"} onClick={() => setRange("7d")}>7 days</Pill>
          <Pill active={range === "30d"} onClick={() => setRange("30d")}>30 days</Pill>
        </div>
      </div>

      {/* Headline metrics */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Delivery rate" value={`${deliveryRate}%`} hint={`${s?.sent ?? 0} of ${s?.total ?? 0} sent`} good={deliveryRate >= 97} />
        <Metric label="Bounce rate" value={`${bounceRate}%`} hint="Keep below 2%" good={Number(bounceRate) < 2} />
        <Metric label="Complaint rate" value={`${complaintRate}%`} hint="Keep below 0.1%" good={Number(complaintRate) < 0.1} />
        <Metric label="Suppression hits" value={String(s?.suppressed ?? 0)} hint="Blocked before send" />
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <MiniStat label="Total" value={s?.total ?? 0} />
        <MiniStat label="Sent" value={s?.sent ?? 0} tone="green" />
        <MiniStat label="Bounced" value={s?.bounced ?? 0} tone="orange" />
        <MiniStat label="Complained" value={s?.complained ?? 0} tone="purple" />
        <MiniStat label="Failed" value={s?.failed ?? 0} tone="red" />
        <MiniStat label="Pending" value={s?.pending ?? 0} tone="blue" />
      </div>

      <div className="mt-6 flex gap-2 border-b border-border">
        {(["overview", "log", "suppressed"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm capitalize ${
              tab === t ? "border-b-2 border-primary font-semibold" : "text-muted-foreground"
            }`}
          >
            {t === "log" ? "Send log" : t === "suppressed" ? "Suppression list" : "By template"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="mt-4 rounded-md border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Template</th>
                <th className="px-3 py-2 text-right">Sent</th>
                <th className="px-3 py-2 text-right">Bounced</th>
                <th className="px-3 py-2 text-right">Failed</th>
                <th className="px-3 py-2 text-right">Bounce %</th>
              </tr>
            </thead>
            <tbody>
              {(s?.byTemplate ?? []).map((t) => {
                const tot = t.sent + t.bounced;
                const br = tot > 0 ? ((t.bounced / tot) * 100).toFixed(1) : "0.0";
                return (
                  <tr key={t.template} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-xs">{t.template}</td>
                    <td className="px-3 py-2 text-right">{t.sent}</td>
                    <td className="px-3 py-2 text-right">{t.bounced}</td>
                    <td className="px-3 py-2 text-right">{t.failed}</td>
                    <td className="px-3 py-2 text-right">{br}%</td>
                  </tr>
                );
              })}
              {!s?.byTemplate?.length && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No sends in this window.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "log" && <SendLog range={range} />}
      {tab === "suppressed" && <SuppressionList />}
    </AdminLayout>
  );
}

function Metric({ label, value, hint, good }: { label: string; value: string; hint?: string; good?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold ${good === undefined ? "" : good ? "text-green-600" : "text-orange-600"}`}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  const toneCls: Record<string, string> = {
    green: "text-green-600", red: "text-red-600", orange: "text-orange-600",
    purple: "text-purple-600", blue: "text-blue-600",
  };
  return (
    <div className="rounded-md border border-border bg-card p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${tone ? toneCls[tone] : ""}`}>{value}</div>
    </div>
  );
}

function SendLog({ range }: { range: Range }) {
  const [status, setStatus] = React.useState("all");
  const [template, setTemplate] = React.useState("all");
  const [q, setQ] = React.useState("");
  const fn = useServerFn(getDeliverabilityLog);
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["deliv-log", range, status, template, q],
    queryFn: () => fn({ data: { range, status, template, q } }),
    staleTime: 30_000,
  });
  const rows = data?.rows ?? [];
  const templates = data?.templates ?? [];

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search recipient…"
          className="rounded-md border border-border bg-card px-3 py-1.5 text-sm"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-border bg-card px-3 py-1.5 text-sm">
          <option value="all">All statuses</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="dlq">DLQ</option>
          <option value="bounced">Bounced</option>
          <option value="complained">Complained</option>
          <option value="suppressed">Suppressed</option>
          <option value="pending">Pending</option>
        </select>
        <select value={template} onChange={(e) => setTemplate(e.target.value)} className="rounded-md border border-border bg-card px-3 py-1.5 text-sm">
          <option value="all">All templates</option>
          {templates.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={() => refetch()} className="rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          {isFetching ? "Loading…" : "Refresh"}
        </button>
      </div>
      <div className="rounded-md border border-border bg-card overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Template</th>
              <th className="px-3 py-2">Recipient</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Error</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={(r.message_id ?? "") + r.created_at} className="border-t border-border">
                <td className="px-3 py-2 whitespace-nowrap text-xs">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.template_name}</td>
                <td className="px-3 py-2">{r.recipient_email}</td>
                <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                <td className="px-3 py-2 text-xs text-muted-foreground max-w-md truncate" title={r.error_message ?? ""}>{r.error_message ?? ""}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No matching rows.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SuppressionList() {
  const [q, setQ] = React.useState("");
  const [reason, setReason] = React.useState("all");
  const [newEmail, setNewEmail] = React.useState("");
  const listFn = useServerFn(getSuppressions);
  const removeFn = useServerFn(removeSuppression);
  const addFn = useServerFn(addSuppression);
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["suppressions", q, reason],
    queryFn: () => listFn({ data: { q, reason } }),
    staleTime: 30_000,
  });
  const rows = data?.rows ?? [];
  const counts = data?.counts ?? {};

  async function handleRemove(email: string) {
    if (!confirm(`Remove ${email} from suppression? They will receive future emails.`)) return;
    const res = await removeFn({ data: { email } });
    if (!res.ok) alert(res.error ?? "Failed");
    refetch();
  }
  async function handleAdd() {
    if (!newEmail.trim()) return;
    const res = await addFn({ data: { email: newEmail, reason: "unsubscribe" } });
    if (!res.ok) alert(res.error ?? "Failed");
    setNewEmail("");
    refetch();
  }

  return (
    <div className="mt-4">
      <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
        <MiniStat label="Bounces" value={counts.bounce ?? 0} tone="orange" />
        <MiniStat label="Complaints" value={counts.complaint ?? 0} tone="purple" />
        <MiniStat label="Unsubscribes" value={counts.unsubscribe ?? 0} tone="blue" />
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email…"
          className="rounded-md border border-border bg-card px-3 py-1.5 text-sm"
        />
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="rounded-md border border-border bg-card px-3 py-1.5 text-sm">
          <option value="all">All reasons</option>
          <option value="bounce">Bounce</option>
          <option value="complaint">Complaint</option>
          <option value="unsubscribe">Unsubscribe</option>
        </select>
        <button onClick={() => refetch()} className="rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          {isFetching ? "Loading…" : "Refresh"}
        </button>
        <div className="ml-auto flex gap-2">
          <input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Manually suppress email…"
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm w-64"
          />
          <button onClick={handleAdd} className="rounded-md border border-border bg-primary text-primary-foreground px-3 py-1.5 text-sm">
            Suppress
          </button>
        </div>
      </div>
      <div className="rounded-md border border-border bg-card overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Reason</th>
              <th className="px-3 py-2">Added</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.email} className="border-t border-border">
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2"><StatusBadge status={r.reason} /></td>
                <td className="px-3 py-2 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => handleRemove(r.email)}
                    className="rounded border border-border bg-card px-2 py-1 text-xs hover:bg-muted"
                  >
                    Unsuppress
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No suppressions.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
