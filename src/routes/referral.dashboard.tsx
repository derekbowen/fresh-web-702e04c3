import * as React from "react";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { SITE_URL } from "@/lib/seo";
import {
  getAffiliateDashboard,
  updateMyPayoutMethod,
  type AffiliateDashboard,
} from "@/lib/affiliate-dashboard.functions";

export const Route = createFileRoute("/affiliate")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: "/affiliate", mode: "signin" } });
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

function AffiliatePage() {
  const [data, setData] = React.useState<AffiliateDashboard | null>(null);
  const [loading, setLoading] = React.useState(true);

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
              to="/referral/apply"
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
            <LinkBox code={data.affiliate.code} disabled={data.affiliate.status !== "approved"} />

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Stat label="Clicks" value={data.totals.clicks.toString()} />
              <Stat label="Referred hosts" value={data.totals.referred_hosts.toString()} />
              <Stat label="Pending" value={dollars(data.totals.pending_cents)} />
              <Stat label="Approved" value={dollars(data.totals.approved_cents)} />
              <Stat label="Paid" value={dollars(data.totals.paid_cents)} />
            </div>

            <PayoutMethodForm
              method={data.affiliate.payout_method}
              details={data.affiliate.payout_details}
              onSaved={load}
            />

            <Section title="Referred hosts">
              {data.referrals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No referred hosts yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-2">Host</th>
                      <th>Attributed</th>
                      <th>First booking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.referrals.map((r) => (
                      <tr key={r.id} className="border-t border-border">
                        <td className="py-2">{r.display_name || r.email_seen || "(host)"}</td>
                        <td>{new Date(r.attributed_at).toLocaleDateString()}</td>
                        <td>{r.first_booking_at ? new Date(r.first_booking_at).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                      <th>Listing</th>
                      <th>Booking</th>
                      <th>Commission</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.commissions.map((c) => (
                      <tr key={c.id} className="border-t border-border">
                        <td className="py-2">{new Date(c.booking_date).toLocaleDateString()}</td>
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
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold text-foreground">{value}</div>
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
      <p className="mt-3 text-xs text-muted-foreground">
        Share this anywhere. When a pool host signs up through your link and starts taking bookings, you earn 5% of
        every booking for the life of their account.
      </p>
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
