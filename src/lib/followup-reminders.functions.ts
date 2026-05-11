import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { processFollowupReminders } from "@/server/followup-reminders.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export type ReminderSettings = {
  owner_id: string;
  email: string | null;
  phone_e164: string | null;
  email_enabled: boolean;
  sms_enabled: boolean;
  min_interval_minutes: number;
  paused: boolean;
  last_notified_at: string | null;
};

export const getMyReminderSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);
    const { data } = await supabaseAdmin
      .from("followup_reminder_settings" as any)
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();
    return (data ?? null) as ReminderSettings | null;
  });

const UpdateSchema = z.object({
  email: z.string().email().max(254).nullable().or(z.literal("").transform(() => null)),
  phone_e164: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, "Use E.164 format like +15551234567")
    .nullable()
    .or(z.literal("").transform(() => null)),
  email_enabled: z.boolean(),
  sms_enabled: z.boolean(),
  min_interval_minutes: z.number().int().min(15).max(1440),
  paused: z.boolean(),
});

export const updateMyReminderSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => UpdateSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);
    const { error } = await supabaseAdmin
      .from("followup_reminder_settings" as any)
      .upsert({ owner_id: userId, ...data });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getRecentReminderLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);
    const { data } = await supabaseAdmin
      .from("followup_reminder_log" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    return (data ?? []) as Array<{
      id: string;
      owner_id: string | null;
      channel: string;
      due_count: number;
      status: string;
      error: string | null;
      recipient: string | null;
      created_at: string;
    }>;
  });

export const getMyDueCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);
    const nowIso = new Date().toISOString();
    const { count } = await supabaseAdmin
      .from("lead_followups")
      .select("id", { count: "exact", head: true })
      .in("status", ["new", "attempting", "connected", "no_response"] as any)
      .lte("next_action_at", nowIso)
      .eq("owner_id", userId);
    return { dueCount: count ?? 0 };
  });

export const runReminderWorkerNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);
    return await processFollowupReminders();
  });
