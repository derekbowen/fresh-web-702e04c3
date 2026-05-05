import * as React from 'react'
import { Img, Section, Text } from '@react-email/components'

export interface Branding {
  siteName: string
  senderName: string
  logoUrl: string | null
  primaryColor: string
  primaryTextColor: string
  footerText: string | null
}

export const DEFAULT_BRANDING: Branding = {
  siteName: 'fresh-web',
  senderName: 'fresh-web',
  logoUrl: null,
  primaryColor: '#000000',
  primaryTextColor: '#ffffff',
  footerText: null,
}

export function buttonStyle(b: Branding): React.CSSProperties {
  return {
    backgroundColor: b.primaryColor,
    color: b.primaryTextColor,
    fontSize: '14px',
    borderRadius: '8px',
    padding: '12px 20px',
    textDecoration: 'none',
    display: 'inline-block',
  }
}

export function BrandHeader({ branding }: { branding: Branding }) {
  if (!branding.logoUrl) return null
  return (
    <Section style={{ padding: '0 0 16px' }}>
      <Img
        src={branding.logoUrl}
        alt={branding.siteName}
        height="40"
        style={{ height: '40px', width: 'auto' }}
      />
    </Section>
  )
}

export function BrandFooter({ branding }: { branding: Branding }) {
  if (!branding.footerText) return null
  return (
    <Text style={{ fontSize: '11px', color: '#999999', margin: '24px 0 0', lineHeight: '1.5' }}>
      {branding.footerText}
    </Text>
  )
}
