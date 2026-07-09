import * as React from "react";
import { render } from "@react-email/components";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { T as TEMPLATES } from "./registry-Dn-QpeYo.js";
const SITE_NAME = "Pool Rental Near Me";
const SENDER_DOMAIN = "notify.poolfriends.poolrentalnearme.com";
const FROM_DOMAIN = "notify.poolfriends.poolrentalnearme.com";
const FROM_LOCAL = "noreply";
function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function sendTransactionalEmailServer({
  templateName,
  recipientEmail,
  idempotencyKey,
  templateData = {}
}) {
  const supabase = supabaseAdmin;
  const template = TEMPLATES[templateName];
  if (!template) {
    console.error("Template not found", { templateName });
    return { success: false, reason: "template_not_found" };
  }
  const effectiveRecipient = template.to || recipientEmail;
  if (!effectiveRecipient) {
    return { success: false, reason: "no_recipient" };
  }
  const normalizedEmail = effectiveRecipient.toLowerCase();
  const messageId = crypto.randomUUID();
  const idemKey = idempotencyKey || messageId;
  const { data: suppressed } = await supabase.from("suppressed_emails").select("id").eq("email", normalizedEmail).maybeSingle();
  if (suppressed) {
    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: "suppressed"
    });
    return { success: false, reason: "email_suppressed" };
  }
  let unsubscribeToken;
  const { data: existingToken } = await supabase.from("email_unsubscribe_tokens").select("token, used_at").eq("email", normalizedEmail).maybeSingle();
  if (existingToken && !existingToken.used_at) {
    unsubscribeToken = existingToken.token;
  } else if (!existingToken) {
    unsubscribeToken = generateToken();
    await supabase.from("email_unsubscribe_tokens").upsert(
      { token: unsubscribeToken, email: normalizedEmail },
      { onConflict: "email", ignoreDuplicates: true }
    );
    const { data: stored } = await supabase.from("email_unsubscribe_tokens").select("token").eq("email", normalizedEmail).maybeSingle();
    if (stored?.token) unsubscribeToken = stored.token;
  } else {
    return { success: false, reason: "email_suppressed" };
  }
  const renderProps = { ...templateData, unsubscribeToken };
  const element = React.createElement(template.component, renderProps);
  const html = await render(element);
  const plainText = await render(element, { plainText: true });
  const resolvedSubject = typeof template.subject === "function" ? template.subject(templateData) : template.subject;
  await supabase.from("email_send_log").insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: effectiveRecipient,
    status: "pending"
  });
  const { error: enqueueError } = await supabase.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: effectiveRecipient,
      from: `${SITE_NAME} <${FROM_LOCAL}@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: resolvedSubject,
      html,
      text: plainText,
      purpose: "transactional",
      label: templateName,
      idempotency_key: idemKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
  if (enqueueError) {
    console.error("Failed to enqueue email", { templateName, error: enqueueError });
    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: "failed",
      error_message: "Failed to enqueue email"
    });
    return { success: false, reason: "enqueue_failed" };
  }
  return { success: true };
}
export {
  sendTransactionalEmailServer as s
};
