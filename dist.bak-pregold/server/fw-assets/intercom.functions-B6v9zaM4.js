import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { r as requireSupabaseAuth } from "./auth-middleware-Bd-cw3tB.js";
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
const INTERCOM_APP_ID = "nuuc4281";
const getIntercomAppId_createServerFn_handler = createServerRpc({
  id: "42da1772a8c46600a4194f9ea276674b6c087905f87a90e19f7362fd956a96da",
  name: "getIntercomAppId",
  filename: "src/server/intercom.functions.ts"
}, (opts) => getIntercomAppId.__executeServer(opts));
const getIntercomAppId = createServerFn({
  method: "GET"
}).handler(getIntercomAppId_createServerFn_handler, async () => {
  return {
    appId: INTERCOM_APP_ID
  };
});
function b64url(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function signHs256(payload, secret) {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  const encHeader = b64url(JSON.stringify(header));
  const encPayload = b64url(JSON.stringify(payload));
  const data = `${encHeader}.${encPayload}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), {
    name: "HMAC",
    hash: "SHA-256"
  }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)));
  return `${data}.${b64url(sig)}`;
}
const getIntercomUserJwt_createServerFn_handler = createServerRpc({
  id: "4ac31434eeab273ed3e2330af0af0d54d6c4ee8e5b43cd2465842fca0c2ea1c5",
  name: "getIntercomUserJwt",
  filename: "src/server/intercom.functions.ts"
}, (opts) => getIntercomUserJwt.__executeServer(opts));
const getIntercomUserJwt = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getIntercomUserJwt_createServerFn_handler, async ({
  context
}) => {
  const secret = process.env.INTERCOM_IDENTITY_SECRET;
  if (!secret) return {
    token: null
  };
  const {
    userId,
    claims
  } = context;
  const now = Math.floor(Date.now() / 1e3);
  const token = await signHs256({
    user_id: userId,
    ...claims.email ? {
      email: claims.email
    } : {},
    iat: now,
    exp: now + 60 * 60
    // 1h
  }, secret);
  return {
    token
  };
});
export {
  getIntercomAppId_createServerFn_handler,
  getIntercomUserJwt_createServerFn_handler
};
