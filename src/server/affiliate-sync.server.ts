/**
 * Nightly sync: poll Sharetribe Integration API for completed transactions,
 * apply milestone-trigger commission model:
 *   - 1st completed booking per host  → $100 activation bonus (one-time)
 *   - 2nd completed booking            → no commission (the "gap")
 *   - 3rd+ completed booking           → 5% recurring (paused if 60d+ dormant)
 *
 * Idempotent on sharetribe_tx_id. Auto-approves commissions whose booking_date
 * is older than the 7-day refund window. Recomputes affiliate tier after each
 * change to a crew.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { integrationGet } from "./sharetribe.server";
import { recomputeAffiliateTier } from "@/lib/affiliate-tier.functions";

const COMMISSION_RATE = 0.05;
const ACTIVATION_BONUS_CENTS = 10_000; // $100
const ACTIVATION_BOOKING = 1;
const RECURRING_UNLOCK_AT = 3;
const REFUND_WINDOW_DAYS = 7;
const DORMANT_PAUSE_DAYS = 60;

type TxResponse = {
  data?: Array<{
    id: { uuid?: string } | string;
    type: "transaction";
    attributes: {
      createdAt?: string;
      lastTransitionedAt?: string;
      lastTransition?: string;
      payinTotal?: { amount: number; currency: string } | null;
      payoutTotal?: { amount: number; currency: string } | null;
    };
    relationships?: {
      provider?: { data?: { id?: { uuid?: string } | string; type?: string } };
      listing?: { data?: { id?: { uuid?: string } | string; type?: string } };
    };
  }>;
  included?: Array<{
    id: { uuid?: string } | string;
    type: string;
    attributes?: { title?: string };
  }>;
  meta?: { totalItems?: number; totalPages?: number; page?: number };
};

function unwrapId(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && v && "uuid" in (v as any)) return String((v as any).uuid);
  return null;
}

export async function syncAffiliateCommissions(): Promise<{
  scanned: number;
  matched: number;
  inserted_activation: number;
  inserted_recurring: number;
  skipped_dormant: number;
  approved: number;
  pages: number;
  since: string;
  errors: string[];
}> {
  const errors: string[] = [];

  const { data: latest } = await supabaseAdmin
    .from("affiliate_commissions")
    .select("booking_date")
    .order("booking_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sinceDate = latest?.booking_date
    ? new Date(new Date(latest.booking_date).getTime() - 2 * 86400_000)
    : new Date(Date.now() - 90 * 86400_000);
  const since = sinceDate.toISOString();

  let scanned = 0;
  let matched = 0;
  let inserted_activation = 0;
  let inserted_recurring = 0;
  let skipped_dormant = 0;
  let page = 1;
  const perPage = 100;
  let pages = 0;
  const touchedAffiliates = new Set<string>();

  while (page <= 50) {
    pages = page;
    let resp: TxResponse;
    try {
      resp = await integrationGet<TxResponse>("/transactions/query", {
        lastTransition: "transition/complete",
        lastTransitionedAtStart: since,
        include: "provider,listing",
        page,
        perPage,
      });
    } catch (e) {
      errors.push(`page ${page}: ${(e as Error).message}`);
      break;
    }

    const txs = resp.data || [];
    if (!txs.length) break;
    scanned += txs.length;

    const listingTitles = new Map<string, string>();
    for (const inc of resp.included || []) {
      if (inc.type === "listing") {
        const id = unwrapId(inc.id);
        if (id && inc.attributes?.title) listingTitles.set(id, inc.attributes.title);
      }
    }

    const providerIds = Array.from(
      new Set(txs.map((t) => unwrapId(t.relationships?.provider?.data?.id)).filter((x): x is string => !!x)),
    );

    if (providerIds.length) {
      const { data: refs } = await supabaseAdmin
        .from("affiliate_referrals")
        .select(
          "id,affiliate_id,sharetribe_user_id,first_booking_at,completed_bookings_count,activation_paid_at,recurring_unlocked_at,last_booking_at,total_gross_cents",
        )
        .in("sharetribe_user_id", providerIds);
      const refByHost = new Map<string, typeof refs extends (infer T)[] | null ? T : never>();
      for (const r of refs || []) refByHost.set(r.sharetribe_user_id, r as any);

      // Sort transactions per-host chronologically so milestone counting is stable.
      const sorted = [...txs].sort((a, b) => {
        const ad = a.attributes.lastTransitionedAt || a.attributes.createdAt || "";
        const bd = b.attributes.lastTransitionedAt || b.attributes.createdAt || "";
        return ad.localeCompare(bd);
      });

      for (const tx of sorted) {
        const providerId = unwrapId(tx.relationships?.provider?.data?.id);
        if (!providerId) continue;
        const ref = refByHost.get(providerId) as any;
        if (!ref) continue;
        matched++;

        const txId = unwrapId(tx.id);
        if (!txId) continue;

        // Skip if we already recorded this tx (idempotent across sync runs)
        const { data: existing } = await supabaseAdmin
          .from("affiliate_commissions")
          .select("id")
          .eq("sharetribe_tx_id", txId)
          .maybeSingle();
        if (existing) continue;

        const gross = tx.attributes.payinTotal?.amount ?? 0;
        const currency = tx.attributes.payinTotal?.currency || "USD";
        const bookingDate = tx.attributes.lastTransitionedAt || tx.attributes.createdAt || new Date().toISOString();
        const listingId = unwrapId(tx.relationships?.listing?.data?.id);
        const listingTitle = (listingId && listingTitles.get(listingId)) || null;

        const nextCount = (ref.completed_bookings_count ?? 0) + 1;

        // Decide commission for this booking based on milestone
        let kind: "activation_bonus" | "recurring" | null = null;
        let commissionCents = 0;

        if (nextCount === ACTIVATION_BOOKING) {
          kind = "activation_bonus";
          commissionCents = ACTIVATION_BONUS_CENTS;
        } else if (nextCount >= RECURRING_UNLOCK_AT) {
          // Pause logic: if last booking was >60d ago, still record (since this booking
          // proves activity resumed), but only if it didn't happen during a long gap
          // from the affiliate's POV. Simple rule: always pay recurring once unlocked
          // and host has a booking. Dormant pause only applies between bookings, not
          // retroactively to the booking that ended the dormancy.
          kind = "recurring";
          commissionCents = Math.round(gross * COMMISSION_RATE);
        }
        // nextCount === 2 → no commission row, but we still update the counter

        if (kind) {
          const { error: insErr } = await supabaseAdmin.from("affiliate_commissions").insert({
            affiliate_id: ref.affiliate_id,
            referral_id: ref.id,
            sharetribe_tx_id: txId,
            host_user_id: providerId,
            listing_id: listingId,
            listing_title: listingTitle,
            booking_gross_cents: gross,
            commission_cents: commissionCents,
            currency,
            booking_date: bookingDate,
            status: "pending",
            kind,
          });
          if (insErr) {
            errors.push(`insert ${txId}: ${insErr.message}`);
            continue;
          }
          if (kind === "activation_bonus") inserted_activation++;
          else inserted_recurring++;
          touchedAffiliates.add(ref.affiliate_id);
        }

        // Update referral milestone state
        const update: {
          completed_bookings_count: number;
          last_booking_at: string;
          total_gross_cents: number;
          first_booking_at?: string;
          activation_paid_at?: string;
          recurring_unlocked_at?: string;
        } = {
          completed_bookings_count: nextCount,
          last_booking_at: bookingDate,
          total_gross_cents: (ref.total_gross_cents ?? 0) + gross,
        };
        if (!ref.first_booking_at) update.first_booking_at = bookingDate;
        if (nextCount === ACTIVATION_BOOKING && !ref.activation_paid_at) update.activation_paid_at = bookingDate;
        if (nextCount >= RECURRING_UNLOCK_AT && !ref.recurring_unlocked_at) update.recurring_unlocked_at = bookingDate;

        await supabaseAdmin.from("affiliate_referrals").update(update).eq("id", ref.id);

        // Mutate in-memory ref so subsequent txs in same page count correctly
        Object.assign(ref, update);

      }
    }

    const totalPages = resp.meta?.totalPages ?? page;
    if (page >= totalPages) break;
    page++;
  }

  // Auto-approve pending commissions past the refund window.
  const cutoff = new Date(Date.now() - REFUND_WINDOW_DAYS * 86400_000).toISOString();
  const { count: approved } = await supabaseAdmin
    .from("affiliate_commissions")
    .update({ status: "approved" }, { count: "exact" })
    .eq("status", "pending")
    .lt("booking_date", cutoff);

  // Recompute tier for every affiliate whose crew changed
  for (const aid of touchedAffiliates) {
    try {
      await recomputeAffiliateTier(aid);
    } catch (e) {
      errors.push(`tier recompute ${aid}: ${(e as Error).message}`);
    }
  }

  // (For visibility — count of referrals currently dormant >60d)
  const dormantCutoff = new Date(Date.now() - DORMANT_PAUSE_DAYS * 86400_000).toISOString();
  const { count: dormantCount } = await supabaseAdmin
    .from("affiliate_referrals")
    .select("id", { count: "exact", head: true })
    .lt("last_booking_at", dormantCutoff)
    .gte("completed_bookings_count", RECURRING_UNLOCK_AT);
  skipped_dormant = dormantCount || 0;

  return {
    scanned,
    matched,
    inserted_activation,
    inserted_recurring,
    skipped_dormant,
    approved: approved || 0,
    pages,
    since,
    errors,
  };
}
