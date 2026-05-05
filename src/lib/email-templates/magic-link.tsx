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

interface MagicLinkEmailProps {
  siteName?: string
  confirmationUrl: string
  branding?: Branding
}

export const MagicLinkEmail = ({
  confirmationUrl,
  branding = DEFAULT_BRANDING,
  siteName,
}: MagicLinkEmailProps) => {
  const name = siteName || branding.siteName
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your login link for {name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <BrandHeader branding={branding} />
          <Heading style={h1}>Your login link</Heading>
          <Text style={text}>
            Click the button below to log in to {name}. This link will expire shortly.
          </Text>
          <Button style={buttonStyle(branding)} href={confirmationUrl}>
            Log In
          </Button>
          <Text style={footer}>
            If you didn't request this link, you can safely ignore this email.
          </Text>
          <BrandFooter branding={branding} />
        </Container>
      </Body>
    </Html>
  )
}

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000000', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 25px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
