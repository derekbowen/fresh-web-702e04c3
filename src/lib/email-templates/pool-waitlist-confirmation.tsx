import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'
import { UnsubscribeFooter } from './_unsubscribe-footer'

const SITE_NAME = 'Pool Rental Near Me'
const SITE_URL = 'https://poolrentalnearme.com'

interface PoolWaitlistConfirmationProps {
  city?: string | null
  region?: string | null
  nearestMiles?: number | null
  unsubscribeToken?: string | null
}

const PoolWaitlistConfirmationEmail = ({
  city,
  region,
  nearestMiles,
  unsubscribeToken,
}: PoolWaitlistConfirmationProps) => {
  const where = city ? `${city}${region ? `, ${region}` : ''}` : 'your area'
  const milesLabel =
    typeof nearestMiles === 'number'
      ? `${Math.round(nearestMiles).toLocaleString()} miles`
      : null

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>You're on the {SITE_NAME} waitlist for {where}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You're on the list! 🎉</Heading>
          <Text style={text}>
            Thanks for joining the {SITE_NAME} waitlist for <strong>{where}</strong>. We'll
            email you the moment a host opens up a pool within driving distance.
          </Text>

          {milesLabel && (
            <Section style={infoBox}>
              <Text style={infoText}>
                The closest pool we currently have is about{' '}
                <strong>{milesLabel}</strong> from you. We're actively recruiting
                hosts in your area to shorten that gap.
              </Text>
            </Section>
          )}

          <Heading as="h2" style={h2}>
            What happens next
          </Heading>
          <Text style={text}>
            <strong>1.</strong> We notify you by email as soon as a host lists a pool near {where}.
            <br />
            <strong>2.</strong> You'll get first access to book before the listing goes public.
            <br />
            <strong>3.</strong> No spam — only relevant pool openings in your area.
          </Text>

          <Section style={ctaSection}>
            <Button href={SITE_URL} style={button}>
              Browse pools available now
            </Button>
          </Section>

          <Text style={tipText}>
            Know someone with a pool? Hosts earn $100–$300+ per booking.{' '}
            <a href={`${SITE_URL}/p/hosting`} style={link}>
              Tell them about hosting
            </a>
            .
          </Text>

          <Text style={footer}>— The {SITE_NAME} team</Text>
          <UnsubscribeFooter unsubscribeToken={unsubscribeToken} />
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: PoolWaitlistConfirmationEmail,
  subject: 'You\'re on the Pool Rental Near Me waitlist',
  displayName: 'Pool waitlist confirmation',
  previewData: { city: 'Austin', region: 'TX', nearestMiles: 287 },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const h1 = {
  fontSize: '26px',
  fontWeight: '700',
  color: '#0f172a',
  margin: '0 0 16px',
  lineHeight: '1.3',
}
const h2 = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#0f172a',
  margin: '28px 0 12px',
}
const text = {
  fontSize: '15px',
  color: '#334155',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const infoBox = {
  backgroundColor: '#f1f5f9',
  borderLeft: '3px solid #0ea5e9',
  borderRadius: '6px',
  padding: '14px 16px',
  margin: '16px 0 24px',
}
const infoText = {
  fontSize: '14px',
  color: '#0f172a',
  lineHeight: '1.5',
  margin: '0',
}
const ctaSection = { textAlign: 'center' as const, margin: '28px 0' }
const button = {
  backgroundColor: '#0ea5e9',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '999px',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
}
const tipText = {
  fontSize: '13px',
  color: '#64748b',
  lineHeight: '1.6',
  margin: '24px 0 0',
  padding: '16px 0 0',
  borderTop: '1px solid #e2e8f0',
}
const link = { color: '#0ea5e9', textDecoration: 'underline' }
const footer = {
  fontSize: '13px',
  color: '#94a3b8',
  margin: '24px 0 0',
}
