import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchShareListing, type ListingSummary, type ShareListing } from "./sharetribe.server";
// Listing reads go through the Phase 1 facade so PRNM_LISTING_READ_SOURCE
// controls the backend for every caller from one place. The default
// ("sharetribe") delegates to the untouched legacy path, so behaviour here is
// unchanged until the flag is set. fetchShareListing is not migrated yet: it
// reads publicData keys the mirror's summary shape does not carry.
import { readListing, readListingSearch } from "./listing-read.server";

export const getShareListing = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }): Promise<{ listing: ShareListing | null }> => {
    const listing = await fetchShareListing(data.id);
    return { listing };
  });

export type { ShareListing };

export const getListing = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().min(1).max(64) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { result } = await readListing(data.id);
    return { listing: result };
  });

export const queryListings = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        page: z.number().int().min(1).max(200).optional(),
        perPage: z.number().int().min(1).max(100).optional(),
        keywords: z.string().max(200).optional(),
        origin: z
          .string()
          .regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)
          .optional(),
        bounds: z.string().max(200).optional(),
        pub_category: z.string().max(100).optional(),
        citySlug: z.string().max(120).regex(/^[a-z0-9-]+$/).optional(),
        city: z.string().max(120).optional(),
        // Was missing, and zod's default strip meant p.pool-rentals-$state.tsx
        // passed stateCode into a validator that silently dropped it — so state
        // hub pages fell through to an unfiltered Sharetribe query and listed
        // pools nationwide instead of that state's. SearchOptions has always
        // declared stateCode; only this schema was out of sync.
        stateCode: z
          .string()
          .regex(/^[A-Za-z]{2}$/)
          .transform((s) => s.toUpperCase())
          .optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => (await readListingSearch(data)).result);

export type { ListingSummary };
