import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { getHostDashboard, type HostDashboard } from "@/lib/host-dashboard.functions";

export const Route = createFileRoute("/host")({
  head: () => ({
    meta: [
      { title: "Host dashboard — Pool Rental Near Me" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: HostPage,
});

function dollars(c: number) {
  return `$${(c / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function HostPage() {
  const [data, setData] = React.useState<HostDashboard | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await getHostDashboard();
        if (alive) setData(d);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        {loading && <p className="text-sm text-muted-foreground">Loading your numbers…</p>}

        {!loading && !data?.host && <SignInPrompt />}

        {!loading && data?.host && data.moneySheet && (
          <>
            <h1 className="text-3xl font-bold text-foreground">
              {data.host.displayName ? `${data.host.displayName}, here's your money` : "Your money"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Updated just now from your bookings.</p>
            <MoneySheet sheet={data.moneySheet} />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function MoneySheet({ sheet }: { sheet: NonNullable<HostDashboard["moneySheet"]> }) {
  return (
    <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card
        accent="bg-emerald-500/10 border-emerald-500/30"
        label={`Cleared in ${sheet.monthLabel}`}
        value={dollars(sheet.bankedCents)}
        sub={`${sheet.bankedCount} completed booking${sheet.bankedCount === 1 ? "" : "s"}`}
      />
      <Card
        accent="bg-sky-500/10 border-sky-500/30"
        label="Upcoming payouts"
        value={dollars(sheet.pipelineCents)}
        sub={`${sheet.pipelineCount} booking${sheet.pipelineCount === 1 ? "" : "s"} in the pipeline`}
      />
      <BenchmarkCard sheet={sheet} />
    </section>
  );
}

function BenchmarkCard({ sheet }: { sheet: NonNullable<HostDashboard["moneySheet"]> }) {
  if (sheet.benchmarkStatus === "ready" && sheet.benchmark) {
    return (
      <Card
        accent="bg-amber-500/10 border-amber-500/30"
        label={`Top pools within ${sheet.benchmark.radiusMiles} miles`}
        value={`${dollars(sheet.benchmark.p80Cents)}/mo`}
        sub="What the best earners near you are pacing for"
      />
    );
  }
  return (
    <Card
      accent="bg-muted border-border"
      label="Top pools near you"
      value="—"
      sub={
        sheet.benchmarkStatus === "insufficient"
          ? "Not enough nearby pools yet to set a target"
          : "Calculating your local benchmark…"
      }
    />
  );
}

function Card({
  accent,
  label,
  value,
  sub,
}: {
  accent: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${accent}`}>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-bold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function SignInPrompt() {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-border bg-card p-8 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Sign in to see your money</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Log in to your host account to see what you've cleared this month and what's coming.
      </p>
      <a
        href="/login"
        className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        Log in
      </a>
    </div>
  );
}
