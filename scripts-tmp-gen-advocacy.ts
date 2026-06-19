// Generate body content for empty host_advocacy_state and host_advocacy_hub rows
// using the Lovable AI Gateway. Saves directly to content_pages.
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const KEY = process.env.OPENROUTER_API_KEY!;
const MODEL = "google/gemini-2.5-pro";

const STATE_FROM_SLUG: Record<string, string> = {
  alabama: "Alabama", alaska: "Alaska", arizona: "Arizona", arkansas: "Arkansas",
  colorado: "Colorado", connecticut: "Connecticut", delaware: "Delaware",
  hawaii: "Hawaii", idaho: "Idaho", illinois: "Illinois", iowa: "Iowa",
  kansas: "Kansas", kentucky: "Kentucky", maine: "Maine", maryland: "Maryland",
  massachusetts: "Massachusetts", michigan: "Michigan", minnesota: "Minnesota",
  mississippi: "Mississippi", missouri: "Missouri", montana: "Montana",
  nebraska: "Nebraska", nevada: "Nevada", "new-hampshire": "New Hampshire",
  "new-mexico": "New Mexico", "new-york": "New York", "north-carolina": "North Carolina",
  "north-dakota": "North Dakota", ohio: "Ohio", oklahoma: "Oklahoma", oregon: "Oregon",
  pennsylvania: "Pennsylvania", "rhode-island": "Rhode Island",
  "south-carolina": "South Carolina", "south-dakota": "South Dakota",
  tennessee: "Tennessee", texas: "Texas", utah: "Utah", vermont: "Vermont",
  virginia: "Virginia", washington: "Washington", "west-virginia": "West Virginia",
  wisconsin: "Wisconsin", wyoming: "Wyoming",
  "pa-what-every-host-needs-to-know": "Pennsylvania",
  "new-jersey": "New Jersey",
};

const STATE_PROMPT = (state: string) => `You are writing a state-specific pool host advocacy guide for poolrentalnearme.com — a peer-to-peer pool rental marketplace where homeowners earn $3K–$10K/month renting their backyard pool by the hour.

Audience: a homeowner in ${state} who is considering listing their pool. They want practical, real information about whether they can do this in ${state}, what the laws and HOA dynamics look like, what they can earn, and what insurance and permits to check.

Write a complete, topical, ~700-word guide for ${state} in markdown. Structure:

# ${state} Pool Host Guide

(2–3 sentence intro about the ${state} pool rental market — climate, season length, demand drivers. Be honest if it's a short-season market.)

## The ${state} Market Overview

(1 paragraph with real regional context — name 2–3 actual metro areas in ${state}, note climate season, demand level vs other states. No invented stats.)

## Income Expectations

(A short markdown table with 3–4 rows: Region | Typical Hourly Rate | Notes. Use realistic ranges in $40–$150/hr depending on market. Below the table, 2 sentences on monthly income potential at typical occupancy.)

## ${state} Regulations to Check

(3–5 bullet points covering: state pool fence/barrier code (reference real ${state} law if you know it; if not, refer generically to the state building/health code), short-term rental tax/lodging considerations if applicable, liability and insurance, alcohol-on-premises rules, noise ordinances. Be careful: only cite specific laws if you actually know them — otherwise use general phrasing like "check your local building code".)

## HOA and Neighborhood Considerations

(1 paragraph: how HOAs typically treat hourly pool rentals in ${state}, what to look for in CC&Rs, how to talk to neighbors.)

## Insurance and Liability

(1 paragraph: mention that Pool Rental Near Me includes $2M liability insurance per booking, and that hosts should still verify their homeowner's policy doesn't exclude commercial pool use.)

## Tips for ${state} Hosts

(4–6 short bullet tips specific to ${state} — climate, season timing, pricing strategy, amenities that work well, common ${state}-specific guest expectations.)

## Get Started

(Closing 2 sentences inviting the reader to list their ${state} pool.)

VOICE RULES:
- Sentence case headings (already done above — keep this style for any subheadings you add).
- Second person ("you", "your pool").
- No em dashes anywhere. Use commas, periods, or restructure.
- BANNED words: leverage, utilize, seamlessly, robust, dive into, elevate, game-changer, unlock, journey, landscape, bustling, thriving, vibrant, state-of-the-art, cutting-edge.
- BANNED phrases: "in this article", "in conclusion", "it's worth noting", "thousands of hosts".
- Numbers under 10 spelled out, 10+ as numerals.
- Dollar amounts as $X/hour not "per hour".
- Real, defensible numbers only. Typical hourly rates $40-150/hr. Never invent statistics.
- Differentiators to mention naturally: 10% flat host fee (vs Swimply's 15%+), $2M liability insurance included.

Return ONLY the body_markdown string starting with "# ${state} Pool Host Guide". Do not include any preamble or explanation.`;

