import { createServerFn } from "@tanstack/react-start";
import { fetchAvailableTimeSlots, type AvailableTimeSlot } from "@/server/sharetribe.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface AvailabilityResult {
  listingId: string;
  fetchedAt: string;
  slots: AvailableTimeSlot[];
  error: string | null;
  cached?: boolean;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function expandToHourlySlots(
  blocks: AvailableTimeSlot[],
  windowEndMs: number,
): AvailableTimeSlot[] {
  const HOUR_MS = 60 * 60 * 1000;
  const nowMs = Date.now();
  const out: AvailableTimeSlot[] = [];
  for (const b of blocks) {
    const bStart = new Date(b.start).getTime();
    const bEnd = new Date(b.end).getTime();
    if (!Number.isFinite(bStart) || !Number.isFinite(bEnd)) continue;
    const firstSlotStart = Math.ceil(bStart / HOUR_MS) * HOUR_MS;
    for (let t = firstSlotStart; t + HOUR_MS <= bEnd; t += HOUR_MS) {
      if (t < nowMs) continue;
      if (t >= windowEndMs) break;
      out.push({
        start: new Date(t).toISOString(),
        end: new Date(t + HOUR_MS).toISOString(),
        seats: b.seats ?? 1,
      });
    }
  }
  return out;
}

/**
 * Fetch live availability for a listing.
 * - Reads from `availability_cache` if < 15 min old
 * - Otherwise calls Sharetribe, splits day blocks into hourly slots, caches result
 * - Returns empty slots + error message on failure (page still renders)
 */
export const getListingAvailability = createServerFn({ method: "GET" })
  .inputValidator((data: { listingId: string; days?: number }) => {
    const id = String(data?.listingId ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      throw new Error("Invalid listing ID");
    }
    const days = Math.min(Math.max(Number(data?.days) || 60, 1), 90);
    return { listingId: id, days };
  })
  .handler(async ({ data }): Promise<AvailabilityResult> => {
    // 1. Try cache
    try {
      const { data: row } = await supabaseAdmin
        .from("availability_cache")
        .select("slots, fetched_at")
        .eq("listing_id", data.listingId)
        .maybeSingle();

      if (row && row.fetched_at) {
        const ageMs = Date.now() - new Date(row.fetched_at).getTime();
        if (ageMs < CACHE_TTL_MS && Array.isArray(row.slots)) {
          return {
            listingId: data.listingId,
            fetchedAt: row.fetched_at,
            slots: row.slots as AvailableTimeSlot[],
            error: null,
            cached: true,
          };
        }
      }
    } catch (err) {
      console.warn("availability_cache read failed (continuing to fresh fetch):", err);
    }

    // 2. Fresh fetch from Sharetribe
    const start = new Date();
    start.setMinutes(0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + data.days);

    try {
      const blocks = await fetchAvailableTimeSlots(
        data.listingId,
        start.toISOString(),
        end.toISOString(),
      );
      const hourly = expandToHourlySlots(blocks, end.getTime());
      const fetchedAt = new Date().toISOString();

      // 3. Update cache (best-effort)
      try {
        await supabaseAdmin
          .from("availability_cache")
          .upsert(
            { listing_id: data.listingId, slots: hourly, fetched_at: fetchedAt },
            { onConflict: "listing_id" },
          );
      } catch (err) {
        console.warn("availability_cache write failed:", err);
      }

      return {
        listingId: data.listingId,
        fetchedAt,
        slots: hourly,
        error: null,
        cached: false,
      };
    } catch (err) {
      console.error("getListingAvailability error:", err);
      return {
        listingId: data.listingId,
        fetchedAt: new Date().toISOString(),
        slots: [],
        error: "Could not load live availability. Please try again.",
      };
    }
  });
