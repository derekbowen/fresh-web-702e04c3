import { createServerFn } from "@tanstack/react-start";
import { fetchAvailableTimeSlots, type AvailableTimeSlot } from "@/server/sharetribe.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { normalizeSlotArray } from "@/lib/availability.utils";

export interface AvailabilityResult {
  listingId: string;
  fetchedAt: string;
  slots: AvailableTimeSlot[];
  error: string | null;
  cached?: boolean;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const HOUR_MS = 60 * 60 * 1000;

function expandToHourlySlots(
  blocks: AvailableTimeSlot[],
  windowEndMs: number,
  maxSlots: number,
): AvailableTimeSlot[] {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const nowMs = Date.now();
  const out: AvailableTimeSlot[] = [];
  for (const b of safeBlocks) {
    if (!b || typeof b.start !== "string" || typeof b.end !== "string") continue;
    const bStart = Date.parse(b.start);
    const bEnd = Date.parse(b.end);
    if (!Number.isFinite(bStart) || !Number.isFinite(bEnd)) continue;
    if (bEnd <= bStart) continue;
    const firstSlotStart = Math.ceil(bStart / HOUR_MS) * HOUR_MS;
    for (let t = firstSlotStart; t + HOUR_MS <= bEnd; t += HOUR_MS) {
      if (t < nowMs) continue;
      if (t >= windowEndMs) break;
      out.push({
        start: new Date(t).toISOString(),
        end: new Date(t + HOUR_MS).toISOString(),
        seats: b.seats ?? 1,
      });
      if (out.length >= maxSlots) return out;
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
    const maxSlots = 24 * data.days;

    // 1. Try cache
    try {
      const { data: row } = await supabaseAdmin
        .from("availability_cache")
        .select("slots, fetched_at")
        .eq("listing_id", data.listingId)
        .maybeSingle();

      if (row && row.fetched_at) {
        const fetchedMs = Date.parse(row.fetched_at as unknown as string);
        if (Number.isFinite(fetchedMs)) {
          const ageMs = Date.now() - fetchedMs;
          if (ageMs < CACHE_TTL_MS) {
            const normalized = normalizeSlotArray(row.slots);
            const rawHadEntries = Array.isArray(row.slots) && row.slots.length > 0;
            // If cache had entries but all were invalid, treat as stale and refetch.
            if (!(rawHadEntries && normalized.length === 0)) {
              return {
                listingId: data.listingId,
                fetchedAt: row.fetched_at as unknown as string,
                slots: normalized,
                error: null,
                cached: true,
              };
            }
          }
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
      const hourly = expandToHourlySlots(blocks, end.getTime(), maxSlots);
      const fetchedAt = new Date().toISOString();

      // 3. Update cache (best-effort)
      try {
        await supabaseAdmin
          .from("availability_cache")
          .upsert(
            { listing_id: data.listingId, slots: hourly as unknown as never, fetched_at: fetchedAt },
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

