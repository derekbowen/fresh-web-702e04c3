import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Emailit webhook receiver.
 *
 * Configure in the Emailit dashboard (Webhooks → Add endpoint) to POST to:
 *   https://www.poolrentalnearme.com/lovable/email/emailit-webhook
 * Subscribe at minimum to: email.loaded (open), email.clicked, email.delivered,
 * email.bounced, email.complained. Emailit generates a signing secret
 * (whsec_...) when you create the endpoint — put it in EMAILIT_WEBHOOK_SECRET.
 *
 * Signature verification (per Emailit docs, /docs/webhooks/request-signature):
 *   - Header `X-Emailit-Signature`  : hex HMAC-SHA256
 *   - Header `X-Emailit-Timestamp`  : unix seconds
 *   - Signed string is `{timestamp}.{rawBody}` with the whsec_ secret.
 *
 * Event handling (event names verbatim from Emailit):
 *   - email.bounced (hard)        → suppress (suppressed_emails, reason='bounce')
 *   - email.bounced (soft)        → log only (email_send_log status='failed')
 *   - email.complained            → suppress (reason='complaint')
 *   - email.loaded                → record open  (email_send_log status='opened')
 *   - email.clicked               → record click (email_send_log status='clicked')
 *   - email.delivered             → record delivery (email_send_log status='delivered')
 *   - anything else               → 200 ack, no-op
 *
 * Open-rate reporting reuses email_send_log (no schema change): the weekly
 * academy sender logs each send with message_id + template_name. An open is a
 * new row with the same message_id and status='opened'. Rate =
 *   distinct opened message_ids  ÷  sends, joined on message_id. Counting
 * DISTINCT message_id makes repeated 'loaded' events naturally idempotent.
 */

const SIG_HEADER = 'x-emailit-signature'
const TS_HEADER = 'x-emailit-timestamp'

interface EmailitEvent {
  event_id?: string
  type?: string
  event?: string
  data?: { object?: Record<string, any> } & Record<string, any>
  email?: string
  recipient?: string
  to?: string
  message_id?: string
  hard?: boolean
  bounce_type?: string
}

const obj = (evt: EmailitEvent): Record<string, any> =>
  (evt.data && (evt.data.object || evt.data)) || {}

function extractEmail(evt: EmailitEvent): string | null {
  const o = obj(evt)
  const candidate =
    o.email ||
    o.to ||
    o.recipient ||
    o.email_address ||
    o.recipient_email ||
    (typeof o.to === 'object' ? o.to?.email : null) ||
    evt.email ||
    evt.recipient ||
    evt.to
  if (typeof candidate !== 'string') return null
  return candidate.trim().toLowerCase() || null
}

// The id that ties an event back to the original send. The send API returns an
// email id; the webhook object echoes it. Try the likely fields in order.
function extractMessageId(evt: EmailitEvent): string | null {
  const o = obj(evt)
  const candidate =
    o.email_id ||
    o.message_id ||
    o.id ||
    o.object_id ||
    evt.message_id ||
    null
  return typeof candidate === 'string' ? candidate : null
}

function extractType(evt: EmailitEvent): string {
  return (evt.type || evt.event || '').toLowerCase()
}

function isHardBounce(evt: EmailitEvent): boolean {
  const o = obj(evt)
  if (evt.hard === true || o.hard === true) return true
  const bt = (evt.bounce_type || o.bounce_type || o.type || '').toLowerCase()
  if (bt === 'hard' || bt === 'permanent') return true
  if (bt === 'soft' || bt === 'transient') return false
  // Unqualified bounce → treat as hard unless explicitly soft.
  return true
}

function hexEq(a: string, b: string): boolean {
  // Compare hex DIGESTS by decoding to bytes (case-insensitive), not as raw
  // strings — Emailit may send upper- or lower-case hex. Buffer.from(_,'hex')
  // silently truncates invalid input, so require equal, non-empty length.
  let ab: Buffer
  let bb: Buffer
  try {
    ab = Buffer.from(a, 'hex')
    bb = Buffer.from(b, 'hex')
  } catch {
    return false
  }
  if (ab.length === 0 || ab.length !== bb.length) return false
  try {
    return timingSafeEqual(ab, bb)
  } catch {
    return false
  }
}