const HUB_PROMPT = `You are writing the national hub page for pool host advocacy on poolrentalnearme.com — a peer-to-peer pool rental marketplace. This is the parent page that links out to all 50 state-specific guides.

Audience: any US homeowner considering listing their pool, regardless of state. They landed here looking for an overview of what hosting actually involves, what the rules look like nationally, and where to find their state.

Write a complete, ~600-word hub page in markdown.

# Pool host advocacy hub

(Intro: 2–3 sentences. Renting your pool is legal in every US state, but the rules vary wildly by state, county, and HOA. This hub helps you find what applies to you.)

## What "host advocacy" means

(1 paragraph defining the term: making sure hosts have the legal, regulatory, and insurance backing to rent their pools confidently. Mention $2M liability insurance per booking and the 10% flat host fee.)

## What's the same across all 50 states

(4–6 bullets covering: federal-level concerns (none specifically regulate pool rental), the role of state pool fence codes, lodging/tax treatment, homeowner insurance gaps to watch for, alcohol/noise ordinances at the local level.)

## What varies by state

(1 paragraph + 3–5 bullets: HOA prevalence, pool barrier specifics, short-term rental laws that may or may not apply, climate/season length, market saturation.)

## Find your state guide

(1 sentence pointing readers to choose their state below. We'll auto-render the state list separately, so you don't need to list states here.)

## Insurance and liability basics

(1 short paragraph: $2M per-booking liability included, what it covers vs what your homeowner policy needs to still cover, recommendation to call your insurer before listing.)

## Get started as a host

(2 sentences: invite the reader to either pick their state above or start listing now.)

VOICE RULES:
- Sentence case headings.
- Second person.
- No em dashes. No banned words: leverage, utilize, seamlessly, robust, dive into, elevate, game-changer, unlock, journey, landscape, bustling, thriving, vibrant, state-of-the-art, cutting-edge.
- No banned phrases: "in this article", "in conclusion", "it's worth noting", "thousands of hosts".
- Real numbers only. Mention 10% host fee and $2M liability insurance.

Return ONLY the markdown body starting with "# Pool host advocacy hub".`;

async function callAI(prompt: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`gateway ${res.status}: ${t.slice(0, 300)}`);
  }
  const json: any = await res.json();
  return json?.choices?.[0]?.message?.content?.trim() ?? "";
}

function deriveTitle(state: string | null): { title: string; seoTitle: string; seoDesc: string } {
  if (!state) {
    return {
      title: "Pool Host Advocacy Hub | Pool Rental Near Me",
      seoTitle: "Pool Host Advocacy Hub | Pool Rental Near Me",
      seoDesc: "Find your state's pool host advocacy guide. Laws, HOA rules, insurance, and income expectations for pool owners renting their pool by the hour.",
    };
  }
  return {
    title: `${state} Pool Host Guide | Rent Your Pool in ${state} | Pool Rental Near Me`,
    seoTitle: `${state} Pool Host Advocacy Guide | Pool Rental Near Me`,
    seoDesc: `Complete guide for ${state} pool owners considering hourly pool rentals. HOA guidance, income estimates, regulations, and host tips for ${state}.`,
  };
}

async function main() {
  const { data: rows, error } = await sb
    .from("content_pages")
    .select("id, url_path, slug, template_type, body_markdown, title, seo_title, seo_description")
    .in("template_type", ["host_advocacy_state", "host_advocacy_hub"])
    .order("url_path");
  if (error) throw error;

  const todo = (rows || []).filter((r: any) => (r.body_markdown?.length ?? 0) < 200);
  console.log(`Generating ${todo.length} pages with ${MODEL}\n`);

  let ok = 0, failed = 0;
  for (const row of todo) {
    const r = row as any;
    const isHub = r.template_type === "host_advocacy_hub";
    const stateSlug = isHub ? null : r.slug.replace(/^host-advocacy-/, "");
    const stateName = isHub ? null : (STATE_FROM_SLUG[stateSlug] ?? null);
    if (!isHub && !stateName) {
      console.log(`skip   ${r.url_path} (unknown state slug "${stateSlug}")`);
      continue;
    }
    const prompt = isHub ? HUB_PROMPT : STATE_PROMPT(stateName!);
    try {
      const md = await callAI(prompt);
      if (!md || md.length < 400) {
        failed++;
        console.log(`short  ${r.url_path} (${md.length}b)`);
        continue;
      }
      const meta = deriveTitle(stateName);
      const { error: upErr } = await sb.from("content_pages").update({
        body_markdown: md,
        title: r.title || meta.title,
        seo_title: r.seo_title || meta.seoTitle,
        seo_description: r.seo_description || meta.seoDesc,
        status: "published",
        scraped_at: new Date().toISOString(),
      }).eq("id", r.id);
      if (upErr) { failed++; console.log(`fail   ${r.url_path} ${upErr.message}`); continue; }
      ok++;
      console.log(`ok ${md.length}b  ${r.url_path}`);
    } catch (e: any) {
      failed++;
      console.log(`fail   ${r.url_path} ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  console.log(`\nDONE ok=${ok} failed=${failed}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
