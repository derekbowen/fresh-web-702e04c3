const BRAND = {
  name: "Pool Rental Near Me",
  tagline: "The peer-to-peer pool rental marketplace",
  url: "https://www.poolrentalnearme.com",
  supportEmail: "support@poolrentalnearme.com",
  // Required by CAN-SPAM. Replace with real postal address.
  postalAddress: "Pool Rental Near Me · 7785 Halbrook Terrace, Riverside, CA 92509",
  // Colors
  primary: "#0c4a6e",
  // deep ocean
  accent: "#0ea5e9",
  // bright pool blue
  bg: "#f8fafc",
  text: "#0f172a",
  muted: "#64748b"
};
const HEADER = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.primary};">
    <tr><td align="center" style="padding:28px 20px;">
      <a href="${BRAND.url}" style="text-decoration:none;color:#ffffff;font:700 22px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;letter-spacing:-0.3px;">
        🌊 ${BRAND.name}
      </a>
    </td></tr>
  </table>
`;
const FOOTER = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-top:1px solid #e2e8f0;">
    <tr><td align="center" style="padding:24px 24px 28px;font:400 12px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${BRAND.muted};">
      <p style="margin:0 0 6px;color:${BRAND.primary};font-weight:600;">${BRAND.name}</p>
      <p style="margin:0 0 10px;">${BRAND.tagline}</p>
      <p style="margin:0 0 14px;">
        <a href="${BRAND.url}" style="color:${BRAND.accent};text-decoration:none;">poolrentalnearme.com</a>
        &nbsp;·&nbsp;
        <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.accent};text-decoration:none;">${BRAND.supportEmail}</a>
      </p>
      <p style="margin:0 0 14px;color:${BRAND.muted};">${BRAND.postalAddress}</p>
      <p style="margin:0;">
        You received this because you signed up at poolrentalnearme.com.
        <a href="{{unsubscribe_url}}" style="color:${BRAND.accent};text-decoration:underline;">Unsubscribe</a>
      </p>
    </td></tr>
  </table>
`;
const SHELL = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light only"/>
<meta name="supported-color-schemes" content="light"/>
<title>{{subject}}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font:400 16px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${BRAND.text};">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">{{preview}}</div>
  ${HEADER}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:36px 28px 32px;color:${BRAND.text};font:400 16px/1.65 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
          {{body}}
        </td></tr>
      </table>
    </td></tr>
  </table>
  ${FOOTER}
</body></html>`;
function wrapInShell(opts) {
  return SHELL.replaceAll("{{subject}}", escapeHtml(opts.subject)).replaceAll("{{preview}}", escapeHtml(opts.preview || opts.subject)).replaceAll("{{body}}", opts.bodyHtml);
}
function renderForRecipient(shellHtml, opts) {
  return shellHtml.replaceAll("{{first_name}}", escapeHtml(opts.firstName || "there")).replaceAll("{{unsubscribe_url}}", opts.unsubscribeUrl);
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function composeFromPlainText(text) {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return { html: "", plain: "" };
  const lines = normalized.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      i++;
      continue;
    }
    if (/^#\s+/.test(trimmed)) {
      blocks.push(
        `<h2 style="margin:0 0 16px;font:700 24px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;color:${BRAND.primary};">${inline(trimmed.replace(/^#\s+/, ""))}</h2>`
      );
      i++;
      continue;
    }
    if (/^##\s+/.test(trimmed)) {
      blocks.push(
        `<h3 style="margin:24px 0 12px;font:700 18px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;color:${BRAND.primary};">${inline(trimmed.replace(/^##\s+/, ""))}</h3>`
      );
      i++;
      continue;
    }
    const btn = trimmed.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (btn) {
      blocks.push(
        `<p style="margin:28px 0;text-align:center;"><a href="${escapeAttr(btn[2])}" style="background:${BRAND.accent};color:#ffffff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">${escapeHtml(btn[1])}</a></p>`
      );
      i++;
      continue;
    }
    if (/^[-*]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(`<li style="margin:4px 0;">${inline(lines[i].trim().replace(/^[-*]\s+/, ""))}</li>`);
        i++;
      }
      blocks.push(`<ul style="padding-left:22px;margin:12px 0;line-height:1.7;">${items.join("")}</ul>`);
      continue;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(`<li style="margin:4px 0;">${inline(lines[i].trim().replace(/^\d+\.\s+/, ""))}</li>`);
        i++;
      }
      blocks.push(`<ol style="padding-left:22px;margin:12px 0;line-height:1.7;">${items.join("")}</ol>`);
      continue;
    }
    const paraLines = [line];
    i++;
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t) break;
      if (/^(#{1,2}\s+|[-*]\s+|\d+\.\s+|\[[^\]]+\]\([^)]+\)$)/.test(t)) break;
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push(`<p style="margin:0 0 16px;">${inline(paraLines.join(" "))}</p>`);
  }
  const lower = normalized.toLowerCase();
  if (!/—\s*the\s+prnm\s+team|—\s*pool\s+rental\s+near\s+me|thanks,|cheers,|best,/i.test(lower)) {
    blocks.push(`<p style="margin:28px 0 0;color:${BRAND.muted};">— The PRNM Team</p>`);
  }
  const html = blocks.join("\n");
  const plain = toPlainText(normalized);
  return { html, plain };
}
function inline(s) {
  let out = escapeHtml(s);
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => `<a href="${escapeAttr(u)}" style="color:${BRAND.accent};">${t}</a>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  return out;
}
function escapeAttr(s) {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
function toPlainText(text) {
  return text.replace(/\r\n/g, "\n").replace(/^#{1,2}\s+/gm, "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)").replace(/^[-*]\s+/gm, "  • ").trim();
}
const STARTER_TEMPLATES = {
  announcement: {
    label: "Announcement",
    text: `# Big news, {{first_name}}

We have something exciting to share with you today.

[Write your announcement here. Keep it short, lead with the benefit, and end with one clear action.]

[Learn more](https://www.poolrentalnearme.com)

Thanks for being part of Pool Rental Near Me.`
  },
  tips: {
    label: "Tips & advice",
    text: `# Quick wins for you, {{first_name}}

Here are three things you can do this week:

1. **Tip one** — short explanation.
2. **Tip two** — short explanation.
3. **Tip three** — short explanation.`
  },
  reminder: {
    label: "Reminder",
    text: `# A quick reminder, {{first_name}}

Just a friendly nudge about [topic].

[Add your reminder details here.]

[Take action](https://www.poolrentalnearme.com)`
  },
  promo: {
    label: "Promotion",
    text: `# A special offer, {{first_name}}

[Describe the offer in one sentence.]

Here's what you get:

- Benefit one
- Benefit two
- Benefit three

[Claim now](https://www.poolrentalnearme.com)`
  },
  plain: {
    label: "Plain note",
    text: `Hi {{first_name}},

[Write your message here.]`
  }
};
export {
  STARTER_TEMPLATES as S,
  composeFromPlainText as c,
  renderForRecipient as r,
  toPlainText as t,
  wrapInShell as w
};
