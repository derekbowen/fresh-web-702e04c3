import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { S as STATE_NAMES } from "./states-UIdvqlKs.js";
import { p as parseCitySlug } from "./city-slug-Bqls2qOy.js";
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
const HOST_ACQ_PREFIX = "become-a-swimming-pool-host-";
function stateSlug(name) {
  return name.toLowerCase().replace(/\s+/g, "-");
}
function stateNameFromSlug(slug) {
  const target = slug.toLowerCase();
  for (const name of Object.values(STATE_NAMES)) {
    if (stateSlug(name) === target) return name;
  }
  return null;
}
function stateCodeForName(name) {
  for (const [code, n] of Object.entries(STATE_NAMES)) {
    if (n === name) return code;
  }
  return null;
}
async function fetchAllHostAcqSlugs() {
  const out = [];
  const PAGE = 1e3;
  let from = 0;
  while (true) {
    const {
      data,
      error
    } = await supabaseAdmin.from("content_pages").select("slug").like("slug", `${HOST_ACQ_PREFIX}%`).range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    for (const r of data) out.push(r.slug);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return out;
}
function parseRows(slugs) {
  const rows = [];
  for (const pageSlug of slugs) {
    if (!pageSlug.startsWith(HOST_ACQ_PREFIX)) continue;
    const citySlug = pageSlug.slice(HOST_ACQ_PREFIX.length);
    if (!citySlug) continue;
    const {
      city,
      stateCode
    } = parseCitySlug(citySlug);
    if (!stateCode || !STATE_NAMES[stateCode]) continue;
    rows.push({
      pageSlug,
      citySlug,
      cityName: city,
      stateCode
    });
  }
  return rows;
}
const getStateHub_createServerFn_handler = createServerRpc({
  id: "79b64087660bdf4fb3cf48087cdebf222c62fa684137a15386958033986d4752",
  name: "getStateHub",
  filename: "src/server/state-hub.functions.ts"
}, (opts) => getStateHub.__executeServer(opts));
const getStateHub = createServerFn({
  method: "GET"
}).inputValidator((data) => z.object({
  state: z.string().min(2).max(40)
}).parse(data)).handler(getStateHub_createServerFn_handler, async ({
  data
}) => {
  try {
    const stateName = stateNameFromSlug(data.state);
    if (!stateName) return null;
    const stateCode = stateCodeForName(stateName);
    if (!stateCode) return null;
    const slugs = await fetchAllHostAcqSlugs();
    const rows = parseRows(slugs).filter((r) => r.stateCode === stateCode);
    const byCity = /* @__PURE__ */ new Map();
    for (const r of rows) if (!byCity.has(r.citySlug)) byCity.set(r.citySlug, r);
    const cities = [...byCity.values()].map((r) => ({
      citySlug: r.citySlug,
      cityName: r.cityName,
      pageSlug: r.pageSlug,
      url: `/p/${r.pageSlug}`
    })).sort((a, b) => a.cityName.localeCompare(b.cityName));
    return {
      stateCode,
      stateName,
      cities
    };
  } catch (err) {
    console.error("getStateHub failed:", err);
    return null;
  }
});
const getAllStateHubs_createServerFn_handler = createServerRpc({
  id: "7f981f7440b17597ba65cf7c841b484ec4af448efa9dbe9542d6397d003ac5f1",
  name: "getAllStateHubs",
  filename: "src/server/state-hub.functions.ts"
}, (opts) => getAllStateHubs.__executeServer(opts));
const getAllStateHubs = createServerFn({
  method: "GET"
}).handler(getAllStateHubs_createServerFn_handler, async () => {
  try {
    const slugs = await fetchAllHostAcqSlugs();
    const rows = parseRows(slugs);
    const counts = /* @__PURE__ */ new Map();
    for (const r of rows) {
      counts.set(r.stateCode, (counts.get(r.stateCode) ?? 0) + 1);
    }
    const entries = [];
    for (const [code, name] of Object.entries(STATE_NAMES)) {
      const n = counts.get(code) ?? 0;
      if (n === 0) continue;
      entries.push({
        stateCode: code,
        stateName: name,
        citySlug: stateSlug(name),
        cityCount: n
      });
    }
    return entries.sort((a, b) => a.stateName.localeCompare(b.stateName));
  } catch (err) {
    console.error("getAllStateHubs failed:", err);
    return [];
  }
});
export {
  getAllStateHubs_createServerFn_handler,
  getStateHub_createServerFn_handler
};
