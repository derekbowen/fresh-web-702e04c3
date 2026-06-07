import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EnvSchema = z.enum(["live", "test"]);

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

function fmtMoney(amount: number | null | undefined, currency = "USD") {
  if (amount == null) return "—";
  return `$${(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

export type MarketplaceOverview = {
  env: "live" | "test";
  counts: { users: number; listings: number; transactions: number; reviews: number };
  gmv: { last30dCents: number; allTimeCents: number; currency: string };
  fetchedAt: string;
};

async function fetchTotal(env: "live" | "test", path: string, query: Record<string, any> = {}) {
  const { stIntegGet } = await import("@/server/sharetribe-env.server");
  const j = await stIntegGet<{ meta?: { totalItems?: number } }>(env, path, { ...query, perPage: 1 });
  return j.meta?.totalItems ?? 0;
}

export const getMarketplaceOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ env: EnvSchema }).parse(d))
  .handler(async ({ data, context }): Promise<MarketplaceOverview> => {
    await assertAdmin((context as any).userId);
    const env = data.env;
    const [users, listings, txAll, reviews] = await Promise.all([
      fetchTotal(env, "/users/query").catch(() => 0),
      fetchTotal(env, "/listings/query").catch(() => 0),
      fetchTotal(env, "/transactions/query").catch(() => 0),
      fetchTotal(env, "/reviews/query").catch(() => 0),
    ]);

    // GMV from Supabase mirror (live only — mirror does not sync test env)
    let last30d = 0;
    let allTime = 0;
    let currency = "USD";
    if (env === "live") {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const since = new Date(Date.now() - 30 * 86400_000).toISOString();
      const [a, b] = await Promise.all([
        supabaseAdmin
          .from("st_transactions")
          .select("payin_total_cents,currency")
          .gte("last_transitioned_at", since)
          .in("state", ["confirm-payment", "complete", "reviewed"]),
        supabaseAdmin
          .from("st_transactions")
          .select("payin_total_cents,currency")
          .in("state", ["confirm-payment", "complete", "reviewed"]),
      ]);
      for (const r of a.data || []) last30d += r.payin_total_cents || 0;
      for (const r of b.data || []) {
        allTime += r.payin_total_cents || 0;
        if (r.currency) currency = r.currency;
      }
    }

    return {
      env,
      counts: { users, listings, transactions: txAll, reviews },
      gmv: { last30dCents: last30d, allTimeCents: allTime, currency },
      fetchedAt: new Date().toISOString(),
    };
  });

export type StRow = { id: string; type: string; attributes: any; relationships?: any };
export type StList = { data: StRow[]; meta?: { totalItems?: number; totalPages?: number; page?: number } };

export const listMarketplaceResource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        env: EnvSchema,
        resource: z.enum(["users", "listings", "transactions", "reviews"]),
        page: z.number().int().min(1).max(500).default(1),
        perPage: z.number().int().min(1).max(100).default(25),
        keywords: z.string().max(200).optional(),
        state: z.string().max(50).optional(), // listings state filter
        lastTransition: z.string().max(100).optional(), // transactions
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<StList> => {
    await assertAdmin((context as any).userId);
    const { stIntegGet } = await import("@/server/sharetribe-env.server");
    const path = `/${data.resource}/query`;
    const query: Record<string, any> = {
      page: data.page,
      perPage: data.perPage,
    };
    if (data.keywords) query.keywords = data.keywords;
    if (data.resource === "listings" && data.state) query.states = data.state;
    if (data.resource === "transactions" && data.lastTransition) {
      query.lastTransitions = data.lastTransition;
    }
    if (data.resource === "listings") query.include = "author,images";
    if (data.resource === "transactions") query.include = "listing,customer,provider";
    if (data.resource === "reviews") query.include = "author,subject,listing";

    try {
      const res = await stIntegGet<StList>(data.env, path, query);
      return res;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Integration API doesn't expose /reviews/query — treat 404 as empty.
      if (/\[404\]/.test(msg)) {
        return { data: [], included: [], meta: { totalItems: 0, totalPages: 0, page: data.page, perPage: data.perPage } } as unknown as StList;
      }
      throw e;
    }
  });

