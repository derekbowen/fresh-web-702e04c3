/**
 * Money Sheet data layer.
 *
 * Computes a single host's BANKED (cleared this month) and PIPELINE (paid, not
 * yet cleared) figures from the existing Sharetribe -> Supabase transaction
 * mirror (public.st_transactions). No new Sharetribe plumbing required.
 *
 * IMPORTANT money rule: use payout_total_cents = the host's take-home (net of
 * commission). The admin GMV query sums payin_total_cents (gross) — copying that
 * here would overstate host earnings by the commission, so we deliberately do not.
 *
 * st_transactions.state holds the last_transition name with the `transition/`
 * prefix stripped (see sharetribe-mirror.server.ts). The state sets below are
 * grounded against the live default-booking (manual-capture) and default-purchase
 * processes. They are centralized here because the exact live transition set is
 * the one thing most worth confirming against real rows before trusting the math.
 */

// Booking delivered / payout released -> money is the host's. "Cleared".
const BANKED_STATES = [
  "complete",
  "auto-complete",
  "reviewed",
  "reviewed-by-customer",
  "reviewed-by-provider",
  "mark-received",
  "mark-received-from-purchased",
] as const;

// Guest has paid (preauth held or captured) but the booking has not completed,
// so the payout has not been released yet. "Upcoming".
const PIPELINE_STATES = [
  "confirm-payment",
  "accept",
  "accept-with-payment",
  "operator-accept",
  "operator-accept-with-payment",
] as const;

export type MoneySheetBenchmark = {
  p80Cents: number;
  cohortSize: number;
  radiusMiles: number;
};

export type MoneySheet = {
  bankedCents: number;
  pipelineCents: number;
  currency: string;
  bankedCount: number;
  pipelineCount: number;
  monthLabel: string;
  benchmark: MoneySheetBenchmark | null;
  // "ready" once the twice-daily benchmark batch has populated a snapshot;
  // "pending" until that increment ships; "insufficient" when the local cohort
  // is too small to report (privacy + statistical floor).
  benchmarkStatus: "ready" | "pending" | "insufficient";
};

function startOfMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function monthLabel(): string {
  return new Date().toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
}

/**
 * Read a precomputed local-earnings benchmark for this host, if the snapshot
 * table exists and has a row. The snapshot is produced by a separate twice-daily
 * batch (next increment); until then this returns null/"pending" and never throws.
 */
async function readBenchmark(
  providerStId: string,
  supabaseAdmin: any,
): Promise<{ value: MoneySheetBenchmark | null; status: MoneySheet["benchmarkStatus"] }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("host_earnings_benchmark")
      .select("p80_cents,cohort_size,radius_miles")
      .eq("host_st_id", providerStId)
      .maybeSingle();
    if (error || !data) return { value: null, status: "pending" };
    if ((data.cohort_size ?? 0) < 1) return { value: null, status: "insufficient" };
    return {
      value: {
        p80Cents: data.p80_cents ?? 0,
        cohortSize: data.cohort_size ?? 0,
        radiusMiles: data.radius_miles ?? 15,
      },
      status: "ready",
    };
  } catch {
    // Table not created yet — benchmark batch is a later increment.
    return { value: null, status: "pending" };
  }
}

export async function computeMoneySheet(providerStId: string): Promise<MoneySheet> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const monthStart = startOfMonthIso();

  const [bankedRes, pipeRes, benchmark] = await Promise.all([
    supabaseAdmin
      .from("st_transactions")
      .select("payout_total_cents,currency")
      .eq("provider_st_id", providerStId)
      .in("state", BANKED_STATES as unknown as string[])
      .gte("last_transitioned_at", monthStart),
    supabaseAdmin
      .from("st_transactions")
      .select("payout_total_cents,currency")
      .eq("provider_st_id", providerStId)
      .in("state", PIPELINE_STATES as unknown as string[]),
    readBenchmark(providerStId, supabaseAdmin),
  ]);

  let bankedCents = 0;
  let bankedCount = 0;
  let currency = "USD";
  for (const r of bankedRes.data || []) {
    bankedCents += r.payout_total_cents || 0;
    bankedCount++;
    if (r.currency) currency = r.currency;
  }

  let pipelineCents = 0;
  let pipelineCount = 0;
  for (const r of pipeRes.data || []) {
    pipelineCents += r.payout_total_cents || 0;
    pipelineCount++;
    if (r.currency) currency = r.currency;
  }

  return {
    bankedCents,
    pipelineCents,
    currency,
    bankedCount,
    pipelineCount,
    monthLabel: monthLabel(),
    benchmark: benchmark.value,
    benchmarkStatus: benchmark.status,
  };
}
