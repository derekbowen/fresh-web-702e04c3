import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { EngineConfig } from "./config";

export type Db = SupabaseClient<any, "public", any>;

/**
 * The engine never opens a realtime channel, but supabase-js >= 2.108 resolves
 * a WebSocket constructor when the client is built and throws on Node 20
 * (no native WebSocket). Hand it a transport that refuses to connect instead
 * of depending on `ws` or a runtime flag.
 */
export class NoRealtimeTransport {
  constructor() {
    throw new Error("host-lifecycle engine does not use Supabase realtime");
  }
}

export function makeDb(cfg: EngineConfig): Db {
  if (!cfg.supabaseUrl || !cfg.supabaseServiceRoleKey) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(cfg.supabaseUrl, cfg.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: NoRealtimeTransport as any },
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
