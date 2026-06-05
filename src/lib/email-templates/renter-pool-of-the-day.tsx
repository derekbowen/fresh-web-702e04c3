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
  pool: Pool;
  unsubUrl?: string;
}

const Email = ({ firstName, pool, unsubUrl }: Props) => {
  const price = pool.priceAmount ? `$${(pool.priceAmount / 100).toFixed(0)}/hr` : null;
  const where = pool.city ? `${pool.city}${pool.stateCode ? ", " + pool.stateCode : ""}` : null;
  return (
    <Html lang="en">
      <Head />
      <Preview>Pool of the day: {pool.title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Pool of the day</Heading>
          <Text style={text}>
            Hey{firstName ? ` ${firstName}` : ""}, here's a pool we think you'd like.
          </Text>
          <Section style={card}>
            {pool.imageUrl && (
              <a href={pool.url}><Img src={pool.imageUrl} alt={pool.title} width="540" style={img} /></a>
            )}
            <Text style={cardTitle}><a href={pool.url} style={link}>{pool.title}</a></Text>
            <Text style={cardMeta}>
              {where || ""}
              {pool.distanceMi != null ? ` · ${pool.distanceMi} mi away` : ""}
              {price ? ` · ${price}` : ""}
            </Text>
            <Button href={pool.url} style={btn}>See availability</Button>
          </Section>
          <Text style={tip}>
            Not the right vibe? <Link href="https://www.poolrentalnearme.com/s" style={link}>Browse every pool near you</Link>.
          </Text>
          <Text style={footer}>
            Pool Rental Near Me · 10,000 Solutions LLC · 2261 Market Street #5429, San Francisco, CA 94114
            {" · "}<Link href={unsubUrl} style={muted}>Unsubscribe</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: Email,
  subject: "Pool of the day",
  displayName: "Renter pool of the day",
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Helvetica, Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const h1 = { fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 12px" };
const text = { fontSize: "15px", color: "#334155", lineHeight: "1.6", margin: "0 0 16px" };
const card = { margin: "16px 0 24px", padding: "0", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" };
const img = { width: "100%", height: "auto", display: "block" };
const cardTitle = { fontSize: "16px", fontWeight: "600", color: "#0f172a", margin: "12px 16px 4px" };
const cardMeta = { fontSize: "13px", color: "#64748b", margin: "0 16px 12px" };
const btn = { backgroundColor: "#0ea5e9", color: "#fff", padding: "10px 18px", borderRadius: "999px", fontSize: "14px", fontWeight: "600", textDecoration: "none", display: "inline-block", margin: "0 16px 16px" };
const link = { color: "#0ea5e9", textDecoration: "none" };
const muted = { color: "#94a3b8", textDecoration: "underline" };
const tip = { fontSize: "13px", color: "#64748b", margin: "16px 0 0" };
const footer = { fontSize: "11px", color: "#94a3b8", margin: "24px 0 0", textAlign: "center" as const };
