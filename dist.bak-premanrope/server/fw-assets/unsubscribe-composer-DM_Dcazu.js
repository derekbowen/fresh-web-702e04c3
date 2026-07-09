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
const unsubscribeComposer_createServerFn_handler = createServerRpc({
  id: "fb8c0612cbfc1cf047b1536b4331437017d1a14ee5f681e1af97162f21ea9ee7",
  name: "unsubscribeComposer",
  filename: "src/routes/unsubscribe-composer.tsx"
}, (opts) => unsubscribeComposer.__executeServer(opts));
const unsubscribeComposer = createServerFn({
  method: "POST"
}).inputValidator((d) => z.object({
  token: z.string().min(8).max(512)
}).parse(d)).handler(unsubscribeComposer_createServerFn_handler, async ({
  data
}) => {
  const {
    unsubscribeComposerByToken
  } = await import("./email-composer.server-DhGnJ9F6.js");
  return await unsubscribeComposerByToken(data.token);
});
export {
  unsubscribeComposer_createServerFn_handler
};
