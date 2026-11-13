/**
 * Listing inquiry: the pure logic behind the "Ask about this pool" form on the
 * listing detail page.
 *
 * Everything with a side effect (the listing read, the Emailit send, the
 * clock, the logger, the rate-limit store) arrives through `InquiryDeps`, so
 * this module is tested with no network, no database and no real email. The
 * wiring lives in ./listing-inquiry.functions.ts.
 *
 * WHO GETS EMAILED. One address only: PRNM's own support inbox. Never the
 * guest (no auto-confirmation) and never the host. Outbound sends to real
 * users need Derek's explicit GO every time, host contact details are not in
 * the listing mirror, and at least one host is do-not-contact. Derek or Brandon
 * read the inquiry and forward or reply by hand.
 *
 * WHAT IS TRUSTED. Nothing the browser sends about the listing. The listing is
 * re-read server-side with readListing(id) and its title, city and id are what
 * go into the email. The guest's own fields are validated, length-capped and
 * stripped of control characters; any line break in a value that could reach
 * a mail header (name, email) is rejected, not repaired.
 *
 * INSURANCE. A message that mentions insurance, liability, coverage, claims,
 * damage or injury is flagged in the subject and the first line of the body as
 * Derek's to answer (CLAUDE.md rule 8). The visitor sees the same confirmation
 * as everyone else: nothing here, and nothing on screen, answers the question.
 */
import { z } from "zod";
import {
  EmailitError,
  type SendViaEmailitInput,
  type SendViaEmailitResult,
} from "@/lib/email/emailit";
import { canonicalListingUrl } from "@/lib/listing-url";
// Type-only: erased at runtime, so this module never loads the Sharetribe or
// Supabase clients. The real readListing is injected by the .functions file.
import type { ListingReadOutcome } from "./listing-read.server";
import type { ListingSummary } from "./sharetribe.server";

// ─────────────────────────────────────────────────────────────────────────────
// Addresses
// ─────────────────────────────────────────────────────────────────────────────

/** The only recipient this module will ever send to. */
export const INQUIRY_TO = "support@poolrentalnearme.com";

/**
 * CLAUDE.md rule 5: all email goes through Emailit from noreply@. The display
 * name matches SITE_NAME in the existing transactional route.
 */
export const INQUIRY_FROM = "Pool Rental Near Me <noreply@poolrentalnearme.com>";

export const INSURANCE_SUBJECT_PREFIX = "[Insurance question - Derek]";

// ─────────────────────────────────────────────────────────────────────────────
// Limits
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Field caps. The form in src/components/listing-inquiry-form.tsx mirrors
 * these for instant feedback, but this module is the authority.
 */
export const INQUIRY_LIMITS = {
  nameMax: 100,
  emailMax: 254,
  phoneMax: 40,
  messageMin: 10,
  messageMax: 2000,
  groupSizeMax: 100,
  /** How far ahead a preferred date may be, in days. */
  dateMaxDaysAhead: 730,
  /** Listing titles are host-written; cap what goes into a subject line. */
  subjectTitleMax: 150,
} as const;

const HOUR_MS = 60 * 60 * 1000;

/**
 * Per-IP, per-email and global caps, each over a sliding hour.
 *
 * The global cap is the backstop: the per-IP key comes from X-Forwarded-For,
 * which a client can set, and an email address costs nothing to change, so
 * only the global cap bounds how many emails this form can push into the
 * support inbox in an hour no matter who is sending.
 */
