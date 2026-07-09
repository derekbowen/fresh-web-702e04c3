import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
import { c as createServerFn } from "../server.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
const InputSchema = z.object({
  action: z.enum(["start", "status", "preflight", "resume-paused"]).default("start"),
  count: z.number().int().min(1).max(10).default(10),
  tier: z.enum(["T1 (200k+)", "T2 (75k–199k)", "T3 (25k–74k)", "T4 (10k–24k)", "longtail"]).optional(),
  stateCode: z.string().length(2).optional(),
  warmOnly: z.boolean().default(false),
  model: z.string().default("google/gemini-3-flash-preview"),
  dryRun: z.boolean().default(false),
  slugs: z.array(z.string()).optional(),
  onlyStaleValidator: z.boolean().default(false)
});
async function getFunctionErrorMessage(error) {
  if (!error) return "Unknown generation error";
  const response = error.context;
  if (response) {
    const text = await response.text().catch(() => "");
    if (text) {
      try {
        const parsed = JSON.parse(text);
        return parsed.error || parsed.message || text.slice(0, 500);
      } catch {
        return text.slice(0, 500);
      }
    }
  }
  return error.message || "Generation backend failed";
}
const generateContentBatch_createServerFn_handler = createServerRpc({
  id: "0e6ca0e8afcbf004b1e376ebfc6b975e1d5efe4352b22af22609a9b82afb745d",
  name: "generateContentBatch",
  filename: "src/server/generate-content-batch.functions.ts"
}, (opts) => generateContentBatch.__executeServer(opts));
const generateContentBatch = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => InputSchema.parse(data)).handler(generateContentBatch_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    supabase
  } = context;
  const {
    data: result,
    error
  } = await supabase.functions.invoke("generate-content-batch", {
    body: data
  });
  if (error) {
    throw new Error(await getFunctionErrorMessage(error));
  }
  return result ?? {};
});
export {
  generateContentBatch_createServerFn_handler
};
