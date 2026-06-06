import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash } from "crypto";

const ClickSchema = z.object({
  ref_code: z.string().trim().min(1).max(40),
  landing_path: z.string().trim().max(500).optional().or(z.literal("")),
  referrer: z.string().trim().max(500).optional().or(z.literal("")),
});

export const recordAffiliateClick = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ClickSchema.parse(d))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { getRequestHeader, getRequestIP } = await import("@tanstack/react-start/server");

      const { data: aff } = await supabaseAdmin
        .from("affiliates")
        .select("id, status")
        .eq("code", data.ref_code)
        .maybeSingle();

      const ua = (getRequestHeader("user-agent") || "").slice(0, 500);
      const ip = getRequestIP({ xForwardedFor: true }) || "";
      const ip_hash = ip ? createHash("sha256").update(ip).digest("hex").slice(0, 32) : null;

      await supabaseAdmin.from("affiliate_clicks").insert({
        affiliate_id: aff?.id ?? null,
        ref_code: data.ref_code,
        landing_path: data.landing_path || null,
        referrer: data.referrer || null,
        ip_hash,
        ua,
      });
      return { ok: true };
    } catch (e) {
      console.error("[affiliate-click] failed", e);
      return { ok: false };
    }
  });
