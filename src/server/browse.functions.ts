/**
 * Server function behind the /s browse page.
 *
 * Reads through the Phase 1 listing-read facade (readListingSearch), so
 * PRNM_LISTING_READ_SOURCE decides the backend exactly as it does for every
 * other listing read. Under mirror-only that means synced_listings only, with
 * Sharetribe never called.
 *
 * Unlike queryListings (sharetribe.functions.ts), this returns the facade's
 * `degraded`, `servedBy` and `source` instead of discarding them: the page has
 * to tell a visitor when their filter was dropped or listings are unavailable.
 * queryListings is deliberately left alone; other callers depend on its shape.
 *
 * Only this server fn and types are exported. A plain exported helper here
 * would drag the facade (and supabaseAdmin) into the client bundle, so all of
 * the logic lives in the pure src/lib/browse-search.ts.
 */
import { createServerFn } from "@tanstack/react-start";
import { readListingSearch } from "./listing-read.server";
import { resolveListingReadSource } from "@/lib/listing-read-source";
import {
  parseBrowseQuery,
  toBrowseResult,
  toSearchOptions,
  unavailableBrowseResult,
  type BrowseQuery,
  type BrowseResult,
} from "@/lib/browse-search";

export const browseListings = createServerFn({ method: "GET" })
  // Same lenient rules as the route's validateSearch: an invalid field is
  // dropped, never rejected, and nothing outside BrowseQuery gets through.
  .inputValidator((data: unknown): BrowseQuery => parseBrowseQuery(data))
  .handler(async ({ data }): Promise<BrowseResult> => {
    const opts = toSearchOptions(data);
    try {
      return toBrowseResult(await readListingSearch(opts));
    } catch (err) {
      // Every facade branch already swallows backend errors; this is the
      // belt-and-braces for anything unexpected, so /s renders "unavailable"
      // rather than a 500.
      console.error("[browse] readListingSearch threw:", err);
      return unavailableBrowseResult(resolveListingReadSource(process.env).source, opts.page ?? 1);
    }
  });

export type { BrowseQuery, BrowseResult };
