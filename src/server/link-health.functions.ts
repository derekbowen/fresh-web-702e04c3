import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type LinkHealthRun = {
  id: string;
  ran_at: string;
  origin: string | null;
  checked: number;
  broken_count: number;
  ok: boolean;
  broken: Array<{ path: string; status: number; reason: string; source?: string }>;
  duration_ms: number | null;
  source: string;
};

async function assertAdmin(userId: string) {
  const { data } = await (supabaseAdmin as any)
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export const getRecentLinkHealthRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LinkHealthRun[]> => {
    await assertAdmin((context as any).userId);
    const { data, error } = await (supabaseAdmin as any)
      .from("link_health_runs")
      .select("id, ran_at, origin, checked, broken_count, ok, broken, duration_ms, source")
      .order("ran_at", { ascending: false })
      .limit(30);
    if (error) {
      console.error("getRecentLinkHealthRuns failed:", error);
      return [];
    }
    return (data || []) as LinkHealthRun[];
  });
