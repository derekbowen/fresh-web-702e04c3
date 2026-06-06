import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import {
  getSharetribeDashboard,
  setAlertStatus,
  triggerSharetribeSyncNow,
} from "@/lib/sharetribe-mirror-admin.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/sharetribe")({
  component: SharetribeMirrorPage,
});

function fmtMoney(cents: number | null, currency: string | null) {
  if (cents == null) return "—";
  return `${(cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency || "USD",
  })}`;
}

function fmtTime(s: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleString();
}

function ago(s: string | null) {
  if (!s) return "never";
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function SharetribeMirrorPage() {
  const fetchDash = useServerFn(getSharetribeDashboard);
  const triggerSync = useServerFn(triggerSharetribeSyncNow);
  const updateAlert = useServerFn(setAlertStatus);
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["st-dashboard"],
    queryFn: () => fetchDash(),
    refetchInterval: 60_000,
  });

  const syncMut = useMutation({
    mutationFn: () => triggerSync(),
    onSuccess: (r: any) => {
      if (r?.ok) {
        toast.success(
          `Synced: ${r.result?.transactions ?? 0} tx, ${r.result?.messages ?? 0} msgs, ${r.result?.alerts ?? 0} alerts`,
        );
      } else {
        toast.error(`Sync failed: ${r?.error ?? "unknown"}`);
      }
      qc.invalidateQueries({ queryKey: ["st-dashboard"] });
    },
  });

  const alertMut = useMutation({
    mutationFn: (v: { id: string; status: "reviewed" | "dismissed" | "escalated" }) =>
      updateAlert({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["st-dashboard"] }),
  });

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6 max-w-7xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Sharetribe data mirror</h1>
            <p className="text-sm text-muted-foreground">
              Local copy of users, listings, transactions, and messages. Auto-syncs every 15 minutes.
            </p>
          </div>
          <Button onClick={() => syncMut.mutate()} disabled={syncMut.isPending}>
            {syncMut.isPending ? "Syncing…" : "Sync now"}
          </Button>
        </div>

        {isLoading || !data ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <>
            {/* Counts */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Stat label="Users" value={data.counts.users} />
              <Stat label="Listings" value={data.counts.listings} />
              <Stat label="Transactions" value={data.counts.transactions} />
              <Stat label="Messages" value={data.counts.messages} />
              <Stat
                label="Open alerts"
                value={data.counts.open_alerts}
                tone={data.counts.open_alerts > 0 ? "danger" : "ok"}
              />
            </div>

            {/* Sync state */}
            <Card>
              <CardHeader>
                <CardTitle>Sync state</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  {data.syncState.length === 0 ? (
                    <p className="text-muted-foreground col-span-3">No sync has run yet. Hit "Sync now".</p>
                  ) : (
                    data.syncState.map((s) => (
                      <div key={s.resource} className="border rounded-md p-3">
                        <div className="font-medium capitalize">{s.resource}</div>
                        <div className="text-muted-foreground text-xs mt-1">
                          Last run: {ago(s.last_run_at)} · {s.last_run_status ?? "—"}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Synced through: {fmtTime(s.last_synced_at)}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Last batch: {s.last_run_rows} rows
                        </div>
                        {s.last_run_error ? (
                          <div className="text-destructive text-xs mt-1 break-all">
                            {s.last_run_error}
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Funnel: message → booking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <Stat label="Total transactions" value={data.funnel.tx_with_messages} />
                  <Stat label="Confirmed / completed" value={data.funnel.tx_confirmed} />
                  <Stat
                    label="Conversion rate"
                    value={`${(data.funnel.rate * 100).toFixed(1)}%`}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Security alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {data.alerts.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No alerts. Healthy.</p>
                ) : (
                  <div className="space-y-2">
                    {data.alerts.map((a) => (
                      <div
                        key={a.id}
                        className="border rounded-md p-3 text-sm flex items-start gap-3 flex-wrap"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge
                              variant={
                                a.severity === "high"
                                  ? "destructive"
                                  : a.severity === "medium"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {a.category}
                            </Badge>
                            <Badge variant="outline">{a.severity}</Badge>
                            <Badge variant="outline">{a.status}</Badge>
                            <span className="text-xs text-muted-foreground">{ago(a.created_at)}</span>
                          </div>
                          <div className="text-foreground break-words">{a.snippet}</div>
                          <div className="text-xs text-muted-foreground mt-1 break-all">
                            Tx: {a.transaction_st_id ?? "—"} · Sender: {a.sender_st_id ?? "—"}
                            {a.matched_terms.length ? ` · Matched: ${a.matched_terms.join(", ")}` : ""}
                          </div>
                        </div>
                        {a.status === "open" ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => alertMut.mutate({ id: a.id, status: "reviewed" })}
                            >
                              Mark reviewed
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => alertMut.mutate({ id: a.id, status: "dismissed" })}
                            >
                              Dismiss
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="text-sm w-full">
                    <thead className="text-left text-muted-foreground">
                      <tr>
                        <th className="py-1 pr-3">When</th>
                        <th className="py-1 pr-3">State</th>
                        <th className="py-1 pr-3">Listing</th>
                        <th className="py-1 pr-3">Gross</th>
                        <th className="py-1 pr-3">Tx ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_transactions.map((t) => (
                        <tr key={t.sharetribe_id} className="border-t">
                          <td className="py-1 pr-3 whitespace-nowrap">{ago(t.last_transitioned_at)}</td>
                          <td className="py-1 pr-3">{t.state ?? "—"}</td>
                          <td className="py-1 pr-3">{t.listing_title ?? "—"}</td>
                          <td className="py-1 pr-3">{fmtMoney(t.payin_total_cents, t.currency)}</td>
                          <td className="py-1 pr-3 text-xs text-muted-foreground">
                            {t.sharetribe_id.slice(0, 8)}…
                          </td>
                        </tr>
                      ))}
                      {data.recent_transactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-3 text-muted-foreground">
                            No transactions yet.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Recent messages */}
            <Card>
              <CardHeader>
                <CardTitle>Recent messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.recent_messages.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No messages yet.</p>
                  ) : (
                    data.recent_messages.map((m) => (
                      <div key={m.id} className="border rounded-md p-2 text-sm">
                        <div className="text-xs text-muted-foreground mb-1">
                          {fmtTime(m.created_at_st)} · sender {m.sender_st_id?.slice(0, 8) ?? "—"} · tx{" "}
                          {m.transaction_st_id?.slice(0, 8) ?? "—"}
                        </div>
                        <div className="break-words">{m.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "ok" | "danger";
}) {
  return (
    <div
      className={`border rounded-md p-3 ${
        tone === "danger" ? "border-destructive/40 bg-destructive/5" : ""
      }`}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
