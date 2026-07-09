import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { integrationGet } from "./sharetribe.server-BZ7y3aGI.js";
import "@supabase/supabase-js";
const PER_PAGE = 100;
const MAX_PAGES = 25;
const LOOKBACK_MS_FIRST_RUN = 30 * 864e5;
const SAFETY_OVERLAP_MS = 2 * 6e4;
function unwrapId(v) {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && v && "uuid" in v) return String(v.uuid);
  return null;
}
async function getCursor(resource) {
  const { data } = await supabaseAdmin.from("st_sync_state").select("last_synced_at").eq("resource", resource).maybeSingle();
  if (data?.last_synced_at) {
    return new Date(new Date(data.last_synced_at).getTime() - SAFETY_OVERLAP_MS);
  }
  return new Date(Date.now() - LOOKBACK_MS_FIRST_RUN);
}
async function setCursor(resource, newCursor, status, rows, error) {
  await supabaseAdmin.from("st_sync_state").upsert(
    {
      resource,
      last_synced_at: newCursor.toISOString(),
      last_run_at: (/* @__PURE__ */ new Date()).toISOString(),
      last_run_status: status,
      last_run_error: null,
      last_run_rows: rows
    },
    { onConflict: "resource" }
  );
}
async function syncUsers() {
  const since = await getCursor("users");
  let page = 1;
  let rows = 0;
  let newest = since;
  while (page <= MAX_PAGES) {
    let resp;
    try {
      resp = await integrationGet("/users/query", {
        createdAtStart: since.toISOString(),
        sort: "createdAt",
        page,
        perPage: PER_PAGE
      });
    } catch (e) {
      return { rows, error: e.message };
    }
    const users = resp.data || [];
    if (!users.length) break;
    const upserts = users.map((u) => {
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
        raw: u
      };
    }).filter(Boolean);
    if (upserts.length) {
      const { error } = await supabaseAdmin.from("st_users").upsert(upserts, { onConflict: "sharetribe_id" });
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
async function syncListings() {
  const since = await getCursor("listings");
  let page = 1;
  let rows = 0;
  let newest = since;
  while (page <= MAX_PAGES) {
    let resp;
    try {
      resp = await integrationGet("/listings/query", {
        states: "published,closed,draft,pendingApproval",
        // Integration listings/query supports createdAtStart per Sharetribe docs
        createdAtStart: since.toISOString(),
        sort: "createdAt",
        page,
        perPage: PER_PAGE
      });
    } catch (e) {
      return { rows, error: e.message };
    }
    const items = resp.data || [];
    if (!items.length) break;
    const upserts = items.map((l) => {
      const id = unwrapId(l.id);
      if (!id) return null;
      const a = l.attributes || {};
      const pd = a.publicData || {};
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
        raw: l
      };
    }).filter(Boolean);
    if (upserts.length) {
      const { error } = await supabaseAdmin.from("st_listings").upsert(upserts, { onConflict: "sharetribe_id" });
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
async function syncTransactions() {
  const since = await getCursor("transactions");
  let page = 1;
  let txRows = 0;
  let msgRows = 0;
  let newest = since;
  while (page <= MAX_PAGES) {
    let resp;
    try {
      resp = await integrationGet("/transactions/query", {
        lastTransitionedAtStart: since.toISOString(),
        include: "customer,provider,listing,booking,messages",
        page,
        perPage: PER_PAGE
      });
    } catch (e) {
      return { txRows, msgRows, error: e.message };
    }
    const txs = resp.data || [];
    if (!txs.length) break;
    const listings = /* @__PURE__ */ new Map();
    const bookings = /* @__PURE__ */ new Map();
    const messagesById = /* @__PURE__ */ new Map();
    for (const inc of resp.included || []) {
      const incId = unwrapId(inc.id);
      if (!incId) continue;
      if (inc.type === "listing") {
        listings.set(incId, { title: inc.attributes?.title });
      } else if (inc.type === "booking") {
        bookings.set(incId, {
          start: inc.attributes?.start,
          end: inc.attributes?.end
        });
      } else if (inc.type === "message") {
        messagesById.set(incId, {
          content: String(inc.attributes?.content ?? ""),
          createdAt: inc.attributes?.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
          senderId: unwrapId(inc.relationships?.sender?.data?.id)
        });
      }
    }
    const txUpserts = [];
    const msgUpserts = [];
    for (const t of txs) {
      const txId = unwrapId(t.id);
      if (!txId) continue;
      const a = t.attributes;
      const lt = a.lastTransitionedAt ? new Date(a.lastTransitionedAt) : null;
      if (lt && lt > newest) newest = lt;
      const listingId = unwrapId(t.relationships?.listing?.data?.id);
      const bookingId = unwrapId(t.relationships?.booking?.data?.id);
      const booking = bookingId ? bookings.get(bookingId) : null;
      const li = a.lineItems || [];
      const providerCommission = li.find(
        (x) => x.code === "line-item/provider-commission"
      )?.lineTotal?.amount;
      const customerCommission = li.find(
        (x) => x.code === "line-item/customer-commission"
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
        raw: t
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
          raw: { content: m.content, senderId: m.senderId }
        });
      }
    }
    if (txUpserts.length) {
      const { error } = await supabaseAdmin.from("st_transactions").upsert(txUpserts, { onConflict: "sharetribe_id" });
      if (error) return { txRows, msgRows, error: error.message };
      txRows += txUpserts.length;
    }
    if (msgUpserts.length) {
      const { error } = await supabaseAdmin.from("st_messages").upsert(msgUpserts, { onConflict: "sharetribe_id", ignoreDuplicates: true });
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
async function syncSharetribeMirror() {
  const t0 = Date.now();
  const errors = [];
  const u = await syncUsers().catch((e) => ({ rows: 0, error: e.message }));
  if (u.error) errors.push(`users: ${u.error}`);
  const l = await syncListings().catch((e) => ({ rows: 0, error: e.message }));
  if (l.error) errors.push(`listings: ${l.error}`);
  const tx = await syncTransactions().catch((e) => ({
    txRows: 0,
    msgRows: 0,
    error: e.message
  }));
  if (tx.error) errors.push(`transactions: ${tx.error}`);
  const { scanMessagesForAlerts } = await import("./security-scanner.server-5nZGEMXU.js");
  const scan = await scanMessagesForAlerts().catch((e) => ({
    scanned: 0,
    alerts: 0,
    error: e instanceof Error ? e.message : String(e)
  }));
  if (scan.error) errors.push(`scan: ${scan.error}`);
  return {
    users: u.rows,
    listings: l.rows,
    transactions: tx.txRows,
    messages: tx.msgRows,
    alerts: scan.alerts,
    errors,
    ms: Date.now() - t0
  };
}
export {
  syncSharetribeMirror
};
