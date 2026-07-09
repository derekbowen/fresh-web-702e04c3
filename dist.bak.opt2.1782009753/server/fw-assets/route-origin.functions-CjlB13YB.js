import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { g as getCanonicalOrigin, P as PROD_ORIGIN } from "./site-origin-DalDu5p3.js";
import { c as createServerFn, b as getRequest } from "../server.js";
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
const getRouteOriginFromRequest_createServerFn_handler = createServerRpc({
  id: "32fc2146154ce85cd3c251b27b207df0ab03d4017644c2a9d78c7da9c8f73d07",
  name: "getRouteOriginFromRequest",
  filename: "src/lib/route-origin.functions.ts"
}, (opts) => getRouteOriginFromRequest.__executeServer(opts));
const getRouteOriginFromRequest = createServerFn({
  method: "GET"
}).handler(getRouteOriginFromRequest_createServerFn_handler, async () => {
  try {
    return getCanonicalOrigin(getRequest());
  } catch {
    return PROD_ORIGIN;
  }
});
export {
  getRouteOriginFromRequest_createServerFn_handler
};
