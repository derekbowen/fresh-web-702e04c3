import { S as StartServer, g as getRequestHeader, d as getRequestIP$1 } from "../server.js";
import { H, e, f, h, i, j, k, l, b, m, n, o, p, q, r, s, t, u, v, w, x, y, z, A, B, C, D, E, F } from "../server.js";
import { attachRouterServerSsrUtils, createRequestHandler, defineHandlerCallback, transformPipeableStreamWithRouter, transformReadableStreamWithRouter } from "@tanstack/router-core/ssr/server";
import { jsx } from "react/jsx-runtime";
import { defineHandlerCallback as defineHandlerCallback2, renderRouterToString } from "@tanstack/react-router/ssr/server";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "react";
import "@tanstack/react-router";
var defaultRenderHandler = defineHandlerCallback2(({ router, responseHeaders }) => renderRouterToString({
  router,
  responseHeaders,
  children: /* @__PURE__ */ jsx(StartServer, { router })
}));
var VIRTUAL_MODULES = {
  startManifest: "tanstack-start-manifest:v",
  injectedHeadScripts: "tanstack-start-injected-head-scripts:v",
  serverFnResolver: "#tanstack-start-server-fn-resolver",
  pluginAdapters: "#tanstack-start-plugin-adapters"
};
export {
  H as HEADERS,
  StartServer,
  VIRTUAL_MODULES,
  attachRouterServerSsrUtils,
  e as clearResponseHeaders,
  f as clearSession,
  createRequestHandler,
  h as createStartHandler,
  defaultRenderHandler,
  i as defaultStreamHandler,
  defineHandlerCallback,
  j as deleteCookie,
  k as getCookie,
  l as getCookies,
  b as getRequest,
  getRequestHeader,
  m as getRequestHeaders,
  n as getRequestHost,
  getRequestIP$1 as getRequestIP,
  o as getRequestProtocol,
  p as getRequestUrl,
  q as getResponse,
  r as getResponseHeader,
  s as getResponseHeaders,
  t as getResponseStatus,
  u as getSession,
  v as getValidatedQuery,
  w as removeResponseHeader,
  x as requestHandler,
  y as sealSession,
  z as setCookie,
  A as setResponseHeader,
  B as setResponseHeaders,
  C as setResponseStatus,
  transformPipeableStreamWithRouter,
  transformReadableStreamWithRouter,
  D as unsealSession,
  E as updateSession,
  F as useSession
};
