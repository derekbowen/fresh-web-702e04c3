import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'
import { UnsubscribeFooter } from './_unsubscribe-footer'

interface InternalLeadNotificationProps {
  formType?: string
  submitterEmail?: string
  submitterName?: string | null
  city?: string | null
  region?: string | null
  message?: string | null
  nearestMiles?: number | null
  referrerPath?: string | null
  unsubscribeToken?: string | null
}

const InternalLeadNotificationEmail = ({
  formType = 'Lead form',
  submitterEmail = 'unknown',
  submitterName,
  city,
  region,
  message,
  nearestMiles,
  referrerPath,
  unsubscribeToken,
}: InternalLeadNotificationProps) => {
  const where = [city, region].filter(Boolean).join(', ') || '—'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{formType}: {submitterEmail}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New {formType} submission</Heading>
          <Text style={text}>
            A new lead just came through. Details below.
          </Text>

          <Section style={card}>
            <Row label="Form" value={formType} />
            <Row label="Email" value={submitterEmail} />
            {submitterName && <Row label="Name" value={submitterName} />}
            <Row label="Location" value={where} />
            {typeof nearestMiles === 'number' && (
              <Row
                label="Nearest pool"
                value={`${Math.round(nearestMiles).toLocaleString()} miles away`}
              />
            )}
            {referrerPath && <Row label="Page" value={referrerPath} />}
          </Section>

          {message && (
            <>
              <Heading as="h2" style={h2}>
                Message
              </Heading>
              <Section style={msgBox}>
                <Text style={msgText}>{message}</Text>
              </Section>
            </>
          )}

          <Hr style={hr} />
          <Text style={footer}>
            Sent automatically by Pool Rental Near Me.
          </Text>
          <UnsubscribeFooter unsubscribeToken={unsubscribeToken} />
        </Container>
      </Body>
    </Html>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={rowText}>
      <span style={rowLabel}>{label}:</span> {value}
    </Text>
  )
}

export const template = {
  component: InternalLeadNotificationEmail,
  subject: (data: Record<string, any>) =>
    `🚀 New ${data.formType || 'lead'} — ${data.submitterEmail || 'unknown'}`,
  to: 'hello@poolrentalnearme.com',
  displayName: 'Internal lead notification',
  previewData: {
    formType: 'Pool waitlist signup',
    submitterEmail: 'jane@example.com',
    submitterName: 'Jane Doe',
    city: 'Austin',
    region: 'TX',
    nearestMiles: 287,
    referrerPath: '/',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const h1 = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#0f172a',
  margin: '0 0 12px',
}
const h2 = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#0f172a',
  margin: '20px 0 8px',
}
const text = {
  fontSize: '14px',
  color: '#475569',
  lineHeight: '1.5',
  margin: '0 0 16px',
}
const card = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '16px 18px',
  margin: '0 0 12px',
}
const rowText = {
  fontSize: '14px',
  color: '#0f172a',
  margin: '0 0 6px',
  lineHeight: '1.5',
}
const rowLabel = { color: '#64748b', fontWeight: 600 as const, marginRight: '6px' }
const msgBox = {
  backgroundColor: '#fff7ed',
  borderLeft: '3px solid #f97316',
  borderRadius: '6px',
  padding: '12px 14px',
  margin: '0 0 16px',
}
const msgText = {
  fontSize: '14px',
  color: '#0f172a',
  lineHeight: '1.6',
  margin: 0,
  whiteSpace: 'pre-wrap' as const,
}
const hr = { borderColor: '#e2e8f0', margin: '24px 0 12px' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: 0 }
