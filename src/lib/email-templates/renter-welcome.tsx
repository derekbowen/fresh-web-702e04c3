import * as React from "react";
import {
  Body, Container, Head, Heading, Html, Img, Preview, Section, Text, Button, Link,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Pool {
  title: string;
  city: string | null;
  stateCode: string | null;
  priceAmount: number | null;
  priceCurrency: string | null;
  imageUrl: string | null;
  url: string;
  distanceMi: number | null;
}
interface Props {
  firstName?: string | null;
  where?: string;
  pools?: Pool[];
  unsubUrl?: string;
}

function priceLabel(p: Pool) {
  if (!p.priceAmount) return null;
  return `$${(p.priceAmount / 100).toFixed(0)}/hr`;
}

const Email = ({ firstName, where = "your area", pools = [], unsubUrl }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>Pools near {where} on Pool Rental Near Me</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome{firstName ? `, ${firstName}` : ""} 👋</Heading>
        <Text style={text}>
          You're in. We're Pool Rental Near Me — book a private pool by the hour,
          right in your neighborhood.
        </Text>
        {pools.length > 0 ? (
          <>
            <Heading as="h2" style={h2}>Pools near {where}</Heading>
            {pools.map((p, i) => (
              <Section key={i} style={card}>
                {p.imageUrl && (
                  <a href={p.url}><Img src={p.imageUrl} alt={p.title} width="540" style={img} /></a>
                )}
                <Text style={cardTitle}>
                  <a href={p.url} style={link}>{p.title}</a>
                </Text>
                <Text style={cardMeta}>
                  {p.city ? `${p.city}${p.stateCode ? ", " + p.stateCode : ""}` : ""}
                  {p.distanceMi != null ? ` · ${p.distanceMi} mi away` : ""}
                  {priceLabel(p) ? ` · ${priceLabel(p)}` : ""}
                </Text>
                <Button href={p.url} style={btn}>View this pool</Button>
              </Section>
            ))}
          </>
        ) : (
          <Section style={infoBox}>
            <Text style={text}>
              We don't have a pool listed near you yet — but new pools are added
              every week. We'll email you the moment one opens up.
            </Text>
            <Button href="https://www.poolrentalnearme.com/s" style={btn}>Browse all pools</Button>
          </Section>
        )}
        <Text style={text}>
          You'll get one pool of the day for the next two weeks. Hate it?
          {" "}<Link href={unsubUrl} style={muted}>Unsubscribe instantly</Link>.
        </Text>
        <Text style={footer}>
          Pool Rental Near Me · 10,000 Solutions LLC · 2261 Market Street #5429, San Francisco, CA 94114
          {" · "}<Link href={unsubUrl} style={muted}>Unsubscribe</Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: "Welcome to Pool Rental Near Me",
  displayName: "Renter welcome",
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Helvetica, Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const h1 = { fontSize: "26px", fontWeight: "700", color: "#0f172a", margin: "0 0 16px" };
const h2 = { fontSize: "18px", fontWeight: "600", color: "#0f172a", margin: "28px 0 12px" };
const text = { fontSize: "15px", color: "#334155", lineHeight: "1.6", margin: "0 0 16px" };
const card = { margin: "16px 0 24px", padding: "0", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" };
const img = { width: "100%", height: "auto", display: "block" };
const cardTitle = { fontSize: "16px", fontWeight: "600", color: "#0f172a", margin: "12px 16px 4px" };
const cardMeta = { fontSize: "13px", color: "#64748b", margin: "0 16px 12px" };
const btn = { backgroundColor: "#0ea5e9", color: "#fff", padding: "10px 18px", borderRadius: "999px", fontSize: "14px", fontWeight: "600", textDecoration: "none", display: "inline-block", margin: "0 16px 16px" };
const link = { color: "#0ea5e9", textDecoration: "none" };
const muted = { color: "#94a3b8", textDecoration: "underline" };
const infoBox = { backgroundColor: "#f1f5f9", padding: "16px", borderRadius: "8px", margin: "12px 0 24px" };
const footer = { fontSize: "11px", color: "#94a3b8", margin: "24px 0 0", textAlign: "center" as const };
