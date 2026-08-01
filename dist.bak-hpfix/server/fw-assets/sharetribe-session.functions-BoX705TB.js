import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { c as createServerFn, g as getRequestHeader } from "../server.js";
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
const getSharetribeAuthState_createServerFn_handler = createServerRpc({
  id: "d9670288464c877763105467f3d6f34bbf113cde0e28bd2a76c90768aed8abc0",
  name: "getSharetribeAuthState",
  filename: "src/server/sharetribe-session.functions.ts"
}, (opts) => getSharetribeAuthState.__executeServer(opts));
const getSharetribeAuthState = createServerFn({
  method: "GET"
}).handler(getSharetribeAuthState_createServerFn_handler, async () => {
  try {
    const cookieHeader = getRequestHeader("cookie") || "";
    if (!cookieHeader) return {
      isAuthed: false
    };
    const match = cookieHeader.match(/(?:^|;\s*)st-authinfo=([^;]+)/i);
    if (!match) return {
      isAuthed: false
    };
    let raw = match[1];
    try {
      raw = decodeURIComponent(raw);
    } catch {
    }
    const isAuthed = /"isAnonymous"\s*:\s*false/i.test(raw) || /isAnonymous=false/i.test(raw);
    return {
      isAuthed
    };
  } catch {
    return {
      isAuthed: false
    };
  }
});
export {
  getSharetribeAuthState_createServerFn_handler
};
