import * as React from "react";
import { Html, Head, Preview, Body, Container, Heading, Text, Section, Button, Hr, Link, render } from "@react-email/components";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { U as UnsubscribeFooter } from "./_unsubscribe-footer-DXp0Y_3B.js";
const SITE_NAME$1 = "Pool Rental Near Me";
const SITE_URL = "https://poolrentalnearme.com";
const PoolWaitlistConfirmationEmail = ({
  city,
  region,
  nearestMiles,
  unsubscribeToken
}) => {
  const where = city ? `${city}${region ? `, ${region}` : ""}` : "your area";
  const milesLabel = typeof nearestMiles === "number" ? `${Math.round(nearestMiles).toLocaleString()} miles` : null;
  return /* @__PURE__ */ jsxs(Html, { lang: "en", dir: "ltr", children: [
    /* @__PURE__ */ jsx(Head, {}),
    /* @__PURE__ */ jsxs(Preview, { children: [
      "You're on the ",
      SITE_NAME$1,
      " waitlist for ",
      where
    ] }),
    /* @__PURE__ */ jsx(Body, { style: main$2, children: /* @__PURE__ */ jsxs(Container, { style: container$2, children: [
      /* @__PURE__ */ jsx(Heading, { style: h1$2, children: "You're on the list! 🎉" }),
      /* @__PURE__ */ jsxs(Text, { style: text$2, children: [
        "Thanks for joining the ",
        SITE_NAME$1,
        " waitlist for ",
        /* @__PURE__ */ jsx("strong", { children: where }),
        ". We'll email you the moment a host opens up a pool within driving distance."
      ] }),
      milesLabel && /* @__PURE__ */ jsx(Section, { style: infoBox, children: /* @__PURE__ */ jsxs(Text, { style: infoText, children: [
        "The closest pool we currently have is about",
        " ",
        /* @__PURE__ */ jsx("strong", { children: milesLabel }),
        " from you. We're actively recruiting hosts in your area to shorten that gap."
      ] }) }),
      /* @__PURE__ */ jsx(Heading, { as: "h2", style: h2$2, children: "What happens next" }),
      /* @__PURE__ */ jsxs(Text, { style: text$2, children: [
        /* @__PURE__ */ jsx("strong", { children: "1." }),
        " We notify you by email as soon as a host lists a pool near ",
        where,
        ".",
        /* @__PURE__ */ jsx("br", {}),
        /* @__PURE__ */ jsx("strong", { children: "2." }),
        " You'll get first access to book before the listing goes public.",
        /* @__PURE__ */ jsx("br", {}),
        /* @__PURE__ */ jsx("strong", { children: "3." }),
        " No spam — only relevant pool openings in your area."
      ] }),
      /* @__PURE__ */ jsx(Section, { style: ctaSection, children: /* @__PURE__ */ jsx(Button, { href: SITE_URL, style: button, children: "Browse pools available now" }) }),
      /* @__PURE__ */ jsxs(Text, { style: tipText, children: [
        "Know someone with a pool? Hosts earn $100–$300+ per booking.",
        " ",
        /* @__PURE__ */ jsx("a", { href: `${SITE_URL}/p/hosting`, style: link, children: "Tell them about hosting" }),
        "."
      ] }),
      /* @__PURE__ */ jsxs(Text, { style: footer$2, children: [
        "— The ",
        SITE_NAME$1,
        " team"
      ] }),
      /* @__PURE__ */ jsx(UnsubscribeFooter, { unsubscribeToken })
    ] }) })
  ] });
};
const template$2 = {
  component: PoolWaitlistConfirmationEmail,
  subject: "You're on the Pool Rental Near Me waitlist",
  displayName: "Pool waitlist confirmation",
  previewData: { city: "Austin", region: "TX", nearestMiles: 287 }
};
const main$2 = {
  backgroundColor: "#ffffff",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
};
const container$2 = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const h1$2 = {
  fontSize: "26px",
  fontWeight: "700",
  color: "#0f172a",
  margin: "0 0 16px",
  lineHeight: "1.3"
};
const h2$2 = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#0f172a",
  margin: "28px 0 12px"
};
const text$2 = {
  fontSize: "15px",
  color: "#334155",
  lineHeight: "1.6",
  margin: "0 0 16px"
};
const infoBox = {
  backgroundColor: "#f1f5f9",
  borderLeft: "3px solid #0ea5e9",
  borderRadius: "6px",
  padding: "14px 16px",
  margin: "16px 0 24px"
};
const infoText = {
  fontSize: "14px",
  color: "#0f172a",
  lineHeight: "1.5",
  margin: "0"
};
const ctaSection = { textAlign: "center", margin: "28px 0" };
const button = {
  backgroundColor: "#0ea5e9",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "999px",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block"
};
const tipText = {
  fontSize: "13px",
  color: "#64748b",
  lineHeight: "1.6",
  margin: "24px 0 0",
  padding: "16px 0 0",
  borderTop: "1px solid #e2e8f0"
};
const link = { color: "#0ea5e9", textDecoration: "underline" };
const footer$2 = {
  fontSize: "13px",
  color: "#94a3b8",
  margin: "24px 0 0"
};
const InternalLeadNotificationEmail = ({
  formType = "Lead form",
  submitterEmail = "unknown",
  submitterName,
  city,
  region,
  message,
  nearestMiles,
  referrerPath,
  unsubscribeToken
}) => {
  const where = [city, region].filter(Boolean).join(", ") || "—";
  return /* @__PURE__ */ jsxs(Html, { lang: "en", dir: "ltr", children: [
    /* @__PURE__ */ jsx(Head, {}),
    /* @__PURE__ */ jsxs(Preview, { children: [
      formType,
      ": ",
      submitterEmail
    ] }),
    /* @__PURE__ */ jsx(Body, { style: main$1, children: /* @__PURE__ */ jsxs(Container, { style: container$1, children: [
      /* @__PURE__ */ jsxs(Heading, { style: h1$1, children: [
        "New ",
        formType,
        " submission"
      ] }),
      /* @__PURE__ */ jsx(Text, { style: text$1, children: "A new lead just came through. Details below." }),
      /* @__PURE__ */ jsxs(Section, { style: card$1, children: [
        /* @__PURE__ */ jsx(Row, { label: "Form", value: formType }),
        /* @__PURE__ */ jsx(Row, { label: "Email", value: submitterEmail }),
        submitterName && /* @__PURE__ */ jsx(Row, { label: "Name", value: submitterName }),
        /* @__PURE__ */ jsx(Row, { label: "Location", value: where }),
        typeof nearestMiles === "number" && /* @__PURE__ */ jsx(
          Row,
          {
            label: "Nearest pool",
            value: `${Math.round(nearestMiles).toLocaleString()} miles away`
          }
        ),
        referrerPath && /* @__PURE__ */ jsx(Row, { label: "Page", value: referrerPath })
      ] }),
      message && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Heading, { as: "h2", style: h2$1, children: "Message" }),
        /* @__PURE__ */ jsx(Section, { style: msgBox, children: /* @__PURE__ */ jsx(Text, { style: msgText, children: message }) })
      ] }),
      /* @__PURE__ */ jsx(Hr, { style: hr$1 }),
      /* @__PURE__ */ jsx(Text, { style: footer$1, children: "Sent automatically by Pool Rental Near Me." }),
      /* @__PURE__ */ jsx(UnsubscribeFooter, { unsubscribeToken })
    ] }) })
  ] });
};
function Row({ label, value }) {
  return /* @__PURE__ */ jsxs(Text, { style: rowText$1, children: [
    /* @__PURE__ */ jsxs("span", { style: rowLabel, children: [
      label,
      ":"
    ] }),
    " ",
    value
  ] });
}
const template$1 = {
  component: InternalLeadNotificationEmail,
  subject: (data) => `🚀 New ${data.formType || "lead"} — ${data.submitterEmail || "unknown"}`,
  to: "hello@poolrentalnearme.com",
  displayName: "Internal lead notification",
  previewData: {
    formType: "Pool waitlist signup",
    submitterEmail: "jane@example.com",
    submitterName: "Jane Doe",
    city: "Austin",
    region: "TX",
    nearestMiles: 287,
    referrerPath: "/"
  }
};
const main$1 = {
  backgroundColor: "#ffffff",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
};
const container$1 = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const h1$1 = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#0f172a",
  margin: "0 0 12px"
};
const h2$1 = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#0f172a",
  margin: "20px 0 8px"
};
const text$1 = {
  fontSize: "14px",
  color: "#475569",
  lineHeight: "1.5",
  margin: "0 0 16px"
};
const card$1 = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "16px 18px",
  margin: "0 0 12px"
};
const rowText$1 = {
  fontSize: "14px",
  color: "#0f172a",
  margin: "0 0 6px",
  lineHeight: "1.5"
};
const rowLabel = { color: "#64748b", fontWeight: 600, marginRight: "6px" };
const msgBox = {
  backgroundColor: "#fff7ed",
  borderLeft: "3px solid #f97316",
  borderRadius: "6px",
  padding: "12px 14px",
  margin: "0 0 16px"
};
const msgText = {
  fontSize: "14px",
  color: "#0f172a",
  lineHeight: "1.6",
  margin: 0,
  whiteSpace: "pre-wrap"
};
const hr$1 = { borderColor: "#e2e8f0", margin: "24px 0 12px" };
const footer$1 = { fontSize: "12px", color: "#94a3b8", margin: 0 };
const DailySeoDigestEmail = ({
  dateLabel = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
  newCompetitorPages = [],
  criticalAudits = [],
  rankDrops = [],
  hostLeads = [],
  totalNewCompetitor = 0,
  totalCriticalAudits = 0,
  totalHostLeads = 0,
  unsubscribeToken
}) => {
  const nothing = newCompetitorPages.length === 0 && criticalAudits.length === 0 && rankDrops.length === 0 && hostLeads.length === 0;
  return /* @__PURE__ */ jsxs(Html, { lang: "en", dir: "ltr", children: [
    /* @__PURE__ */ jsx(Head, {}),
    /* @__PURE__ */ jsx(Preview, { children: `Daily SEO digest — ${totalNewCompetitor} new competitor pages, ${totalCriticalAudits} critical audits, ${totalHostLeads} host leads` }),
    /* @__PURE__ */ jsx(Body, { style: main, children: /* @__PURE__ */ jsxs(Container, { style: container, children: [
      /* @__PURE__ */ jsx(Heading, { style: h1, children: "🚨 Daily SEO digest" }),
      /* @__PURE__ */ jsx(Text, { style: subtle, children: dateLabel }),
      /* @__PURE__ */ jsxs(Section, { style: statRow, children: [
        /* @__PURE__ */ jsx(Stat, { label: "New competitor pages", value: String(totalNewCompetitor), tone: totalNewCompetitor > 0 ? "warn" : "ok" }),
        /* @__PURE__ */ jsx(Stat, { label: "Critical audit flags", value: String(totalCriticalAudits), tone: totalCriticalAudits > 0 ? "danger" : "ok" }),
        /* @__PURE__ */ jsx(Stat, { label: "Rank drops", value: String(rankDrops.length), tone: rankDrops.length > 0 ? "warn" : "ok" })
      ] }),
      nothing && /* @__PURE__ */ jsx(Section, { style: card, children: /* @__PURE__ */ jsx(Text, { style: text, children: "✅ Nothing critical in the last 24 hours. All tracked competitors quiet, no audit scores below 60, no rank drops." }) }),
      newCompetitorPages.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(Heading, { as: "h2", style: h2, children: [
          "New competitor pages (",
          totalNewCompetitor,
          ")"
        ] }),
        /* @__PURE__ */ jsxs(Section, { style: card, children: [
          newCompetitorPages.slice(0, 15).map((p) => /* @__PURE__ */ jsxs(Text, { style: rowText, children: [
            /* @__PURE__ */ jsx("span", { style: domainTag, children: p.domain }),
            " ",
            /* @__PURE__ */ jsx(Link, { href: p.url, style: linkStyle, children: p.title || p.url })
          ] }, p.url)),
          totalNewCompetitor > newCompetitorPages.length && /* @__PURE__ */ jsxs(Text, { style: moreText, children: [
            "…and ",
            totalNewCompetitor - newCompetitorPages.length,
            " more"
          ] })
        ] })
      ] }),
      criticalAudits.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(Heading, { as: "h2", style: h2, children: [
          "Critical AI audit flags (",
          totalCriticalAudits,
          ")"
        ] }),
        /* @__PURE__ */ jsxs(Section, { style: card, children: [
          criticalAudits.slice(0, 15).map((a) => /* @__PURE__ */ jsxs(Text, { style: rowText, children: [
            /* @__PURE__ */ jsxs("span", { style: scoreBadge(a.score), children: [
              a.score,
              "/100"
            ] }),
            " ",
            /* @__PURE__ */ jsx(Link, { href: `https://www.poolrentalnearme.com${a.url_path}`, style: linkStyle, children: a.url_path }),
            a.summary && /* @__PURE__ */ jsxs("span", { style: summaryStyle, children: [
              " — ",
              a.summary
            ] })
          ] }, a.url_path)),
          totalCriticalAudits > criticalAudits.length && /* @__PURE__ */ jsxs(Text, { style: moreText, children: [
            "…and ",
            totalCriticalAudits - criticalAudits.length,
            " more"
          ] })
        ] })
      ] }),
      rankDrops.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(Heading, { as: "h2", style: h2, children: [
          "Significant rank drops (",
          rankDrops.length,
          ")"
        ] }),
        /* @__PURE__ */ jsx(Section, { style: card, children: rankDrops.map((r) => /* @__PURE__ */ jsxs(Text, { style: rowText, children: [
          /* @__PURE__ */ jsx("strong", { children: r.keyword }),
          ":",
          " ",
          r.previous_position ?? "—",
          " → ",
          /* @__PURE__ */ jsx("span", { style: { color: "#dc2626", fontWeight: 600 }, children: r.current_position ?? "lost" })
        ] }, r.keyword)) })
      ] }),
      hostLeads.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(Heading, { as: "h2", style: h2, children: [
          "🎯 New host leads (",
          totalHostLeads,
          ")"
        ] }),
        /* @__PURE__ */ jsxs(Section, { style: card, children: [
          /* @__PURE__ */ jsx(Text, { style: { ...text, fontSize: "12px", marginBottom: "12px" }, children: "Potential identity matches for competitor listings (above-board sources only — public business pages, Yelp, host-published contact info)." }),
          hostLeads.slice(0, 10).map((h, i) => /* @__PURE__ */ jsxs(Text, { style: rowText, children: [
            /* @__PURE__ */ jsxs("span", { style: confidenceBadge(h.match_confidence), children: [
              h.match_confidence,
              "%"
            ] }),
            " ",
            h.domain && /* @__PURE__ */ jsx("span", { style: domainTag, children: h.domain }),
            " ",
            /* @__PURE__ */ jsx("strong", { children: h.candidate_name || h.candidate_business_name || "Unknown" }),
            h.candidate_email && /* @__PURE__ */ jsxs(Fragment, { children: [
              " — ",
              /* @__PURE__ */ jsx(Link, { href: `mailto:${h.candidate_email}`, style: linkStyle, children: h.candidate_email })
            ] }),
            h.candidate_phone && /* @__PURE__ */ jsxs(Fragment, { children: [
              " — ",
              h.candidate_phone
            ] }),
            h.candidate_evidence && /* @__PURE__ */ jsxs("span", { style: summaryStyle, children: [
              /* @__PURE__ */ jsx("br", {}),
              h.candidate_evidence
            ] }),
            /* @__PURE__ */ jsx("br", {}),
            /* @__PURE__ */ jsx(Link, { href: h.competitor_url, style: { ...linkStyle, fontSize: "11px" }, children: "view listing" })
          ] }, i)),
          totalHostLeads > hostLeads.length && /* @__PURE__ */ jsxs(Text, { style: moreText, children: [
            "…and ",
            totalHostLeads - hostLeads.length,
            " more"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Hr, { style: hr }),
      /* @__PURE__ */ jsxs(Text, { style: footer, children: [
        "Sent automatically by Pool Rental Near Me admin. View details in ",
        /* @__PURE__ */ jsx(Link, { href: "/admin/dashboard", style: linkStyle, children: "admin dashboard" }),
        "."
      ] }),
      /* @__PURE__ */ jsx(UnsubscribeFooter, { unsubscribeToken })
    ] }) })
  ] });
};
function Stat({ label, value, tone }) {
  const color = tone === "danger" ? "#dc2626" : tone === "warn" ? "#d97706" : "#16a34a";
  return /* @__PURE__ */ jsxs(Section, { style: statCell, children: [
    /* @__PURE__ */ jsx(Text, { style: { ...statValue, color }, children: value }),
    /* @__PURE__ */ jsx(Text, { style: statLabel, children: label })
  ] });
}
function confidenceBadge(score) {
  return {
    display: "inline-block",
    backgroundColor: score >= 70 ? "#dcfce7" : score >= 50 ? "#fef3c7" : "#f1f5f9",
    color: score >= 70 ? "#166534" : score >= 50 ? "#92400e" : "#475569",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 600,
    marginRight: "6px"
  };
}
function scoreBadge(score) {
  return {
    display: "inline-block",
    backgroundColor: score < 40 ? "#fee2e2" : "#fef3c7",
    color: score < 40 ? "#991b1b" : "#92400e",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 600,
    marginRight: "6px"
  };
}
const template = {
  component: DailySeoDigestEmail,
  subject: (data) => {
    const n = (data.totalNewCompetitor || 0) + (data.totalCriticalAudits || 0) + ((data.rankDrops || []).length || 0);
    return n > 0 ? `🚨 Daily SEO digest — ${n} item${n === 1 ? "" : "s"} need attention` : `✅ Daily SEO digest — all clear`;
  },
  to: "derek@poolrentalnearme.com",
  displayName: "Daily SEO digest",
  previewData: {
    totalNewCompetitor: 12,
    totalCriticalAudits: 3,
    newCompetitorPages: [
      { url: "https://swimply.com/pools/example", domain: "swimply.com", title: "Pool Rental in Austin" }
    ],
    criticalAudits: [
      { url_path: "/p/los-angeles-ca", score: 35, summary: "Missing schema, thin content" }
    ],
    rankDrops: [{ keyword: "pool rental near me", previous_position: 5, current_position: 14 }]
  }
};
const main = { backgroundColor: "#ffffff", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' };
const container = { padding: "32px 24px", maxWidth: "640px", margin: "0 auto" };
const h1 = { fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px" };
const h2 = { fontSize: "16px", fontWeight: "600", color: "#0f172a", margin: "24px 0 8px" };
const subtle = { fontSize: "13px", color: "#64748b", margin: "0 0 20px" };
const text = { fontSize: "14px", color: "#475569", lineHeight: "1.5", margin: "0 0 8px" };
const card = { backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px 18px", margin: "0 0 12px" };
const statRow = { display: "block", margin: "0 0 16px" };
const statCell = { display: "inline-block", width: "33%", textAlign: "center", padding: "8px" };
const statValue = { fontSize: "28px", fontWeight: "700", margin: 0, lineHeight: 1 };
const statLabel = { fontSize: "11px", color: "#64748b", textTransform: "uppercase", margin: "4px 0 0", letterSpacing: "0.05em" };
const rowText = { fontSize: "13px", color: "#0f172a", margin: "0 0 8px", lineHeight: "1.5" };
const domainTag = { display: "inline-block", backgroundColor: "#e0e7ff", color: "#3730a3", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, marginRight: "6px" };
const linkStyle = { color: "#2563eb", textDecoration: "underline" };
const summaryStyle = { color: "#64748b", fontSize: "12px" };
const moreText = { fontSize: "12px", color: "#94a3b8", margin: "8px 0 0", fontStyle: "italic" };
const hr = { borderColor: "#e2e8f0", margin: "24px 0 12px" };
const footer = { fontSize: "12px", color: "#94a3b8", margin: 0 };
const TEMPLATES = {
  "pool-waitlist-confirmation": template$2,
  "internal-lead-notification": template$1,
  "daily-seo-digest": template
};
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
  const template2 = TEMPLATES[templateName];
  if (!template2) {
    console.error("Template not found", { templateName });
    return { success: false, reason: "template_not_found" };
  }
  const effectiveRecipient = template2.to || recipientEmail;
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
  const element = React.createElement(template2.component, renderProps);
  const html = await render(element);
  const plainText = await render(element, { plainText: true });
  const resolvedSubject = typeof template2.subject === "function" ? template2.subject(templateData) : template2.subject;
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
  TEMPLATES as T,
  sendTransactionalEmailServer as s
};
