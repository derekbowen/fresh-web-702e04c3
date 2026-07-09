import { c as createSsrRpc } from "./cities.functions-XBYRqf13.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
import { c as createServerFn } from "../server.js";
const getFollowupDashboard = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  rangeDays: z.number().int().min(1).max(365).default(90)
}).parse(data ?? {})).handler(createSsrRpc("cf171c8df8716b2f6cc9d89d71360a26d135adceab0be1c2e4698f83cea8ca79"));
const getFollowupDrilldown = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  source: z.string().nullish(),
  city: z.string().nullish(),
  region: z.string().nullish(),
  rangeDays: z.number().int().min(1).max(365).default(90),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(100).default(25)
}).parse(data ?? {})).handler(createSsrRpc("e039732b83838daf157966068ef245d18cba8b1cc8045b10d1fa5733912c90d0"));
export {
  getFollowupDrilldown as a,
  getFollowupDashboard as g
};
