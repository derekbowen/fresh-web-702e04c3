/**
 * Admin-only server fns that exercise the Sharetribe Marketplace API SDK
 * against the TEST marketplace. Used by the "SDK Test" view in
 * /admin/marketplace.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("forbidden");
}

export type SdkPingResult = {
  ok: boolean;
  marketplaceId: string | null;
  marketplaceName: string | null;
  marketplaceUrl: string | null;
  clientIdSuffix: string;
  error: string | null;
};

export const sdkTestPing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SdkPingResult> => {
    await assertAdmin((context as any).userId);
    const { getTestSdkTrusted, sdkErrorMessage } = await import(
      "@/lib/sharetribe-test/sdk.server"
    );
    const clientId = process.env.SHARETRIBE_TEST_CLIENT_ID ?? "";
    const clientIdSuffix = clientId.slice(-6);
    try {
      const sdk = getTestSdkTrusted();
      const res = await sdk.marketplace.show();
      const m = res?.data?.data;
      return {
        ok: true,
        marketplaceId: m?.id?.uuid ?? null,
        marketplaceName: m?.attributes?.name ?? null,
        marketplaceUrl: m?.attributes?.url ?? null,
        clientIdSuffix,
        error: null,
      };
    } catch (e) {
      return {
        ok: false,
        marketplaceId: null,
        marketplaceName: null,
        marketplaceUrl: null,
        clientIdSuffix,
        error: sdkErrorMessage(e),
      };
    }
  });

export type SdkListing = {
  id: string;
  title: string;
  state: string;
  priceCents: number | null;
  priceCurrency: string | null;
  city: string | null;
};

export const sdkTestSearchListings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        keywords: z.string().max(200).optional(),
        page: z.number().int().min(1).max(50).optional(),
        perPage: z.number().int().min(1).max(50).optional(),
      })
      .parse(d),
  )
  .handler(
    async ({ data, context }): Promise<{ items: SdkListing[]; total: number; error: string | null }> => {
      await assertAdmin((context as any).userId);
      const { getTestSdkTrusted, sdkErrorMessage } = await import(
        "@/lib/sharetribe-test/sdk.server"
      );
      try {
        const sdk = getTestSdkTrusted();
        const params: Record<string, any> = {
          perPage: data.perPage ?? 10,
          page: data.page ?? 1,
        };
        if (data.keywords) params.keywords = data.keywords;
        const res = await sdk.listings.query(params);
        const items: SdkListing[] = (res?.data?.data ?? []).map((l: any) => {
          const attrs = l.attributes ?? {};
          const pd = attrs.publicData ?? {};
          return {
            id: l.id?.uuid ?? "",
            title: attrs.title ?? "(untitled)",
            state: attrs.state ?? "unknown",
            priceCents: attrs.price?.amount ?? null,
            priceCurrency: attrs.price?.currency ?? null,
            city: pd.city ?? pd.location?.city ?? null,
          };
        });
        return {
          items,
          total: res?.data?.meta?.totalItems ?? items.length,
          error: null,
        };
      } catch (e) {
        return { items: [], total: 0, error: sdkErrorMessage(e) };
      }
    },
  );
