import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const getHostDripStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context as { userId: string };
    const { data: role } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!role) throw new Error("Forbidden");

    const [
      { count: subs },
      { count: active },
      { count: unsub },
      { count: sent },
      { count: pending },
      { count: failed },
      { data: state },
      { data: recent },
      { data: upcoming },
    ] = await Promise.all([
      supabaseAdmin.from("host_subscribers").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("host_subscribers").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabaseAdmin.from("host_subscribers").select("*", { count: "exact", head: true }).eq("status", "unsubscribed"),
      supabaseAdmin.from("host_drip_emails").select("*", { count: "exact", head: true }).eq("status", "sent"),
      supabaseAdmin.from("host_drip_emails").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("host_drip_emails").select("*", { count: "exact", head: true }).eq("status", "failed"),
      supabaseAdmin.from("host_drip_state").select("*").eq("id", 1).maybeSingle(),
      supabaseAdmin.from("host_subscribers").select("email, name, status, sequence_scheduled, created_at").order("created_at", { ascending: false }).limit(25),
      supabaseAdmin.from("host_drip_emails").select("kind, status, scheduled_at, subject, sent_at, error").order("scheduled_at", { ascending: true }).limit(40),
    ]);

    return {
      counts: {
        subs: subs ?? 0, active: active ?? 0, unsubscribed: unsub ?? 0,
        sent: sent ?? 0, pending: pending ?? 0, failed: failed ?? 0,
      },
      state,
      recent: recent ?? [],
      upcoming: upcoming ?? [],
    };
  });

const runPollNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context as { userId: string };
    const { data: role } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!role) throw new Error("Forbidden");
    const { pollSharetribeHosts } = await import("@/server/host-drip.server");
    return await pollSharetribeHosts();
  });

const runSendNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context as { userId: string };
    const { data: role } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!role) throw new Error("Forbidden");
    const { sendDueHostEmails } = await import("@/server/host-drip.server");
    return await sendDueHostEmails(20);
  });

const runBroadcastShareLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context as { userId: string };
    const { data: role } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!role) throw new Error("Forbidden");
    const { queueBroadcast } = await import("@/server/host-drip.server");
    return await queueBroadcast("15-share-link-profits");
  });


export const Route = createFileRoute("/admin/host-drip")({
  component: Page,
});

function Page() {
  const fetcher = useServerFn(getHostDripStats);
  const poll = useServerFn(runPollNow);
  const send = useServerFn(runSendNow);
  const broadcast = useServerFn(runBroadcastShareLink);
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["host-drip-stats"],
    queryFn: () => fetcher(),
  });

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Host drip (7-week sequence)</h1>
      <p className="text-sm text-slate-600">
        Hosts are pulled from Sharetribe (any user with at least one listing in any state).
        New hosts get a 7-touch weekly sequence starting ~5 min after the poller picks them up.
      </p>

      <div className="flex gap-3 flex-wrap">
        <button
          className="px-4 py-2 rounded bg-sky-600 text-white"
          onClick={async () => { await poll(); refetch(); }}
        >Poll Sharetribe now</button>
        <button
          className="px-4 py-2 rounded bg-slate-700 text-white"
          onClick={async () => { await send(); refetch(); }}
        >Drain send queue now</button>
        <button
          className="px-4 py-2 rounded bg-blue-700 text-white"
          onClick={async () => {
            if (!confirm("Queue the 'keep more of your profits' broadcast to ALL active hosts?")) return;
            const r: any = await broadcast();
            alert(`Queued ${r.queued} (skipped ${r.skipped} already sent, of ${r.total} active).`);
            refetch();
          }}
        >Broadcast: share-link profits</button>
        <button className="px-4 py-2 rounded border" onClick={() => refetch()}>Refresh</button>
      </div>


      {isLoading || !data ? <p>Loading…</p> : (
        <>
          <section className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Stat label="Subscribers" value={data.counts.subs} />
            <Stat label="Active" value={data.counts.active} />
            <Stat label="Unsubscribed" value={data.counts.unsubscribed} />
            <Stat label="Sent" value={data.counts.sent} />
            <Stat label="Pending" value={data.counts.pending} />
            <Stat label="Failed" value={data.counts.failed} />
          </section>

          <section className="text-sm text-slate-600">
            Last polled: {data.state?.last_polled_at || "never"}
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Recent hosts</h2>
            <table className="w-full text-sm border-collapse">
              <thead><tr className="text-left border-b"><th>Email</th><th>Name</th><th>Status</th><th>Scheduled?</th><th>Added</th></tr></thead>
              <tbody>
                {data.recent.map((r: any, i: number) => (
                  <tr key={i} className="border-b">
                    <td>{r.email}</td><td>{r.name || "—"}</td>
                    <td>{r.status}</td>
                    <td>{r.sequence_scheduled ? "yes" : "no"}</td>
                    <td>{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Next 40 queued / recent emails</h2>
            <table className="w-full text-sm border-collapse">
              <thead><tr className="text-left border-b"><th>Kind</th><th>Status</th><th>Subject</th><th>Scheduled</th><th>Sent</th><th>Error</th></tr></thead>
              <tbody>
                {data.upcoming.map((r: any, i: number) => (
                  <tr key={i} className="border-b">
                    <td>{r.kind}</td><td>{r.status}</td><td className="truncate max-w-xs">{r.subject || "—"}</td>
                    <td>{new Date(r.scheduled_at).toLocaleString()}</td>
                    <td>{r.sent_at ? new Date(r.sent_at).toLocaleString() : "—"}</td>
                    <td className="text-red-600 text-xs">{r.error || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded p-4">
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
