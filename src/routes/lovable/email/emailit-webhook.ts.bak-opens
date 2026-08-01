import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Emailit webhook receiver.
 *
 * Configure in the Emailit dashboard to deliver events to:
 *   https://www.poolrentalnearme.com/lovable/email/emailit-webhook
 *
 * Signature verification: Emailit signs the raw body with HMAC-SHA256
 * using EMAILIT_WEBHOOK_SECRET. The signature is expected in the
 * `x-emailit-signature` header as a lowercase hex digest. If Emailit's
 * actual header name differs, adjust SIG_HEADER below — the HMAC
 * algorithm (sha256 over the raw body) is the industry-standard pattern.
 *
 * Event handling:
 *   - bounce  (hard / permanent)  → upsert suppressed_emails(reason='bounce')
 *   - bounce  (soft / transient)  → log only, no suppression
 *   - complaint / spam_complaint  → upsert suppressed_emails(reason='complaint')
 *   - delivered / opened / clicked → no-op (logged at debug level)
 */

const SIG_HEADER = 'x-emailit-signature'

interface EmailitEvent {
  // Common shape — adjust as the actual Emailit payload is confirmed.
  type?: string
  event?: string
  data?: Record<string, any>
  email?: string
  recipient?: string
  to?: string
  message_id?: string
  hard?: boolean
  bounce_type?: string
  reason?: string
}

function extractEmail(evt: EmailitEvent): string | null {
  const candidate =
    evt.email ||
    evt.recipient ||
    evt.to ||
    (evt.data && (evt.data.email || evt.data.recipient || evt.data.to))
  if (typeof candidate !== 'string') return null
  return candidate.trim().toLowerCase() || null
}

function extractType(evt: EmailitEvent): string {
  return (evt.type || evt.event || (evt.data && (evt.data.type || evt.data.event)) || '').toLowerCase()
}

function isHardBounce(evt: EmailitEvent): boolean {
  if (evt.hard === true) return true
  if (evt.data?.hard === true) return true
  const bt = (evt.bounce_type || evt.data?.bounce_type || '').toLowerCase()
  if (bt === 'hard' || bt === 'permanent') return true
  // If no qualifier given, treat any "bounced" / "bounce" type as hard
  // unless explicitly marked soft.
  if (bt === 'soft' || bt === 'transient') return false
  return true
}

function safeTimingEq(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ab.length !== bb.length) return false
  try { return timingSafeEqual(ab, bb) } catch { return false }
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
        const signature = request.headers.get(SIG_HEADER) || ''
        if (!signature) {
          return Response.json({ error: 'Missing signature' }, { status: 401 })
        }

        const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
        // Accept either bare hex or `sha256=<hex>` style.
        const provided = signature.replace(/^sha256=/i, '').trim()
        if (!safeTimingEq(provided, expected)) {
          console.warn('emailit-webhook: invalid signature')
          return Response.json({ error: 'Invalid signature' }, { status: 401 })
        }

        let evt: EmailitEvent
        try {
          const parsed = JSON.parse(rawBody)
          // Some providers wrap the payload in { event: {...} } or send arrays.
          evt = Array.isArray(parsed) ? parsed[0] : parsed
        } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const type = extractType(evt)
        const email = extractEmail(evt)
        const messageId = evt.message_id || evt.data?.message_id || null

        // Bounces
        if (type.includes('bounce') || type === 'bounced') {
          if (!email) return Response.json({ ok: true, skipped: 'no_email' })
          const hard = isHardBounce(evt)
          if (hard) {
            await supabase.from('suppressed_emails').upsert(
              { email, reason: 'bounce', metadata: evt as any },
              { onConflict: 'email' },
            )
            await supabase.from('email_send_log').insert({
              message_id: messageId,
              template_name: 'system',
              recipient_email: email,
              status: 'bounced',
              error_message: 'Hard bounce reported by Emailit',
            })
            return Response.json({ ok: true, action: 'suppressed_bounce' })
          }
          // Soft bounce — log only
          await supabase.from('email_send_log').insert({
            message_id: messageId,
            template_name: 'system',
            recipient_email: email,
            status: 'failed',
            error_message: 'Soft bounce (transient) reported by Emailit',
          })
          return Response.json({ ok: true, action: 'soft_bounce_logged' })
        }

        // Complaints
        if (type.includes('complaint') || type.includes('spam')) {
          if (!email) return Response.json({ ok: true, skipped: 'no_email' })
          await supabase.from('suppressed_emails').upsert(
            { email, reason: 'complaint', metadata: evt as any },
            { onConflict: 'email' },
          )
          await supabase.from('email_send_log').insert({
            message_id: messageId,
            template_name: 'system',
            recipient_email: email,
            status: 'complained',
            error_message: 'Spam complaint reported by Emailit',
          })
          return Response.json({ ok: true, action: 'suppressed_complaint' })
        }

        // Delivered / opened / clicked — no-op for now
        console.log('emailit-webhook: ignored event', { type, has_email: !!email })
        return Response.json({ ok: true, action: 'ignored', type })
      },
    },
  },
})
