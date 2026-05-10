import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sendTransactionalEmailServer } from "@/server/transactional-email.server";

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
          message: `Phone: ${data.phone}`,
          referrerPath: data.page ?? null,
        },
      });
    } catch (err) {
      console.error("submitHostLead notify failed:", err);
      throw new Error("Could not submit. Please try again.");
    }
    return { ok: true };
  });
