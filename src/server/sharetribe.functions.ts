import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  fetchListing,
  fetchShareListing,
  searchListings,
  type ListingSummary,
  type ShareListing,
} from "./sharetribe.server";

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
    const result = await fetchListing(data.id);
    return result ? { listing: result.listing } : { listing: null };
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
      })
      .parse(data),
  )
  .handler(async ({ data }) => searchListings(data));

export type { ListingSummary };
