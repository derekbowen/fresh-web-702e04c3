import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { fetchAvailableTimeSlots } from "./sharetribe.server-BZ7y3aGI.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { normalizeSlotArray } from "./availability.utils-ohL_VTYY.js";
import { c as createServerFn } from "../server.js";
import "@supabase/supabase-js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
const CACHE_TTL_MS = 15 * 60 * 1e3;
const HOUR_MS = 60 * 60 * 1e3;
function expandToHourlySlots(blocks, windowEndMs, maxSlots) {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const nowMs = Date.now();
  const out = [];
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
        seats: b.seats ?? 1
      });
      if (out.length >= maxSlots) return out;
    }
  }
  return out;
}
const getListingAvailability_createServerFn_handler = createServerRpc({
  id: "cc8247edfb764bc249057bfb7ed1c1c3b7fb767a9ecb3a0527db515930482181",
  name: "getListingAvailability",
  filename: "src/lib/availability.functions.ts"
}, (opts) => getListingAvailability.__executeServer(opts));
const getListingAvailability = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const id = String(data?.listingId ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    throw new Error("Invalid listing ID");
  }
  const days = Math.min(Math.max(Number(data?.days) || 60, 1), 90);
  return {
    listingId: id,
    days
  };
}).handler(getListingAvailability_createServerFn_handler, async ({
  data
}) => {
  const maxSlots = 24 * data.days;
  try {
    const {
      data: row
    } = await supabaseAdmin.from("availability_cache").select("slots, fetched_at").eq("listing_id", data.listingId).maybeSingle();
    if (row && row.fetched_at) {
      const fetchedMs = Date.parse(row.fetched_at);
      if (Number.isFinite(fetchedMs)) {
        const ageMs = Date.now() - fetchedMs;
        if (ageMs < CACHE_TTL_MS) {
          const normalized = normalizeSlotArray(row.slots);
          const rawHadEntries = Array.isArray(row.slots) && row.slots.length > 0;
          if (!(rawHadEntries && normalized.length === 0)) {
            return {
              listingId: data.listingId,
              fetchedAt: row.fetched_at,
              slots: normalized,
              error: null,
              cached: true
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn("availability_cache read failed (continuing to fresh fetch):", err);
  }
  const start = /* @__PURE__ */ new Date();
  start.setMinutes(0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + data.days);
  try {
    const blocks = await fetchAvailableTimeSlots(data.listingId, start.toISOString(), end.toISOString());
    const hourly = expandToHourlySlots(blocks, end.getTime(), maxSlots);
    const fetchedAt = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await supabaseAdmin.from("availability_cache").upsert({
        listing_id: data.listingId,
        slots: hourly,
        fetched_at: fetchedAt
      }, {
        onConflict: "listing_id"
      });
    } catch (err) {
      console.warn("availability_cache write failed:", err);
    }
    return {
      listingId: data.listingId,
      fetchedAt,
      slots: hourly,
      error: null,
      cached: false
    };
  } catch (err) {
    console.error("getListingAvailability error:", err);
    return {
      listingId: data.listingId,
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      slots: [],
      error: "Could not load live availability. Please try again."
    };
  }
});
export {
  getListingAvailability_createServerFn_handler
};
