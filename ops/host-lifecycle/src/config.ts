/**
 * Runtime configuration for the host lifecycle engine. Read fresh on every
 * run from the process environment (`node --env-file=.env`), so a change to
 * EAST's .env takes effect on the next tick with no restart.
 *
 *   HOST_LIFECYCLE_EMAILS_ENABLED  master kill switch; anything but "true" = no external email
 *   HOST_EMAIL_MODE                dry_run | allowlist | production   (default dry_run)
 *   HOST_EMAIL_ALLOWLIST           comma-separated recipients allowed in allowlist mode
 *   HOST_LIFECYCLE_DAILY_CAP       system-wide real sends per UTC day (default 25)
 *   HOST_LIFECYCLE_USER_GAP_HOURS  minimum hours between lifecycle emails to one host (default 24)
 *   HOST_LIFECYCLE_SUPPORT_PHONE   Derek's verified support number; unset = placeholder, not production-ready
 *   HOST_LIFECYCLE_FROM            sender, default "Pool Rental Near Me <support@poolrentalnearme.com>"
 *   HOST_LIFECYCLE_REPLY_TO        default support@poolrentalnearme.com
 *   HOST_LIFECYCLE_POSTAL_ADDRESS  optional footer address
 *   HOST_LIFECYCLE_NO_LISTING_MAX_DAYS / HOST_LIFECYCLE_NO_BOOKING_MIN_DAYS  campaign knobs
 *   SITE_ORIGIN                    default https://www.poolrentalnearme.com
 */
import { DEFAULT_CAMPAIGN_CONFIG, type CampaignConfig } from "../../../src/lib/host-lifecycle/campaigns";
import { SITE_ORIGIN_DEFAULT } from "../../../src/lib/host-lifecycle/urls";

export type Mode = "dry_run" | "allowlist" | "production";

export interface EngineConfig {
  enabled: boolean;
  mode: Mode;
  allowlist: string[];
  dailyCap: number;
  userGapHours: number;
  supportPhone: string | null;
  from: string;
  replyTo: string;
  postalAddress: string | null;
  origin: string;
  campaigns: CampaignConfig;
  emailitApiKey: string | null;
  supabaseUrl: string | null;
  supabaseServiceRoleKey: string | null;
  sharetribeClientId: string | null;
  sharetribeClientSecret: string | null;
}

function num(v: string | undefined, d: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : d;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): EngineConfig {
  const modeRaw = (env.HOST_EMAIL_MODE ?? "dry_run").trim().toLowerCase();
  const mode: Mode = modeRaw === "production" ? "production" : modeRaw === "allowlist" ? "allowlist" : "dry_run";
  return {
    enabled: (env.HOST_LIFECYCLE_EMAILS_ENABLED ?? "false").trim().toLowerCase() === "true",
    mode,
    allowlist: (env.HOST_EMAIL_ALLOWLIST ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
    dailyCap: num(env.HOST_LIFECYCLE_DAILY_CAP, 25),
    userGapHours: num(env.HOST_LIFECYCLE_USER_GAP_HOURS, 24),
    supportPhone: env.HOST_LIFECYCLE_SUPPORT_PHONE?.trim() || null,
    from: env.HOST_LIFECYCLE_FROM?.trim() || "Pool Rental Near Me <support@poolrentalnearme.com>",
    replyTo: env.HOST_LIFECYCLE_REPLY_TO?.trim() || "support@poolrentalnearme.com",
    postalAddress: env.HOST_LIFECYCLE_POSTAL_ADDRESS?.trim() || null,
    origin: env.SITE_ORIGIN?.trim() || SITE_ORIGIN_DEFAULT,
    campaigns: {
      noListingMaxAccountAgeDays: num(env.HOST_LIFECYCLE_NO_LISTING_MAX_DAYS, DEFAULT_CAMPAIGN_CONFIG.noListingMaxAccountAgeDays),
      noBookingMinDays: num(env.HOST_LIFECYCLE_NO_BOOKING_MIN_DAYS, DEFAULT_CAMPAIGN_CONFIG.noBookingMinDays),
    },
    emailitApiKey: env.EMAILIT_API_KEY ?? null,
    supabaseUrl: env.SUPABASE_URL ?? null,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY ?? null,
    sharetribeClientId: env.SHARETRIBE_INTEG_CLIENT_ID ?? null,
    sharetribeClientSecret: env.SHARETRIBE_INTEG_CLIENT_SECRET ?? null,
  };
}

/** The single decision that separates "record" from "send". Pure; unit-tested. */
export type SendDecision =
  | { kind: "send"; to: string }
  | { kind: "record_only"; reason: string };

export function decideDelivery(cfg: Pick<EngineConfig, "enabled" | "mode" | "allowlist">, recipient: string): SendDecision {
  if (!cfg.enabled) return { kind: "record_only", reason: "kill switch: HOST_LIFECYCLE_EMAILS_ENABLED is not true" };
  if (cfg.mode === "dry_run") return { kind: "record_only", reason: "mode dry_run" };
  if (cfg.mode === "allowlist") {
    if (cfg.allowlist.includes(recipient.toLowerCase())) return { kind: "send", to: recipient };
    return { kind: "record_only", reason: "mode allowlist: recipient not allowlisted" };
  }
  return { kind: "send", to: recipient };
}
