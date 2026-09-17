/**
 * Host lifecycle email templates. One responsive shell, eight short emails.
 * Pure: render(templateKey, vars) → { subject, html, text, ctaUrl }.
 *
 * Content rules (CLAUDE.md): signed by Derek or nobody; 0% host fees, hosts keep
 * 100%; payouts via Stripe after each completed booking; no insurance,
 * coverage or guarantee language; no invented numbers.
 */
import type { TemplateKey } from "./campaigns";

/** Brand tokens taken from the live site (src/styles.css primary ≈ sky-500; hero/host band uses these hexes). */
export const BRAND = {
  primary: "#0EA5E9",
  primaryDark: "#0B4A6F",
  text: "#1F2937",
  muted: "#6B7280",
  bg: "#F4F7FA",
  card: "#FFFFFF",
  border: "#E5E7EB",
  /** Resized copy of the production logo, served by EAST under the stable /fw-assets path. */
  logoUrl: "https://www.poolrentalnearme.com/fw-assets/email/prnm-logo-240.png",
  siteName: "Pool Rental Near Me",
  siteUrl: "https://www.poolrentalnearme.com",
} as const;

export interface TemplateVars {
  first_name: string | null;
  listing_title: string | null;
  listing_url: string | null;
  completion_url: string | null;
  location_url: string | null;
  pricing_url: string | null;
  photos_url: string | null;
  /** What the draft still lacks (from the state detector); drives the incomplete_info copy and CTA. */
  missing_pieces: Array<"address" | "photos" | "price" | "description" | "title">;
  publish_url: string | null;
  stripe_url: string | null;
  wizard_url: string;
  support_phone: string | null; // null → placeholder, flagged as not production-ready
  support_email: string;
  unsubscribe_url: string;
  postal_address: string | null;
}

export interface RenderedEmail {
  subject: string;
  preheader: string;
  html: string;
  text: string;
  ctaLabel: string;
  ctaUrl: string;
  /** False when a required production value (support phone) is still a placeholder. */
  productionReady: boolean;
  placeholders: string[];
}

export const SUPPORT_PHONE_PLACEHOLDER = "{{DEREK_SUPPORT_PHONE}}";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function greeting(v: TemplateVars): string {
  return v.first_name ? `Hi ${v.first_name},` : "Hi there,";
}

interface Body {
  subject: string;
  preheader: string;
  /** Short paragraphs, plain text; rendered as <p>. */
  paragraphs: string[];
  ctaLabel: string;
  ctaUrl: string;
  /** Optional bullet list rendered after the paragraphs. */
  bullets?: string[];
  /** Optional closing line before the support block. */
  closing?: string;
}