export const INQUIRY_RATE_LIMITS = {
  perIp: { limit: 5, windowMs: HOUR_MS },
  perEmail: { limit: 3, windowMs: HOUR_MS },
  global: { limit: 30, windowMs: HOUR_MS },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Text hygiene
// ─────────────────────────────────────────────────────────────────────────────

/** Any character a mail client or header parser may treat as a line break. */
const HEADER_LINE_BREAK = /[\r\n\u0085\u2028\u2029]/;

/**
 * C0 controls except tab and newline, DEL, the C1 block, and the Unicode
 * format characters that reorder or hide text (bidi overrides, zero-widths,
 * BOM). Stripped from every value.
 */
const STRIP_CHARS =
  // eslint-disable-next-line no-control-regex -- matching control characters is the point
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;

/** Strip control and format characters; keep newlines and tabs. */
export function stripControlChars(s: string): string {
  return s.replace(STRIP_CHARS, "");
}

/** True if `s` contains anything that could start a new mail header line. */
export function hasHeaderLineBreak(s: string): boolean {
  return HEADER_LINE_BREAK.test(s);
}

/** A single line of guest text: controls stripped, whitespace collapsed. */
function cleanSingleLine(s: string): string {
  return stripControlChars(s).replace(/\s+/g, " ").trim();
}

/**
 * Host-written or mirror-supplied text bound for a header (the listing title,
 * city, state). The guest cannot fix these, so they are repaired rather than
 * rejected: every line break and control character becomes a space.
 */
export function headerSafe(s: string | null | undefined, max = 200): string {
  if (!s) return "";
  const flat = String(s)
    .replace(/[\r\n\u0085\u2028\u2029\t]/g, " ")
    .replace(STRIP_CHARS, "")
    .replace(/\s+/g, " ")
    .trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

/** Message body: newlines normalised to \n, controls stripped, blank runs capped. */
function cleanMessage(s: string): string {
  return stripControlChars(s.replace(/\r\n?/g, "\n").replace(/[\u2028\u2029\u0085]/g, "\n"))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─────────────────────────────────────────────────────────────────────────────
// Insurance flag (CLAUDE.md rule 8)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Words that route an inquiry to Derek. Deliberately broad: a false positive
 * costs Derek one glance, a false negative means someone else answers a
 * coverage question. "covered" on its own is NOT matched ("covered patio" is
 * a pool amenity, not a coverage question); "coverage" is.
 */
const INSURANCE_TERMS =
  /\b(?:insur\w*|liabilit\w*|liable|coverage|claim(?:s|ed|ing)?|damag\w*|injur\w*)\b/i;

export function mentionsInsurance(text: string): boolean {
  return INSURANCE_TERMS.test(text);
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_RE = /^[0-9+().\-/\s]+(?:\s*(?:x|ext\.?)\s*\d{1,6})?$/i;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Defence in depth for reply_to: nothing that could split or quote an address list. */
const ADDRESS_UNSAFE = /[\s<>,;"\\]/;

/** Fields the form submits. Everything else in the payload is ignored. */
export type InquiryField =
  | "listingId"
  | "name"
  | "email"
  | "phone"
  | "preferredDate"
  | "groupSize"
  | "message";

/** Empty strings and null become "not given" for optional fields. */
function optionalField<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(
    (v) =>
      v === null || v === undefined || (typeof v === "string" && v.trim() === "") ? undefined : v,
    schema.optional(),
  );
}

function isoDayNumber(y: number, m: number, d: number): number | null {
  const t = Date.UTC(y, m - 1, d);
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== m - 1 || back.getUTCDate() !== d) {
    return null; // 2026-02-30 and friends
  }
  return Math.floor(t / 86_400_000);
}

/** Built per request because the date window depends on `now`. */
export function buildInquirySchema(now: number) {
  const L = INQUIRY_LIMITS;
  const today = Math.floor(now / 86_400_000);

  return z.object({
    listingId: z.string({ error: "Missing listing." }).trim().regex(UUID_RE, "Missing listing."),

    name: z
      .string({ error: "Please tell us your name." })
      .max(L.nameMax * 2, `Please keep your name under ${L.nameMax} characters.`)
      .refine((s) => !hasHeaderLineBreak(s), "Your name can't contain line breaks.")
      .transform(cleanSingleLine)
      .pipe(
        z
          .string()
          .min(1, "Please tell us your name.")
          .max(L.nameMax, `Please keep your name under ${L.nameMax} characters.`),
      ),

    email: z
      .string({ error: "Please enter your email address." })
      .max(L.emailMax * 2, "Please enter a valid email address.")
      .refine((s) => !hasHeaderLineBreak(s), "Your email address can't contain line breaks.")
      .transform((s) => stripControlChars(s).trim())
      .pipe(
        z
          .string()
          .min(1, "Please enter your email address.")
          .max(L.emailMax, "Please enter a valid email address.")
          .refine((s) => !ADDRESS_UNSAFE.test(s), "Please enter a valid email address.")
          .pipe(z.email("Please enter a valid email address.")),
      ),

    phone: optionalField(
      z
        .string()
        .max(L.phoneMax * 2, "That phone number looks too long.")
        .transform(cleanSingleLine)
        .pipe(
          z
            .string()
            .max(L.phoneMax, "That phone number looks too long.")
            .regex(PHONE_RE, "Please use digits, spaces, + ( ) - only.")
            .refine(
              (s) => (s.match(/\d/g) ?? []).length >= 5,
              "That phone number looks too short.",
            ),
        ),
    ),

    preferredDate: optionalField(
      z
        .string()
        .trim()
        .regex(ISO_DATE_RE, "Please pick a date.")
        .refine((s) => {
          const m = ISO_DATE_RE.exec(s);
          if (!m) return false;
          const day = isoDayNumber(Number(m[1]), Number(m[2]), Number(m[3]));
          // One day of slack behind UTC "today" so a visitor west of UTC can
          // still pick their own today in the evening.
          return day !== null && day >= today - 1 && day <= today + L.dateMaxDaysAhead;
        }, "Please pick a date from today onwards."),
    ),

    groupSize: optionalField(
      z
        .union([
          z.number(),
          z
            .string()
            .trim()
            .regex(/^\d{1,4}$/, `Please enter a number from 1 to ${L.groupSizeMax}.`)
            .transform(Number),
        ])
        .pipe(
          z
            .number()
            .int(`Please enter a number from 1 to ${L.groupSizeMax}.`)
            .min(1, `Please enter a number from 1 to ${L.groupSizeMax}.`)
            .max(L.groupSizeMax, `Please enter a number from 1 to ${L.groupSizeMax}.`),
        ),
    ),

    message: z
      .string({ error: "Please write your question." })
      .max(
        L.messageMax * 2,
        `Please keep your message under ${L.messageMax.toLocaleString("en-US")} characters.`,
      )
      .transform(cleanMessage)
      .pipe(
        z
          .string()
          .min(1, "Please write your question.")
          .min(
            L.messageMin,
            `Please add a little more detail (at least ${L.messageMin} characters).`,
          )
          .max(
            L.messageMax,
            `Please keep your message under ${L.messageMax.toLocaleString("en-US")} characters.`,
          ),
      ),
  });
}

export type ValidInquiry = z.output<ReturnType<typeof buildInquirySchema>>;

/**
 * The honeypot is a text input real visitors never see. Anything in it means a
 * bot filled every field; it is answered with the normal success shape so the
 * bot learns nothing, and nothing is read, counted or sent.
 */
export const HONEYPOT_FIELD = "hp_extra_notes";

function honeypotTripped(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const v = (raw as Record<string, unknown>)[HONEYPOT_FIELD];
  return typeof v === "string" ? v.trim() !== "" : v !== undefined && v !== null && v !== false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rate limiting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sliding-window counter, in process memory.
 *
 * In-memory is enough because fresh-web runs as ONE pm2 process on EAST: this
 * Map is the whole picture there, and it resets on restart (acceptable: a
 * restart buys a spammer one more hour of the same caps). It is NOT shared
 * across processes or Worker isolates; if this ever runs as several, move the
 * counters to a shared store. The repo had no rate-limit store to reuse.
 *
 * Memory is bounded: at most `maxKeys` keys; beyond that the least recently
 * hit keys are dropped (which only ever loosens their limit, and the global
 * counter has a single key so it is never evicted).
 */
export class SlidingWindowCounter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    readonly limit: number,
    readonly windowMs: number,
    private readonly maxKeys = 5_000,
  ) {}

  private live(key: string, now: number): number[] {
    const all = this.hits.get(key);
    if (!all) return [];
    const cutoff = now - this.windowMs;
    const kept = all.filter((t) => t > cutoff);
    if (kept.length === 0) this.hits.delete(key);
    else if (kept.length !== all.length) this.hits.set(key, kept);
    return kept;
  }

  /** Would one more hit stay within the limit? Does not record anything. */
  allows(key: string, now: number): boolean {
    return this.live(key, now).length < this.limit;
  }

  record(key: string, now: number): void {
    const kept = this.live(key, now);
    kept.push(now);
    // Re-insert so Map order is least-recently-hit first, for eviction.
    this.hits.delete(key);
    this.hits.set(key, kept);
    if (this.hits.size > this.maxKeys) {
      for (const k of this.hits.keys()) {
        if (this.hits.size <= this.maxKeys) break;
        this.hits.delete(k);
      }
    }
  }

  /** Number of keys currently tracked (for tests). */
  get size(): number {
    return this.hits.size;
  }
}

export interface InquiryRateLimiter {
  perIp: SlidingWindowCounter;
  perEmail: SlidingWindowCounter;
  global: SlidingWindowCounter;
}

export function createInquiryRateLimiter(
  limits: {
    [K in keyof typeof INQUIRY_RATE_LIMITS]: { limit: number; windowMs: number };
  } = INQUIRY_RATE_LIMITS,
): InquiryRateLimiter {
  return {
    perIp: new SlidingWindowCounter(limits.perIp.limit, limits.perIp.windowMs),
    perEmail: new SlidingWindowCounter(limits.perEmail.limit, limits.perEmail.windowMs),
    global: new SlidingWindowCounter(limits.global.limit, limits.global.windowMs, 1),
  };
}

const GLOBAL_KEY = "all";

/**
 * Rate-limit key for a client IP. IPv4 as-is; IPv6 by /64, because one
 * household or VPS routinely holds a whole /64 and rotating within it is
 * free. Returns null when there is no usable address, in which case the
 * per-IP limit is skipped and the per-email and global caps still apply
 * (bucketing every unknown caller together would let one bot lock out
 * everyone whose proxy hides their address).
 */
export function ipBucket(ip: string | null | undefined): string | null {
  if (!ip) return null;
  let s = ip.trim().toLowerCase();
  if (!s) return null;

  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(s);
  if (mapped) return mapped[1]!;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(s)) return s;

  if (s.includes(":")) {
    s = s.replace(/^\[|\]$/g, "").split("%")[0]!;
    const halves = s.split("::");
    if (halves.length <= 2) {
      const head = halves[0] ? halves[0].split(":") : [];
      const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
      const fill = halves.length === 2 ? 8 - head.length - tail.length : 0;
      const groups = fill >= 0 ? [...head, ...Array<string>(fill).fill("0"), ...tail] : [];
      if (groups.length === 8 && groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) {
        return `${groups
          .slice(0, 4)
          .map((g) => g.replace(/^0+(?=.)/, ""))
          .join(":")}::/64`;
      }
    }
  }
  // Unparseable but present: still a key, capped so it cannot bloat memory.
  return `raw:${s.slice(0, 64)}`;
}

/**
 * Rate-limit key for an email address: lower-cased, with any +tag dropped, so
 * a@x.com, A@x.com and a+1@x.com share one budget.
 */
export function emailBucket(email: string): string {
  const lower = email.trim().toLowerCase();
  const at = lower.lastIndexOf("@");
  if (at <= 0) return lower;
  const local = lower.slice(0, at).split("+")[0] || lower.slice(0, at);
  return `${local}${lower.slice(at)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Email
// ─────────────────────────────────────────────────────────────────────────────

export interface InquiryEmail {
  subject: string;
  html: string;
  text: string;
  insuranceFlag: boolean;
}

const INSURANCE_FIRST_LINE =
  "INSURANCE QUESTION: this message mentions insurance, liability, coverage, a claim, damage or injury. " +
  "It must be answered by Derek. Please do not answer it from the support inbox.";

const FOOTER_LINE =
  "The guest has not been emailed and the host has not been contacted. " +
  "Replying to this email goes to the guest. If you forward it to a host, check the do-not-contact list first.";

function formatDate(iso: string | undefined): string {
  if (!iso) return "not given";
  const m = ISO_DATE_RE.exec(iso);
  if (!m) return iso;
  const weekday = new Date(
    Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])),
  ).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  return `${iso} (${weekday})`;
}

/**
 * Build the support-inbox email. `listing` must be the server's own read;
 * nothing about the listing comes from the browser.
 */
export function buildInquiryEmail(
  inquiry: ValidInquiry,
  listing: ListingSummary,
  siteUrl: string,
): InquiryEmail {
  const insuranceFlag = mentionsInsurance(inquiry.message);

  const title = headerSafe(listing.title, INQUIRY_LIMITS.subjectTitleMax) || "Untitled listing";
  const loc = [headerSafe(listing.city, 80), headerSafe(listing.state, 40)]
    .filter(Boolean)
    .join(", ");
  const baseSubject = `Pool inquiry: ${title}${loc ? ` (${loc})` : ""}`;
  const subject = insuranceFlag ? `${INSURANCE_SUBJECT_PREFIX} ${baseSubject}` : baseSubject;

  const listingUrl = canonicalListingUrl(listing.id, siteUrl);

  const rows: Array<[string, string]> = [
    ["Listing", headerSafe(listing.title, 300) || "Untitled listing"],
    ["Location", loc || "not given"],
    ["Listing ID", listing.id],
    ["Listing URL", listingUrl],
    ["Guest name", inquiry.name],
    ["Guest email", inquiry.email],
    ["Phone", inquiry.phone ?? "not given"],
    ["Preferred date", formatDate(inquiry.preferredDate)],
    ["Group size", inquiry.groupSize !== undefined ? String(inquiry.groupSize) : "not given"],
  ];

  const textLines: string[] = [];
  if (insuranceFlag) textLines.push(INSURANCE_FIRST_LINE, "");
  textLines.push("New inquiry from the listing page inquiry form.", "");
  for (const [k, v] of rows) textLines.push(`${k}: ${v}`);
  textLines.push("", "Message:", inquiry.message, "", "--", FOOTER_LINE);
  const text = textLines.join("\n");

  const cell = "padding:4px 12px 4px 0;vertical-align:top;";
  const htmlRows = rows
    .map(([k, v]) => {
      const value =
        k === "Listing URL"
          ? `<a href="${escapeHtml(v)}">${escapeHtml(v)}</a>`
          : k === "Guest email"
            ? `<a href="mailto:${escapeHtml(v)}">${escapeHtml(v)}</a>`
            : escapeHtml(v);
      return `<tr><td style="${cell}color:#64748b;white-space:nowrap;">${escapeHtml(k)}</td><td style="${cell}">${value}</td></tr>`;
    })
    .join("");

  const html = [
    `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;padding:20px;">`,
    insuranceFlag
      ? `<p style="margin:0 0 16px;padding:10px 12px;border:2px solid #b91c1c;color:#b91c1c;font-weight:700;">${escapeHtml(INSURANCE_FIRST_LINE)}</p>`
      : "",
    `<p style="margin:0 0 12px;color:#475569;">New inquiry from the listing page inquiry form.</p>`,
    `<table style="border-collapse:collapse;font-size:14px;margin:0 0 16px;">${htmlRows}</table>`,
    `<p style="margin:0 0 4px;font-weight:600;">Message</p>`,
    `<div style="white-space:pre-wrap;border-left:3px solid #cbd5e1;padding:4px 0 4px 12px;margin:0 0 20px;">${escapeHtml(inquiry.message)}</div>`,
    `<p style="margin:0;color:#64748b;font-size:12px;">${escapeHtml(FOOTER_LINE)}</p>`,
    `</body></html>`,
  ].join("");

  return { subject, html, text, insuranceFlag };
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export type InquiryResult =
  | { ok: true }
  | {
      ok: false;
      reason: "invalid";
      message: string;
      fieldErrors: Partial<Record<InquiryField, string>>;
    }
  | {
      ok: false;
      /**
       * rate_limited        a cap was hit; nothing read or sent
       * listing_not_found   no published listing with that id
       * listing_unavailable the listing read itself failed (mirror down)
       * unavailable         email is not configured, or Emailit refused it
       */
      reason: "rate_limited" | "listing_not_found" | "listing_unavailable" | "unavailable";
      message: string;
    };

export interface InquiryLogger {
  info: (line: string) => void;
  warn: (line: string) => void;
  error: (line: string) => void;
}

export interface InquiryDeps {
  readListing: (id: string) => Promise<ListingReadOutcome<ListingSummary | null>>;
  /** The real one is sendViaEmailit; tests pass it too, with fetch mocked. */
  send: (input: SendViaEmailitInput) => Promise<SendViaEmailitResult>;
  env: { EMAILIT_API_KEY?: string | undefined };
  now: () => number;
  limiter: InquiryRateLimiter;
  log: InquiryLogger;
  /** Base for the canonical listing URL in the email body. */
  siteUrl: string;
}

export interface InquiryContext {
  /** Client IP as the request layer resolved it; null when unknown. */
  ip: string | null;
}

const VISITOR_MESSAGES = {
  invalid: "Please check the highlighted fields.",
  rate_limited:
    "We can't take another message from this form right now. Please try again later, or email us instead.",
  listing_not_found: "We couldn't find this pool. It may have been taken down.",
  listing_unavailable: "We can't send messages about this pool right now. Please email us instead.",
  unavailable: "Your message couldn't be sent just now. Please email us instead.",
} as const;

export async function handleListingInquiry(
  raw: unknown,
  ctx: InquiryContext,
  deps: InquiryDeps,
): Promise<InquiryResult> {
  // 1. Honeypot first, before validation, so a bot never learns which of its
  //    values were wrong. Nothing is read, counted or sent.
  if (honeypotTripped(raw)) {
    deps.log.info("[listing-inquiry] honeypot filled; answered success, nothing sent");
    return { ok: true };
  }

  // 2. Validate everything. The browser's own checks are a convenience only.
  const now = deps.now();
  const parsed = buildInquirySchema(now).safeParse(raw ?? {});
  if (!parsed.success) {
    const fieldErrors: Partial<Record<InquiryField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in fieldErrors)) {
        fieldErrors[field as InquiryField] = issue.message;
      }
    }
    return { ok: false, reason: "invalid", message: VISITOR_MESSAGES.invalid, fieldErrors };
  }
  const inquiry = parsed.data;

  // 3. No key, no point reading the listing or spending anyone's quota.
  if (!deps.env.EMAILIT_API_KEY) {
    deps.log.error(
      `[listing-inquiry] NOT SENT listing=${inquiry.listingId} reason=missing_api_key ` +
        "(EMAILIT_API_KEY is not set); visitor shown the email-us fallback",
    );
    return { ok: false, reason: "unavailable", message: VISITOR_MESSAGES.unavailable };
  }

  // 4. Caps. Checked together up front so a capped request costs no read.
  const ipKey = ipBucket(ctx.ip);
  const emailKey = emailBucket(inquiry.email);
  const { perIp, perEmail, global } = deps.limiter;
  const blockedBy =
    ipKey !== null && !perIp.allows(ipKey, now)
      ? "per-ip"
      : !perEmail.allows(emailKey, now)
        ? "per-email"
        : !global.allows(GLOBAL_KEY, now)
          ? "global"
          : null;
  if (blockedBy) {
    deps.log.warn(
      `[listing-inquiry] NOT SENT listing=${inquiry.listingId} reason=rate_limited limiter=${blockedBy}`,
    );
    return { ok: false, reason: "rate_limited", message: VISITOR_MESSAGES.rate_limited };
  }
  // Every validated submission counts against its IP, including ones for a
  // listing that turns out not to exist, so the form cannot be used to probe
  // ids for free.
  if (ipKey !== null) perIp.record(ipKey, now);

  // 5. The server's own read of the listing. Client-sent listing data is never used.
  let outcome: ListingReadOutcome<ListingSummary | null>;
  try {
    outcome = await deps.readListing(inquiry.listingId);
  } catch {
    deps.log.error(
      `[listing-inquiry] NOT SENT listing=${inquiry.listingId} reason=listing_read_threw`,
    );
    return {
      ok: false,
      reason: "listing_unavailable",
      message: VISITOR_MESSAGES.listing_unavailable,
    };
  }
  if (outcome.servedBy === "unserviceable") {
    // mirror-only and the mirror query failed: a 500-shaped problem, not a 404.
    deps.log.error(
      `[listing-inquiry] NOT SENT listing=${inquiry.listingId} reason=listing_unserviceable source=${outcome.source}`,
    );
    return {
      ok: false,
      reason: "listing_unavailable",
      message: VISITOR_MESSAGES.listing_unavailable,
    };
  }
  const listing = outcome.result;
  if (!listing) {
    return { ok: false, reason: "listing_not_found", message: VISITOR_MESSAGES.listing_not_found };
  }

  // 6. Re-check the email and global caps: other requests may have spent them
  //    while this one awaited the listing read. Nothing awaits between this
  //    check and the record below, so the caps hold exactly under concurrency.
  const sendAt = deps.now();
  if (!perEmail.allows(emailKey, sendAt) || !global.allows(GLOBAL_KEY, sendAt)) {
    deps.log.warn(
      `[listing-inquiry] NOT SENT listing=${listing.id} reason=rate_limited limiter=recheck`,
    );
    return { ok: false, reason: "rate_limited", message: VISITOR_MESSAGES.rate_limited };
  }

  // 7. Build and send. The send attempt is what spends the email and global
  //    budgets, whether or not Emailit accepts it: a retry storm against a
  //    failing provider is still a storm.
  const email = buildInquiryEmail(inquiry, listing, deps.siteUrl);
  perEmail.record(emailKey, sendAt);
  global.record(GLOBAL_KEY, sendAt);

  try {
    await deps.send({
      from: INQUIRY_FROM,
      to: INQUIRY_TO,
      replyTo: inquiry.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  } catch (err) {
    // One line, no guest message, no guest address, and not err.message:
    // EmailitError's message embeds the provider's response body.
    const status = err instanceof EmailitError ? err.status : "n/a";
    const kind = err instanceof EmailitError ? "emailit_error" : "send_threw";
    deps.log.error(
      `[listing-inquiry] NOT SENT listing=${listing.id} reason=${kind} status=${status}; ` +
        "visitor shown the email-us fallback",
    );
    return { ok: false, reason: "unavailable", message: VISITOR_MESSAGES.unavailable };
  }

  deps.log.info(
    `[listing-inquiry] sent to support inbox listing=${listing.id} insurance_flag=${email.insuranceFlag ? "yes" : "no"}`,
  );
  return { ok: true };
}
