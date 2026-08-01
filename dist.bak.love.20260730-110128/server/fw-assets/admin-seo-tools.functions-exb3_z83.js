import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { r as requireSupabaseAuth } from "./auth-middleware-Bd-cw3tB.js";
import { z } from "zod";
import { c as createServerFn } from "../server.js";
const importGscQueries = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  rows: z.array(z.object({
    url_path: z.string().min(1),
    query: z.string().min(1).max(300),
    clicks: z.number().int().min(0).default(0),
    impressions: z.number().int().min(0).default(0),
    ctr: z.number().nullable().optional(),
    position: z.number().nullable().optional()
  })).min(1).max(5e3)
}).parse(d)).handler(createSsrRpc("2033915202afff1ecdcab94a8d5cb7129d202dd3f5332d4a864d814baf7ede56"));
const findKeywordOpportunities = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  minPosition: z.number().min(1).max(100).default(5),
  maxPosition: z.number().min(1).max(100).default(20),
  minImpressions: z.number().int().min(0).default(50),
  limit: z.number().int().min(10).max(500).default(100),
  pathLike: z.string().max(200).default("")
}).parse(d ?? {})).handler(createSsrRpc("60bd55c1c6dfa9680eebd080845d94a4a14b439e39650c610e49367d28a96939"));
const getKeywordStats = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("d08326e8cd7b793b8e3e5c27654807fd98f6d2e6bc7a862fb18a91c75c053c3f"));
const listCompetitorPages = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  q: z.string().max(200).default(""),
  limit: z.number().int().min(10).max(500).default(100)
}).parse(d ?? {})).handler(createSsrRpc("18c4d88a88f01b6faf6dc97883d6a278b4bfe7051d0ea47ede4eff9b181d44e8"));
const scrapeCompetitorUrl = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  url: z.string().url(),
  notes: z.string().max(1e3).optional()
}).parse(d)).handler(createSsrRpc("abcedb62da03db7f2ad3350d24d21ab7da713b62d6f689ba430c13b65e023004"));
const compareCompetitorToPage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  competitor_id: z.string().uuid(),
  our_url_path: z.string().min(1)
}).parse(d)).handler(createSsrRpc("ee0e9e2133ef2cd6ef2a909fab2dfb7c0aea8c8465511c40df71be8acc135db1"));
const deleteCompetitor = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("01307473f0636f6dcc058befb82d2bc8bbac42361618ef95e6024c9792fb29b5"));
const generateLinkSuggestions = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  sampleSize: z.number().int().min(20).max(2e3).default(500),
  minScore: z.number().min(0.05).max(1).default(0.18),
  perPage: z.number().int().min(1).max(20).default(5)
}).parse(d ?? {})).handler(createSsrRpc("ecbc4f3f2bcda1eb2070b56e715844b0c372e02b3ab9298ad9991797d73d8073"));
const listLinkSuggestions = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  status: z.enum(["pending", "applied", "dismissed", "all"]).default("pending"),
  q: z.string().max(200).default(""),
  limit: z.number().int().min(10).max(500).default(100)
}).parse(d ?? {})).handler(createSsrRpc("3db742c56eae54ce7923952b7facb873d1bd7dafa05dbe7c55db6409c5ef9e70"));
const updateLinkSuggestionStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
  status: z.enum(["pending", "applied", "dismissed"])
}).parse(d)).handler(createSsrRpc("cf2b6276ee034a7c3b59050dfd297c16caf07f0096f5ff8f5701c01fbe09b7e2"));
const applyLinkSuggestion = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("ce8f67d5d07510af79a3c3f6bf73d90e78a639da2b8f0151e7b8bb372215c2ca"));
const applyLinkSuggestionsBulk = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  ids: z.array(z.string().uuid()).min(1).max(2500)
}).parse(d)).handler(createSsrRpc("7e290d83e150fa34d3041f674f34af64f0462dee6613c76c7c3f54748d706a2d"));
export {
  generateLinkSuggestions as a,
  applyLinkSuggestionsBulk as b,
  applyLinkSuggestion as c,
  listCompetitorPages as d,
  deleteCompetitor as e,
  findKeywordOpportunities as f,
  getKeywordStats as g,
  compareCompetitorToPage as h,
  importGscQueries as i,
  listLinkSuggestions as l,
  scrapeCompetitorUrl as s,
  updateLinkSuggestionStatus as u
};
