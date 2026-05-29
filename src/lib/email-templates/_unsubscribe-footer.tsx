import * as React from 'react'
import { Hr, Section, Text } from '@react-email/components'

/**
 * CAN-SPAM compliant footer. Appended to every outbound email template.
 * - Brand + legal entity + mailing address (CAN-SPAM physical address)
 * - Unsubscribe link (only rendered if a token is provided — auth/transactional
 *   required emails may omit it; the queue dispatcher still sets the
 *   List-Unsubscribe header when a token exists on the queued payload).
 *
 * The token is passed via templateData.unsubscribeToken at render time.
 */
interface Props {
  unsubscribeToken?: string | null
}

const UNSUB_BASE = 'https://www.poolrentalnearme.com/email/unsubscribe'

export const UnsubscribeFooter: React.FC<Props> = ({ unsubscribeToken }) => {
  const unsubUrl = unsubscribeToken ? `${UNSUB_BASE}?token=${unsubscribeToken}` : null
  return (
    <Section>
      <Hr style={hr} />
      <Text style={text}>
        Pool Rental Near Me · 10,000 Solutions LLC
        <br />
        2261 Market Street #5429, San Francisco, CA 94114
        {unsubUrl && (
          <>
            {' · '}
            <a href={unsubUrl} style={link}>Unsubscribe</a>
          </>
        )}
      </Text>
    </Section>
  )
}

const hr = { borderColor: '#e5e7eb', margin: '32px 0 16px' }
const text = {
  fontSize: '11px',
  color: '#9ca3af',
  lineHeight: '1.5',
  margin: '0',
  textAlign: 'center' as const,
}
const link = { color: '#9ca3af', textDecoration: 'underline' }
