/**
 * Nightly sync: poll Sharetribe Integration API for completed transactions,
 * write 5% commission rows for hosts attributed to an affiliate.
 *
 * Idempotent on sharetribe_tx_id. Auto-approves commissions whose booking_date
 * is older than the 7-day refund window.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { integrationGet } from "./sharetribe.server";

const COMMISSION_RATE = 0.05;
const REFUND_WINDOW_DAYS = 7;

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
  inserted: number;
  approved: number;
  pages: number;
  since: string;
  errors: string[];
}> {
  const errors: string[] = [];

  // Find the latest booking_date we've recorded; pull 2 days earlier to be safe.
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
  let inserted = 0;
  let page = 1;
  const perPage = 100;
  let pages = 0;

  // Loop pages (capped)
  while (page <= 50) {
    pages = page;
    let resp: TxResponse;
    try {
      resp = await integrationGet<TxResponse>("/transactions/query", {
        lastTransition: "transition/complete",
        "lastTransitionedAtStart": since,
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

    // Build listing title map from included
    const listingTitles = new Map<string, string>();
    for (const inc of resp.included || []) {
      if (inc.type === "listing") {
        const id = unwrapId(inc.id);
        if (id && inc.attributes?.title) listingTitles.set(id, inc.attributes.title);
      }
    }

    // Map providers (Sharetribe user IDs) → affiliate_referrals
    const providerIds = Array.from(
      new Set(
        txs
          .map((t) => unwrapId(t.relationships?.provider?.data?.id))
          .filter((x): x is string => !!x),
      ),
    );
    if (providerIds.length) {
      const { data: refs } = await supabaseAdmin
        .from("affiliate_referrals")
        .select("id,affiliate_id,sharetribe_user_id,first_booking_at")
        .in("sharetribe_user_id", providerIds);
      const refByHost = new Map<string, { id: string; affiliate_id: string; first_booking_at: string | null }>();
      for (const r of refs || []) refByHost.set(r.sharetribe_user_id, r);

      for (const tx of txs) {
        const providerId = unwrapId(tx.relationships?.provider?.data?.id);
        if (!providerId) continue;
        const ref = refByHost.get(providerId);
        if (!ref) continue;
        matched++;

        const txId = unwrapId(tx.id);
        if (!txId) continue;
        const gross = tx.attributes.payinTotal?.amount ?? 0; // already in minor units (cents)
        const currency = tx.attributes.payinTotal?.currency || "USD";
        const commission = Math.round(gross * COMMISSION_RATE);
        const bookingDate = tx.attributes.lastTransitionedAt || tx.attributes.createdAt || new Date().toISOString();
        const listingId = unwrapId(tx.relationships?.listing?.data?.id);
        const listingTitle = (listingId && listingTitles.get(listingId)) || null;

        const { error: insErr, count } = await supabaseAdmin
          .from("affiliate_commissions")
          .upsert(
            {
              affiliate_id: ref.affiliate_id,
              referral_id: ref.id,
              sharetribe_tx_id: txId,
              host_user_id: providerId,
              listing_id: listingId,
              listing_title: listingTitle,
              booking_gross_cents: gross,
              commission_cents: commission,
              currency,
              booking_date: bookingDate,
              status: "pending",
            },
            { onConflict: "sharetribe_tx_id", ignoreDuplicates: true, count: "exact" },
          );
        if (insErr) {
          errors.push(`upsert ${txId}: ${insErr.message}`);
          continue;
        }
        if ((count ?? 0) > 0) inserted++;

        if (!ref.first_booking_at) {
          await supabaseAdmin
            .from("affiliate_referrals")
            .update({ first_booking_at: bookingDate })
            .eq("id", ref.id)
            .is("first_booking_at", null);
        }
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

  return { scanned, matched, inserted, approved: approved || 0, pages, since, errors };
}
