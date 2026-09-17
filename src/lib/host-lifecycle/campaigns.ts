/**
 * Host lifecycle campaigns: nudges tied to whatever is stopping the host from
 * getting live and earning. State overrides schedule — every campaign has an
 * explicit "still eligible?" check that runs again immediately before send.
 * Pure functions; unit-tested.
 */
import type { HostLifecycleRow, LifecycleState } from "./state";

export type CampaignKey =
  | "no_listing_1"
  | "no_listing_2"
  | "incomplete_photos"
  | "incomplete_info"
  | "publish_1"
  | "stripe_1"
  | "stripe_2"
  | "no_booking_1";

export type TemplateKey = CampaignKey;

export interface CampaignDef {
  key: CampaignKey;
  template: TemplateKey;
  group: "no_listing" | "incomplete" | "publish" | "stripe" | "no_booking";
  /** Human description shown in the admin view. */
  description: string;
  /** Minimum age of the relevant fact before the first email (hours). */
  minAgeHours: number;
  /** For follow-ups: key of the email that must have been sent first, and the gap after it (hours). */
  after?: { campaign: CampaignKey; hours: number };
}

export const HOURS = 3600_000;
export const DAY = 24 * HOURS;

export interface CampaignConfig {
  /** Provider accounts older than this are dormant leads, not onboarding; the no-listing campaign skips them. */
  noListingMaxAccountAgeDays: number;
  /** Days a published+Stripe listing must be live with zero bookings before the optimisation email. */
  noBookingMinDays: number;
}

export const DEFAULT_CAMPAIGN_CONFIG: CampaignConfig = {
  noListingMaxAccountAgeDays: 90,
  noBookingMinDays: 10,
};

export const CAMPAIGNS: CampaignDef[] = [
  { key: "no_listing_1", template: "no_listing_1", group: "no_listing", description: "Provider account, no listing, account ≥ 24 h old", minAgeHours: 24 },
  { key: "no_listing_2", template: "no_listing_2", group: "no_listing", description: "Still no listing ≥ 3 days after email 1", minAgeHours: 24, after: { campaign: "no_listing_1", hours: 72 } },
  { key: "incomplete_photos", template: "incomplete_photos", group: "incomplete", description: "Draft has address but no photos, ≥ 24 h in that state", minAgeHours: 24 },
  { key: "incomplete_info", template: "incomplete_info", group: "incomplete", description: "Draft missing address, price or description, ≥ 24 h in that state", minAgeHours: 24 },
  { key: "publish_1", template: "publish_1", group: "publish", description: "Draft is complete but not published, ≥ 24 h in that state", minAgeHours: 24 },
  { key: "stripe_1", template: "stripe_1", group: "stripe", description: "Published, Stripe not connected, ≥ 24 h in that state", minAgeHours: 24 },
  { key: "stripe_2", template: "stripe_2", group: "stripe", description: "Still no Stripe ≥ 3 days after email 1", minAgeHours: 24, after: { campaign: "stripe_1", hours: 72 } },
  { key: "no_booking_1", template: "no_booking_1", group: "no_booking", description: "Published + Stripe, zero bookings, live ≥ N days", minAgeHours: 24 },
];

export const CAMPAIGN_BY_KEY: Record<CampaignKey, CampaignDef> = Object.fromEntries(
  CAMPAIGNS.map((c) => [c.key, c]),
) as Record<CampaignKey, CampaignDef>;

/** The state(s) in which each campaign applies. Leaving the set = stop. */
export const CAMPAIGN_STATES: Record<CampaignKey, LifecycleState[]> = {
  no_listing_1: ["SIGNED_UP"],
  no_listing_2: ["SIGNED_UP"],
  incomplete_photos: ["ADDRESS_ADDED"],
  incomplete_info: ["LISTING_STARTED", "PHOTOS_ADDED"],
  publish_1: ["LISTING_READY"],
  stripe_1: ["PUBLISHED"],
  stripe_2: ["PUBLISHED"],
  no_booking_1: ["STRIPE_CONNECTED"],
};

/** What we already sent (or dry-ran) to a host, by campaign. */
export interface SentHistory {
  /** campaign → ISO time of the send (or dry-run record). */
  sent: Partial<Record<CampaignKey, string>>;
  /** ISO time of the most recent lifecycle email of any campaign, if any. */
  lastEmailAt: string | null;
}

export interface EligibilityInput {
  row: HostLifecycleRow;
  /** When the host entered its current lifecycle state (ISO). */
  stateEnteredAt: string;
  history: SentHistory;
  now: Date;
  config?: CampaignConfig;
}

export interface Eligibility {
  campaign: CampaignKey;
  eligible: boolean;
  reason: string;
}

/**
 * Structural check: does this campaign apply to the host's CURRENT state?
 * Used both at enqueue time and immediately before send (state overrides schedule).
 */
