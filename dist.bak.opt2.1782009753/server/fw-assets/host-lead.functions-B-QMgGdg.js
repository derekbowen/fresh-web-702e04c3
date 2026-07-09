import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { s as sendTransactionalEmailServer } from "./transactional-email.server-MlBL04ei.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { t as toE164, b as scheduleSequence } from "./sms.server-BJah3xxU.js";
import { c as createServerFn } from "../server.js";
import "react";
import "@react-email/components";
import "./registry-Dn-QpeYo.js";
import "react/jsx-runtime";
import "./_unsubscribe-footer-DXp0Y_3B.js";
import "@supabase/supabase-js";
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
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(40),
  city: z.string().trim().max(120).nullable().optional(),
  region: z.string().trim().max(20).nullable().optional(),
  page: z.string().trim().max(300).nullable().optional()
});
const submitHostLead_createServerFn_handler = createServerRpc({
  id: "77a019bdcee1129151c815536eb8268c7844203715fff3d45cc20b23559ec740",
  name: "submitHostLead",
  filename: "src/lib/host-lead.functions.ts"
}, (opts) => submitHostLead.__executeServer(opts));
const submitHostLead = createServerFn({
  method: "POST"
}).inputValidator((data) => schema.parse(data)).handler(submitHostLead_createServerFn_handler, async ({
  data
}) => {
  const phoneE164 = toE164(data.phone);
  let leadId = null;
  try {
    const {
      data: row
    } = await supabaseAdmin.from("host_leads").insert({
      name: data.name,
      email: data.email.toLowerCase(),
      phone_raw: data.phone,
      phone_e164: phoneE164 ?? data.phone,
      city: data.city ?? null,
      region: data.region ?? null,
      page: data.page ?? null
    }).select("id").single();
    leadId = row?.id ?? null;
  } catch (err) {
    console.error("submitHostLead persist failed:", err);
  }
  if (leadId && phoneE164) {
    try {
      await scheduleSequence({
        leadId,
        phoneE164,
        firstName: data.name
      });
    } catch (err) {
      console.error("submitHostLead scheduleSequence failed:", err);
    }
  }
  try {
    await sendTransactionalEmailServer({
      templateName: "internal-lead-notification",
      recipientEmail: "hello@poolrentalnearme.com",
      idempotencyKey: `host-lead-${data.email.toLowerCase()}-${Date.now()}`,
      templateData: {
        formType: "Become a host — popup lead",
        submitterEmail: data.email,
        submitterName: data.name,
        city: data.city ?? null,
        region: data.region ?? null,
        message: `Phone: ${data.phone}${phoneE164 ? ` (${phoneE164})` : " (could not normalize)"}`,
        referrerPath: data.page ?? null
      }
    });
  } catch (err) {
    console.error("submitHostLead notify failed:", err);
  }
  return {
    ok: true
  };
});
export {
  submitHostLead_createServerFn_handler
};
