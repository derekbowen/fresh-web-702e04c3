import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const getRenterDripStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context as { userId: string };
    const { data: role } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!role) throw new Error("Forbidden");

    const [{ count: subs }, { count: active }, { count: unsub }, { data: state }, { data: recent }, { data: pending }] = await Promise.all([
      supabaseAdmin.from("renter_subscribers").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("renter_subscribers").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabaseAdmin.from("renter_subscribers").select("*", { count: "exact", head: true }).eq("status", "unsubscribed"),
      supabaseAdmin.from("renter_drip_state").select("*").eq("id", 1).maybeSingle(),
      supabaseAdmin.from("renter_subscribers").select("email, name, city, state_code, zip, status, created_at").order("created_at", { ascending: false }).limit(20),
      supabaseAdmin.from("renter_emails").select("kind, status, scheduled_at, subject").order("scheduled_at", { ascending: true }).limit(30),
    ]);

    return {
      counts: { subs: subs ?? 0, active: active ?? 0, unsubscribed: unsub ?? 0 },
      state,
      recent: recent ?? [],
      pending: pending ?? [],
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
    const { pollSharetribeRenters } = await import("@/server/renter-drip.server");
    return await pollSharetribeRenters();
  });

const runSendNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context as { userId: string };
    const { data: role } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!role) throw new Error("Forbidden");
    const { sendDueEmails } = await import("@/server/renter-drip.server");
    return await sendDueEmails(50);
  });

const runBackfillAll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context as { userId: string };
    const { data: role } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!role) throw new Error("Forbidden");
    const { backfillAllSharetribeRenters } = await import("@/server/renter-drip.server");
    return await backfillAllSharetribeRenters();
  });

export const Route = createFileRoute("/admin/renter-drip")({
  component: Page,
});

function Page() {
  const fetcher = useServerFn(getRenterDripStats);
  const poll = useServerFn(runPollNow);
  const send = useServerFn(runSendNow);
  const backfill = useServerFn(runBackfillAll);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["renter-drip-stats"],
    queryFn: () => fetcher(),
  });

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Renter drip</h1>

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
            if (!confirm("Pull ALL existing Sharetribe customers and queue the 3-day sequence for any not already scheduled?")) return;
            const r: any = await backfill();
            alert(`Fetched ${r.fetched} across ${r.pages} pages. Inserted ${r.inserted}, scheduled ${r.scheduled}, skipped ${r.skipped}.`);
            refetch();
          }}
        >Backfill ALL existing Sharetribe customers</button>
        <button className="px-4 py-2 rounded border" onClick={() => refetch()}>Refresh</button>
      </div>

      {isLoading || !data ? <p>Loading…</p> : (
        <>
          <section className="grid grid-cols-3 gap-4">
            <Stat label="Subscribers" value={data.counts.subs} />
            <Stat label="Active" value={data.counts.active} />
            <Stat label="Unsubscribed" value={data.counts.unsubscribed} />
          </section>

          <section className="text-sm text-slate-600">
            Last polled: {data.state?.last_polled_at || "never"}<br/>
            Cursor: {data.state?.last_st_created_at || "—"}
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Recent subscribers</h2>
            <table className="w-full text-sm border-collapse">
              <thead><tr className="text-left border-b"><th>Email</th><th>Name</th><th>Location</th><th>ZIP</th><th>Status</th><th>Joined</th></tr></thead>
              <tbody>
                {data.recent.map((r: any, i: number) => (
                  <tr key={i} className="border-b">
                    <td>{r.email}</td><td>{r.name}</td>
                    <td>{r.city ? `${r.city}, ${r.state_code || ""}` : "—"}</td>
                    <td>{r.zip || "—"}</td>
                    <td>{r.status}</td>
                    <td>{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Next 30 queued/recent emails</h2>
            <table className="w-full text-sm border-collapse">
              <thead><tr className="text-left border-b"><th>Kind</th><th>Status</th><th>Subject</th><th>Scheduled</th></tr></thead>
              <tbody>
                {data.pending.map((r: any, i: number) => (
                  <tr key={i} className="border-b">
                    <td>{r.kind}</td><td>{r.status}</td><td>{r.subject || "—"}</td>
                    <td>{new Date(r.scheduled_at).toLocaleString()}</td>
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
