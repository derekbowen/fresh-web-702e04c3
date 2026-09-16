import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { EngineConfig } from "./config";

export type Db = SupabaseClient<any, "public", any>;

export function makeDb(cfg: EngineConfig): Db {
  if (!cfg.supabaseUrl || !cfg.supabaseServiceRoleKey) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(cfg.supabaseUrl, cfg.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function startRun(db: Db, phase: string, cfg: EngineConfig, worker: string): Promise<string> {
  const { data, error } = await db
    .from("host_lifecycle_runs")
    .insert({ phase, mode: cfg.mode, enabled: cfg.enabled, worker })
    .select("id")
    .single();
  if (error) throw new Error(`host_lifecycle_runs insert: ${error.message}`);
  return data.id as string;
}

export async function finishRun(db: Db, id: string, stats: Record<string, unknown>, err?: unknown): Promise<void> {
  await db
    .from("host_lifecycle_runs")
    .update({ finished_at: new Date().toISOString(), stats, error: err ? String((err as Error).message ?? err).slice(0, 1000) : null })
    .eq("id", id);
}
