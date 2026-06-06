import * as React from "react";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { SITE_URL } from "@/lib/seo";
import {
  getAffiliateDashboard,
  updateMyPayoutMethod,
  type AffiliateDashboard,
  type CrewHost,
} from "@/lib/affiliate-dashboard.functions";
import { logCoachingActivity } from "@/lib/affiliate-coaching.functions";
import { COACHING_TEMPLATES, type CoachingTemplate } from "@/lib/affiliate-coaching-templates";

export const Route = createFileRoute("/p/affiliate-dashboard")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/p/affiliate-program" });
    }
  },
  head: () => ({
    meta: [
      { title: "Affiliate dashboard — Pool Rental Near Me" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AffiliatePage,
});

function dollars(c: number) {
  return `$${(c / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dollarsShort(c: number) {
  return `$${Math.round(c / 100).toLocaleString()}`;
}

function AffiliatePage() {
  const [data, setData] = React.useState<AffiliateDashboard | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [coachingHost, setCoachingHost] = React.useState<CrewHost | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const d = await getAffiliateDashboard();
      setData(d);
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold text-foreground">Affiliate dashboard</h1>

        {loading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}

        {!loading && !data?.affiliate && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-8">
            <h2 className="text-xl font-semibold">You're not in the affiliate program yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Apply with the same email you used to sign in. We'll review and email you when your link is live.
            </p>
            <Link
              to="/p/affiliate-program"
              className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
            >
              Apply now
            </Link>
          </div>
        )}

        {!loading && data?.affiliate && data.affiliate.status !== "approved" && (
          <div className="mt-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm">
            Your status is <strong>{data.affiliate.status}</strong>. Your referral link will activate once we approve
            your application.
          </div>
        )}

        {!loading && data?.affiliate && (
          <>
            <TierBlock tier={data.affiliate.tier} progress={data.tier_progress} />

            <LinkBox code={data.affiliate.code} disabled={data.affiliate.status !== "approved"} />

            <HowYouEarn />

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Stat label="Clicks" value={data.totals.clicks.toString()} />
              <Stat label="Hosts" value={data.totals.referred_hosts.toString()} />
              <Stat label="Active" value={data.totals.active_hosts.toString()} hint="3+ bookings, last 60d" />
              <Stat label="Pending" value={dollars(data.totals.pending_cents)} />
              <Stat label="Paid" value={dollars(data.totals.paid_cents)} />
            </div>

            <PayoutMethodForm
              method={data.affiliate.payout_method}
              details={data.affiliate.payout_details}
              onSaved={load}
            />

            <Section title="Your crew">
              {data.crew.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No referred hosts yet. Share your link, then check back here to coach the hosts you bring in.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.crew.map((h) => (
                    <CrewCard key={h.id} host={h} onCoach={() => setCoachingHost(h)} />
                  ))}
                </div>
              )}
            </Section>

            <Section title="Commission history">
              {data.commissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No commissions yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-2">Date</th>
                      <th>Type</th>
                      <th>Listing</th>
                      <th>Booking</th>
                      <th>You earn</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.commissions.map((c) => (
                      <tr key={c.id} className="border-t border-border">
                        <td className="py-2">{new Date(c.booking_date).toLocaleDateString()}</td>
                        <td>
                          <KindPill kind={c.kind} />
                        </td>
                        <td>{c.listing_title || "—"}</td>
                        <td>{dollars(c.booking_gross_cents)}</td>
                        <td className="font-medium">{dollars(c.commission_cents)}</td>
                        <td>
                          <StatusPill status={c.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            <Section title="Payouts">
              {data.payouts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payouts yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-2">Date</th>
                      <th>Method</th>
                      <th>Reference</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payouts.map((p) => (
                      <tr key={p.id} className="border-t border-border">
                        <td className="py-2">{new Date(p.paid_at).toLocaleDateString()}</td>
                        <td>{p.method || "—"}</td>
                        <td className="text-muted-foreground">{p.reference || "—"}</td>
                        <td className="font-medium">{dollars(p.total_cents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>
          </>
        )}
      </main>
      <SiteFooter />

      {coachingHost && (
        <CoachingDialog
          host={coachingHost}
          onClose={() => setCoachingHost(null)}
          onSaved={() => {
            setCoachingHost(null);
          }}
        />
      )}
    </div>
  );
}

const TIER_LABEL: Record<string, string> = {
  starter: "Starter",
  lead: "Lead Host",
  captain: "Regional Captain",
};

function TierBlock({
  tier,
  progress,
}: {
  tier: "starter" | "lead" | "captain";
  progress: AffiliateDashboard["tier_progress"];
}) {
  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase text-muted-foreground">Your tier</div>
          <div className="mt-1 text-2xl font-bold text-foreground">{TIER_LABEL[tier]}</div>
        </div>
        {progress.next && (
          <div className="text-xs text-muted-foreground">
            Next tier: <span className="font-semibold text-foreground">{TIER_LABEL[progress.next]}</span>
          </div>
        )}
      </div>

      {progress.next === "lead" && (
        <ProgressBar
          label={`${progress.active_hosts_current}/${progress.active_hosts_required} active hosts → Lead Host`}
          value={progress.active_hosts_current}
          max={progress.active_hosts_required}
        />
      )}
      {progress.next === "captain" && (
        <ProgressBar
          label={`${dollarsShort(progress.gmv30_current_cents)} / ${dollarsShort(progress.gmv30_required_cents)} crew GMV in last 30d → Regional Captain`}
          value={progress.gmv30_current_cents}
          max={progress.gmv30_required_cents}
        />
      )}
      {!progress.next && (
        <p className="mt-3 text-sm text-muted-foreground">
          You're at the top tier. Keep your crew active to stay there.
        </p>
      )}
    </div>
  );
}

function ProgressBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="mt-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function HowYouEarn() {
  return (
    <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">How you earn</h3>
      <ol className="mt-3 space-y-2 text-sm">
        <li>
          <strong>Host's 1st booking</strong> → you get a <strong>$100 activation bonus</strong>
        </li>
        <li>
          <strong>Host's 3rd booking</strong> → unlocks <strong>5% recurring</strong> on every booking after that
        </li>
        <li>Host goes 60 days without a booking → commissions pause; resume on next booking</li>
      </ol>
      <p className="mt-3 text-xs text-muted-foreground">
        Your job isn't just to sign hosts up. Coach them. Tell them to post on Nextdoor, in Facebook groups, to their
        friends. Hosts who get to 3 bookings are the ones who pay you forever.
      </p>
    </div>
  );
}

function CrewCard({ host, onCoach }: { host: CrewHost; onCoach: () => void }) {
  const dotColor =
    host.status === "active"
      ? "bg-green-500"
      : host.status === "warming"
        ? "bg-yellow-500"
        : host.status === "dormant"
          ? "bg-red-500"
          : "bg-muted-foreground";
  const statusLabel = {
    active: "Active",
    warming: `Warming (${host.completed_bookings_count}/3 bookings)`,
    dormant: "Dormant — needs coaching",
    new: "Signed up — no bookings yet",
  }[host.status];

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${dotColor}`} />
            <span className="truncate font-medium">{host.display_name || host.email_seen || "(host)"}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{statusLabel}</div>
        </div>
        <div className="text-right text-xs">
          <div className="font-semibold text-foreground">{dollars(host.total_earned_cents)}</div>
          <div className="text-muted-foreground">earned</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <Mini label="Bookings" value={host.completed_bookings_count.toString()} />
        <Mini label="GMV" value={dollarsShort(host.total_gross_cents)} />
        <Mini
          label="Last booking"
          value={host.last_booking_at ? new Date(host.last_booking_at).toLocaleDateString() : "—"}
        />
      </div>
      <button
        onClick={onCoach}
        className="mt-3 w-full rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
      >
        Log coaching activity
      </button>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-muted/40 p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}

function CoachingDialog({
  host,
  onClose,
  onSaved,
}: {
  host: CrewHost;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [template, setTemplate] = React.useState<CoachingTemplate | null>(null);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function save() {
    if (!note.trim()) {
      setErr("Add a short note about what you did.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await logCoachingActivity({
        data: {
          referral_id: host.id,
          note: note.trim(),
          template_used: template?.id ?? null,
        },
      });
      onSaved();
    } catch (e: any) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  function pickTemplate(t: CoachingTemplate) {
    setTemplate(t);
    setNote(`Sent ${t.label} to ${host.display_name || "host"}:\n\n${t.body}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">
          Coach {host.display_name || host.email_seen || "this host"}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Pick a script to send them, or write your own note about what you did.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {COACHING_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => pickTemplate(t)}
              className={`rounded-lg border px-3 py-2 text-left text-xs ${template?.id === t.id ? "border-primary bg-primary/10" : "border-border bg-background"}`}
            >
              <div className="font-semibold">{t.label}</div>
              <div className="text-muted-foreground capitalize">{t.channel}</div>
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={8}
          placeholder="What did you do to help this host? (e.g. 'Texted Sarah the Nextdoor script — she posted it 3pm Friday')"
          className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          maxLength={2000}
        />

        {err && <p className="mt-2 text-xs text-destructive">{err}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded border border-border px-3 py-1 text-sm">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Saving…" : "Log activity"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold text-foreground">{value}</div>
      {hint && <div className="mt-0.5 text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-4 overflow-x-auto">{children}</div>
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-700",
    approved: "bg-blue-500/20 text-blue-700",
    paid: "bg-green-500/20 text-green-700",
    reversed: "bg-red-500/20 text-red-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] || "bg-muted text-foreground"}`}>
      {status}
    </span>
  );
}

function KindPill({ kind }: { kind: "activation_bonus" | "recurring" }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${kind === "activation_bonus" ? "bg-amber-500/20 text-amber-700" : "bg-primary/15 text-primary"}`}
    >
      {kind === "activation_bonus" ? "Activation bonus" : "Recurring 5%"}
    </span>
  );
}

function LinkBox({ code, disabled }: { code: string; disabled: boolean }) {
  const url = `${SITE_URL}/?ref=${code}`;
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-6">
      <div className="text-xs uppercase text-muted-foreground">Your referral link</div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <code className="flex-1 break-all rounded-lg bg-background px-3 py-2 text-sm">{url}</code>
        <button
          disabled={disabled}
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function PayoutMethodForm({
  method,
  details,
  onSaved,
}: {
  method: string | null;
  details: Record<string, string>;
  onSaved: () => void;
}) {
  const [m, setM] = React.useState(method || "paypal");
  const [handle, setHandle] = React.useState(details.handle || details.email || "");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await updateMyPayoutMethod({
        data: { payout_method: m as any, payout_details: { handle } },
      });
      setMsg(res.ok ? "Saved." : "Could not save.");
      if (res.ok) onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">Payout method</h2>
      <p className="mt-1 text-xs text-muted-foreground">How you want to be paid out. We process payouts monthly.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr_auto]">
        <select
          value={m}
          onChange={(e) => setM(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="paypal">PayPal</option>
          <option value="venmo">Venmo</option>
          <option value="ach">ACH (US bank)</option>
          <option value="check">Mailed check</option>
        </select>
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder={m === "ach" ? "Bank account info" : m === "check" ? "Mailing address" : "Email or @handle"}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          maxLength={500}
        />
        <button
          onClick={save}
          disabled={busy}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
      {msg && <p className="mt-2 text-xs text-muted-foreground">{msg}</p>}
    </section>
  );
}
