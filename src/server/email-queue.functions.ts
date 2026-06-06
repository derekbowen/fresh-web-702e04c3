import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";


export type QueuedEmail = {
  source: "host_drip" | "renter_drip";
  id: string;
  email: string;
  name: string | null;
  step: number;
  kind: string;
  subject: string | null;
  scheduled_at: string;
};

export const listQueuedEmails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: boolean; emails: QueuedEmail[]; error?: string }> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { userId } = context as { userId: string };
      const { data: roleRow } = await supabaseAdmin
        .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
      if (!roleRow) return { ok: false, emails: [], error: "Not authorized" };


      const [host, renter] = await Promise.all([
        supabaseAdmin
          .from("host_drip_emails")
          .select("id, step, kind, subject, scheduled_at, host_subscribers!inner(email, name)")
          .eq("status", "pending")
          .gt("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true })
          .limit(500),
        supabaseAdmin
          .from("renter_emails")
          .select("id, step, kind, subject, scheduled_at, renter_subscribers!inner(email, name)")
          .eq("status", "pending")
          .gt("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true })
          .limit(500),
      ]);

      const out: QueuedEmail[] = [];
      for (const r of (host.data ?? []) as any[]) {
        out.push({
          source: "host_drip",
          id: r.id,
          email: r.host_subscribers?.email ?? "",
          name: r.host_subscribers?.name ?? null,
          step: r.step,
          kind: r.kind,
          subject: r.subject ?? null,
          scheduled_at: r.scheduled_at,
        });
      }
      for (const r of (renter.data ?? []) as any[]) {
        out.push({
          source: "renter_drip",
          id: r.id,
          email: r.renter_subscribers?.email ?? "",
          name: r.renter_subscribers?.name ?? null,
          step: r.step,
          kind: r.kind,
          subject: r.subject ?? null,
          scheduled_at: r.scheduled_at,
        });
      }
      out.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
      return { ok: true, emails: out };
    } catch (e: any) {
      return { ok: false, emails: [], error: e?.message ?? String(e) };
    }
  },
);
