import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-Bd-cw3tB.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { r as runAliasBackfill } from "./alias-backfill.server-CG8T_N6R.js";
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
const inputSchema = z.object({
  limit: z.number().int().positive().max(2e3).optional(),
  dryRun: z.boolean().optional()
});
const runAliasBackfillFn_createServerFn_handler = createServerRpc({
  id: "6a4f9d68461af7001d413a407fb7d497b6fa132f8bcd382fd6be56cc057ff354",
  name: "runAliasBackfillFn",
  filename: "src/server/alias-backfill.functions.ts"
}, (opts) => runAliasBackfillFn.__executeServer(opts));
const runAliasBackfillFn = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => inputSchema.parse(data)).handler(runAliasBackfillFn_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    data: roleRow,
    error: roleErr
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (roleErr) throw new Error(roleErr.message);
  if (!roleRow) throw new Error("Admin role required");
  return runAliasBackfill({
    limit: data.limit,
    dryRun: data.dryRun
  });
});
export {
  runAliasBackfillFn_createServerFn_handler
};
