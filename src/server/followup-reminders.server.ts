/**
 * Follow-up reminder engine.
 *
 * Finds lead_followups that are due (next_action_at <= now) and still in an
 * actionable status, groups them by owner_id, and sends a digest email
 * (and optional SMS) to each owner — respecting per-owner channel toggles
 * and a min interval to avoid notification spam.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendViaEmailit } from "@/lib/email/emailit";
import { sendSms, isOptedOut } from "@/server/sms.server";

const ACTIVE_STATUSES = ["new", "attempting", "connected", "no_response"] as const;

type DueRow = {
  id: string;
  source: string;
  lead_id: string;
  status: string;
  next_action_at: string;
  owner_id: string | null;
  notes: string | null;
};

type Settings = {
  owner_id: string;
  email: string | null;
  phone_e164: string | null;
  email_enabled: boolean;
  sms_enabled: boolean;
  min_interval_minutes: number;
  paused: boolean;
  last_notified_at: string | null;
};

const FROM_EMAIL = "alerts@poolrentalnearme.com";
const FROM_NAME = "PRNM Follow-ups";
const APP_BASE = "https://www.poolrentalnearme.com";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function fmtRelative(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diffMin = Math.round((now - t) / 60000);
  if (diffMin < 60) return `${diffMin}m overdue`;
  const h = Math.round(diffMin / 60);
  if (h < 48) return `${h}h overdue`;
  return `${Math.round(h / 24)}d overdue`;
}

async function logAttempt(row: {
  owner_id: string | null;
  channel: string;
  due_count: number;
  status: string;
  error?: string | null;
  recipient?: string | null;
}) {
  await supabaseAdmin.from("followup_reminder_log" as any).insert(row);
}

export async function processFollowupReminders(): Promise<{
  ownersChecked: number;
  emailsSent: number;
  smsSent: number;
  errors: number;
}> {
  const nowIso = new Date().toISOString();

  // 1. Pull all active, due follow-ups with an owner.
  const { data: due, error } = await supabaseAdmin
    .from("lead_followups")
    .select("id, source, lead_id, status, next_action_at, owner_id, notes")
    .in("status", ACTIVE_STATUSES as any)
    .lte("next_action_at", nowIso)
    .not("owner_id", "is", null)
    .order("next_action_at", { ascending: true })
    .limit(2000);

  if (error) throw new Error(error.message);

  const rows: DueRow[] = (due ?? []) as any;
  if (rows.length === 0) {
    return { ownersChecked: 0, emailsSent: 0, smsSent: 0, errors: 0 };
  }

  // Group by owner.
  const byOwner = new Map<string, DueRow[]>();
  for (const r of rows) {
    if (!r.owner_id) continue;
    const arr = byOwner.get(r.owner_id) ?? [];
    arr.push(r);
    byOwner.set(r.owner_id, arr);
  }

  const ownerIds = [...byOwner.keys()];

  // 2. Load settings for those owners.
  const { data: settingsRows } = await supabaseAdmin
    .from("followup_reminder_settings" as any)
    .select("*")
    .in("owner_id", ownerIds);

  const settingsByOwner = new Map<string, Settings>();
  for (const s of (settingsRows ?? []) as any[]) settingsByOwner.set(s.owner_id, s);

  let emailsSent = 0;
  let smsSent = 0;
  let errors = 0;

  for (const [ownerId, items] of byOwner) {
    const s = settingsByOwner.get(ownerId);
    if (!s) {
      // No settings row = owner hasn't opted in; skip silently.
      continue;
    }
    if (s.paused) continue;

    // Throttle by min interval.
    if (s.last_notified_at) {
      const last = new Date(s.last_notified_at).getTime();
      const elapsedMin = (Date.now() - last) / 60000;
      if (elapsedMin < s.min_interval_minutes) continue;
    }

    const count = items.length;
    const subject = `${count} follow-up${count === 1 ? "" : "s"} due now`;
    const lines = items.slice(0, 25).map((r) => {
      const adminUrl = `${APP_BASE}/admin/follow-ups`;
      return `<li><a href="${adminUrl}">${escapeHtml(r.source)} · ${escapeHtml(r.lead_id.slice(0, 8))}</a> — ${escapeHtml(r.status)} · ${escapeHtml(fmtRelative(r.next_action_at))}</li>`;
    });
    const moreNote =
      items.length > 25 ? `<p style="color:#64748b;font-size:13px;">…and ${items.length - 25} more.</p>` : "";

    const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#fff;color:#0f172a;padding:20px;">
<h2 style="margin:0 0 12px;">${count} follow-up${count === 1 ? "" : "s"} need attention</h2>
<p style="color:#475569;margin:0 0 16px;">Each item is past its scheduled next-action time.</p>
<ul style="padding-left:18px;line-height:1.6;">${lines.join("")}</ul>
${moreNote}
<p style="margin-top:24px;"><a href="${APP_BASE}/admin/follow-ups" style="background:#0ea5e9;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600;">Open follow-ups</a></p>
<p style="color:#94a3b8;font-size:12px;margin-top:32px;">You're getting this because reminders are enabled in PRNM admin → Follow-up reminders.</p>
</body></html>`;

    const text = `${count} follow-ups due. Open: ${APP_BASE}/admin/follow-ups`;

    let didSend = false;

    // Email.
    if (s.email_enabled && s.email) {
      try {
        await sendViaEmailit({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: s.email,
          subject,
          html,
          text,
        });
        emailsSent++;
        didSend = true;
        await logAttempt({
          owner_id: ownerId,
          channel: "email",
          due_count: count,
          status: "sent",
          recipient: s.email,
        });
      } catch (e: any) {
        errors++;
        await logAttempt({
          owner_id: ownerId,
          channel: "email",
          due_count: count,
          status: "failed",
          error: String(e?.message ?? e).slice(0, 500),
          recipient: s.email,
        });
      }
    }

    // SMS.
    if (s.sms_enabled && s.phone_e164) {
      try {
        const opted = await isOptedOut(s.phone_e164);
        if (opted) {
          await logAttempt({
            owner_id: ownerId,
            channel: "sms",
            due_count: count,
            status: "skipped",
            error: "opted_out",
            recipient: s.phone_e164,
          });
        } else {
          const body = `PRNM: ${count} follow-up${count === 1 ? "" : "s"} due. ${APP_BASE}/admin/follow-ups`;
          const { sid, error: smsErr } = await sendSms(s.phone_e164, body);
          if (smsErr) {
            errors++;
            await logAttempt({
              owner_id: ownerId,
              channel: "sms",
              due_count: count,
              status: "failed",
              error: smsErr.slice(0, 500),
              recipient: s.phone_e164,
            });
          } else {
            smsSent++;
            didSend = true;
            await logAttempt({
              owner_id: ownerId,
              channel: "sms",
              due_count: count,
              status: "sent",
              recipient: s.phone_e164,
              error: sid ?? null,
            });
          }
        }
      } catch (e: any) {
        errors++;
        await logAttempt({
          owner_id: ownerId,
          channel: "sms",
          due_count: count,
          status: "failed",
          error: String(e?.message ?? e).slice(0, 500),
          recipient: s.phone_e164,
        });
      }
    }

    if (didSend) {
      await supabaseAdmin
        .from("followup_reminder_settings" as any)
        .update({ last_notified_at: new Date().toISOString() })
        .eq("owner_id", ownerId);
    }
  }

  return { ownersChecked: byOwner.size, emailsSent, smsSent, errors };
}