export const Route = createFileRoute('/lovable/email/emailit-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.EMAILIT_WEBHOOK_SECRET
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!secret || !supabaseUrl || !supabaseServiceKey) {
          console.error('emailit-webhook: missing required env vars')
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const rawBody = await request.text()
        const signature = (request.headers.get(SIG_HEADER) || '').replace(/^sha256=/i, '').trim()
        const timestamp = (request.headers.get(TS_HEADER) || '').trim()
        if (!signature || !timestamp) {
          return Response.json({ error: 'Missing signature headers' }, { status: 401 })
        }

        // Emailit signs `{timestamp}.{rawBody}` with the whsec_ secret.
        const signedPayload = `${timestamp}.${rawBody}`
        const expected = createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex')
        if (!hexEq(signature, expected)) {
          console.warn('emailit-webhook: invalid signature')
          return Response.json({ error: 'Invalid signature' }, { status: 401 })
        }

        // Replay protection: the timestamp is inside the signed payload, but a
        // valid old request could still be re-POSTed. Reject anything more than
        // 5 minutes from now (in either direction).
        const tsSeconds = Number(timestamp)
        if (!Number.isFinite(tsSeconds) || Math.abs(Date.now() / 1000 - tsSeconds) > 300) {
          return Response.json({ error: 'Stale or invalid timestamp' }, { status: 401 })
        }

        let evt: EmailitEvent
        try {
          const parsed = JSON.parse(rawBody)
          evt = Array.isArray(parsed) ? parsed[0] : parsed
        } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const type = extractType(evt)
        const email = extractEmail(evt)
        const messageId = extractMessageId(evt)
        const eventId = evt.event_id || null

        // ---- Bounces ----
        if (type.includes('bounce')) {
          if (!email) return Response.json({ ok: true, skipped: 'no_email' })
          const hard = isHardBounce(evt)
          if (hard) {
            await supabase
              .from('suppressed_emails')
              .upsert({ email, reason: 'bounce', metadata: evt as any }, { onConflict: 'email' })
            await supabase.from('email_send_log').insert({
              message_id: messageId,
              template_name: 'system',
              recipient_email: email,
              status: 'bounced',
              error_message: 'Hard bounce reported by Emailit',
              metadata: { event_id: eventId, type },
            })
            return Response.json({ ok: true, action: 'suppressed_bounce' })
          }
          await supabase.from('email_send_log').insert({
            message_id: messageId,
            template_name: 'system',
            recipient_email: email,
            status: 'failed',
            error_message: 'Soft bounce (transient) reported by Emailit',
            metadata: { event_id: eventId, type },
          })
          return Response.json({ ok: true, action: 'soft_bounce_logged' })
        }

        // ---- Complaints ----
        if (type.includes('complain') || type.includes('spam')) {
          if (!email) return Response.json({ ok: true, skipped: 'no_email' })
          await supabase
            .from('suppressed_emails')
            .upsert({ email, reason: 'complaint', metadata: evt as any }, { onConflict: 'email' })
          await supabase.from('email_send_log').insert({
            message_id: messageId,
            template_name: 'system',
            recipient_email: email,
            status: 'complained',
            error_message: 'Spam complaint reported by Emailit',
            metadata: { event_id: eventId, type },
          })
          return Response.json({ ok: true, action: 'suppressed_complaint' })
        }

        // ---- Engagement / delivery events (open, click, delivered) ----
        // Emailit: email.loaded = open (tracking pixel), email.clicked = click.
        const engagement: Record<string, string> = {
          'email.loaded': 'opened',
          'email.clicked': 'clicked',
          'email.delivered': 'delivered',
        }
        const status = engagement[type]
        if (status) {
          if (!email && !messageId) return Response.json({ ok: true, skipped: 'no_key' })
          // Idempotency: Emailit retries reuse event_id, and a recipient can open
          // many times — dedup so we log each event at most once.
          if (eventId) {
            const { data: dup } = await supabase
              .from('email_send_log')
              .select('id')
              .eq('metadata->>event_id', eventId)
              .limit(1)
            if (dup && dup.length > 0) return Response.json({ ok: true, action: 'duplicate' })
          }
          // email_send_log status has a CHECK constraint (sent/bounced/complained/
          // failed/dlq/pending); 'opened'/'clicked'/'delivered' are rejected, so we
          // store the allowed 'sent' and keep the true event in metadata.type.
          // Open-rate = distinct message_id where metadata->>type = 'email.loaded'.
          await supabase.from('email_send_log').insert({
            message_id: messageId,
            template_name: 'event',
            recipient_email: email,
            status: 'sent',
            error_message: null,
            metadata: { event_id: eventId, type, engagement: status },
          })
          return Response.json({ ok: true, action: status })
        }

        // ---- Everything else (accepted/scheduled/attempted/failed/rejected/…) ----
        console.log('emailit-webhook: ack (no-op)', { type, has_email: !!email })
        return Response.json({ ok: true, action: 'ack', type })
      },
    },
  },
})
