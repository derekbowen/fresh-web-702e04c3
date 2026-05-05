import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
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

interface RecoveryEmailProps {
  siteName?: string
  confirmationUrl: string
  branding?: Branding
}

export const RecoveryEmail = ({
  confirmationUrl,
  branding = DEFAULT_BRANDING,
  siteName,
}: RecoveryEmailProps) => {
  const name = siteName || branding.siteName
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Reset your password for {name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <BrandHeader branding={branding} />
          <Heading style={h1}>Reset your password</Heading>
          <Text style={text}>
            We received a request to reset your password for {name}. Click the button below to choose a new password.
          </Text>
          <Button style={buttonStyle(branding)} href={confirmationUrl}>
            Reset Password
          </Button>
          <Text style={footer}>
            If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
          </Text>
          <BrandFooter branding={branding} />
        </Container>
      </Body>
    </Html>
  )
}

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000000', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 25px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
