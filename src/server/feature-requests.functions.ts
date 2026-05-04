import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const schema = z.object({
  email: z.string().trim().email().max(255),
  name: z.string().trim().min(1).max(120).optional().nullable(),
  requestText: z.string().trim().min(5).max(2000),
  city: z.string().trim().min(1).max(120).optional().nullable(),
  region: z.string().trim().min(1).max(40).optional().nullable(),
  referrerPath: z.string().trim().max(2000).optional().nullable(),
});

export const submitFeatureRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    let city: string | null = data.city ?? null;
    let region: string | null = data.region ?? null;
    let latitude: number | null = null;
    let longitude: number | null = null;
    let userAgent: string | null = null;
    try {
      const req = getRequest() as Request & {
        cf?: { city?: string; region?: string; latitude?: string; longitude?: string };
      };
      const cf = req.cf ?? {};
      city = city ?? cf.city ?? null;
      region = region ?? cf.region ?? null;
      latitude = cf.latitude ? Number(cf.latitude) : null;
      longitude = cf.longitude ? Number(cf.longitude) : null;
      userAgent = getRequestHeader("user-agent") ?? null;
    } catch {
      // best-effort context capture
    }

    const { error } = await (supabaseAdmin as any)
      .from("feature_requests")
      .insert({
        email: data.email.toLowerCase(),
        name: data.name ?? null,
        request_text: data.requestText,
        city,
        region,
        latitude,
        longitude,
        user_agent: userAgent,
        referrer_path: data.referrerPath ?? null,
      });
    if (error) {
      console.error("submitFeatureRequest insert failed:", error);
      throw new Error("Could not submit your request. Please try again.");
    }
    return { ok: true };
  });
