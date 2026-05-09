import { createServerFn } from "@tanstack/react-start";
import { fetchAvailableTimeSlots, type AvailableTimeSlot } from "@/server/sharetribe.server";

export interface AvailabilityResult {
  listingId: string;
  fetchedAt: string;
  slots: AvailableTimeSlot[];
  error: string | null;
}

/**
 * Fetch live availability for a listing.
 * Defensive: returns empty slots on any error so the page still renders.
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
    const start = new Date();
    // Round down to start of next hour so Sharetribe accepts the window.
    start.setMinutes(0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + data.days);

    try {
      const blocks = await fetchAvailableTimeSlots(
        data.listingId,
        start.toISOString(),
        end.toISOString(),
      );
      // Sharetribe returns availability blocks (e.g. one 10am–10pm block per
      // day). Split each block into 1-hour bookable slots so the calendar
      // shows real hourly options instead of one giant range.
      const HOUR_MS = 60 * 60 * 1000;
      const nowMs = Date.now();
      const windowEndMs = end.getTime();
      const hourly: AvailableTimeSlot[] = [];
      for (const b of blocks) {
        const bStart = new Date(b.start).getTime();
        const bEnd = new Date(b.end).getTime();
        if (!Number.isFinite(bStart) || !Number.isFinite(bEnd)) continue;
        // Align to top of hour
        const firstSlotStart = Math.ceil(bStart / HOUR_MS) * HOUR_MS;
        for (let t = firstSlotStart; t + HOUR_MS <= bEnd; t += HOUR_MS) {
          if (t < nowMs) continue;
          if (t >= windowEndMs) break;
          hourly.push({
            start: new Date(t).toISOString(),
            end: new Date(t + HOUR_MS).toISOString(),
            seats: b.seats ?? 1,
          });
        }
      }
      return {
        listingId: data.listingId,
        fetchedAt: new Date().toISOString(),
        slots: hourly,
        error: null,
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
