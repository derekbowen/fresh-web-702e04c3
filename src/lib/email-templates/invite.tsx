import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'
import {
  DEFAULT_BRANDING,
  type Branding,
  BrandHeader,
  BrandFooter,
  buttonStyle,
} from './_branding'

interface InviteEmailProps {
  siteName?: string
  siteUrl: string
  confirmationUrl: string
  branding?: Branding
}

export const InviteEmail = ({
  siteUrl,
  confirmationUrl,
  branding = DEFAULT_BRANDING,
  siteName,
}: InviteEmailProps) => {
  const name = siteName || branding.siteName
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>You've been invited to join {name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <BrandHeader branding={branding} />
          <Heading style={h1}>You've been invited</Heading>
          <Text style={text}>
            You've been invited to join{' '}
            <Link href={siteUrl} style={link}>
              <strong>{name}</strong>
            </Link>
            . Click the button below to accept the invitation and create your account.
          </Text>
          <Button style={buttonStyle(branding)} href={confirmationUrl}>
            Accept Invitation
          </Button>
          <Text style={footer}>
            If you weren't expecting this invitation, you can safely ignore this email.
          </Text>
          <BrandFooter branding={branding} />
        </Container>
      </Body>
    </Html>
  )
}

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000000', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 25px' }
const link = { color: 'inherit', textDecoration: 'underline' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
