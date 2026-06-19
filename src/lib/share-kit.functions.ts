import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SITE_URL } from "@/lib/seo";

export type ShareKitResult = {
  captions: { hype: string; family: string; weekend: string } | null;
  shareUrl: string | null;
  error?: string;
};

/**
 * Generate the 3 share captions for one of the signed-in host's own listings.
 * Gated to the listing owner via the Sharetribe session (also stops the AI
 * endpoint from being used as an open generator).
 */
export const getShareCaptions = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ listingId: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<ShareKitResult> => {
    const { getCurrentHost } = await import("@/server/sharetribe-marketplace.server");
    const host = await getCurrentHost();
    if (!host) return { captions: null, shareUrl: null, error: "Not signed in" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("synced_listings")
      .select("sharetribe_id,slug,title,city,state_code,price_amount,author_id")
      .eq("sharetribe_id", data.listingId)
      .maybeSingle();
    if (!row) return { captions: null, shareUrl: null, error: "Listing not found" };
    if (row.author_id && row.author_id !== host.id) {
      return { captions: null, shareUrl: null, error: "Not your listing" };
    }

    const shareUrl = `${SITE_URL}/l/${row.slug}/${row.sharetribe_id}`;
    const { generateShareCaptions } = await import("@/server/share-kit.server");
    const out = await generateShareCaptions({
      title: row.title,
      city: row.city,
      state: row.state_code,
      pricePerHourCents: row.price_amount ?? null,
      shareUrl,
    });
    if ("error" in out) return { captions: null, shareUrl, error: out.error };
    return { captions: out, shareUrl };
  });
