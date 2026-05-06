import * as React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminRole } from "@/server/admin-auth.functions";
import { listAdmins, grantAdmin, revokeAdmin, type AdminTeamMember } from "@/server/admin-team.functions";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/team")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: "/admin/team", mode: "signin" } });
    }
    const { isAdmin } = await checkAdminRole();
    if (!isAdmin) throw redirect({ to: "/admin/no-access" });
  },
  head: () => ({
    meta: [
      { title: "Admin team — PRNM" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const [admins, setAdmins] = React.useState<AdminTeamMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [identifier, setIdentifier] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await listAdmins();
      setAdmins(r.admins);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  async function onGrant(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || busy) return;
    setBusy(true);
    try {
      await grantAdmin({ data: { identifier: identifier.trim() } });
      toast.success("Admin granted.");
      setIdentifier("");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to grant admin");
    } finally {
      setBusy(false);
    }
  }

  async function onRevoke(user_id: string, label: string) {
    if (!confirm(`Remove admin access from ${label}?`)) return;
    try {
      await revokeAdmin({ data: { user_id } });
      toast.success("Admin removed.");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to remove admin");
    }
  }

  return (
    <AdminLayout title="Team">
      <h1 className="text-3xl font-bold">Admin team</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Anyone listed here can open the admin dashboard. Grant access by email
        (the person must have signed up at /auth first) or by user ID.
      </p>

      <form onSubmit={onGrant} className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div className="min-w-[260px] flex-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email or user ID</label>
          <Input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="helper@example.com"
            className="mt-1"
          />
        </div>
        <Button type="submit" disabled={busy || !identifier.trim()}>
          {busy ? "Granting…" : "Grant admin"}
        </Button>
      </form>

      <section className="mt-8 rounded-xl border border-border">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Current admins ({admins.length})
          </h2>
          <button onClick={load} className="text-xs font-medium text-primary hover:underline">
            Refresh
          </button>
        </div>
        <ul className="divide-y divide-border">
          {loading && <li className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</li>}
          {!loading && admins.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">No admins yet.</li>
          )}
          {admins.map((a) => {
            const name = a.full_name || a.display_name || "(no name)";
            return (
              <li key={a.user_id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{name}</div>
                  <div className="truncate font-mono text-xs text-muted-foreground">{a.user_id}</div>
                </div>
                <button
                  onClick={() => onRevoke(a.user_id, name)}
                  className="shrink-0 rounded-md border border-red-500/40 bg-red-500/5 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-500/10 dark:text-red-300"
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </AdminLayout>
  );
}
