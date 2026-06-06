/**
 * Branded shell for Email Composer sends.
 * Wraps any inner body HTML with the PRNM logo header and a compliant
 * unsubscribe footer. Substitutes:
 *   {{first_name}}      → recipient's first name (or "there")
 *   {{unsubscribe_url}} → per-recipient unsubscribe URL
 *   {{body}}            → composer body HTML
 */

const HEADER = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c4a6e;padding:24px 0;">
    <tr><td align="center">
      <a href="https://www.poolrentalnearme.com" style="text-decoration:none;color:#ffffff;font:700 22px/1 -apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:-0.3px;">
        🌊 Pool Rental Near Me
      </a>
    </td></tr>
  </table>
`;

const FOOTER = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:28px 24px;margin-top:32px;border-top:1px solid #e2e8f0;">
    <tr><td align="center" style="font:400 12px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#64748b;">
      <p style="margin:0 0 8px;">Pool Rental Near Me · The peer-to-peer pool rental marketplace</p>
      <p style="margin:0 0 12px;">
        <a href="https://www.poolrentalnearme.com" style="color:#0ea5e9;text-decoration:none;">poolrentalnearme.com</a>
      </p>
      <p style="margin:0;">
        Don't want these emails?
        <a href="{{unsubscribe_url}}" style="color:#0ea5e9;text-decoration:underline;">Unsubscribe</a>
      </p>
    </td></tr>
  </table>
`;

const SHELL = `<!doctype html>
<html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>{{subject}}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font:400 16px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;">{{preview}}</div>
  ${HEADER}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;padding:32px 28px;">
        <tr><td style="color:#0f172a;font:400 16px/1.65 -apple-system,Segoe UI,Roboto,sans-serif;">
          {{body}}
        </td></tr>
      </table>
    </td></tr>
  </table>
  ${FOOTER}
</body></html>`;

export function wrapInShell(opts: {
  subject: string;
  bodyHtml: string;
  preview?: string;
}): string {
  return SHELL
    .replaceAll("{{subject}}", escapeHtml(opts.subject))
    .replaceAll("{{preview}}", escapeHtml(opts.preview || ""))
    .replaceAll("{{body}}", opts.bodyHtml);
}

export function renderForRecipient(
  shellHtml: string,
  opts: { firstName: string; unsubscribeUrl: string },
): string {
  return shellHtml
    .replaceAll("{{first_name}}", escapeHtml(opts.firstName || "there"))
    .replaceAll("{{unsubscribe_url}}", opts.unsubscribeUrl);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export const STARTER_TEMPLATES: Record<string, { label: string; body: string }> = {
  announcement: {
    label: "Announcement",
    body: `<h2 style="margin:0 0 16px;font:700 24px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;color:#0c4a6e;">Big news, {{first_name}}</h2>
<p>We have something exciting to share with you today.</p>
<p>[Write your announcement here. Keep it short, lead with the benefit, and end with one clear action.]</p>
<p style="margin:28px 0;">
  <a href="https://www.poolrentalnearme.com" style="background:#0ea5e9;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">Learn more</a>
</p>
<p>Thanks for being part of Pool Rental Near Me.</p>
<p style="margin-top:24px;">— The PRNM Team</p>`,
  },
  tips: {
    label: "Tips & advice",
    body: `<h2 style="margin:0 0 16px;font:700 24px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;color:#0c4a6e;">Quick wins for you, {{first_name}}</h2>
<p>Here are three things you can do this week:</p>
<ol style="padding-left:20px;line-height:1.7;">
  <li><strong>Tip one</strong> — short explanation.</li>
  <li><strong>Tip two</strong> — short explanation.</li>
  <li><strong>Tip three</strong> — short explanation.</li>
</ol>
<p style="margin-top:24px;">— The PRNM Team</p>`,
  },
  reminder: {
    label: "Reminder",
    body: `<h2 style="margin:0 0 16px;font:700 24px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;color:#0c4a6e;">A quick reminder, {{first_name}}</h2>
<p>Just a friendly nudge about [topic].</p>
<p>[Add your reminder details here.]</p>
<p style="margin:28px 0;">
  <a href="https://www.poolrentalnearme.com" style="background:#0ea5e9;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">Take action</a>
</p>
<p>— The PRNM Team</p>`,
  },
  promo: {
    label: "Promotion",
    body: `<h2 style="margin:0 0 16px;font:700 24px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;color:#0c4a6e;">A special offer, {{first_name}} 🌊</h2>
<p>[Describe the offer in one sentence.]</p>
<p>Here's what you get:</p>
<ul style="padding-left:20px;line-height:1.7;">
  <li>Benefit one</li>
  <li>Benefit two</li>
  <li>Benefit three</li>
</ul>
<p style="margin:28px 0;">
  <a href="https://www.poolrentalnearme.com" style="background:#0ea5e9;color:#ffffff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">Claim now</a>
</p>
<p>— The PRNM Team</p>`,
  },
  plain: {
    label: "Plain text",
    body: `<p>Hi {{first_name}},</p>
<p>[Write your message here.]</p>
<p>— The PRNM Team</p>`,
  },
};