function bodies(key: TemplateKey, v: TemplateVars): Body {
  const title = v.listing_title ? `“${v.listing_title}”` : "your pool";
  switch (key) {
    case "no_listing_1":
      return {
        subject: "Need help getting your pool listed?",
        preheader: "Your account is set up. Listing takes about ten minutes.",
        paragraphs: [
          "You created a host account on Pool Rental Near Me but haven't started a listing yet.",
          "Listing takes about ten minutes: a few photos, your address, your hourly price. Guests can't find your pool until it's live.",
        ],
        ctaLabel: "Finish your pool listing",
        ctaUrl: v.wizard_url,
      };
    case "no_listing_2":
      return {
        subject: "Derek can help you get this finished",
        preheader: "If something got in the way, I'll walk you through it.",
        paragraphs: [
          "Still no listing on your account, and that's usually because something got in the way: a question about pricing, a photo that wouldn't upload, or just time.",
          "I'm happy to help you finish it. Reply to this email or call me, and we'll get your pool live together.",
        ],
        ctaLabel: "Finish your pool listing",
        ctaUrl: v.wizard_url,
        closing: "— Derek",
      };
    case "incomplete_photos":
      return {
        subject: "Your pool is almost ready — add your photos",
        preheader: "Photos are the last thing guests need to see before they book.",
        paragraphs: [
          `${title} has its address and details. It just needs photos.`,
          "Three or four clear daylight shots are enough: the pool, the seating, anything that makes it yours.",
        ],
        ctaLabel: "Add photos",
        ctaUrl: v.photos_url ?? v.completion_url ?? v.wizard_url,
      };
    case "incomplete_info": {
      // Specific to what is actually missing; the CTA lands on the wizard tab
      // that fixes the first missing piece (details → location → pricing).
      const info = incompleteInfoCopy(title, v);
      return {
        subject: "You're almost done listing your pool",
        preheader: info.preheader,
        paragraphs: info.paragraphs,
        ctaLabel: info.ctaLabel,
        ctaUrl: info.ctaUrl ?? v.completion_url ?? v.wizard_url,
      };
    }
    case "publish_1":
      return {
        subject: "Your pool is ready — publish it",
        preheader: "Everything's filled in. Guests can't see it until it's live.",
        paragraphs: [
          `${title} is complete: photos, address, price, the lot. It's still a draft, so guests can't discover or book it.`,
          "Publishing takes one click. You approve every booking request, so nothing happens without you.",
        ],
        ctaLabel: "Publish your pool",
        ctaUrl: v.publish_url ?? v.completion_url ?? v.wizard_url,
      };
    case "stripe_1":
      return {
        subject: "One last step before you can get paid",
        preheader: "Your pool is live. Set up payouts so bookings can pay you.",
        paragraphs: [
          `${title} is live. Before a booking can pay you, you need to connect a payout account.`,
          "It's a short Stripe form: your bank details and a few identity questions. Payouts are initiated after each completed booking, and you keep 100% of your price.",
        ],
        ctaLabel: "Set up payouts",
        ctaUrl: v.stripe_url ?? v.wizard_url,
      };
    case "stripe_2":
      return {
        subject: "Need help setting up your payouts?",
        preheader: "Your pool is live but can't be paid yet. I can help.",
        paragraphs: [
          `${title} is live, but payouts still aren't set up, so a booking can't pay you yet.`,
          "If the Stripe form asked for something you weren't sure about, reply or call me and I'll walk you through it. It usually takes five minutes.",
        ],
        ctaLabel: "Set up payouts",
        ctaUrl: v.stripe_url ?? v.wizard_url,
        closing: "— Derek",
      };
    case "no_booking_1":
      return {
        subject: "Let's get more eyes on your pool",
        preheader: "A few small changes usually make the difference.",
        paragraphs: [
          `${title} is live and ready to be paid. No bookings yet, which is normal in the first weeks. A few things reliably help:`,
        ],
        bullets: [
          "Photos: bright, daylight, pool first.",
          "Price: check what similar pools near you charge per hour.",
          "Description: say who it's good for (families, small parties, swim lessons).",
          "Availability: keep your calendar current so requests aren't declined.",
          "Share your booking link with people who already ask you about the pool.",
        ],
        ctaLabel: "View your listing",
        ctaUrl: v.listing_url ?? v.wizard_url,
        closing: "Want me to look it over? Reply to this email and I'll send a few specific suggestions. — Derek",
      };
  }
}

