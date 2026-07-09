import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { s as sendTransactionalEmailServer } from "./transactional-email.server-BoL6nxoQ.js";
import { c as createServerFn, g as getRequest, a as getRequestHeader } from "../server.js";
import "@supabase/supabase-js";
import "react";
import "@react-email/components";
import "react/jsx-runtime";
import "./_unsubscribe-footer-DXp0Y_3B.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router";
import "@tanstack/react-router/ssr/server";
const schema = z.object({
  email: z.string().trim().email().max(255),
  nearestMiles: z.number().nullable().optional(),
  city: z.string().trim().min(1).max(120).nullable().optional(),
  region: z.string().trim().min(1).max(20).nullable().optional()
});
const joinPoolWaitlist_createServerFn_handler = createServerRpc({
  id: "aa4bdb35470374a924313712806bef27436b63448c847ad43833b6ba622835e0",
  name: "joinPoolWaitlist",
  filename: "src/server/waitlist.functions.ts"
}, (opts) => joinPoolWaitlist.__executeServer(opts));
const joinPoolWaitlist = createServerFn({
  method: "POST"
}).inputValidator((data) => schema.parse(data)).handler(joinPoolWaitlist_createServerFn_handler, async ({
  data
}) => {
  let city = null;
  let region = null;
  let latitude = null;
  let longitude = null;
  let userAgent = null;
  try {
    const req = getRequest();
    const cf = req.cf ?? {};
    city = data.city ?? cf.city ?? null;
    region = data.region ?? cf.region ?? null;
    latitude = cf.latitude ? Number(cf.latitude) : null;
    longitude = cf.longitude ? Number(cf.longitude) : null;
    userAgent = getRequestHeader("user-agent") ?? null;
  } catch {
  }
  const {
    error
  } = await supabaseAdmin.from("pool_waitlist").insert({
    email: data.email.toLowerCase(),
    city,
    region,
    latitude,
    longitude,
    nearest_miles: data.nearestMiles ?? null,
    user_agent: userAgent
  });
  if (error) {
    console.error("joinPoolWaitlist insert failed:", error);
    throw new Error("Could not save your email. Please try again.");
  }
  try {
    await sendTransactionalEmailServer({
      templateName: "pool-waitlist-confirmation",
      recipientEmail: data.email,
      idempotencyKey: `pool-waitlist-${data.email.toLowerCase()}`,
      templateData: {
        city: data.city ?? city,
        region: data.region ?? region,
        nearestMiles: data.nearestMiles ?? null
      }
    });
  } catch (emailErr) {
    console.error("waitlist confirmation email failed:", emailErr);
  }
  try {
    await sendTransactionalEmailServer({
      templateName: "internal-lead-notification",
      recipientEmail: "hello@poolrentalnearme.com",
      idempotencyKey: `waitlist-notify-${data.email.toLowerCase()}-${Date.now()}`,
      templateData: {
        formType: "Pool waitlist signup",
        submitterEmail: data.email,
        city: data.city ?? city,
        region: data.region ?? region,
        nearestMiles: data.nearestMiles ?? null
      }
    });
  } catch (notifyErr) {
    console.error("waitlist internal notification failed:", notifyErr);
  }
  return {
    ok: true
  };
});
export {
  joinPoolWaitlist_createServerFn_handler
};
