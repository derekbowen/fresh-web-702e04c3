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
      const slots = await fetchAvailableTimeSlots(
        data.listingId,
        start.toISOString(),
        end.toISOString(),
      );
      return {
        listingId: data.listingId,
        fetchedAt: new Date().toISOString(),
        slots,
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
