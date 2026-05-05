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

interface EmailChangeEmailProps {
  siteName?: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
  branding?: Branding
}

export const EmailChangeEmail = ({
  oldEmail,
  newEmail,
  confirmationUrl,
  branding = DEFAULT_BRANDING,
  siteName,
}: EmailChangeEmailProps) => {
  const name = siteName || branding.siteName
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Confirm your email change for {name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <BrandHeader branding={branding} />
          <Heading style={h1}>Confirm your email change</Heading>
          <Text style={text}>
            You requested to change your email address for {name} from{' '}
            <Link href={`mailto:${oldEmail}`} style={link}>{oldEmail}</Link>{' '}
            to{' '}
            <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
          </Text>
          <Text style={text}>Click the button below to confirm this change:</Text>
          <Button style={buttonStyle(branding)} href={confirmationUrl}>
            Confirm Email Change
          </Button>
          <Text style={footer}>
            If you didn't request this change, please secure your account immediately.
          </Text>
          <BrandFooter branding={branding} />
        </Container>
      </Body>
    </Html>
  )
}

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000000', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 25px' }
const link = { color: 'inherit', textDecoration: 'underline' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
