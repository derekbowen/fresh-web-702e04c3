import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
const InputSchema = z.object({
  referral_id: z.string().uuid().nullable().optional(),
  note: z.string().trim().min(1).max(2e3),
  template_used: z.string().trim().max(64).nullable().optional()
});
const logCoachingActivity = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => InputSchema.parse(d)).handler(createSsrRpc("2e98a3d655094ebe28008e5260238bab8e3b7ff28d999f5b29adbd404a105978"));
createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("97a11c1acf2b2ec33d7e63d16329718b2e259bb7a2a493613550088e869994d7"));
const listCoachingForAffiliate = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  affiliate_id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("12babc8844acd2104b17cdecfb1cd8ebf2d7b33f9f9f94e5de894ea313c17e04"));
export {
  listCoachingForAffiliate as a,
  logCoachingActivity as l
};