export function stillApplies(campaign: CampaignKey, row: HostLifecycleRow): { ok: boolean; reason: string } {
  if (row.deleted) return { ok: false, reason: "account deleted" };
  if (row.banned) return { ok: false, reason: "account banned" };
  const states = CAMPAIGN_STATES[campaign];
  if (!states.includes(row.lifecycle_state)) {
    return { ok: false, reason: `state is ${row.lifecycle_state}, campaign needs ${states.join("/")}` };
  }
  switch (campaign) {
    case "no_listing_1":
    case "no_listing_2":
      if (row.listing_id) return { ok: false, reason: "listing exists" };
      if (row.user_type !== "provider") return { ok: false, reason: "not a provider account" };
      return { ok: true, reason: "provider account with no listing" };
    case "incomplete_photos":
      if (row.photo_count > 0) return { ok: false, reason: "photos added" };
      if (!row.has_address) return { ok: false, reason: "address missing (info campaign applies)" };
      return { ok: true, reason: "draft has address, no photos" };
    case "incomplete_info":
      if (row.listing_ready) return { ok: false, reason: "listing complete" };
      if (row.has_address && row.photo_count === 0) return { ok: false, reason: "only photos missing (photos campaign applies)" };
      return { ok: true, reason: `draft missing ${row.missing.join(", ") || "required info"}` };
    case "publish_1":
      if (!row.listing_ready) return { ok: false, reason: "listing not complete" };
      if (row.listing_state === "published") return { ok: false, reason: "already published" };
      return { ok: true, reason: "complete draft, not published" };
    case "stripe_1":
    case "stripe_2":
      if (row.stripe_connected) return { ok: false, reason: "Stripe connected" };
      if (row.listing_state !== "published") return { ok: false, reason: "listing not published" };
      // A published listing missing its location/photos/price cannot be found or
      // booked, so a payout nudge is not actionable for that host yet.
      if (!row.listing_ready) return { ok: false, reason: `published but incomplete (${row.missing.join(", ") || "missing details"}); payout nudge not actionable` };
      return { ok: true, reason: "published and complete, Stripe not connected" };
    case "no_booking_1":
      if (row.booking_count > 0) return { ok: false, reason: "has a booking" };
      if (!row.stripe_connected) return { ok: false, reason: "Stripe not connected" };
      return { ok: true, reason: "published + Stripe, zero bookings" };
  }
}

/** Full eligibility, including timing, prerequisites and one-email-per-campaign. */
export function evaluateCampaign(campaign: CampaignKey, input: EligibilityInput): Eligibility {
  const { row, history, now } = input;
  const cfg = input.config ?? DEFAULT_CAMPAIGN_CONFIG;
  const def = CAMPAIGN_BY_KEY[campaign];
  const s = stillApplies(campaign, row);
  if (!s.ok) return { campaign, eligible: false, reason: s.reason };
  if (history.sent[campaign]) return { campaign, eligible: false, reason: "already sent" };
  if (!row.email_verified) return { campaign, eligible: false, reason: "email not verified" };

  const nowMs = now.getTime();
  if (def.after) {
    const prev = history.sent[def.after.campaign];
    if (!prev) return { campaign, eligible: false, reason: `waiting for ${def.after.campaign}` };
    const gap = nowMs - Date.parse(prev);
    if (gap < def.after.hours * HOURS) {
      return { campaign, eligible: false, reason: `only ${Math.floor(gap / HOURS)} h since ${def.after.campaign}, need ${def.after.hours} h` };
    }
  } else {
    // First email of a group: the relevant fact must be old enough.
    const anchor = campaign.startsWith("no_listing") ? row.st_created_at : input.stateEnteredAt;
    const age = nowMs - Date.parse(anchor);
    if (age < def.minAgeHours * HOURS) {
      return { campaign, eligible: false, reason: `only ${Math.floor(age / HOURS)} h in state, need ${def.minAgeHours} h` };
    }
  }

  if (campaign.startsWith("no_listing")) {
    const accountAgeDays = (nowMs - Date.parse(row.st_created_at)) / DAY;
    if (accountAgeDays > cfg.noListingMaxAccountAgeDays) {
      return { campaign, eligible: false, reason: `account ${Math.floor(accountAgeDays)} d old, over the ${cfg.noListingMaxAccountAgeDays} d onboarding window` };
    }
  }
  if (campaign === "no_booking_1") {
    const liveDays = (nowMs - Date.parse(input.stateEnteredAt)) / DAY;
    if (liveDays < cfg.noBookingMinDays) {
      return { campaign, eligible: false, reason: `live with Stripe for ${Math.floor(liveDays)} d, need ${cfg.noBookingMinDays} d` };
    }
  }
  return { campaign, eligible: true, reason: s.reason };
}

/** Every campaign the host qualifies for right now. At most one per group is ever returned. */
export function eligibleCampaigns(input: EligibilityInput): Eligibility[] {
  const out: Eligibility[] = [];
  const seenGroup = new Set<string>();
  for (const def of CAMPAIGNS) {
    const e = evaluateCampaign(def.key, input);
    if (e.eligible && !seenGroup.has(def.group)) {
      out.push(e);
      seenGroup.add(def.group);
    }
  }
  return out;
}

/** Diagnostic: every campaign with its reason, for the admin view and dry-run log. */
export function explainAll(input: EligibilityInput): Eligibility[] {
  return CAMPAIGNS.map((def) => evaluateCampaign(def.key, input));
}
