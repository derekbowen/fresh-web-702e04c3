import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getGscSyncOverview, runGscSync } from "@/server/gsc-sync.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

const syncSchema = z.object({
  days: z.number().int().min(1).max(30).default(3),
  rowLimit: z.number().int().min(100).max(100000).default(25000),
});

export const adminRunGscSync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => syncSchema.parse(data ?? {}))
  .handler(async ({ context, data }) => {
    await assertAdmin((context as any).userId);
    return runGscSync({ ...data, triggerSource: "manual" });
  });

export const adminGetGscSyncOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin((context as any).userId);
    return getGscSyncOverview();
  });