export function renderTemplate(key: TemplateKey, v: TemplateVars): RenderedEmail {
  const b = bodies(key, v);
  const placeholders: string[] = [];
  const phone = v.support_phone ?? SUPPORT_PHONE_PLACEHOLDER;
  if (!v.support_phone) placeholders.push("support_phone");
  const g = greeting(v);

  const paragraphsHtml = b.paragraphs.map((p) => `<p style="margin:0 0 16px 0;font-size:16px;line-height:24px;color:${BRAND.text};">${esc(p)}</p>`).join("");
  const bulletsHtml = b.bullets
    ? `<ul style="margin:0 0 16px 20px;padding:0;font-size:16px;line-height:24px;color:${BRAND.text};">${b.bullets.map((x) => `<li style="margin:0 0 6px 0;">${esc(x)}</li>`).join("")}</ul>`
    : "";
  const closingHtml = b.closing ? `<p style="margin:8px 0 0 0;font-size:16px;line-height:24px;color:${BRAND.text};">${esc(b.closing)}</p>` : "";
  const cta = `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 24px 0;"><tr><td style="border-radius:999px;background:${BRAND.primary};">
      <a href="${esc(b.ctaUrl)}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${esc(b.ctaLabel)}</a>
    </td></tr></table>`;
  const telHref = v.support_phone ? `tel:${v.support_phone.replace(/[^0-9+]/g, "")}` : "#";
  const support = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:8px;border-top:1px solid ${BRAND.border};">
      <tr><td style="padding:20px 0 0 0;">
        <p style="margin:0 0 6px 0;font-size:15px;font-weight:700;color:${BRAND.primaryDark};">Need help?</p>
        <p style="margin:0 0 10px 0;font-size:15px;line-height:22px;color:${BRAND.text};">I'm Derek with Pool Rental Near Me. If you're stuck getting your pool listed, setting up payouts, or have any questions, contact me directly.</p>
        <p style="margin:0;font-size:15px;line-height:22px;color:${BRAND.text};"><strong>Call or text Derek:</strong> <a href="${telHref}" style="color:${BRAND.primary};text-decoration:none;">${esc(phone)}</a><br>
        Or just reply to this email.</p>
      </td></tr></table>`;
  const postal = v.postal_address ? `<br>${esc(v.postal_address)}` : "";
  const footer = `<p style="margin:0;font-size:12px;line-height:18px;color:${BRAND.muted};">
      ${BRAND.siteName}${postal}<br>
      You're receiving this because you created a host account on ${BRAND.siteName}. These are one-time reminders about finishing your listing, not a newsletter.
      <a href="${esc(v.unsubscribe_url)}" style="color:${BRAND.muted};">Unsubscribe from host reminders</a></p>`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting"><title>${esc(b.subject)}</title>
<style>@media (max-width:620px){.container{width:100%!important}.inner{padding:20px!important}}</style></head>
<body style="margin:0;padding:0;background:${BRAND.bg};">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${BRAND.bg};">${esc(b.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.bg};"><tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;">
    <tr><td align="left" style="padding:8px 8px 20px 8px;">
      <a href="${BRAND.siteUrl}" style="text-decoration:none;"><img src="${BRAND.logoUrl}" width="120" height="111" alt="${BRAND.siteName}" style="display:block;width:120px;height:auto;border:0;"></a>
    </td></tr>
    <tr><td class="inner" style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <p style="margin:0 0 16px 0;font-size:16px;line-height:24px;color:${BRAND.text};">${esc(g)}</p>
      ${paragraphsHtml}${bulletsHtml}${cta}${closingHtml}${support}
    </td></tr>
    <tr><td style="padding:20px 8px 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${footer}</td></tr>
  </table>
</td></tr></table>
</body></html>`;

  const text = [
    g,
    "",
    ...b.paragraphs,
    ...(b.bullets ? ["", ...b.bullets.map((x) => `• ${x}`)] : []),
    "",
    `${b.ctaLabel}: ${b.ctaUrl}`,
    ...(b.closing ? ["", b.closing] : []),
    "",
    "Need help?",
    "I'm Derek with Pool Rental Near Me. If you're stuck getting your pool listed, setting up payouts, or have any questions, contact me directly.",
    `Call or text Derek: ${phone}`,
    "Or just reply to this email.",
    "",
    `${BRAND.siteName}${v.postal_address ? ` · ${v.postal_address}` : ""}`,
    "You're receiving this because you created a host account on Pool Rental Near Me. These are one-time reminders about finishing your listing, not a newsletter.",
    `Unsubscribe from host reminders: ${v.unsubscribe_url}`,
  ].join("\n");

  return {
    subject: b.subject,
    preheader: b.preheader,
    html,
    text,
    ctaLabel: b.ctaLabel,
    ctaUrl: b.ctaUrl,
    productionReady: placeholders.length === 0,
    placeholders,
  };
}

