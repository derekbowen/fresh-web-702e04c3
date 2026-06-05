/**
 * Renter drip — server-only helpers.
 *
 * - geocodeZip: ZIP → lat/lng via zippopotam.us (free, no key).
 * - pickPoolForSubscriber: nearest published listing in synced_listings the
 *   subscriber hasn't been emailed yet.
 * - findNearbyPools: top-N pools for the welcome email.
 * - scheduleSequence: queues the 14-day sequence in renter_emails.
 * - sendDueEmails: drains pending rows and sends via Emailit.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { render } from "@react-email/components";
import * as React from "react";
import { sendViaEmailit } from "@/lib/email/emailit";
import { template as welcomeTpl } from "@/lib/email-templates/renter-welcome";
import { template as poolTpl } from "@/lib/email-templates/renter-pool-of-the-day";
import { template as referralTpl } from "@/lib/email-templates/renter-referral";

const FROM = "Pool Rental Near Me <hello@notify.poolfriends.poolrentalnearme.com>";
const SITE_URL = "https://www.poolrentalnearme.com";

export interface NearbyPool {
  sharetribeId: string;
  slug: string | null;
  title: string;
  city: string | null;
  stateCode: string | null;
  priceAmount: number | null;
  priceCurrency: string | null;
  imageUrl: string | null;
  url: string;
  distanceMi: number | null;
}

// ---------- ZIP geocoding (free, cached on subscriber row) ----------

export async function geocodeZip(zip: string): Promise<
  { lat: number; lng: number; city: string | null; state: string | null } | null
> {
  const z = String(zip).trim().slice(0, 5);
  if (!/^\d{5}$/.test(z)) return null;
  try {
    const r = await fetch(`https://api.zippopotam.us/us/${z}`);
    if (!r.ok) return null;
    const j: any = await r.json();
    const place = j?.places?.[0];
    if (!place) return null;
    return {
      lat: parseFloat(place.latitude),
      lng: parseFloat(place.longitude),
      city: place["place name"] ?? null,
      state: place["state abbreviation"] ?? null,
    };
  } catch {
    return null;
  }
}

// ---------- Nearby pools ----------

export async function findNearbyPools(
  lat: number,
  lng: number,
  limit = 3,
  excludeIds: string[] = [],
): Promise<NearbyPool[]> {
  // Bounding box ~75 miles
  const degLat = 75 / 69;
  const degLng = 75 / (69 * Math.max(0.1, Math.cos((lat * Math.PI) / 180)));
  const { data, error } = await supabaseAdmin
    .from("synced_listings")
    .select(
      "sharetribe_id, slug, title, city, state_code, price_amount, price_currency, primary_image_url, latitude, longitude",
    )
    .eq("state", "published")
    .eq("is_deleted", false)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .not("primary_image_url", "is", null)
    .gte("latitude", lat - degLat)
    .lte("latitude", lat + degLat)
    .gte("longitude", lng - degLng)
    .lte("longitude", lng + degLng)
    .limit(200);
  if (error || !data) return [];

  const withDist = data
    .filter((r) => !excludeIds.includes(r.sharetribe_id))
    .map((r) => {
      const d = haversineMi(lat, lng, Number(r.latitude), Number(r.longitude));
      return { row: r, d };
    })
    .sort((a, b) => a.d - b.d)
    .slice(0, limit);

  return withDist.map(({ row, d }) => ({
    sharetribeId: row.sharetribe_id,
    slug: row.slug,
    title: row.title || "Pool rental",
    city: row.city,
    stateCode: row.state_code,
    priceAmount: row.price_amount,
    priceCurrency: row.price_currency,
    imageUrl: row.primary_image_url,
    url: `${SITE_URL}/l/${row.slug || "pool"}/${row.sharetribe_id}`,
    distanceMi: Math.round(d * 10) / 10,
  }));
}

function haversineMi(la1: number, lo1: number, la2: number, lo2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLa = toRad(la2 - la1);
  const dLo = toRad(lo2 - lo1);
  const a =
    Math.sin(dLa / 2) ** 2 +
    Math.cos(toRad(la1)) * Math.cos(toRad(la2)) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ---------- Sequence scheduling ----------

// Day, kind. Welcome and referrals are predictable; pool_of_day picks the
// listing at SEND TIME so we always have a fresh pool.
type Step = { day: number; kind: "welcome" | "pool_of_day" | "referral" };
const SEQUENCE: Step[] = [
  { day: 0, kind: "welcome" },
  { day: 1, kind: "pool_of_day" },
  { day: 2, kind: "pool_of_day" },
  { day: 3, kind: "pool_of_day" },
  { day: 5, kind: "pool_of_day" },
  { day: 7, kind: "referral" },
  { day: 9, kind: "pool_of_day" },
  { day: 11, kind: "pool_of_day" },
  { day: 14, kind: "referral" },
];

export async function scheduleSequence(subscriberId: string, baseAt = new Date()) {
  const rows = SEQUENCE.map((s, i) => ({
    subscriber_id: subscriberId,
    step: i,
    kind: s.kind,
    scheduled_at: new Date(baseAt.getTime() + s.day * 86400_000).toISOString(),
    status: "pending" as const,
  }));
  await supabaseAdmin.from("renter_emails").insert(rows);
  await supabaseAdmin
    .from("renter_subscribers")
    .update({ sequence_scheduled: true })
    .eq("id", subscriberId);
}

// ---------- Send loop ----------

export async function sendDueEmails(batch = 25): Promise<{
  considered: number;
  sent: number;
  failed: number;
  skipped: number;
}> {
  const { data: due } = await supabaseAdmin
    .from("renter_emails")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(batch);

  if (!due || due.length === 0) {
    return { considered: 0, sent: 0, failed: 0, skipped: 0 };
  }

  let sent = 0,
    failed = 0,
    skipped = 0;

  for (const row of due) {
    try {
      const { data: sub } = await supabaseAdmin
        .from("renter_subscribers")
        .select("*")
        .eq("id", row.subscriber_id)
        .single();
      if (!sub || sub.status !== "active") {
        await supabaseAdmin
          .from("renter_emails")
          .update({ status: "skipped", error: "subscriber inactive" })
          .eq("id", row.id);
        skipped++;
        continue;
      }

      const firstName = (sub.name || "").split(" ")[0] || null;
      const unsubUrl = `${SITE_URL}/unsubscribe-renter?token=${sub.unsubscribe_token}`;

      let html = "";
      let subject = "";
      let listingId: string | null = null;

      if (row.kind === "welcome") {
        const pools =
          sub.latitude && sub.longitude
            ? await findNearbyPools(Number(sub.latitude), Number(sub.longitude), 3)
            : [];
        const where = sub.city
          ? `${sub.city}${sub.state_code ? ", " + sub.state_code : ""}`
          : "your area";
        subject = pools.length
          ? `${pools.length} pools near ${where} — welcome to Pool Rental Near Me`
          : `Welcome to Pool Rental Near Me`;
        html = await render(
          React.createElement(welcomeTpl.component, {
            firstName,
            where,
            pools,
            unsubUrl,
          }),
        );
        listingId = pools[0]?.sharetribeId ?? null;
      } else if (row.kind === "pool_of_day") {
        // Pick one pool not yet sent
        const { data: already } = await supabaseAdmin
          .from("renter_emails")
          .select("listing_id")
          .eq("subscriber_id", sub.id)
          .not("listing_id", "is", null);
        const exclude = (already ?? [])
          .map((r) => r.listing_id as string)
          .filter(Boolean);
        const pools =
          sub.latitude && sub.longitude
            ? await findNearbyPools(Number(sub.latitude), Number(sub.longitude), 1, exclude)
            : [];
        if (pools.length === 0) {
          // No new pool to show — skip but don't fail the sequence
          await supabaseAdmin
            .from("renter_emails")
            .update({ status: "skipped", error: "no new nearby pool available" })
            .eq("id", row.id);
          skipped++;
          continue;
        }
        const pool = pools[0];
        subject = `Pool of the day: ${pool.title}${pool.city ? " in " + pool.city : ""}`;
        listingId = pool.sharetribeId;
        html = await render(
          React.createElement(poolTpl.component, {
            firstName,
            pool,
            unsubUrl,
          }),
        );
      } else if (row.kind === "referral") {
        subject = `Know someone with a pool? Earn $50 when they list`;
        html = await render(
          React.createElement(referralTpl.component, {
            firstName,
            unsubUrl,
          }),
        );
      } else {
        await supabaseAdmin
          .from("renter_emails")
          .update({ status: "failed", error: `unknown kind: ${row.kind}` })
          .eq("id", row.id);
        failed++;
        continue;
      }

      // Send via Emailit
      const result = await sendViaEmailit({
        from: FROM,
        to: sub.email,
        subject,
        html,
        headers: {
          "List-Unsubscribe": `<${unsubUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });

      await supabaseAdmin
        .from("renter_emails")
        .update({
          status: "sent",
          subject,
          listing_id: listingId,
          emailit_id: result.id,
          sent_at: new Date().toISOString(),
          attempts: (row.attempts ?? 0) + 1,
        })
        .eq("id", row.id);
      sent++;
    } catch (err: any) {
      const msg = err?.message || String(err);
      const attempts = (row.attempts ?? 0) + 1;
      const final = attempts >= 3;
      await supabaseAdmin
        .from("renter_emails")
        .update({
          status: final ? "failed" : "pending",
          error: msg.slice(0, 500),
          attempts,
          scheduled_at: final
            ? row.scheduled_at
            : new Date(Date.now() + 5 * 60_000).toISOString(),
        })
        .eq("id", row.id);
      if (final) failed++;
    }
  }

  return { considered: due.length, sent, failed, skipped };
}

// ---------- Sharetribe poller ----------

export async function pollSharetribeRenters(): Promise<{
  fetched: number;
  inserted: number;
  scheduled: number;
  skipped: number;
  cursor: string | null;
}> {
  const { integrationGet } = await import("@/server/sharetribe.server");

  const { data: state } = await supabaseAdmin
    .from("renter_drip_state")
    .select("last_st_created_at")
    .eq("id", 1)
    .single();

  const sinceISO =
    state?.last_st_created_at ||
    new Date(Date.now() - 24 * 3600_000).toISOString();

  let fetched = 0;
  let inserted = 0;
  let scheduled = 0;
  let skipped = 0;
  let newCursor: string | null = null;

  try {
    // Sharetribe Integration API: users/query
    const res: any = await integrationGet("/users/query", {
      perPage: 100,
      sort: "createdAt",
      createdAtStart: sinceISO,
    });
    const users: any[] = Array.isArray(res?.data) ? res.data : [];
    fetched = users.length;

    for (const u of users) {
      const stUserId =
        typeof u.id === "string" ? u.id : u.id?.uuid || u.id?._ref || null;
      const attrs = u.attributes || {};
      const email = (attrs.email || "").toLowerCase().trim();
      const createdAt = attrs.createdAt || null;
      if (!stUserId || !email) {
        skipped++;
        continue;
      }
      if (createdAt && (!newCursor || createdAt > newCursor)) newCursor = createdAt;

      const profile = attrs.profile || {};
      const firstName = profile.firstName || "";
      const lastName = profile.lastName || "";
      const name = `${firstName} ${lastName}`.trim() || null;

      // Look for ZIP in known locations
      const pd = profile.protectedData || {};
      const pubd = profile.publicData || {};
      const zipRaw: string | null =
        pd.zip || pd.zipCode || pd.postalCode || pubd.zip || pubd.zipCode || pubd.postalCode || null;
      const zip = zipRaw ? String(zipRaw).trim().slice(0, 10) : null;

      // Geocode if ZIP present
      let lat: number | null = null,
        lng: number | null = null,
        city: string | null = null,
        st: string | null = null;
      if (zip) {
        const g = await geocodeZip(zip);
        if (g) {
          lat = g.lat;
          lng = g.lng;
          city = g.city;
          st = g.state;
        }
      }

      // Upsert subscriber
      const { data: existing } = await supabaseAdmin
        .from("renter_subscribers")
        .select("id, sequence_scheduled")
        .or(`st_user_id.eq.${stUserId},email.eq.${email}`)
        .maybeSingle();

      let subscriberId: string;
      if (existing) {
        subscriberId = existing.id;
        await supabaseAdmin
          .from("renter_subscribers")
          .update({
            st_user_id: stUserId,
            email,
            name,
            zip,
            city,
            state_code: st,
            latitude: lat,
            longitude: lng,
            st_created_at: createdAt,
          })
          .eq("id", subscriberId);
        if (!existing.sequence_scheduled) {
          await scheduleSequence(subscriberId);
          scheduled++;
        }
      } else {
        const { data: ins } = await supabaseAdmin
          .from("renter_subscribers")
          .insert({
            st_user_id: stUserId,
            email,
            name,
            zip,
            city,
            state_code: st,
            latitude: lat,
            longitude: lng,
            st_created_at: createdAt,
          })
          .select("id")
          .single();
        if (!ins) {
          skipped++;
          continue;
        }
        subscriberId = ins.id;
        inserted++;
        await scheduleSequence(subscriberId);
        scheduled++;
      }
    }
  } catch (err: any) {
    console.error("pollSharetribeRenters error:", err?.message || err);
  }

  // Bump cursor only on success
  if (newCursor) {
    await supabaseAdmin
      .from("renter_drip_state")
      .update({ last_st_created_at: newCursor, last_polled_at: new Date().toISOString() })
      .eq("id", 1);
  } else {
    await supabaseAdmin
      .from("renter_drip_state")
      .update({ last_polled_at: new Date().toISOString() })
      .eq("id", 1);
  }

  return { fetched, inserted, scheduled, skipped, cursor: newCursor };
}
