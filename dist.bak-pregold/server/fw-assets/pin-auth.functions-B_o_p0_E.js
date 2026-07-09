import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { c as createServerFn } from "../server.js";
import "@supabase/supabase-js";
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
const pinSignIn_createServerFn_handler = createServerRpc({
  id: "cddd0c30d68208abf4508c3c28044886f86f26543e0e3d3208423f3cb39b1bdd",
  name: "pinSignIn",
  filename: "src/server/pin-auth.functions.ts"
}, (opts) => pinSignIn.__executeServer(opts));
const pinSignIn = createServerFn({
  method: "POST"
}).inputValidator((data) => z.object({
  pin: z.string().min(1).max(64)
}).parse(data)).handler(pinSignIn_createServerFn_handler, async ({
  data
}) => {
  const ADMIN_PIN = process.env.ADMIN_PIN;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  if (!ADMIN_PIN || !ADMIN_EMAIL) return {
    ok: false
  };
  if (data.pin.length !== ADMIN_PIN.length) return {
    ok: false
  };
  let diff = 0;
  for (let i = 0; i < ADMIN_PIN.length; i++) {
    diff |= data.pin.charCodeAt(i) ^ ADMIN_PIN.charCodeAt(i);
  }
  if (diff !== 0) return {
    ok: false
  };
  const {
    data: link,
    error
  } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: ADMIN_EMAIL
  });
  if (error || !link?.properties?.hashed_token) {
    console.error("[pin-auth] generateLink failed", error);
    return {
      ok: false
    };
  }
  return {
    ok: true,
    hashed_token: link.properties.hashed_token,
    email: ADMIN_EMAIL
  };
});
export {
  pinSignIn_createServerFn_handler
};
