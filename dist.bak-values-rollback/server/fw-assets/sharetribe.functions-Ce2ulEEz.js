import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { fetchShareListing, fetchListing, searchListings } from "./sharetribe.server-BZ7y3aGI.js";
import { c as createServerFn } from "../server.js";
import "./client.server-D5ro3rAQ.js";
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
const getShareListing_createServerFn_handler = createServerRpc({
  id: "bb5d3d0d2b3b73dd48ca1c4c0e9431d99be11e49d2b332f4894f8656efdcd926",
  name: "getShareListing",
  filename: "src/server/sharetribe.functions.ts"
}, (opts) => getShareListing.__executeServer(opts));
const getShareListing = createServerFn({
  method: "GET"
}).inputValidator((data) => z.object({
  id: z.string().uuid()
}).parse(data)).handler(getShareListing_createServerFn_handler, async ({
  data
}) => {
  const listing = await fetchShareListing(data.id);
  return {
    listing
  };
});
const getListing_createServerFn_handler = createServerRpc({
  id: "24c49324d39d3d16fb55e6a3b1e44e2059495858d3d4ce5ec2db8844fb2d074f",
  name: "getListing",
  filename: "src/server/sharetribe.functions.ts"
}, (opts) => getListing.__executeServer(opts));
const getListing = createServerFn({
  method: "GET"
}).inputValidator((data) => z.object({
  id: z.string().min(1).max(64)
}).parse(data)).handler(getListing_createServerFn_handler, async ({
  data
}) => {
  const result = await fetchListing(data.id);
  return result ? {
    listing: result.listing
  } : {
    listing: null
  };
});
const queryListings_createServerFn_handler = createServerRpc({
  id: "70f04e447e5b237c46a6d2681f5964dc581e01c7e256218597e0c074ddbdebd1",
  name: "queryListings",
  filename: "src/server/sharetribe.functions.ts"
}, (opts) => queryListings.__executeServer(opts));
const queryListings = createServerFn({
  method: "GET"
}).inputValidator((data) => z.object({
  page: z.number().int().min(1).max(200).optional(),
  perPage: z.number().int().min(1).max(100).optional(),
  keywords: z.string().max(200).optional(),
  origin: z.string().regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/).optional(),
  bounds: z.string().max(200).optional(),
  pub_category: z.string().max(100).optional(),
  citySlug: z.string().max(120).regex(/^[a-z0-9-]+$/).optional(),
  city: z.string().max(120).optional()
}).parse(data)).handler(queryListings_createServerFn_handler, async ({
  data
}) => searchListings(data));
export {
  getListing_createServerFn_handler,
  getShareListing_createServerFn_handler,
  queryListings_createServerFn_handler
};