export const TEMPLATE_KEYS: TemplateKey[] = [
  "no_listing_1", "no_listing_2", "incomplete_photos", "incomplete_info", "publish_1", "stripe_1", "stripe_2", "no_booking_1",
];

/** Sample variables for previews and tests. */
/** Copy for incomplete_info driven by the detector's missing pieces (photos are handled by incomplete_photos). */
export function incompleteInfoCopy(title: string, v: TemplateVars): { preheader: string; paragraphs: string[]; ctaLabel: string; ctaUrl: string | null } {
  const m = (v.missing_pieces ?? []).filter((p) => p !== "photos");
  const needsAddress = m.includes("address"); const needsPrice = m.includes("price"); const needsDetails = m.includes("title") || m.includes("description");
  const parts: string[] = [];
  if (needsAddress) parts.push("the pool's address");
  if (needsPrice) parts.push("an hourly price");
  if (needsDetails) parts.push(m.includes("title") ? "a title" : "a short description");
  const list = parts.length <= 1 ? (parts[0] ?? "a few required details") : parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
  const why = needsAddress && !needsPrice && !needsDetails
    ? "Guests search by location, so without an address your pool can't appear in results or be booked."
    : needsPrice && !needsAddress && !needsDetails
      ? "Guests need to see a price before they can request a booking. You can change it any time."
      : "Guests can't see or book a listing until these are filled in.";
  const ctaUrl = needsDetails ? v.completion_url : needsAddress ? v.location_url : needsPrice ? v.pricing_url : v.completion_url;
  const ctaLabel = needsDetails ? "Finish the details" : needsAddress ? "Add your address" : needsPrice ? "Set your price" : "Finish your listing";
  return {
    preheader: `${title} still needs ${list} before it can go live.`,
    paragraphs: [`${title} is saved as a draft, but it still needs ${list}, so it can't be published yet.`, why],
    ctaLabel,
    ctaUrl: ctaUrl ?? null,
  };
}

export function sampleVars(overrides: Partial<TemplateVars> = {}): TemplateVars {
  return {
    first_name: "Sarah",
    listing_title: "Backyard Saltwater Pool with Shade",
    listing_url: "https://www.poolrentalnearme.com/l/backyard-saltwater-pool-with-shade/00000000-0000-0000-0000-000000000000",
    completion_url: "https://www.poolrentalnearme.com/l/backyard-saltwater-pool-with-shade/00000000-0000-0000-0000-000000000000/draft/details",
    location_url: "https://www.poolrentalnearme.com/l/backyard-saltwater-pool-with-shade/00000000-0000-0000-0000-000000000000/draft/location",
    pricing_url: "https://www.poolrentalnearme.com/l/backyard-saltwater-pool-with-shade/00000000-0000-0000-0000-000000000000/draft/pricing",
    photos_url: "https://www.poolrentalnearme.com/l/backyard-saltwater-pool-with-shade/00000000-0000-0000-0000-000000000000/draft/photos",
    missing_pieces: ["address"],
    publish_url: "https://www.poolrentalnearme.com/l/backyard-saltwater-pool-with-shade/00000000-0000-0000-0000-000000000000/draft/photos",
    stripe_url: "https://www.poolrentalnearme.com/account/payments",
    wizard_url: "https://www.poolrentalnearme.com/wizard/",
    support_phone: null,
    support_email: "support@poolrentalnearme.com",
    unsubscribe_url: "https://www.poolrentalnearme.com/unsubscribe?token=sample",
    postal_address: null,
    ...overrides,
  };
}
