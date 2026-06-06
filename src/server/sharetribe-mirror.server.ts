/**
 * Sharetribe data mirror — pulls users, listings, transactions (with messages,
 * customer, provider, listing) from the Integration API and upserts into
 * public.st_* tables. Idempotent on sharetribe_id / message_st_id.
 *
 * Runs every 15 minutes via /api/public/hooks/sync-sharetribe-mirror.
 * Cursor: per-resource last_synced_at in public.st_sync_state.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { integrationGet } from "./sharetribe.server";

const PER_PAGE = 100;
const MAX_PAGES = 25;
const LOOKBACK_MS_FIRST_RUN = 30 * 86400_000; // 30 days
const SAFETY_OVERLAP_MS = 2 * 60_000; // re-pull last 2 min to avoid edge gaps

function unwrapId(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && v && "uuid" in (v as any)) return String((v as any).uuid);
  return null;
}

async function getCursor(resource: string): Promise<Date> {
  const { data } = await supabaseAdmin
    .from("st_sync_state")
    .select("last_synced_at")
    .eq("resource", resource)
    .maybeSingle();
  if (data?.last_synced_at) {
    return new Date(new Date(data.last_synced_at).getTime() - SAFETY_OVERLAP_MS);
  }
  return new Date(Date.now() - LOOKBACK_MS_FIRST_RUN);
}

async function setCursor(
  resource: string,
  newCursor: Date,
  status: string,
  rows: number,
  error?: string,
) {
  await supabaseAdmin.from("st_sync_state").upsert(
    {
      resource,
      last_synced_at: newCursor.toISOString(),
      last_run_at: new Date().toISOString(),
      last_run_status: status,
      last_run_error: error ?? null,
      last_run_rows: rows,
    },
    { onConflict: "resource" },
  );
}

// ---------- Users ----------
type STUserResp = {
  data?: Array<{
    id: { uuid?: string } | string;
    type: "user";
    attributes?: {
      email?: string;
      emailVerified?: boolean;
      pendingEmail?: string | null;
      banned?: boolean;
      deleted?: boolean;
      createdAt?: string;
      profile?: {
        firstName?: string;
        lastName?: string;
        displayName?: string;
        publicData?: Record<string, unknown>;
      };
    };
  }>;
  meta?: { totalPages?: number; page?: number };
};

async function syncUsers(): Promise<{ rows: number; error?: string }> {
  const since = await getCursor("users");
  let page = 1;
  let rows = 0;
  let newest = since;

  while (page <= MAX_PAGES) {
    let resp: STUserResp;
    try {
      resp = await integrationGet<STUserResp>("/users/query", {
        createdAtStart: since.toISOString(),
        sort: "createdAt",
        page,
        perPage: PER_PAGE,
      });
    } catch (e) {
      return { rows, error: (e as Error).message };
    }
    const users = resp.data || [];
    if (!users.length) break;

    const upserts = users
      .map((u) => {
        const id = unwrapId(u.id);
        if (!id) return null;
        const a = u.attributes || {};
        const created = a.createdAt ? new Date(a.createdAt) : null;
        if (created && created > newest) newest = created;
        return {
          sharetribe_id: id,
          email: a.email?.toLowerCase() ?? null,
          display_name: a.profile?.displayName ?? null,
          first_name: a.profile?.firstName ?? null,
          last_name: a.profile?.lastName ?? null,
          banned: !!a.banned,
          deleted: !!a.deleted,
          email_verified: !!a.emailVerified,
          pending_email: a.pendingEmail ?? null,
          created_at_st: a.createdAt ?? null,
          profile: a.profile ?? {},
          raw: u as any,
        };
      })
      .filter(Boolean) as any[];

    if (upserts.length) {
      const { error } = await supabaseAdmin
        .from("st_users")
        .upsert(upserts, { onConflict: "sharetribe_id" });
      if (error) return { rows, error: error.message };
      rows += upserts.length;
    }

    const total = resp.meta?.totalPages ?? page;
    if (page >= total) break;
    page++;
  }
  await setCursor("users", newest, "ok", rows);
  return { rows };
}

// ---------- Listings ----------
type STListingResp = {
  data?: Array<{
    id: { uuid?: string } | string;
    type: "listing";
    attributes?: {
      title?: string;
      description?: string;
      state?: string;
      geolocation?: { lat: number; lng: number } | null;
      price?: { amount: number; currency: string } | null;
      publicData?: Record<string, unknown>;
      createdAt?: string;
    };
    relationships?: {
      author?: { data?: { id?: { uuid?: string } | string } };
      images?: { data?: Array<unknown> };
    };
  }>;
  meta?: { totalPages?: number; page?: number };
};

async function syncListings(): Promise<{ rows: number; error?: string }> {
  const since = await getCursor("listings");
  let page = 1;
  let rows = 0;
  let newest = since;

  while (page <= MAX_PAGES) {
    let resp: STListingResp;
    try {
      resp = await integrationGet<STListingResp>("/listings/query", {
        states: "published,closed,draft,pendingApproval",
        // Integration listings/query supports createdAtStart per Sharetribe docs
        createdAtStart: since.toISOString(),
        sort: "createdAt",
        page,
        perPage: PER_PAGE,
      });
    } catch (e) {
      return { rows, error: (e as Error).message };
    }
    const items = resp.data || [];
    if (!items.length) break;

    const upserts = items
      .map((l) => {
        const id = unwrapId(l.id);
        if (!id) return null;
        const a = l.attributes || {};
        const pd: any = a.publicData || {};
        const created = a.createdAt ? new Date(a.createdAt) : null;
        if (created && created > newest) newest = created;
        return {
          sharetribe_id: id,
          author_st_id: unwrapId(l.relationships?.author?.data?.id),
          title: a.title ?? null,
          description: a.description ?? null,
          state: a.state ?? null,
          geolocation: a.geolocation ?? null,
          city: pd.city ?? pd.location?.city ?? null,
          region: pd.region ?? pd.state ?? null,
          country: pd.country ?? null,
          price_amount: a.price?.amount ?? null,
          price_currency: a.price?.currency ?? null,
          photos_count: (l.relationships?.images?.data || []).length,
          created_at_st: a.createdAt ?? null,
          updated_at_st: a.createdAt ?? null,
          public_data: pd,
          raw: l as any,
        };
      })
      .filter(Boolean) as any[];

    if (upserts.length) {
      const { error } = await supabaseAdmin
        .from("st_listings")
        .upsert(upserts, { onConflict: "sharetribe_id" });
      if (error) return { rows, error: error.message };
      rows += upserts.length;
    }

    const total = resp.meta?.totalPages ?? page;
    if (page >= total) break;
    page++;
  }
  await setCursor("listings", newest, "ok", rows);
  return { rows };
}

// ---------- Transactions + Messages ----------
type STTxResp = {
  data?: Array<{
    id: { uuid?: string } | string;
    type: "transaction";
    attributes: {
      createdAt?: string;
      processName?: string;
      lastTransitionedAt?: string;
      lastTransition?: string;
      payinTotal?: { amount: number; currency: string } | null;
      payoutTotal?: { amount: number; currency: string } | null;
      lineItems?: Array<{
        code?: string;
        unitPrice?: { amount: number; currency: string };
        lineTotal?: { amount: number; currency: string };
        reversal?: boolean;
      }>;
      transitions?: Array<{ transition: string; createdAt: string; by?: string }>;
    };
    relationships?: {
      customer?: { data?: { id?: { uuid?: string } | string } };
      provider?: { data?: { id?: { uuid?: string } | string } };
      listing?: { data?: { id?: { uuid?: string } | string } };
      booking?: { data?: { id?: { uuid?: string } | string } };
      messages?: { data?: Array<{ id?: { uuid?: string } | string }> };
    };
  }>;
  included?: Array<{
    id: { uuid?: string } | string;
    type: string;
    attributes?: any;
    relationships?: any;
  }>;
  meta?: { totalPages?: number; page?: number };
};

async function syncTransactions(): Promise<{
  txRows: number;
  msgRows: number;
  error?: string;
}> {
  const since = await getCursor("transactions");
  let page = 1;
  let txRows = 0;
  let msgRows = 0;
  let newest = since;

  while (page <= MAX_PAGES) {
    let resp: STTxResp;
    try {
      resp = await integrationGet<STTxResp>("/transactions/query", {
        lastTransitionedAtStart: since.toISOString(),
        include: "customer,provider,listing,booking,messages",
        page,
        perPage: PER_PAGE,
      });
    } catch (e) {
      return { txRows, msgRows, error: (e as Error).message };
    }
    const txs = resp.data || [];
    if (!txs.length) break;

    // Index included
    const listings = new Map<string, { title?: string }>();
    const bookings = new Map<string, { start?: string; end?: string }>();
    const messagesById = new Map<
      string,
      {
        content: string;
        createdAt: string;
        senderId: string | null;
      }
    >();
    for (const inc of resp.included || []) {
      const incId = unwrapId(inc.id);
      if (!incId) continue;
      if (inc.type === "listing") {
        listings.set(incId, { title: inc.attributes?.title });
      } else if (inc.type === "booking") {
        bookings.set(incId, {
          start: inc.attributes?.start,
          end: inc.attributes?.end,
        });
      } else if (inc.type === "message") {
        messagesById.set(incId, {
          content: String(inc.attributes?.content ?? ""),
          createdAt: inc.attributes?.createdAt ?? new Date().toISOString(),
          senderId: unwrapId(inc.relationships?.sender?.data?.id),
        });
      }
    }

    const txUpserts: any[] = [];
    const msgUpserts: any[] = [];

    for (const t of txs) {
      const txId = unwrapId(t.id);
      if (!txId) continue;
      const a = t.attributes;
      const lt = a.lastTransitionedAt ? new Date(a.lastTransitionedAt) : null;
      if (lt && lt > newest) newest = lt;

      const listingId = unwrapId(t.relationships?.listing?.data?.id);
      const bookingId = unwrapId(t.relationships?.booking?.data?.id);
      const booking = bookingId ? bookings.get(bookingId) : null;
      const li = (a.lineItems || []) as any[];
      const providerCommission = li.find(
        (x) => x.code === "line-item/provider-commission",
      )?.lineTotal?.amount;
      const customerCommission = li.find(
        (x) => x.code === "line-item/customer-commission",
      )?.lineTotal?.amount;

      txUpserts.push({
        sharetribe_id: txId,
        process_name: a.processName ?? null,
        last_transition: a.lastTransition ?? null,
        last_transitioned_at: a.lastTransitionedAt ?? null,
        listing_st_id: listingId,
        listing_title: listingId ? listings.get(listingId)?.title ?? null : null,
        customer_st_id: unwrapId(t.relationships?.customer?.data?.id),
        provider_st_id: unwrapId(t.relationships?.provider?.data?.id),
        booking_start: booking?.start ?? null,
        booking_end: booking?.end ?? null,
        payin_total_cents: a.payinTotal?.amount ?? null,
        payout_total_cents: a.payoutTotal?.amount ?? null,
        provider_commission_cents: providerCommission ?? null,
        customer_commission_cents: customerCommission ?? null,
        currency: a.payinTotal?.currency ?? null,
        state: a.lastTransition?.replace(/^transition\//, "") ?? null,
        created_at_st: a.createdAt ?? null,
        transitions: a.transitions ?? [],
        raw: t as any,
      });

      for (const ref of t.relationships?.messages?.data || []) {
        const mid = unwrapId(ref.id);
        if (!mid) continue;
        const m = messagesById.get(mid);
        if (!m) continue;
        msgUpserts.push({
          sharetribe_id: mid,
          transaction_st_id: txId,
          sender_st_id: m.senderId,
          content: m.content,
          created_at_st: m.createdAt,
          scanned: false,
          raw: { content: m.content, senderId: m.senderId },
        });
      }
    }

    if (txUpserts.length) {
      const { error } = await supabaseAdmin
        .from("st_transactions")
        .upsert(txUpserts, { onConflict: "sharetribe_id" });
      if (error) return { txRows, msgRows, error: error.message };
      txRows += txUpserts.length;
    }
    if (msgUpserts.length) {
      const { error } = await supabaseAdmin
        .from("st_messages")
        .upsert(msgUpserts, { onConflict: "sharetribe_id", ignoreDuplicates: true });
      if (error) return { txRows, msgRows, error: error.message };
      msgRows += msgUpserts.length;
    }

    const total = resp.meta?.totalPages ?? page;
    if (page >= total) break;
    page++;
  }
  await setCursor("transactions", newest, "ok", txRows);
  return { txRows, msgRows };
}

// ---------- Public entry ----------
export async function syncSharetribeMirror(): Promise<{
  users: number;
  listings: number;
  transactions: number;
  messages: number;
  alerts: number;
  errors: string[];
  ms: number;
}> {
  const t0 = Date.now();
  const errors: string[] = [];

  const u = await syncUsers().catch((e) => ({ rows: 0, error: (e as Error).message }));
  if (u.error) errors.push(`users: ${u.error}`);

  const l = await syncListings().catch((e) => ({ rows: 0, error: (e as Error).message }));
  if (l.error) errors.push(`listings: ${l.error}`);

  const tx = await syncTransactions().catch((e) => ({
    txRows: 0,
    msgRows: 0,
    error: (e as Error).message,
  }));
  if (tx.error) errors.push(`transactions: ${tx.error}`);

  // Scan newly-arrived messages
  const { scanMessagesForAlerts } = await import("./security-scanner.server");
  const scan = await scanMessagesForAlerts().catch((e) => ({
    scanned: 0,
    alerts: 0,
    error: (e as Error).message,
  }));
  if ((scan as any).error) errors.push(`scan: ${(scan as any).error}`);

  return {
    users: u.rows,
    listings: l.rows,
    transactions: tx.txRows,
    messages: tx.msgRows,
    alerts: scan.alerts,
    errors,
    ms: Date.now() - t0,
  };
}
