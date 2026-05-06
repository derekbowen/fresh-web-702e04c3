import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RequestTypes = [
  "access",
  "delete",
  "correct",
  "portability",
  "opt_out_sale_share",
  "limit_sensitive",
  "appeal",
  "other",
] as const;

const SubmitSchema = z.object({
  requestType: z.enum(RequestTypes),
  email: z.string().trim().email().max(255),
  fullName: z.string().trim().max(120).optional().nullable(),
  stateCode: z.string().trim().length(2).optional().nullable(),
  details: z.string().trim().max(4000).optional().nullable(),
  sourceUrl: z.string().trim().max(500).optional().nullable(),
});

export const submitPrivacyRequest = createServerFn({ method: "POST" })
  .inputValidator((data) => SubmitSchema.parse(data))
  .handler(async ({ data }) => {
    const gpc = (getRequestHeader("Sec-GPC") || "").toString() === "1";
    const ua = (getRequestHeader("user-agent") || "").toString().slice(0, 400);
    const { error } = await supabaseAdmin.from("privacy_requests").insert({
      request_type: data.requestType,
      email: data.email,
      full_name: data.fullName || null,
      state_code: data.stateCode || null,
      details: data.details || null,
      source_url: data.sourceUrl || null,
      user_agent: ua,
      gpc_signal: gpc,
    });
    if (error) throw new Error(error.message);
    return { ok: true, gpcDetected: gpc };
  });

export const listPrivacyRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");
    const { data, error } = await supabaseAdmin
      .from("privacy_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });
