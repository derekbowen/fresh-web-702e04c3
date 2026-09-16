/**
 * Send phase. Order of gates, every one re-checked per job immediately before
 * the provider call:
 *   lease (SKIP LOCKED) → host still in state (state overrides schedule)
 *   → suppression (bounce/complaint/unsubscribe/pause) → per-user gap
 *   → system daily cap → kill switch + mode → CTA URL check → Emailit.
 * dry_run and allowlist record the exact email they would have sent.
 */
import { stillApplies, type CampaignKey } from "../../../src/lib/host-lifecycle/campaigns";
import { safeFirstName } from "../../../src/lib/host-lifecycle/state";
import { renderTemplate, type TemplateVars } from "../../../src/lib/host-lifecycle/templates";
import { listingUrls, oneClickUnsubscribeUrl, stripeUrl, unsubscribeUrl, wizardUrl } from "../../../src/lib/host-lifecycle/urls";
import { decideDelivery, type EngineConfig } from "./config";
import type { Db } from "./db";
import type { StateRow } from "./queue";

export interface SendStats {
  leased: number; sent: number; recorded: number; suppressed: number; cancelled: number; failed: number; capped: number;
  byOutcome: Record<string, number>;
}

export interface Suppression { suppressed: boolean; reason: string }

export async function checkSuppression(db: Db, userId: string, email: string): Promise<Suppression> {
  const e = email.toLowerCase();
  const [sup, tok, sub, comp] = await Promise.all([
    db.from("suppressed_emails").select("reason").ilike("email", e).limit(1),
    db.from("email_unsubscribe_tokens").select("used_at").ilike("email", e).not("used_at", "is", null).limit(1),
    db.from("host_subscribers").select("status, intercom_paused_at").or(`st_user_id.eq.${userId.replace(/[^0-9a-f-]/gi, "")},email.ilike.${e.replace(/[,()]/g, "")}`).limit(5),
    db.from("composer_unsubscribes").select("id").ilike("email", e).limit(1),
  ]);
  if (sup.data && sup.data.length > 0) return { suppressed: true, reason: `suppressed_emails:${sup.data[0].reason}` };
  if (tok.data && tok.data.length > 0) return { suppressed: true, reason: "unsubscribed (email_unsubscribe_tokens)" };
  if (comp.data && comp.data.length > 0) return { suppressed: true, reason: "unsubscribed (composer_unsubscribes)" };
  for (const s of sub.data ?? []) {
    if (s.status === "unsubscribed" || s.status === "paused" || s.status === "excluded") return { suppressed: true, reason: `host_subscribers:${s.status}` };
    if (s.intercom_paused_at) return { suppressed: true, reason: "intercom conversation open (host_subscribers.intercom_paused_at)" };
  }
  return { suppressed: false, reason: "" };
}

export async function getOrCreateUnsubToken(db: Db, email: string): Promise<string> {
  const e = email.toLowerCase();
  const { data } = await db.from("email_unsubscribe_tokens").select("token, used_at").ilike("email", e).maybeSingle();
  if (data?.token) return data.token as string;
  const token = cryptoRandom();
  await db.from("email_unsubscribe_tokens").upsert({ token, email: e }, { onConflict: "email", ignoreDuplicates: true });
  const { data: again } = await db.from("email_unsubscribe_tokens").select("token").ilike("email", e).maybeSingle();
  return (again?.token as string) ?? token;
}

function cryptoRandom(): string {
  const bytes = new Uint8Array(24); crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sentTodayCount(db: Db, now: Date): Promise<number> {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  const { count } = await db.from("communication_jobs").select("id", { count: "exact", head: true }).eq("status", "sent").gte("sent_at", start);
  return count ?? 0;
}

export async function lastEmailToUser(db: Db, userId: string): Promise<string | null> {
  const { data } = await db.from("communication_jobs").select("sent_at, updated_at, status").eq("user_id", userId).in("status", ["sent", "dry_run"]).order("updated_at", { ascending: false }).limit(1);
  const j = data?.[0]; if (!j) return null;
  return (j.sent_at ?? j.updated_at) as string;
}

export async function checkUrl(url: string): Promise<{ ok: boolean; status: number }> {
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (compatible; PRNM-lifecycle-url-check)", Accept: "text/html" } });
    return { ok: res.status >= 200 && res.status < 400, status: res.status };
  } catch { return { ok: false, status: 0 }; }
}

export interface EmailitLike { send(input: { from: string; to: string; subject: string; html: string; text: string; replyTo: string; headers: Record<string, string> }): Promise<{ id: string }> }

export class EmailitClient implements EmailitLike {
  constructor(private apiKey: string) {}
  async send(input: { from: string; to: string; subject: string; html: string; text: string; replyTo: string; headers: Record<string, string> }): Promise<{ id: string }> {
    const res = await fetch("https://api.emailit.com/v2/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ from: input.from, to: input.to, subject: input.subject, html: input.html, text: input.text, reply_to: input.replyTo, headers: input.headers }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Emailit ${res.status}: ${text.slice(0, 200)}`);
    try { return { id: JSON.parse(text)?.id ?? "" }; } catch { return { id: "" }; }
  }
}

export function buildVars(cfg: EngineConfig, row: StateRow, unsubToken: string): TemplateVars {
  const urls = listingUrls(cfg.origin, row.listing_id ? { id: row.listing_id, title: row.listing_title, state: row.listing_state } : null);
  return {
    first_name: safeFirstName(row.first_name),
    listing_title: row.listing_title,
    ...urls,
    stripe_url: stripeUrl(cfg.origin),
    wizard_url: wizardUrl(cfg.origin),
    support_phone: cfg.supportPhone,
    support_email: cfg.replyTo,
    unsubscribe_url: unsubscribeUrl(cfg.origin, unsubToken),
    postal_address: cfg.postalAddress,
  };
}

export async function sendDue(db: Db, cfg: EngineConfig, emailit: EmailitLike | null, worker: string, now = new Date(), limit = 20): Promise<SendStats> {
  const stats: SendStats = { leased: 0, sent: 0, recorded: 0, suppressed: 0, cancelled: 0, failed: 0, capped: 0, byOutcome: {} };
  const bump = (k: string) => { stats.byOutcome[k] = (stats.byOutcome[k] ?? 0) + 1; };
  const { data: leased, error } = await db.rpc("lease_communication_jobs", { p_limit: limit, p_worker: worker });
  if (error) throw new Error(`lease: ${error.message}`);
  let sentToday = await sentTodayCount(db, now);
  const urlCache = new Map<string, { ok: boolean; status: number }>();

  for (const job of (leased ?? []) as Array<Record<string, any>>) {
    stats.leased++;
    const finish = async (patch: Record<string, unknown>) => {
      await db.from("communication_jobs").update({ ...patch, updated_at: new Date().toISOString(), mode: cfg.mode }).eq("id", job.id);
    };
    try {
      // 1. Re-read the host's CURRENT state (sync must be fresh).
      const { data: row } = await db.from("host_lifecycle_state").select("*").eq("user_id", job.user_id).maybeSingle();
      const r = row as StateRow | null;
      if (!r) { await finish({ status: "cancelled", suppressed_at: now.toISOString(), suppressed_reason: "host not in lifecycle table" }); stats.cancelled++; bump("cancelled:no_host"); continue; }
      if (Date.now() - Date.parse(r.last_synced_at) > 3 * 3600_000) { await finish({ status: "queued", last_error: "sync older than 3 h; not sending on stale state" }); bump("deferred:stale_sync"); continue; }
      const verdict = stillApplies(job.campaign_key as CampaignKey, r);
      if (!verdict.ok) { await finish({ status: "cancelled", suppressed_at: now.toISOString(), suppressed_reason: `state changed: ${verdict.reason}` }); stats.cancelled++; bump("cancelled:state_changed"); continue; }
      // 2. Suppression.
      const sup = await checkSuppression(db, r.user_id, r.email);
      if (sup.suppressed) { await finish({ status: "suppressed", suppressed_at: now.toISOString(), suppressed_reason: sup.reason }); stats.suppressed++; bump(`suppressed:${sup.reason.split(":")[0]}`); continue; }
      if (!r.email_verified) { await finish({ status: "suppressed", suppressed_at: now.toISOString(), suppressed_reason: "email not verified" }); stats.suppressed++; bump("suppressed:unverified"); continue; }
      // 3. Per-user gap.
      const last = await lastEmailToUser(db, r.user_id);
      if (last && now.getTime() - Date.parse(last) < cfg.userGapHours * 3600_000) {
        const next = new Date(Date.parse(last) + cfg.userGapHours * 3600_000).toISOString();
        await finish({ status: "queued", scheduled_at: next, last_error: `per-user gap: last lifecycle email ${last}` }); bump("deferred:user_gap"); continue;
      }
      // 4. Render.
      const token = await getOrCreateUnsubToken(db, r.email);
      const vars = buildVars(cfg, r, token);
      const rendered = renderTemplate(job.template_key, vars);
      // 5. Decide delivery (kill switch + mode + allowlist).
      const decision = decideDelivery(cfg, r.email);
      const base = { subject: rendered.subject, cta_url: rendered.ctaUrl, rendered_html: rendered.html };
      if (decision.kind === "record_only") {
        await finish({ ...base, status: "dry_run", sent_at: null, last_error: null, suppressed_reason: decision.reason });
        stats.recorded++; bump(`recorded:${cfg.mode}`); continue;
      }
      // 6. Production-readiness + cap + URL check only when a real send is about to happen.
      if (!rendered.productionReady) { await finish({ ...base, status: "queued", last_error: `not production-ready: placeholders ${rendered.placeholders.join(",")}` }); stats.failed++; bump("blocked:placeholder"); continue; }
      if (sentToday >= cfg.dailyCap) { await finish({ ...base, status: "queued", scheduled_at: new Date(now.getTime() + 6 * 3600_000).toISOString(), last_error: `daily cap ${cfg.dailyCap} reached` }); stats.capped++; bump("deferred:daily_cap"); continue; }
      let u = urlCache.get(rendered.ctaUrl); if (!u) { u = await checkUrl(rendered.ctaUrl); urlCache.set(rendered.ctaUrl, u); }
      if (!u.ok) { await finish({ ...base, status: "queued", last_error: `CTA URL check failed (${u.status}) ${rendered.ctaUrl}` }); stats.failed++; bump("blocked:cta_url"); continue; }
      if (!emailit) throw new Error("Emailit client not configured");
      // 7. Final kill-switch read, immediately before the provider call.
      if (!cfg.enabled) { await finish({ ...base, status: "dry_run", suppressed_reason: "kill switch" }); stats.recorded++; bump("recorded:kill_switch"); continue; }
      const res = await emailit.send({
        from: cfg.from, to: decision.to, subject: rendered.subject, html: rendered.html, text: rendered.text, replyTo: cfg.replyTo,
        headers: { "List-Unsubscribe": `<${oneClickUnsubscribeUrl(cfg.origin, token)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click", "X-PRNM-Campaign": job.campaign_key },
      });
      sentToday++;
      await finish({ ...base, status: "sent", sent_at: new Date().toISOString(), provider_message_id: res.id, last_error: null });
      stats.sent++; bump("sent");
    } catch (err) {
      const msg = String((err as Error).message ?? err).slice(0, 500);
      const retry = (job.attempt_count ?? 1) < 3;
      await finish({ status: retry ? "queued" : "failed", scheduled_at: new Date(now.getTime() + 30 * 60_000).toISOString(), last_error: msg });
      stats.failed++; bump(retry ? "retry" : "failed");
    }
  }
  return stats;
}
