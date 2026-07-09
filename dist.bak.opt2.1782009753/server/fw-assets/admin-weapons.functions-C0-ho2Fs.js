import { c as createSsrRpc } from "./cities.functions-XBYRqf13.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
import { c as createServerFn } from "../server.js";
const listCompetitorSites = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("14d3a7795c2abab014699fc5ca23f7dcfbd829cbf0f184dbab271f7d1ee3627b"));
const addCompetitorSite = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  domain: z.string().min(2).max(200),
  sitemap_url: z.string().url(),
  label: z.string().max(120).optional()
}).parse(d)).handler(createSsrRpc("e9130c2cdd8853e7faf0eea4716513a3f57ca2e62d985fc7567092bf62b9b2b3"));
const deleteCompetitorSite = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("f8f33b2e00023d190f133d5f13a011c6929b3eb24179e18e2bf68d76d7277333"));
const runCompetitorScan = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  site_id: z.string().uuid().optional()
}).parse(d ?? {})).handler(createSsrRpc("81517c05c1e8aa3058d7a03b968d70633c743aa30df757eb20b82cc10f236231"));
const listNewCompetitorUrls = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  onlyUnacknowledged: z.boolean().default(true),
  limit: z.number().int().min(10).max(500).default(100),
  site_id: z.string().uuid().optional(),
  kind: z.string().optional(),
  excludeListings: z.boolean().default(true)
}).parse(d ?? {})).handler(createSsrRpc("063d69f1f2682b59006a835b8640aa63cdedf46c94ba36000c97b0e2b755d48c"));
const acknowledgeCompetitorUrls = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  ids: z.array(z.string().uuid()).min(1).max(500)
}).parse(d)).handler(createSsrRpc("838ce17b61ad793223f9dd93e9e9b2b4c1045ee67bfb5530aa43246671b556c3"));
const scrapeCompetitorUrlRow = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("fcf0ff2b7c8a68737b6230c3f299dde154914c843f5adef72505231480e8349d"));
const listHostMatches = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  status: z.enum(["new", "review", "contacted", "converted", "dismissed", "all"]).default("new"),
  minConfidence: z.number().min(0).max(100).default(40),
  limit: z.number().min(1).max(500).default(100)
}).parse(d ?? {})).handler(createSsrRpc("d5d6363526ad9356a9568b0cf6305fe377136ecdf597a5a6aa32d7a2a4b9c76f"));
const updateHostMatchStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "review", "contacted", "converted", "dismissed"]),
  admin_notes: z.string().max(2e3).optional()
}).parse(d)).handler(createSsrRpc("17ad8af8ba6e68526b52fdfb1c681b33c73722d3b8ffbb3f02b3c71a073be8a9"));
const runHostMatchOne = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  competitor_url_id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("2f479321ef485c24a7c1af7af38594c14e6580eb6ef6390f61259be3adceb4c4"));
const enrichHostMatchOne = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  match_id: z.string().uuid(),
  force_tier: z.enum(["osint", "batchdata", "pdl"]).optional()
}).parse(d)).handler(createSsrRpc("f1c3dce6843fd729808eda510284e96dbaff7ed3b9b5a0caf92b8678799c8a44"));
const getEnrichmentSpend = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("a7a07e080657b7e9c38ba1b0e50b073537a0661907becdc4526c1929c7fecd8b"));
const reportFalsePositive = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  match_id: z.string().uuid(),
  reason: z.string().max(500).optional()
}).parse(d)).handler(createSsrRpc("30a11be2cd92777ceb4b7820523f59c4841cec6a29507dc822a37ff237e40ef6"));
const runValidatorSelfTests = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("8dbe2da725144eb48bdf897d14b83c410cc1af034c9b31425d792593734a3aec"));
const listTrackedKeywords = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("0124477d5fcebea7d632a84eb6e0f6cfd986607cf4973f3a42509c15795f339b"));
const addTrackedKeyword = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  keyword: z.string().min(1).max(200),
  target_url_path: z.string().max(300).optional(),
  market: z.string().max(10).default("us")
}).parse(d)).handler(createSsrRpc("e56c4f372d6ef42c8ecf0c6f075396156ca179d82e7f859bed028f61ebfd10a2"));
const deleteTrackedKeyword = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("d674bdd5bdaa8c00e13bd3438b79f6705b4f57bc585f3b5b72f3e6d171fab6f3"));
const runSerpCheck = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(50).default(20)
}).parse(d ?? {})).handler(createSsrRpc("7836715b7533f15d606ba7be7927f494bc1c0c7f659c9bc9eff3c4c04eeb1796"));
const auditPage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  url_path: z.string().min(1).max(300)
}).parse(d)).handler(createSsrRpc("c1846078e13f13d425356cd4d277ba0cef460600feb88188568f2153800b6b27"));
const listRecentAudits = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  limit: z.number().int().min(10).max(200).default(50),
  url_path: z.string().max(300).optional()
}).parse(d ?? {})).handler(createSsrRpc("9456853ef1f99892aad68736b1232814f585b04838b7ac7a48445eea214ece8d"));
const classifyCompetitorUrls = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  limit: z.number().int().min(10).max(5e3).default(2e3),
  force: z.boolean().default(false)
}).parse(d ?? {})).handler(createSsrRpc("7255488cd3d4e7b307e9cba105f30422d19321023b29e2fdf03c0a277f3c66ed"));
const detectCityGaps = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  minCompetitors: z.number().int().min(1).max(5).default(1)
}).parse(d ?? {})).handler(createSsrRpc("0bd7da178e0cf1630c83be8ef3ee6e143ec24dd39c2b16933f91e05e987bc8da"));
const createCounterPageFromGap = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  city_slug: z.string().min(2).max(80),
  state_code: z.string().length(2).nullable().optional(),
  competitor_url: z.string().url().optional()
}).parse(d)).handler(createSsrRpc("865d0dd01ecf1c3f7a56e3f80d8c3c83b18cdc856fdb0debbce528cd2f401e77"));
const generateCompetitorDigest = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  days: z.number().int().min(1).max(30).default(7)
}).parse(d ?? {})).handler(createSsrRpc("aeb2f7b3e575da6163f8204221e333a2295a7ca2b51efb075335bae62fd4567c"));
export {
  addTrackedKeyword as a,
  listRecentAudits as b,
  auditPage as c,
  deleteTrackedKeyword as d,
  listCompetitorSites as e,
  listNewCompetitorUrls as f,
  listHostMatches as g,
  getEnrichmentSpend as h,
  detectCityGaps as i,
  addCompetitorSite as j,
  deleteCompetitorSite as k,
  listTrackedKeywords as l,
  acknowledgeCompetitorUrls as m,
  classifyCompetitorUrls as n,
  runCompetitorScan as o,
  runHostMatchOne as p,
  createCounterPageFromGap as q,
  runSerpCheck as r,
  scrapeCompetitorUrlRow as s,
  generateCompetitorDigest as t,
  runValidatorSelfTests as u,
  reportFalsePositive as v,
  enrichHostMatchOne as w,
  updateHostMatchStatus as x
};
