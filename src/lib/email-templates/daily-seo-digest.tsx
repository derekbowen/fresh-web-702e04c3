import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, Link,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface CompetitorPage { url: string; domain: string; title?: string | null }
interface AuditIssue { url_path: string; score: number; summary?: string | null }
interface RankDrop { keyword: string; previous_position: number | null; current_position: number | null }
interface HostLead {
  competitor_url: string; domain?: string | null;
  candidate_name?: string | null; candidate_business_name?: string | null;
  candidate_email?: string | null; candidate_phone?: string | null;
  candidate_website?: string | null; match_confidence: number;
  candidate_evidence?: string | null;
}

interface DailySeoDigestProps {
  dateLabel?: string
  newCompetitorPages?: CompetitorPage[]
  criticalAudits?: AuditIssue[]
  rankDrops?: RankDrop[]
  hostLeads?: HostLead[]
  totalNewCompetitor?: number
  totalCriticalAudits?: number
  totalHostLeads?: number
}

const DailySeoDigestEmail = ({
  dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
  newCompetitorPages = [],
  criticalAudits = [],
  rankDrops = [],
  totalNewCompetitor = 0,
  totalCriticalAudits = 0,
}: DailySeoDigestProps) => {
  const nothing =
    newCompetitorPages.length === 0 &&
    criticalAudits.length === 0 &&
    rankDrops.length === 0

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {`Daily SEO digest — ${totalNewCompetitor} new competitor pages, ${totalCriticalAudits} critical audits`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🚨 Daily SEO digest</Heading>
          <Text style={subtle}>{dateLabel}</Text>

          <Section style={statRow}>
            <Stat label="New competitor pages" value={String(totalNewCompetitor)} tone={totalNewCompetitor > 0 ? 'warn' : 'ok'} />
            <Stat label="Critical audit flags" value={String(totalCriticalAudits)} tone={totalCriticalAudits > 0 ? 'danger' : 'ok'} />
            <Stat label="Rank drops" value={String(rankDrops.length)} tone={rankDrops.length > 0 ? 'warn' : 'ok'} />
          </Section>

          {nothing && (
            <Section style={card}>
              <Text style={text}>
                ✅ Nothing critical in the last 24 hours. All tracked competitors quiet, no audit scores below 60, no rank drops.
              </Text>
            </Section>
          )}

          {newCompetitorPages.length > 0 && (
            <>
              <Heading as="h2" style={h2}>New competitor pages ({totalNewCompetitor})</Heading>
              <Section style={card}>
                {newCompetitorPages.slice(0, 15).map((p) => (
                  <Text key={p.url} style={rowText}>
                    <span style={domainTag}>{p.domain}</span>{' '}
                    <Link href={p.url} style={linkStyle}>{p.title || p.url}</Link>
                  </Text>
                ))}
                {totalNewCompetitor > newCompetitorPages.length && (
                  <Text style={moreText}>…and {totalNewCompetitor - newCompetitorPages.length} more</Text>
                )}
              </Section>
            </>
          )}

          {criticalAudits.length > 0 && (
            <>
              <Heading as="h2" style={h2}>Critical AI audit flags ({totalCriticalAudits})</Heading>
              <Section style={card}>
                {criticalAudits.slice(0, 15).map((a) => (
                  <Text key={a.url_path} style={rowText}>
                    <span style={scoreBadge(a.score)}>{a.score}/100</span>{' '}
                    <Link href={`https://www.poolrentalnearme.com${a.url_path}`} style={linkStyle}>
                      {a.url_path}
                    </Link>
                    {a.summary && <span style={summaryStyle}> — {a.summary}</span>}
                  </Text>
                ))}
                {totalCriticalAudits > criticalAudits.length && (
                  <Text style={moreText}>…and {totalCriticalAudits - criticalAudits.length} more</Text>
                )}
              </Section>
            </>
          )}

          {rankDrops.length > 0 && (
            <>
              <Heading as="h2" style={h2}>Significant rank drops ({rankDrops.length})</Heading>
              <Section style={card}>
                {rankDrops.map((r) => (
                  <Text key={r.keyword} style={rowText}>
                    <strong>{r.keyword}</strong>:{' '}
                    {r.previous_position ?? '—'} → <span style={{ color: '#dc2626', fontWeight: 600 }}>{r.current_position ?? 'lost'}</span>
                  </Text>
                ))}
              </Section>
            </>
          )}

          <Hr style={hr} />
          <Text style={footer}>
            Sent automatically by Pool Rental Near Me admin.
            View details in <Link href="https://www.poolrentalnearme.com/admin/dashboard" style={linkStyle}>admin dashboard</Link>.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'ok' | 'warn' | 'danger' }) {
  const color = tone === 'danger' ? '#dc2626' : tone === 'warn' ? '#d97706' : '#16a34a'
  return (
    <Section style={statCell}>
      <Text style={{ ...statValue, color }}>{value}</Text>
      <Text style={statLabel}>{label}</Text>
    </Section>
  )
}

function scoreBadge(score: number): React.CSSProperties {
  return {
    display: 'inline-block',
    backgroundColor: score < 40 ? '#fee2e2' : '#fef3c7',
    color: score < 40 ? '#991b1b' : '#92400e',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
    marginRight: '6px',
  }
}

export const template = {
  component: DailySeoDigestEmail,
  subject: (data: Record<string, any>) => {
    const n = (data.totalNewCompetitor || 0) + (data.totalCriticalAudits || 0) + ((data.rankDrops || []).length || 0)
    return n > 0
      ? `🚨 Daily SEO digest — ${n} item${n === 1 ? '' : 's'} need attention`
      : `✅ Daily SEO digest — all clear`
  },
  to: 'derek@poolrentalnearme.com',
  displayName: 'Daily SEO digest',
  previewData: {
    totalNewCompetitor: 12,
    totalCriticalAudits: 3,
    newCompetitorPages: [
      { url: 'https://swimply.com/pools/example', domain: 'swimply.com', title: 'Pool Rental in Austin' },
    ],
    criticalAudits: [
      { url_path: '/p/los-angeles-ca', score: 35, summary: 'Missing schema, thin content' },
    ],
    rankDrops: [{ keyword: 'pool rental near me', previous_position: 5, current_position: 14 }],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '640px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }
const h2 = { fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: '24px 0 8px' }
const subtle = { fontSize: '13px', color: '#64748b', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#475569', lineHeight: '1.5', margin: '0 0 8px' }
const card = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px 18px', margin: '0 0 12px' }
const statRow = { display: 'block', margin: '0 0 16px' }
const statCell = { display: 'inline-block', width: '33%', textAlign: 'center' as const, padding: '8px' }
const statValue = { fontSize: '28px', fontWeight: '700', margin: 0, lineHeight: 1 }
const statLabel = { fontSize: '11px', color: '#64748b', textTransform: 'uppercase' as const, margin: '4px 0 0', letterSpacing: '0.05em' }
const rowText = { fontSize: '13px', color: '#0f172a', margin: '0 0 8px', lineHeight: '1.5' }
const domainTag = { display: 'inline-block', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, marginRight: '6px' }
const linkStyle = { color: '#2563eb', textDecoration: 'underline' }
const summaryStyle = { color: '#64748b', fontSize: '12px' }
const moreText = { fontSize: '12px', color: '#94a3b8', margin: '8px 0 0', fontStyle: 'italic' as const }
const hr = { borderColor: '#e2e8f0', margin: '24px 0 12px' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: 0 }
