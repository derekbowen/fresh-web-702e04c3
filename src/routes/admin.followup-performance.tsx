import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { getFollowupDashboard, type DashboardData } from "@/lib/followup-analytics.functions";

export const Route = createFileRoute("/admin/followup-performance")({
  component: FollowupPerformancePage,
});

const RANGES = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
  { label: "1y", value: 365 },
];

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function FollowupPerformancePage() {
  const [rangeDays, setRangeDays] = React.useState(30);
  const fetchDashboard = useServerFn(getFollowupDashboard);
  const { data, isLoading, error } = useQuery({
    queryKey: ["followup-dashboard", rangeDays],
    queryFn: () => fetchDashboard({ data: { rangeDays } }),
  });

  return (
    <AdminLayout title="Follow-up performance">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Follow-up performance</h1>
            <p className="text-sm text-muted-foreground">
              Response rate, conversion, time-to-reply, and AI score distribution by source and city.
            </p>
          </div>
          <div className="flex gap-1 rounded-md border border-border bg-card p-1">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRangeDays(r.value)}
                className={`rounded px-3 py-1 text-xs font-medium ${
                  rangeDays === r.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load dashboard: {(error as Error).message}
          </div>
        )}
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {data && <DashboardBody data={data} rangeDays={rangeDays} />}
      </div>
    </AdminLayout>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function DashboardBody({ data, rangeDays }: { data: DashboardData; rangeDays: number }) {
  const { summary, bySource, byCity, scoreDist } = data;
  const maxScore = Math.max(1, ...scoreDist.map((b) => b.count));

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Leads" value={summary.total.toLocaleString()} sub={`${summary.contacted} contacted`} />
        <StatCard
          label="Response rate"
          value={pct(summary.responseRate)}
          sub={`${summary.responded} of ${summary.contacted}`}
        />
        <StatCard
          label="Conversion rate"
          value={pct(summary.conversionRate)}
          sub={`${summary.converted} converted`}
        />
        <StatCard
          label="Median time to reply"
          value={summary.medianHoursToReply == null ? "—" : `${summary.medianHoursToReply.toFixed(1)} h`}
          sub={summary.avgScore != null ? `Avg AI score ${summary.avgScore.toFixed(0)}` : "No scores yet"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="By source">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-1 text-left">Source</th>
                <th className="text-right">Total</th>
                <th className="text-right">Resp.</th>
                <th className="text-right">Conv.</th>
                <th className="text-right">Avg score</th>
              </tr>
            </thead>
            <tbody>
              {bySource.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No data.</td></tr>
              )}
              {bySource.map((b) => (
                <tr key={b.source} className="border-t border-border">
                  <td className="py-2 font-medium">{b.source}</td>
                  <td className="text-right">{b.total}</td>
                  <td className="text-right">{pct(b.responseRate)}</td>
                  <td className="text-right">{pct(b.conversionRate)}</td>
                  <td className="text-right">{b.avgScore == null ? "—" : b.avgScore.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="AI score distribution">
          <div className="space-y-2">
            {scoreDist.map((b) => (
              <div key={b.bucket} className="flex items-center gap-3">
                <div className="w-20 text-xs text-muted-foreground">{b.bucket}</div>
                <div className="h-3 flex-1 overflow-hidden rounded bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(b.count / maxScore) * 100}%` }}
                  />
                </div>
                <div className="w-10 text-right text-xs tabular-nums">{b.count}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section title="Top cities">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-1 text-left">City</th>
                <th className="text-left">Region</th>
                <th className="text-right">Leads</th>
                <th className="text-right">Responded</th>
                <th className="text-right">Resp. rate</th>
                <th className="text-right">Converted</th>
                <th className="text-right">Conv. rate</th>
                <th className="text-right">Avg score</th>
              </tr>
            </thead>
            <tbody>
              {byCity.length === 0 && (
                <tr><td colSpan={8} className="py-4 text-center text-muted-foreground">No data.</td></tr>
              )}
              {byCity.map((c) => (
                <tr key={`${c.city}-${c.region}`} className="border-t border-border">
                  <td className="py-2 font-medium">{c.city}</td>
                  <td className="text-muted-foreground">{c.region ?? "—"}</td>
                  <td className="text-right">{c.total}</td>
                  <td className="text-right">{c.responded}</td>
                  <td className="text-right">{pct(c.responseRate)}</td>
                  <td className="text-right">{c.converted}</td>
                  <td className="text-right">{pct(c.conversionRate)}</td>
                  <td className="text-right">{c.avgScore == null ? "—" : c.avgScore.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}
