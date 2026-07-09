import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { z } from "zod";
import { c as createServerFn } from "../server.js";
const getCoachRole = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({}).parse(d ?? {})).handler(createSsrRpc("1fc6100b81d662bf30f055f485bb8cd24f9120f07ec45923ac6cc1f1c0d45c01"));
const setCoachRole = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  role: z.enum(["ceo", "coo", "cs"]).nullable()
}).parse(d)).handler(createSsrRpc("917d54276cd8b450f346cbd32f0f407b0b99ad0b4d05a2bdb61390becda5fcab"));
const prnmCoachChat = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(8e3)
  })).min(1).max(40),
  completedRoutes: z.array(z.string().max(120)).max(40).optional(),
  roleOverride: z.enum(["ceo", "coo", "cs"]).optional(),
  agentMode: z.boolean().optional()
}).parse(d)).handler(createSsrRpc("62ec45a012cbc8ff335d6ca5c87c309b1531c77ea6801cc41c1ad090b461f7e5"));
const listOpportunities = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  role: z.enum(["ceo", "coo", "cs"]).optional(),
  includeCompleted: z.boolean().optional()
}).parse(d ?? {})).handler(createSsrRpc("ebc6e2ce46b7ab45a14db48c398fc0f8f0a6602274228f70b1319517541cd229"));
const markOpportunity = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  action: z.enum(["complete", "reopen", "dismiss"])
}).parse(d)).handler(createSsrRpc("95ec2f8872f885682d1152c48fda0b0b1fcd057f88b2e57c05fecddc7dc9b23e"));
const generateOpportunities = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  role: z.enum(["ceo", "coo", "cs"]).optional()
}).parse(d ?? {})).handler(createSsrRpc("cf812b6a34518ab8a1c67ce80bb408c1d7bd12e83e76ae032f3a50f33b045d29"));
export {
  generateOpportunities as a,
  getCoachRole as g,
  listOpportunities as l,
  markOpportunity as m,
  prnmCoachChat as p,
  setCoachRole as s
};
