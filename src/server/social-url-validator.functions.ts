import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  validateSocialUrls,
  type SocialValidationResult,
} from "./social-url-validator.server";

const InputSchema = z.object({
  urls: z.array(z.string().min(1).max(500)).min(1).max(50),
});

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export const validateSocialUrlsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ context, data }): Promise<{ results: SocialValidationResult[] }> => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);
    const results = await validateSocialUrls(data.urls);
    return { results };
  });
