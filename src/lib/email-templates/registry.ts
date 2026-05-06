import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

import { template as poolWaitlistConfirmation } from './pool-waitlist-confirmation'
import { template as internalLeadNotification } from './internal-lead-notification'
import { template as dailySeoDigest } from './daily-seo-digest'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'pool-waitlist-confirmation': poolWaitlistConfirmation,
  'internal-lead-notification': internalLeadNotification,
  'daily-seo-digest': dailySeoDigest,
}
