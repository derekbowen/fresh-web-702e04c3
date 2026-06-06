import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";

type ListKind = "host" | "renter";
type StatusFilter = "all" | "active" | "paused" | "unsubscribed";

async function requireAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: role } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!role) throw new Error("Forbidden");
}

function tableFor(kind: ListKind) {
  return kind === "host" ? "host_subscribers" : "renter_subscribers";
}

const fetchSubs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: ListKind; status: StatusFilter; search: string; limit?: number }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = tableFor(data.kind);
    let q = supabaseAdmin
      .from(table)
      .select("id, email, name, status, sequence_scheduled, unsubscribed_at, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.status !== "all") q = q.eq("status", data.status);
    if (data.search.trim()) q = q.ilike("email", `%${data.search.trim()}%`);
    const { data: rows, count } = await q;

    // Status counts
    const counts: Record<string, number> = { active: 0, paused: 0, unsubscribed: 0 };
    for (const k of Object.keys(counts)) {
      const { count: c } = await supabaseAdmin
        .from(table).select("*", { count: "exact", head: true }).eq("status", k);
      counts[k] = c ?? 0;
    }
    return { rows: rows ?? [], total: count ?? 0, counts };
  });

const updateStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: ListKind; id: string; status: "active" | "paused" | "unsubscribed" }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: any = { status: data.status };
    if (data.status === "unsubscribed") patch.unsubscribed_at = new Date().toISOString();
    if (data.status === "active") patch.unsubscribed_at = null;
    const { error } = await supabaseAdmin.from(tableFor(data.kind)).update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const bulkUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: ListKind; ids: string[]; status: "active" | "paused" | "unsubscribed" }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    await requireAdmin(userId);
    if (data.ids.length === 0) return { ok: true, updated: 0 };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: any = { status: data.status };
    if (data.status === "unsubscribed") patch.unsubscribed_at = new Date().toISOString();
    if (data.status === "active") patch.unsubscribed_at = null;
    const { error } = await supabaseAdmin.from(tableFor(data.kind)).update(patch).in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true, updated: data.ids.length };
  });

export const Route = createFileRoute("/admin/drip-subscribers")({
  component: Page,
});

