import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sendTransactionalEmailServer } from "@/server/transactional-email.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { toE164, scheduleSequence } from "@/server/sms.server";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(40),
  city: z.string().trim().max(120).nullable().optional(),
  region: z.string().trim().max(20).nullable().optional(),
  page: z.string().trim().max(300).nullable().optional(),
});

export const submitHostLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const phoneE164 = toE164(data.phone);

    // Persist lead
    let leadId: string | null = null;
    try {
      const { data: row } = await supabaseAdmin
        .from("host_leads")
        .insert({
          name: data.name,
          email: data.email.toLowerCase(),
          phone_raw: data.phone,
          phone_e164: phoneE164 ?? data.phone,
          city: data.city ?? null,
          region: data.region ?? null,
          page: data.page ?? null,
        })
        .select("id")
        .single();
      leadId = row?.id ?? null;
    } catch (err) {
      console.error("submitHostLead persist failed:", err);
    }

    // Schedule SMS sequence (best-effort)
    if (leadId && phoneE164) {
      try {
        await scheduleSequence({ leadId, phoneE164, firstName: data.name });
      } catch (err) {
        console.error("submitHostLead scheduleSequence failed:", err);
      }
    }

    // Email notification
    try {
      await sendTransactionalEmailServer({
        templateName: "internal-lead-notification",
        recipientEmail: "hello@poolrentalnearme.com",
        idempotencyKey: `host-lead-${data.email.toLowerCase()}-${Date.now()}`,
        templateData: {
          formType: "Become a host — popup lead",
          submitterEmail: data.email,
          submitterName: data.name,
          city: data.city ?? null,
          region: data.region ?? null,
          message: `Phone: ${data.phone}${phoneE164 ? ` (${phoneE164})` : " (could not normalize)"}`,
          referrerPath: data.page ?? null,
        },
      });
    } catch (err) {
      console.error("submitHostLead notify failed:", err);
    }

    return { ok: true };
  });
