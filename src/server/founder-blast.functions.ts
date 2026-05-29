import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  runDryRun,
  runLiveBatch,
  runFinalSummary,
} from "./founder-blast.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Admin role required");
}

export const founderBlastDryRunFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    return runDryRun();
  });

const liveSchema = z.object({
  batchSize: z.number().int().min(1).max(8).default(6),
  delayMs: z.number().int().min(0).max(10000).default(3000),
});

export const founderBlastLiveBatchFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => liveSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    return runLiveBatch({ batchSize: data.batchSize, delayMs: data.delayMs });
  });

export const founderBlastSummaryFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    return runFinalSummary();
  });
