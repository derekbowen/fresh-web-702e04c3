import { c as createSsrRpc } from "./cities.functions-XBYRqf13.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
import { c as createServerFn } from "../server.js";
const RequestTypes = ["access", "delete", "correct", "portability", "opt_out_sale_share", "limit_sensitive", "appeal", "other"];
const SubmitSchema = z.object({
  requestType: z.enum(RequestTypes),
  email: z.string().trim().email().max(255),
  fullName: z.string().trim().max(120).optional().nullable(),
  stateCode: z.string().trim().length(2).optional().nullable(),
  details: z.string().trim().max(4e3).optional().nullable(),
  sourceUrl: z.string().trim().max(500).optional().nullable()
});
const submitPrivacyRequest = createServerFn({
  method: "POST"
}).inputValidator((data) => SubmitSchema.parse(data)).handler(createSsrRpc("feb9d6d6d0a9520db9c0b2c53eca1a71d517f8298732c0f448b19bad1cd8a0f8"));
const listPrivacyRequests = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("e725aa6616da92e590420aff75c6c1119541f9a84cf744634140206e9fc4740c"));
export {
  listPrivacyRequests as l,
  submitPrivacyRequest as s
};
