import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import * as React from "react";
import { render } from "@react-email/components";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { R as ReauthenticationEmail, E as EmailChangeEmail, a as RecoveryEmail, M as MagicLinkEmail, I as InviteEmail, S as SignupEmail } from "./reauthentication-CCohUDQL.js";
import { c as createServerFn } from "../server.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
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
const DEFAULT_BRANDING = {
  site_name: "fresh-web",
  sender_name: "fresh-web",
  logo_url: null,
  primary_color: "#000000",
  primary_text_color: "#ffffff",
  footer_text: null
};
async function loadEmailBranding() {
  const {
    data,
    error
  } = await supabaseAdmin.from("email_branding").select("site_name, sender_name, logo_url, primary_color, primary_text_color, footer_text").eq("id", 1).maybeSingle();
  if (error || !data) return DEFAULT_BRANDING;
  return {
    ...DEFAULT_BRANDING,
    ...data
  };
}
async function assertAdmin(userId) {
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}
const getEmailBranding_createServerFn_handler = createServerRpc({
  id: "6fa876458b59315b8310895746df89279bc4859d10dc62900c6fbe62a958e791",
  name: "getEmailBranding",
  filename: "src/server/email-branding.functions.ts"
}, (opts) => getEmailBranding.__executeServer(opts));
const getEmailBranding = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getEmailBranding_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  return loadEmailBranding();
});
const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a 6-digit hex color");
const UpdateSchema = z.object({
  site_name: z.string().min(1).max(120),
  sender_name: z.string().min(1).max(120),
  logo_url: z.string().url().max(500).nullable().or(z.literal("").transform(() => null)),
  primary_color: HexColor,
  primary_text_color: HexColor,
  footer_text: z.string().max(500).nullable().or(z.literal("").transform(() => null))
});
const updateEmailBranding_createServerFn_handler = createServerRpc({
  id: "d120ac3644f89dbf72c968cee435af07316f838a8b6393fecd2faf4a9d4fe6c3",
  name: "updateEmailBranding",
  filename: "src/server/email-branding.functions.ts"
}, (opts) => updateEmailBranding.__executeServer(opts));
const updateEmailBranding = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => UpdateSchema.parse(data)).handler(updateEmailBranding_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  const {
    error
  } = await supabaseAdmin.from("email_branding").upsert({
    id: 1,
    ...data
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const TEMPLATES = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail
};
const SAMPLE_URL = "https://example.com";
const SAMPLE_EMAIL = "user@example.test";
function sampleProps(type) {
  switch (type) {
    case "signup":
      return {
        siteUrl: SAMPLE_URL,
        recipient: SAMPLE_EMAIL,
        confirmationUrl: SAMPLE_URL
      };
    case "invite":
      return {
        siteUrl: SAMPLE_URL,
        confirmationUrl: SAMPLE_URL
      };
    case "magiclink":
    case "recovery":
      return {
        confirmationUrl: SAMPLE_URL
      };
    case "email_change":
      return {
        oldEmail: SAMPLE_EMAIL,
        email: SAMPLE_EMAIL,
        newEmail: "new@example.test",
        confirmationUrl: SAMPLE_URL
      };
    case "reauthentication":
      return {
        token: "123456"
      };
    default:
      return {};
  }
}
const previewAuthEmail_createServerFn_handler = createServerRpc({
  id: "ea699fac7c9b1dc6ded35057d44edc2d5cc0995b6989313865436a8c98617741",
  name: "previewAuthEmail",
  filename: "src/server/email-branding.functions.ts"
}, (opts) => previewAuthEmail.__executeServer(opts));
const previewAuthEmail = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  type: z.string()
}).parse(data)).handler(previewAuthEmail_createServerFn_handler, async ({
  context,
  data
}) => {
  const {
    userId
  } = context;
  await assertAdmin(userId);
  const Template = TEMPLATES[data.type];
  if (!Template) throw new Error(`Unknown email type: ${data.type}`);
  const row = await loadEmailBranding();
  const branding = {
    siteName: row.site_name,
    senderName: row.sender_name,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color,
    primaryTextColor: row.primary_text_color,
    footerText: row.footer_text
  };
  const props = {
    ...sampleProps(data.type),
    siteName: branding.siteName,
    branding
  };
  const html = await render(React.createElement(Template, props));
  return {
    html
  };
});
export {
  getEmailBranding_createServerFn_handler,
  previewAuthEmail_createServerFn_handler,
  updateEmailBranding_createServerFn_handler
};
