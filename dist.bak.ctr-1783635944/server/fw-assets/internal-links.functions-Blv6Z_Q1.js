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
const HUB_TARGETS = [{
  phrase: "earnings calculator",
  to: "/p/earnings-calculator",
  priority: 9,
  title: "Pool host earnings calculator"
}, {
  phrase: "free host tools",
  to: "/p/free-host-tools",
  priority: 9,
  title: "Free pool host tools"
}, {
  phrase: "host tools",
  to: "/p/free-host-tools",
  priority: 8,
  title: "Free pool host tools"
}, {
  phrase: "how it works",
  to: "/p/how-it-works",
  priority: 8,
  title: "How pool rental works"
}, {
  phrase: "become a pool host",
  to: "/p/hosting",
  priority: 8,
  title: "Become a pool host"
}, {
  phrase: "pool host",
  to: "/p/hosting",
  priority: 5,
  title: "Become a pool host"
}, {
  phrase: "pool pros",
  to: "/p/pool-pros",
  priority: 7,
  title: "Pool pros directory"
}, {
  phrase: "all locations",
  to: "/p/all-locations",
  priority: 6,
  title: "All pool rental locations"
}, {
  phrase: "swimply alternative",
  to: "/p/swimply-alternative-vs-pool-rental-near-me",
  priority: 7,
  title: "Swimply alternative"
}, {
  phrase: "giggster",
  to: "/p/giggster-vs-pool-rental-near-me",
  priority: 6,
  title: "Giggster vs Pool Rental Near Me"
}, {
  phrase: "peerspace",
  to: "/p/peerspace-vs-pool-rental-near-me",
  priority: 6,
  title: "Peerspace vs Pool Rental Near Me"
}];
const getInternalLinkTargets_createServerFn_handler = createServerRpc({
  id: "73cb5e46062dcac03bae88abd15e15438c0a270fb576390d6dfaf491512c5864",
  name: "getInternalLinkTargets",
  filename: "src/server/internal-links.functions.ts"
}, (opts) => getInternalLinkTargets.__executeServer(opts));
const getInternalLinkTargets = createServerFn({
  method: "GET"
}).inputValidator((data) => z.object({
  citySlug: z.string().nullable().optional(),
  nearbyCitySlugs: z.array(z.string()).optional()
}).parse(data)).handler(getInternalLinkTargets_createServerFn_handler, async ({
  data
}) => {
  const targets = [...HUB_TARGETS];
  const slugs = /* @__PURE__ */ new Set();
  if (data.citySlug) slugs.add(data.citySlug);
  for (const s of data.nearbyCitySlugs ?? []) slugs.add(s);
  if (slugs.size > 0) {
    try {
      const {
        data: rows
      } = await supabaseAdmin.from("cities").select("slug, name, state_code").in("slug", Array.from(slugs)).eq("is_published", true);
      for (const r of rows ?? []) {
        const stateLow = r.state_code ? r.state_code.toLowerCase() : null;
        const hostAcqSlug = stateLow ? `become-a-swimming-pool-host-${r.slug}${r.slug.endsWith(`-${stateLow}`) ? "" : `-${stateLow}`}` : `become-a-swimming-pool-host-${r.slug}`;
        targets.push({
          phrase: r.name,
          to: `/p/${hostAcqSlug}`,
          title: `Become a pool host in ${r.name}`,
          priority: 4
        });
        if (r.state_code) {
          targets.push({
            phrase: `${r.name}, ${r.state_code}`,
            to: `/p/${hostAcqSlug}`,
            title: `Become a pool host in ${r.name}, ${r.state_code}`,
            priority: 6
          });
        }
      }
    } catch (err) {
      console.error("getInternalLinkTargets cities lookup failed:", err);
    }
  }
  return targets;
});
export {
  getInternalLinkTargets_createServerFn_handler
};
