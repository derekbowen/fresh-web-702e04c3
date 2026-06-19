import { createServerFn } from "@tanstack/react-start";
import type { MoneySheet } from "@/server/host-money-sheet.server";

export type HostDashboard = {
  host: { id: string; email: string | null; displayName: string | null } | null;
  moneySheet: MoneySheet | null;
};

/**
 * Host dashboard loader.
 *
 * Identity is the host's Sharetribe session (the st-{clientId}-token cookie),
 * NOT a Supabase account — so this intentionally does NOT use requireSupabaseAuth.
 * If there is no authenticated Sharetribe host, host is null and the route shows
 * a sign-in prompt that bounces to the Sharetribe-hosted login.
 */
export const getHostDashboard = createServerFn({ method: "POST" }).handler(
  async (): Promise<HostDashboard> => {
    const { getCurrentHost } = await import("@/server/sharetribe-marketplace.server");
    const host = await getCurrentHost();
    if (!host) return { host: null, moneySheet: null };

    const { computeMoneySheet } = await import("@/server/host-money-sheet.server");
    const moneySheet = await computeMoneySheet(host.id);
    return { host, moneySheet };
  },
);
