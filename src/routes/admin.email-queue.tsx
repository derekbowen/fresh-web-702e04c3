import * as React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin-layout";
import { listQueuedEmails } from "@/server/email-queue.functions";

export const Route = createFileRoute("/admin/email-queue")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: "/admin/email-queue", mode: "signin" } });
    }
  },
  head: () => ({
    meta: [
      { title: "Email queue — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: EmailQueuePage,
});

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = d.getTime() - now;
  const mins = Math.round(diffMs / 60000);
  const rel =
    mins < 60 ? `in ${mins}m`
    : mins < 60 * 24 ? `in ${Math.round(mins / 60)}h`
    : `in ${Math.round(mins / (60 * 24))}d`;
  return `${d.toLocaleString()} (${rel})`;
}

function EmailQueuePage() {
  const fetchQueue = useServerFn(listQueuedEmails);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["email-queue"],
    queryFn: () => fetchQueue(),
    staleTime: 30_000,
  });

  const emails = data?.emails ?? [];
  const hostCount = emails.filter((e) => e.source === "host_drip").length;
  const renterCount = emails.filter((e) => e.source === "renter_drip").length;

  return (
    <AdminLayout title="Email queue">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Email queue</h1>
          <p className="text-sm text-muted-foreground">
            Pending drip emails scheduled for a future date.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted"
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-md border border-border bg-card p-3">
          <div className="text-xs text-muted-foreground">Total queued</div>
          <div className="text-xl font-semibold">{emails.length}</div>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <div className="text-xs text-muted-foreground">Host drip</div>
          <div className="text-xl font-semibold">{hostCount}</div>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <div className="text-xs text-muted-foreground">Renter drip</div>
          <div className="text-xl font-semibold">{renterCount}</div>
        </div>
      </div>

      {data && !data.ok && (
        <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700">
          {data.error}
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-md border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Scheduled</th>
              <th className="px-3 py-2 text-left">List</th>
              <th className="px-3 py-2 text-left">Recipient</th>
              <th className="px-3 py-2 text-left">Step</th>
              <th className="px-3 py-2 text-left">Subject / kind</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!isLoading && emails.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">No future-scheduled emails.</td></tr>
            )}
            {emails.map((e) => (
              <tr key={`${e.source}-${e.id}`} className="border-t border-border">
                <td className="whitespace-nowrap px-3 py-2 text-xs">{fmtWhen(e.scheduled_at)}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${e.source === "host_drip" ? "bg-blue-500/10 text-blue-700" : "bg-emerald-500/10 text-emerald-700"}`}>
                    {e.source === "host_drip" ? "Host" : "Renter"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{e.email}</div>
                  {e.name && <div className="text-xs text-muted-foreground">{e.name}</div>}
                </td>
                <td className="px-3 py-2">#{e.step}</td>
                <td className="px-3 py-2">
                  <div className="font-medium">{e.subject ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{e.kind}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
