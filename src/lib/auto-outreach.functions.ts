import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const sb = () => supabaseAdmin as any;

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export const getAutoOutreachState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin((context as any).userId);
    const { data: settings } = await sb().from("auto_outreach_settings").select("*").eq("id", 1).maybeSingle();
    const { data: messages } = await sb()
      .from("auto_outreach_messages")
      .select("id, source, channel, step, to_address, subject, body, status, scheduled_at, sent_at, error, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    const { data: counts } = await sb()
      .from("auto_outreach_messages")
      .select("status")
      .limit(5000);
    const tally: Record<string, number> = {};
    (counts ?? []).forEach((r: any) => { tally[r.status] = (tally[r.status] ?? 0) + 1; });
    return { ok: true as const, settings, messages: messages ?? [], tally };
  });

const settingsSchema = z.object({
  email_enabled: z.boolean(),
  sms_enabled: z.boolean(),
  dm_drafts_enabled: z.boolean(),
  from_email: z.string().email().max(200),
  from_name: z.string().min(1).max(120),
  reply_to: z.string().email().max(200).nullable().optional(),
  max_per_hour: z.number().int().min(1).max(1000),
});

export const updateAutoOutreachSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => settingsSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    const { error } = await sb().from("auto_outreach_settings").update({ ...data, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const runAutoOutreachNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin((context as any).userId);
    const { runAutoOutreach } = await import("@/server/auto-outreach.server");
    return runAutoOutreach();
  });

export const cancelAutoOutreachMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).userId);
    const { error } = await sb().from("auto_outreach_messages").update({ status: "skipped" }).eq("id", data.id).eq("status", "pending");
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
