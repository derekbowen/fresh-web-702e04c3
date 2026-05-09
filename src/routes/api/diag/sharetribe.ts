/**
 * TEMPORARY diagnostic route for the empty home-page Featured Pools grid.
 *
 * Hits Sharetribe's auth + listings/query endpoints with the same params the
 * home loader uses, but WITHOUT the safe() wrapper that swallows errors. Lets
 * us see whether Sharetribe is throwing (auth/network) or returning empty.
 *
 * Gate: ?key=<DIAG_KEY env or fallback>. Remove this file after diagnosing.
 */
import { createFileRoute } from "@tanstack/react-router";
import { searchListings } from "@/server/sharetribe.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const FALLBACK_KEY = "poolside-diag-2026";
const MARKETPLACE_API_BASE = "https://flex-api.sharetribe.com";

async function getPublicReadToken(clientId: string) {
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "client_credentials",
    scope: "public-read",
  });
  const res = await fetch(`${MARKETPLACE_API_BASE}/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`auth ${res.status}: ${text.slice(0, 300)}`);
  }
  return (JSON.parse(text) as { access_token: string }).access_token;
}

async function rawSearch(
  token: string,
  params: Record<string, string | number>,
): Promise<{ count: number; firstId: string | null; total: number }> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) qs.set(k, String(v));
  const res = await fetch(
    `${MARKETPLACE_API_BASE}/v1/api/listings/query?${qs}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
  );
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`listings/query ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = JSON.parse(text) as {
    data?: Array<{ id?: string }>;
    meta?: { totalItems?: number };
  };
  return {
    count: json.data?.length ?? 0,
    firstId: json.data?.[0]?.id ?? null,
    total: json.meta?.totalItems ?? 0,
  };
}

function describeError(e: unknown): { message: string; stack: string | null } {
  if (e instanceof Error) return { message: e.message, stack: e.stack ?? null };
  return { message: String(e), stack: null };
}

export const Route = createFileRoute("/api/diag/sharetribe")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const expected = process.env.DIAG_KEY || FALLBACK_KEY;
        let providedKey: string | null = null;
        try {
          providedKey = new URL(request.url).searchParams.get("key");
        } catch {
          /* ignore */
        }
        if (providedKey !== expected) {
          return new Response(
            `Forbidden. seenUrl=${request.url} providedKey=${providedKey}`,
            { status: 403 },
          );
        }

        const clientId = process.env.SHARETRIBE_CLIENT_ID;
        const integClientId = process.env.SHARETRIBE_INTEG_CLIENT_ID;
        const integSecret = process.env.SHARETRIBE_INTEG_CLIENT_SECRET;
        const marketplaceUrl = process.env.SHARETRIBE_MARKETPLACE_URL ?? null;

        const out: Record<string, unknown> = {
          success: false,
          marketplaceUrl,
          publicClientIdPresent: Boolean(clientId),
          publicClientIdPrefix: clientId ? clientId.slice(0, 8) : null,
          integClientIdPresent: Boolean(integClientId),
          integClientSecretPresent: Boolean(integSecret),
          authError: null as unknown,
          caCount: 0,
          caTotal: 0,
          caError: null as unknown,
          featuredCount: 0,
          featuredTotal: 0,
          featuredError: null as unknown,
          firstListingId: null as string | null,
        };

        if (!clientId) {
          out.authError = describeError(
            new Error("SHARETRIBE_CLIENT_ID not set in worker env"),
          );
          return Response.json(out, { status: 500 });
        }

        let token: string;
        try {
          token = await getPublicReadToken(clientId);
        } catch (e) {
          out.authError = describeError(e);
          return Response.json(out, { status: 200 });
        }

        const baseImageParams = {
          "fields.image":
            "variants.landscape-crop,variants.landscape-crop2x,variants.default",
          include: "images",
        };

        // CA pull (mirrors searchListings({ perPage: 6, stateCode: "CA" }))
        // Note: stateCode routes through searchSyncedListings (Supabase) in
        // prod — we replicate the marketplace fallback here to test the API.
        try {
          const r = await rawSearch(token, {
            page: 1,
            perPage: 6,
            ...baseImageParams,
          });
          out.caCount = r.count;
          out.caTotal = r.total;
          if (r.firstId) out.firstListingId = r.firstId;
        } catch (e) {
          out.caError = describeError(e);
        }

        // Featured pull (mirrors searchListings({ perPage: 12 }))
        try {
          const r = await rawSearch(token, {
            page: 1,
            perPage: 12,
            ...baseImageParams,
          });
          out.featuredCount = r.count;
          out.featuredTotal = r.total;
          if (r.firstId && !out.firstListingId) out.firstListingId = r.firstId;
        } catch (e) {
          out.featuredError = describeError(e);
        }

        // Wrapper checks (mirror what the home loader actually calls)
        try {
          const r = await searchListings({ perPage: 12 });
          (out as Record<string, unknown>).wrapperFeaturedCount = r.listings.length;
          (out as Record<string, unknown>).wrapperFeaturedTotal = r.total;
        } catch (e) {
          (out as Record<string, unknown>).wrapperFeaturedError = describeError(e);
        }
        try {
          const r = await searchListings({ perPage: 6, stateCode: "CA" });
          (out as Record<string, unknown>).wrapperCaCount = r.listings.length;
          (out as Record<string, unknown>).wrapperCaTotal = r.total;
        } catch (e) {
          (out as Record<string, unknown>).wrapperCaError = describeError(e);
        }

        // Mirror table direct check
        try {
          const { count: totalRows, error: e1 } = await supabaseAdmin
            .from("synced_listings")
            .select("id", { count: "exact", head: true });
          if (e1) throw e1;
          const { count: publishedRows, error: e2 } = await supabaseAdmin
            .from("synced_listings")
            .select("id", { count: "exact", head: true })
            .eq("state", "published")
            .eq("is_deleted", false);
          if (e2) throw e2;
          const { data: latest, error: e3 } = await supabaseAdmin
            .from("synced_listings")
            .select("updated_at, last_synced_at")
            .order("updated_at", { ascending: false })
            .limit(1);
          if (e3) throw e3;
          (out as Record<string, unknown>).mirrorTotalRows = totalRows ?? 0;
          (out as Record<string, unknown>).mirrorPublishedRows = publishedRows ?? 0;
          (out as Record<string, unknown>).mirrorLastUpdated = latest?.[0]?.updated_at ?? null;
          (out as Record<string, unknown>).mirrorLastSynced = latest?.[0]?.last_synced_at ?? null;
        } catch (e) {
          (out as Record<string, unknown>).mirrorError = describeError(e);
        }

        out.success = !out.authError && !out.caError && !out.featuredError;
        return Response.json(out, { status: 200 });
      },
    },
  },
});
  },
});
