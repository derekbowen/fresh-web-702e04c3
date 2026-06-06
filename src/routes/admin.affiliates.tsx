import * as React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminRole } from "@/server/admin-auth.functions";
import { AdminLayout } from "@/components/admin-layout";
import {
  listAffiliatesAdmin,
  setAffiliateStatus,
  linkHostToAffiliate,
  createAffiliatePayout,
  type AdminAffiliateRow,
} from "@/lib/affiliate-admin.functions";
import { setAffiliateTierOverride } from "@/lib/affiliate-tier.functions";
import { listCoachingForAffiliate, type CoachingLogEntry } from "@/lib/affiliate-coaching.functions";

export const Route = createFileRoute("/admin/affiliates")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user)
      throw redirect({ to: "/auth", search: { redirect: "/admin/affiliates", mode: "signin" } });
    const { isAdmin } = await checkAdminRole();
    if (!isAdmin) throw redirect({ to: "/admin/no-access" });
  },
  head: () => ({
    meta: [{ title: "Affiliates — Admin" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: AdminAffiliates,
});

function dollars(c: number) {
  return `$${(c / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const TIER_LABEL: Record<string, string> = { starter: "Starter", lead: "Lead", captain: "Captain" };
const TIER_COLOR: Record<string, string> = {
  starter: "bg-muted text-foreground",
  lead: "bg-blue-500/20 text-blue-700",
  captain: "bg-amber-500/20 text-amber-700",
};

function AdminAffiliates() {
  const [rows, setRows] = React.useState<AdminAffiliateRow[]>([]);
  const [filter, setFilter] = React.useState<"all" | "pending" | "approved" | "rejected" | "paused">("all");
  const [sort, setSort] = React.useState<"recent" | "gmv_30d" | "approved_cents">("recent");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [linkOpen, setLinkOpen] = React.useState<AdminAffiliateRow | null>(null);
  const [payoutOpen, setPayoutOpen] = React.useState<AdminAffiliateRow | null>(null);
  const [coachingOpen, setCoachingOpen] = React.useState<AdminAffiliateRow | null>(null);
  const [tierOpen, setTierOpen] = React.useState<AdminAffiliateRow | null>(null);

  const load = React.useCallback(async () => {
    setBusy(true);
    try {
      const r = await listAffiliatesAdmin({ data: { status: filter, sort } });
      setRows(r.rows);
    } finally {
      setBusy(false);
    }
  }, [filter, sort]);
  React.useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(id: string, status: "approved" | "rejected" | "paused" | "pending") {
    setMsg(null);
    await setAffiliateStatus({ data: { id, status } });
    setMsg(`Updated to ${status}.`);
    load();
  }

  const leaderboard = [...rows]
    .filter((r) => r.status === "approved")
    .sort((a, b) => b.gmv_30d_cents - a.gmv_30d_cents)
    .slice(0, 10);

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Affiliates</h1>
            <p className="text-sm text-muted-foreground">
              Approve applications, link Sharetribe hosts, override tier, record payouts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="recent">Sort: Recent</option>
              <option value="gmv_30d">Sort: 30d GMV</option>
              <option value="approved_cents">Sort: Approved $</option>
            </select>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paused">Paused</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </header>

        {msg && <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">{msg}</div>}

        {leaderboard.length > 0 && (
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Top 10 by 30-day GMV
            </h2>
            <ol className="mt-3 space-y-1 text-sm">
              {leaderboard.map((r, i) => (
                <li key={r.id} className="flex items-center justify-between gap-3">
                  <span className="truncate">
                    <span className="mr-2 text-muted-foreground">#{i + 1}</span>
                    {r.full_name || r.email}{" "}
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${TIER_COLOR[r.tier]}`}>
                      {TIER_LABEL[r.tier]}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    {r.active_host_count} active · {dollars(r.gmv_30d_cents)} GMV
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2">Affiliate</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Tier</th>
                <th className="px-3 py-2">Hosts</th>
                <th className="px-3 py-2">Active</th>
                <th className="px-3 py-2">30d GMV</th>
                <th className="px-3 py-2">Pending</th>
                <th className="px-3 py-2">Approved</th>
                <th className="px-3 py-2">Paid</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {busy && rows.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-6 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.code}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{r.status}</span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => setTierOpen(r)}
                      className={`rounded-full px-2 py-0.5 text-xs ${TIER_COLOR[r.tier]}`}
                      title={r.tier_override ? "Manually overridden" : "Auto-computed"}
                    >
                      {TIER_LABEL[r.tier]}
                      {r.tier_override ? " 🔒" : ""}
                    </button>
                  </td>
                  <td className="px-3 py-2">{r.referral_count}</td>
                  <td className="px-3 py-2">{r.active_host_count}</td>
                  <td className="px-3 py-2">{dollars(r.gmv_30d_cents)}</td>
                  <td className="px-3 py-2">{dollars(r.pending_cents)}</td>
                  <td className="px-3 py-2">{dollars(r.approved_cents)}</td>
                  <td className="px-3 py-2">{dollars(r.paid_cents)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap justify-end gap-2 text-xs">
                      {r.status !== "approved" && (
                        <button
                          onClick={() => changeStatus(r.id, "approved")}
                          className="rounded bg-primary px-2 py-1 text-primary-foreground"
                        >
                          Approve
                        </button>
                      )}
                      {r.status === "approved" && (
                        <button
                          onClick={() => changeStatus(r.id, "paused")}
                          className="rounded border border-border px-2 py-1"
                        >
                          Pause
                        </button>
                      )}
                      {r.status !== "rejected" && (
                        <button
                          onClick={() => changeStatus(r.id, "rejected")}
                          className="rounded border border-border px-2 py-1"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => setLinkOpen(r)}
                        className="rounded border border-border px-2 py-1"
                      >
                        Link host
                      </button>
                      <button
                        onClick={() => setCoachingOpen(r)}
                        className="rounded border border-border px-2 py-1"
                      >
                        Coaching log
                      </button>
                      <button
                        onClick={() => setPayoutOpen(r)}
                        disabled={r.approved_cents === 0}
                        className="rounded bg-green-600 px-2 py-1 text-white disabled:opacity-40"
                      >
                        Pay {dollars(r.approved_cents)}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!busy && rows.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-6 text-center text-muted-foreground">
                    No affiliates.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {linkOpen && (
          <LinkHostDialog
            affiliate={linkOpen}
            onClose={() => setLinkOpen(null)}
            onSaved={() => {
              setLinkOpen(null);
              load();
            }}
          />
        )}
        {payoutOpen && (
          <PayoutDialog
            affiliate={payoutOpen}
            onClose={() => setPayoutOpen(null)}
            onSaved={() => {
              setPayoutOpen(null);
              load();
            }}
          />
        )}
        {coachingOpen && (
          <CoachingLogDrawer affiliate={coachingOpen} onClose={() => setCoachingOpen(null)} />
        )}
        {tierOpen && (
          <TierOverrideDialog
            affiliate={tierOpen}
            onClose={() => setTierOpen(null)}
            onSaved={() => {
              setTierOpen(null);
              load();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

function Modal({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[85vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function LinkHostDialog({
  affiliate,
  onClose,
  onSaved,
}: {
  affiliate: AdminAffiliateRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [stId, setStId] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  async function save() {
    setBusy(true);
    setErr(null);
    try {
      await linkHostToAffiliate({
        data: { affiliate_id: affiliate.id, sharetribe_user_id: stId.trim(), email_seen: email, display_name: name },
      });
      onSaved();
    } catch (e: any) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-semibold">Link Sharetribe host</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Linking host to <strong>{affiliate.full_name || affiliate.email}</strong>. Find the user UUID in Sharetribe
        Console &rarr; Users.
      </p>
      <div className="mt-4 space-y-3">
        <input
          value={stId}
          onChange={(e) => setStId(e.target.value)}
          placeholder="Sharetribe user UUID"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Host email (optional)"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Display name (optional)"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        {err && <p className="text-xs text-destructive">{err}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded border border-border px-3 py-1 text-sm">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy || !stId.trim()}
            className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Saving…" : "Link"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PayoutDialog({
  affiliate,
  onClose,
  onSaved,
}: {
  affiliate: AdminAffiliateRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [method, setMethod] = React.useState("paypal");
  const [reference, setReference] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const r = await createAffiliatePayout({
        data: { affiliate_id: affiliate.id, method, reference, notes },
      });
      if (!r.ok) throw new Error("Failed");
      onSaved();
    } catch (e: any) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-semibold">Record payout</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Paying <strong>{dollars(affiliate.approved_cents)}</strong> in approved commissions to{" "}
        {affiliate.full_name || affiliate.email}.
      </p>
      <div className="mt-4 space-y-3">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="paypal">PayPal</option>
          <option value="venmo">Venmo</option>
          <option value="ach">ACH</option>
          <option value="check">Check</option>
          <option value="other">Other</option>
        </select>
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Reference (tx id, check #)"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Notes (optional)"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        {err && <p className="text-xs text-destructive">{err}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded border border-border px-3 py-1 text-sm">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="rounded bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Record payout"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CoachingLogDrawer({
  affiliate,
  onClose,
}: {
  affiliate: AdminAffiliateRow;
  onClose: () => void;
}) {
  const [entries, setEntries] = React.useState<CoachingLogEntry[] | null>(null);
  React.useEffect(() => {
    (async () => {
      const r = await listCoachingForAffiliate({ data: { affiliate_id: affiliate.id } });
      setEntries(r.entries);
    })();
  }, [affiliate.id]);
  return (
    <Modal onClose={onClose} wide>
      <h3 className="text-lg font-semibold">
        Coaching log — {affiliate.full_name || affiliate.email}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        What this affiliate has done to support their crew. Empty log = they're recruiting but not coaching.
      </p>
      <div className="mt-4 space-y-2">
        {entries === null && <p className="text-sm text-muted-foreground">Loading…</p>}
        {entries && entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No coaching activity logged.</p>
        )}
        {entries?.map((e) => (
          <div key={e.id} className="rounded-lg border border-border bg-background p-3 text-sm">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{new Date(e.created_at).toLocaleString()}</span>
              {e.template_used && (
                <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">{e.template_used}</span>
              )}
            </div>
            <pre className="mt-2 whitespace-pre-wrap font-sans">{e.note}</pre>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button onClick={onClose} className="rounded border border-border px-3 py-1 text-sm">
          Close
        </button>
      </div>
    </Modal>
  );
}

function TierOverrideDialog({
  affiliate,
  onClose,
  onSaved,
}: {
  affiliate: AdminAffiliateRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tier, setTier] = React.useState<"starter" | "lead" | "captain">(affiliate.tier);
  const [override, setOverride] = React.useState(affiliate.tier_override);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  async function save() {
    setBusy(true);
    setErr(null);
    try {
      await setAffiliateTierOverride({ data: { affiliate_id: affiliate.id, tier, override } });
      onSaved();
    } catch (e: any) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-semibold">Tier — {affiliate.full_name || affiliate.email}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Current: <span className="font-semibold">{TIER_LABEL[affiliate.tier]}</span>{" "}
        {affiliate.tier_override ? "(manually pinned)" : "(auto-computed)"}.
      </p>
      <div className="mt-4 space-y-3">
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value as any)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="starter">Starter</option>
          <option value="lead">Lead Host</option>
          <option value="captain">Regional Captain</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
          Pin this tier (don't let auto-recompute change it)
        </label>
        {err && <p className="text-xs text-destructive">{err}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded border border-border px-3 py-1 text-sm">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
