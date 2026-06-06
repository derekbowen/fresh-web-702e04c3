import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Not authorized");
  return supabaseAdmin;
}

export type DeliverabilityStats = {
  total: number;
  sent: number;
  failed: number;
  bounced: number;
  complained: number;
  suppressed: number;
  pending: number;
  byTemplate: Array<{ template: string; sent: number; failed: number; bounced: number }>;
};

export type LogEntry = {
  message_id: string | null;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
};

export type SuppressionEntry = {
  email: string;
  reason: string;
  created_at: string;
};

function rangeStart(range: "24h" | "7d" | "30d"): string {
  const ms = range === "24h" ? 86400e3 : range === "7d" ? 7 * 86400e3 : 30 * 86400e3;
  return new Date(Date.now() - ms).toISOString();
}

export const getDeliverabilityStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { range?: "24h" | "7d" | "30d" }) => ({
    range: input?.range ?? "7d",
  }))
  .handler(async ({ data, context }): Promise<{ ok: boolean; stats?: DeliverabilityStats; error?: string }> => {
    try {
      const { userId } = context as { userId: string };
      const sb = await requireAdmin(userId);
      const since = rangeStart(data.range);

      // Pull dedup'd latest status per message_id within window
      const { data: rows, error } = await sb
        .from("email_send_log")
        .select("message_id, template_name, status, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(20000);
      if (error) throw error;

      const latest = new Map<string, { template: string; status: string }>();
      let nullKeyIdx = 0;
      for (const r of rows ?? []) {
        const key = r.message_id ?? `__null_${nullKeyIdx++}`;
        if (!latest.has(key)) latest.set(key, { template: r.template_name, status: r.status });
      }

      const stats: DeliverabilityStats = {
        total: latest.size,
        sent: 0, failed: 0, bounced: 0, complained: 0, suppressed: 0, pending: 0,
        byTemplate: [],
      };
      const tplMap = new Map<string, { sent: number; failed: number; bounced: number }>();

      for (const v of latest.values()) {
        if (v.status === "sent") stats.sent++;
        else if (v.status === "bounced") stats.bounced++;
        else if (v.status === "complained") stats.complained++;
        else if (v.status === "suppressed") stats.suppressed++;
        else if (v.status === "pending") stats.pending++;
        else stats.failed++;

        const t = tplMap.get(v.template) ?? { sent: 0, failed: 0, bounced: 0 };
        if (v.status === "sent") t.sent++;
        else if (v.status === "bounced") t.bounced++;
        else if (v.status !== "pending") t.failed++;
        tplMap.set(v.template, t);
      }

      stats.byTemplate = Array.from(tplMap.entries())
        .map(([template, t]) => ({ template, ...t }))
        .sort((a, b) => b.sent + b.failed + b.bounced - (a.sent + a.failed + a.bounced))
        .slice(0, 25);

      return { ok: true, stats };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Failed to load stats" };
    }
  });

export const getDeliverabilityLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { range?: "24h" | "7d" | "30d"; status?: string; template?: string; q?: string; limit?: number }) => ({
    range: input?.range ?? "7d",
    status: input?.status ?? "all",
    template: input?.template ?? "all",
    q: input?.q?.trim().toLowerCase() ?? "",
    limit: Math.min(input?.limit ?? 200, 500),
  }))
  .handler(async ({ data, context }): Promise<{ ok: boolean; rows?: LogEntry[]; templates?: string[]; error?: string }> => {
    try {
      const { userId } = context as { userId: string };
      const sb = await requireAdmin(userId);
      const since = rangeStart(data.range);

      let query = sb
        .from("email_send_log")
        .select("message_id, template_name, recipient_email, status, error_message, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (data.template !== "all") query = query.eq("template_name", data.template);
      if (data.q) query = query.ilike("recipient_email", `%${data.q}%`);

      const { data: rows, error } = await query;
      if (error) throw error;

      // Dedup latest per message_id
      const latest = new Map<string, LogEntry>();
      let nullKeyIdx = 0;
      for (const r of rows ?? []) {
        const key = r.message_id ?? `__null_${nullKeyIdx++}`;
        if (!latest.has(key)) latest.set(key, r as LogEntry);
      }
      let result = Array.from(latest.values());
      if (data.status !== "all") result = result.filter((r) => r.status === data.status);
      result = result.slice(0, data.limit);

      // Template options
      const { data: tplRows } = await sb
        .from("email_send_log")
        .select("template_name")
        .gte("created_at", rangeStart("30d"))
        .limit(5000);
      const templates = Array.from(new Set((tplRows ?? []).map((r: any) => r.template_name as string))).sort();

      return { ok: true, rows: result, templates };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Failed to load log" };
    }
  });

export const getSuppressions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { q?: string; reason?: string; limit?: number }) => ({
    q: input?.q?.trim().toLowerCase() ?? "",
    reason: input?.reason ?? "all",
    limit: Math.min(input?.limit ?? 200, 500),
  }))
  .handler(async ({ data, context }): Promise<{ ok: boolean; rows?: SuppressionEntry[]; counts?: Record<string, number>; error?: string }> => {
    try {
      const { userId } = context as { userId: string };
      const sb = await requireAdmin(userId);

      let query = sb
        .from("suppressed_emails")
        .select("email, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(data.limit);
      if (data.reason !== "all") query = query.eq("reason", data.reason);
      if (data.q) query = query.ilike("email", `%${data.q}%`);
      const { data: rows, error } = await query;
      if (error) throw error;

      const { data: all } = await sb.from("suppressed_emails").select("reason");
      const counts: Record<string, number> = { bounce: 0, complaint: 0, unsubscribe: 0 };
      for (const r of all ?? []) counts[(r as any).reason] = (counts[(r as any).reason] ?? 0) + 1;

      return { ok: true, rows: (rows ?? []) as SuppressionEntry[], counts };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Failed to load suppressions" };
    }
  });

export const removeSuppression = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string }) => {
    const email = input?.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email");
    return { email };
  })
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { userId } = context as { userId: string };
      const sb = await requireAdmin(userId);
      const { error } = await sb.from("suppressed_emails").delete().eq("email", data.email);
      if (error) throw error;
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Failed to remove" };
    }
  });

export const addSuppression = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; reason?: "bounce" | "complaint" | "unsubscribe" }) => {
    const email = input?.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email");
    const reason = input?.reason ?? "unsubscribe";
    return { email, reason };
  })
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { userId } = context as { userId: string };
      const sb = await requireAdmin(userId);
      const { error } = await sb
        .from("suppressed_emails")
        .upsert({ email: data.email, reason: data.reason, metadata: { added_by: userId, manual: true } }, { onConflict: "email" });
      if (error) throw error;
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Failed to add" };
    }
  });