function Page() {
  const list = useServerFn(fetchSubs);
  const update = useServerFn(updateStatus);
  const bulk = useServerFn(bulkUpdate);

  const [kind, setKind] = useState<ListKind>("host");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const q = useQuery({
    queryKey: ["drip-subs", kind, status, search],
    queryFn: () => list({ data: { kind, status, search, limit: 200 } }),
  });

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }
  function toggleAll() {
    if (!q.data) return;
    if (selected.size === q.data.rows.length) setSelected(new Set());
    else setSelected(new Set(q.data.rows.map((r: any) => r.id)));
  }

  async function setOne(id: string, s: "active" | "paused" | "unsubscribed") {
    await update({ data: { kind, id, status: s } });
    q.refetch();
  }

  async function setBulk(s: "active" | "paused" | "unsubscribed") {
    const ids = Array.from(selected);
    if (ids.length === 0) { alert("Select rows first"); return; }
    const verb = s === "active" ? "resume" : s === "paused" ? "pause" : "unsubscribe";
    if (!confirm(`${verb} ${ids.length} subscriber${ids.length === 1 ? "" : "s"}?`)) return;
    await bulk({ data: { kind, ids, status: s } });
    setSelected(new Set());
    q.refetch();
  }

  const rows = q.data?.rows ?? [];
  const counts = q.data?.counts ?? { active: 0, paused: 0, unsubscribed: 0 };

  return (
    <AdminLayout title="Drip subscribers">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Pause individual recipients so their drip emails stop (e.g. when they reply, book, or ask).
          Paused subscribers stay on the list but get skipped by the sender. Resume to put them back in rotation.
        </p>

        <section className="border rounded-lg p-4 bg-card space-y-3">
          <div className="flex gap-2 flex-wrap items-center">
            <div className="flex gap-1">
              <Tab active={kind === "host"} onClick={() => { setKind("host"); setSelected(new Set()); }}>
                Hosts
              </Tab>
              <Tab active={kind === "renter"} onClick={() => { setKind("renter"); setSelected(new Set()); }}>
                Renters
              </Tab>
            </div>
            <div className="flex-1" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email…"
              className="border rounded p-2 text-sm w-64"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="border rounded p-2 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="active">Active ({counts.active})</option>
              <option value="paused">Paused ({counts.paused})</option>
              <option value="unsubscribed">Unsubscribed ({counts.unsubscribed})</option>
            </select>
          </div>

          <div className="flex gap-2 text-xs">
            <Pill color="emerald">Active: {counts.active}</Pill>
            <Pill color="amber">Paused: {counts.paused}</Pill>
            <Pill color="rose">Unsubscribed: {counts.unsubscribed}</Pill>
          </div>

          {selected.size > 0 && (
            <div className="border rounded p-2 bg-sky-50 flex gap-2 items-center text-sm">
              <span className="font-medium">{selected.size} selected</span>
              <button onClick={() => setBulk("paused")} className="px-2 py-1 border rounded bg-white hover:bg-amber-50">⏸ Pause</button>
              <button onClick={() => setBulk("active")} className="px-2 py-1 border rounded bg-white hover:bg-emerald-50">▶ Resume</button>
              <button onClick={() => setBulk("unsubscribed")} className="px-2 py-1 border rounded bg-white hover:bg-rose-50 text-rose-700">🚫 Unsubscribe</button>
              <button onClick={() => setSelected(new Set())} className="text-xs underline text-slate-600 ml-auto">Clear</button>
            </div>
          )}

          {q.isLoading ? (
            <p className="text-sm">Loading…</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left border-b">
                    <th className="p-2 w-8">
                      <input
                        type="checkbox"
                        checked={rows.length > 0 && selected.size === rows.length}
                        onChange={toggleAll}
                      />
                    </th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Seq scheduled</th>
                    <th className="p-2">Created</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={7} className="p-4 text-slate-500 italic">No subscribers match.</td></tr>
                  )}
                  {rows.map((r: any) => (
                    <tr key={r.id} className="border-b hover:bg-slate-50">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggle(r.id)}
                        />
                      </td>
                      <td className="p-2 font-mono text-xs">{r.email}</td>
                      <td className="p-2 text-xs">{r.name || "—"}</td>
                      <td className="p-2"><StatusBadge s={r.status} /></td>
                      <td className="p-2 text-xs">{r.sequence_scheduled ? "✓" : "—"}</td>
                      <td className="p-2 text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="p-2 space-x-1 whitespace-nowrap">
                        {r.status !== "paused" && r.status !== "unsubscribed" && (
                          <button onClick={() => setOne(r.id, "paused")} className="text-xs px-2 py-1 border rounded hover:bg-amber-50">⏸ Pause</button>
                        )}
                        {r.status !== "active" && (
                          <button onClick={() => setOne(r.id, "active")} className="text-xs px-2 py-1 border rounded hover:bg-emerald-50">▶ Resume</button>
                        )}
                        {r.status !== "unsubscribed" && (
                          <button onClick={() => setOne(r.id, "unsubscribed")} className="text-xs px-2 py-1 text-rose-600 hover:underline">Unsub</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm rounded border ${active ? "bg-sky-600 text-white border-sky-600" : "bg-white hover:bg-slate-50"}`}
    >
      {children}
    </button>
  );
}

function Pill({ color, children }: { color: "emerald" | "amber" | "rose"; children: React.ReactNode }) {
  const cls = color === "emerald" ? "bg-emerald-100 text-emerald-700"
    : color === "amber" ? "bg-amber-100 text-amber-700"
    : "bg-rose-100 text-rose-700";
  return <span className={`px-2 py-0.5 rounded ${cls}`}>{children}</span>;
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    paused: "bg-amber-100 text-amber-700",
    unsubscribed: "bg-rose-100 text-rose-700",
  };
  return <span className={`text-xs px-2 py-0.5 rounded ${map[s] || "bg-slate-100 text-slate-700"}`}>{s}</span>;
}
