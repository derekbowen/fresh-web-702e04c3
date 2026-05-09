import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type GenStats = {
  ok: boolean;
  totals: { generated: number; pending: number; paused: number; total: number };
  pendingByTier: Array<{ tier: string; n: number }>;
  pausedByTier: Array<{ tier: string; n: number }>;
  pausedByValidator: Array<{ version: string; n: number }>;
  topPausedReasons: Array<{ reason: string; n: number }>;
  recentInserts: Array<{ slug: string; title: string | null; created_at: string }>;
  recentErrors: Array<{
    slug: string;
    tier: string | null;
    updated_at: string;
    error: string;
    attempts: number;
    status: string;
  }>;
  perDay: Array<{ day: string; n: number }>;
  error?: string;
};

export const getGenerateStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<GenStats> => {
    const { userId } = context as { userId: string };
    // admin gate
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return {
        ok: false,
        totals: { generated: 0, pending: 0, total: 0 },
        pendingByTier: [],
        recentInserts: [],
        recentErrors: [],
        perDay: [],
        error: "not admin",
      };
    }

    try {
      const [genCount, pendCount, allPending, recentPages, recentErr] = await Promise.all([
        supabaseAdmin.from("content_plan").select("*", { count: "exact", head: true }).eq("status", "generated"),
        supabaseAdmin.from("content_plan").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabaseAdmin.from("content_plan").select("priority_tier").eq("status", "pending").limit(2000),
        supabaseAdmin
          .from("content_pages")
          .select("slug,title,created_at")
          .order("created_at", { ascending: false })
          .limit(20),
        supabaseAdmin
          .from("content_plan")
          .select("slug,priority_tier,updated_at,last_error")
          .eq("status", "pending")
          .not("last_error", "is", null)
          .order("updated_at", { ascending: false })
          .limit(10),
      ]);

      const tierMap = new Map<string, number>();
      for (const r of allPending.data ?? []) {
        const t = (r.priority_tier as string | null) ?? "untiered";
        tierMap.set(t, (tierMap.get(t) ?? 0) + 1);
      }
      const pendingByTier = Array.from(tierMap.entries())
        .map(([tier, n]) => ({ tier, n }))
        .sort((a, b) => b.n - a.n);

      // per-day for last 14 days from content_pages
      const since = new Date(Date.now() - 14 * 86400_000).toISOString();
      const { data: dayRows } = await supabaseAdmin
        .from("content_pages")
        .select("created_at")
        .gte("created_at", since)
        .limit(10000);
      const dayMap = new Map<string, number>();
      for (const r of dayRows ?? []) {
        const d = new Date(r.created_at as string).toISOString().slice(0, 10);
        dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
      }
      const perDay = Array.from(dayMap.entries())
        .map(([day, n]) => ({ day, n }))
        .sort((a, b) => (a.day < b.day ? 1 : -1));

      const generated = genCount.count ?? 0;
      const pending = pendCount.count ?? 0;

      return {
        ok: true,
        totals: { generated, pending, total: generated + pending },
        pendingByTier,
        recentInserts: (recentPages.data ?? []).map((r) => ({
          slug: r.slug as string,
          title: (r.title as string | null) ?? null,
          created_at: r.created_at as string,
        })),
        recentErrors: (recentErr.data ?? []).map((r) => ({
          slug: r.slug as string,
          tier: (r.priority_tier as string | null) ?? null,
          updated_at: r.updated_at as string,
          error: ((r.last_error as string | null) ?? "").slice(0, 240),
        })),
        perDay,
      };
    } catch (e) {
      return {
        ok: false,
        totals: { generated: 0, pending: 0, total: 0 },
        pendingByTier: [],
        recentInserts: [],
        recentErrors: [],
        perDay: [],
        error: e instanceof Error ? e.message : String(e),
      };
    }
  });
