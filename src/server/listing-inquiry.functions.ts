/**
 * Server function behind the listing page's inquiry form.
 *
 * Thin wiring only: the logic, and every rule about who may be emailed, lives
 * in ./listing-inquiry.server.ts. The one recipient is PRNM's support inbox.
 *
 * Email path: sendViaEmailit directly, the same chokepoint the drip, composer
 * and follow-up-reminder senders use. Not the Lovable queue under
 * src/routes/lovable/email/: that dispatcher sends through Lovable's own API
 * (sendLovableEmail + LOVABLE_API_KEY), not Emailit, from the
 * notify.poolfriends subdomain, and it gates every send on a Supabase
 * suppression list and unsubscribe token for the recipient, which here would
 * be our own support inbox.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { sendViaEmailit } from "@/lib/email/emailit";
import { SITE_URL } from "@/lib/seo";
import { readListing } from "./listing-read.server";
import {
  createInquiryRateLimiter,
  handleListingInquiry,
  type InquiryResult,
} from "./listing-inquiry.server";

/**
 * One limiter per server process. fresh-web runs as a single pm2 process on
 * EAST, so these in-memory counters are the whole picture there; see
 * SlidingWindowCounter for what that does and does not cover.
 */
const limiter = createInquiryRateLimiter();

/** What the form sends. Every field is re-validated by handleListingInquiry. */
export interface ListingInquiryPayload {
  listingId: string;
  name: string;
  email: string;
  phone?: string;
  preferredDate?: string;
  groupSize?: number;
  message: string;
  /** Honeypot; see HONEYPOT_FIELD. Always empty from a real visitor. */
  hp_extra_notes?: string;
}

/**
 * Client IP, the way the rest of this repo gets it (affiliate-click uses the
 * same call): the left-most X-Forwarded-For entry, else the socket address.
 * The left-most entry is whatever the first proxy was handed, so a client can
 * choose it; that is why the per-IP cap is only one of three and the global
 * cap is the real bound.
 */
function clientIp(): string | null {
  try {
    return getRequestIP({ xForwardedFor: true }) ?? null;
  } catch {
    return null;
  }
}

export const sendListingInquiry = createServerFn({ method: "POST" })
  // Shape-only here; handleListingInquiry runs the real schema so it can
  // return per-field messages instead of throwing.
  .inputValidator(
    (data: unknown): ListingInquiryPayload =>
      data && typeof data === "object"
        ? (data as ListingInquiryPayload)
        : ({} as ListingInquiryPayload),
  )
  .handler(
    async ({ data }): Promise<InquiryResult> =>
      handleListingInquiry(
        data,
        { ip: clientIp() },
        {
          readListing,
          send: sendViaEmailit,
          env: process.env,
          now: Date.now,
          limiter,
          log: console,
          siteUrl: SITE_URL,
        },
      ),
  );

export type { InquiryResult };
