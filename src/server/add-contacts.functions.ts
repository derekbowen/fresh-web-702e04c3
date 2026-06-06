import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  raw: z.string().min(1).max(500_000),
  lists: z.array(z.enum(["host", "renter"])).min(1),
  scheduleDrip: z.boolean().default(true),
});

type Parsed = { email: string; name: string | null };

function parseLines(raw: string): { rows: Parsed[]; invalid: string[] } {
  const rows: Parsed[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const lineRaw of raw.split(/\r?\n/)) {
    const line = lineRaw.trim();
    if (!line) continue;
    // formats: email | email,name | name <email> | email\tname
    let email = "";
    let name: string | null = null;
    const angle = line.match(/^(.*?)<([^>]+)>$/);
    if (angle) {
      name = angle[1].trim().replace(/,$/, "") || null;
      email = angle[2].trim();
    } else {
      const parts = line.split(/[,\t;]/).map((p) => p.trim()).filter(Boolean);
      email = parts[0] ?? "";
      name = parts[1] ?? null;
    }
    email = email.toLowerCase();
    if (!emailRe.test(email) || email.length > 255) {
      invalid.push(line);
      continue;
    }
    if (seen.has(email)) continue;
    seen.add(email);
    rows.push({ email, name: name && name.length <= 120 ? name : null });
  }
  return { rows, invalid };
}

export type AddContactsResult = {
  ok: boolean;
  error?: string;
  parsed: number;
  invalid: string[];
  perList: Record<
    "host" | "renter",
    { added: number; existing: number; scheduled: number; skipped: number }
  >;
};

export const addContacts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data, context }): Promise<AddContactsResult> => {
    const result: AddContactsResult = {
      ok: false,
      parsed: 0,
      invalid: [],
      perList: {
        host: { added: 0, existing: 0, scheduled: 0, skipped: 0 },
        renter: { added: 0, existing: 0, scheduled: 0, skipped: 0 },
      },
    };
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { userId } = context as { userId: string };
      const { data: roleRow } = await supabaseAdmin
        .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
      if (!roleRow) return { ...result, error: "Not authorized" };

      const { rows, invalid } = parseLines(data.raw);
      result.parsed = rows.length;
      result.invalid = invalid.slice(0, 20);
      if (rows.length === 0) return { ...result, ok: true, error: "No valid emails found" };

      for (const list of data.lists) {
        const table = list === "host" ? "host_subscribers" : "renter_subscribers";
        for (const r of rows) {
          // Check for existing
          const { data: existing } = await supabaseAdmin
            .from(table).select("id, status, sequence_scheduled").ilike("email", r.email).maybeSingle();

          let subscriberId: string | null = existing?.id ?? null;
          if (existing) {
            result.perList[list].existing += 1;
            if (existing.status !== "active") {
              result.perList[list].skipped += 1;
              continue;
            }
          } else {
            const { data: ins, error } = await supabaseAdmin
              .from(table)
              .insert({ email: r.email, name: r.name })
              .select("id")
              .single();
            if (error || !ins) {
              result.perList[list].skipped += 1;
              continue;
            }
            subscriberId = ins.id;
            result.perList[list].added += 1;
          }

          if (data.scheduleDrip && subscriberId && !existing?.sequence_scheduled) {
            try {
              if (list === "host") {
                const { scheduleSequence } = await import("@/server/host-drip.server");
                await scheduleSequence(subscriberId);
              } else {
                const { scheduleSequence } = await import("@/server/renter-drip.server");
                await scheduleSequence(subscriberId);
              }
              result.perList[list].scheduled += 1;
            } catch (e) {
              console.error("[add-contacts] schedule failed", list, r.email, e);
            }
          }
        }
      }

      return { ...result, ok: true };
    } catch (e: any) {
      return { ...result, ok: false, error: e?.message ?? String(e) };
    }
  });
