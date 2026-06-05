import * as React from "react";
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Button, Link,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  firstName?: string | null;
  unsubUrl?: string;
}

const Email = ({ firstName, unsubUrl }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>Know someone with a pool? Refer them and earn.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Got a friend with a backyard pool?</Heading>
        <Text style={text}>
          Hey{firstName ? ` ${firstName}` : ""}, real talk: the fastest way to get a great pool
          near you is to know the host yourself.
        </Text>
        <Text style={text}>
          Hosts on Pool Rental Near Me typically earn <strong>$3,000–$10,000/month</strong> from a
          backyard they already own. We only charge a 10% host fee (Swimply takes 15%+), and every
          booking includes $2M of liability insurance.
        </Text>
        <Section style={cta}>
          <Button href="https://www.poolrentalnearme.com/p/become-a-pool-host" style={btn}>
            Refer a pool owner
          </Button>
        </Section>
        <Text style={text}>
          Forward this email to anyone you know with a pool. Once they list and complete their
          first booking, we'll send you a $50 credit.
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
  subject: "Know someone with a pool?",
  displayName: "Renter referral ask",
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Helvetica, Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const h1 = { fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 16px" };
const text = { fontSize: "15px", color: "#334155", lineHeight: "1.6", margin: "0 0 16px" };
const cta = { textAlign: "center" as const, margin: "24px 0" };
const btn = { backgroundColor: "#0ea5e9", color: "#fff", padding: "12px 22px", borderRadius: "999px", fontSize: "15px", fontWeight: "600", textDecoration: "none", display: "inline-block" };
const muted = { color: "#94a3b8", textDecoration: "underline" };
const footer = { fontSize: "11px", color: "#94a3b8", margin: "24px 0 0", textAlign: "center" as const };
