import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { c as createServerFn } from "../server.js";
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
const ApplySchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  audience: z.string().trim().max(1e3).optional().or(z.literal("")),
  promo_plan: z.string().trim().max(2e3).optional().or(z.literal(""))
});
const applyAsAffiliate_createServerFn_handler = createServerRpc({
  id: "7703e29797da4d1ec9552c00bdd63705cbb7d8be411edbefae7a8417956aa515",
  name: "applyAsAffiliate",
  filename: "src/lib/affiliate-apply.functions.ts"
}, (opts) => applyAsAffiliate.__executeServer(opts));
const applyAsAffiliate = createServerFn({
  method: "POST"
}).inputValidator((d) => ApplySchema.parse(d)).handler(applyAsAffiliate_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const email = data.email.toLowerCase();
  let authUserId = null;
  let accountCreated = false;
  const {
    data: created,
    error: createErr
  } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    // skip email verification — magic link is the verification
    user_metadata: {
      full_name: data.full_name
    }
  });
  if (created?.user) {
    authUserId = created.user.id;
    accountCreated = true;
  } else if (createErr) {
    const msg = createErr.message || "";
    const exists = /already|exists|registered/i.test(msg) || createErr?.status === 422;
    if (!exists) {
      console.error("[affiliate-apply] createUser failed", createErr);
      return {
        ok: false,
        error: "Could not create account. Try again."
      };
    }
    const {
      data: list
    } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200
    });
    const match = list?.users?.find((u) => (u.email || "").toLowerCase() === email);
    authUserId = match?.id ?? null;
  }
  const {
    data: existing
  } = await supabaseAdmin.from("affiliates").select("id, status, user_id").ilike("email", email).maybeSingle();
  if (existing) {
    if (!existing.user_id && authUserId) {
      await supabaseAdmin.from("affiliates").update({
        user_id: authUserId
      }).eq("id", existing.id);
    }
    return {
      ok: true,
      alreadyExists: true,
      accountCreated,
      status: existing.status
    };
  }
  const {
    error: insErr
  } = await supabaseAdmin.from("affiliates").insert({
    full_name: data.full_name,
    email,
    phone: data.phone || null,
    audience: data.audience || null,
    promo_plan: data.promo_plan || null,
    status: "pending",
    user_id: authUserId
  });
  if (insErr) {
    console.error("[affiliate-apply] insert failed", insErr);
    return {
      ok: false,
      error: "Could not save application."
    };
  }
  return {
    ok: true,
    accountCreated
  };
});
export {
  applyAsAffiliate_createServerFn_handler
};
