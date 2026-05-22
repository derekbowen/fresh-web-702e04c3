/**
 * Research-grade state advocacy generator.
 *
 * For each target state:
 *   1. Firecrawl search for 6 authoritative sources (state STR statute,
 *      top metro STR ordinances, county code, HOA pre-emption news).
 *   2. Firecrawl scrape (markdown) for the top hits.
 *   3. Hand the corpus to Gemini 2.5 Pro with a strict prompt requiring
 *      named counties/cities, inline citations as markdown links, and
 *      voice rules.
 *   4. Write to content_pages.content for the matching host-advocacy-{state}
 *      slug, set status=published, updated_at=now().
 *
 * Run for a single state:  bun run scripts-tmp-gen-advocacy-v2.ts california
 * Run for all empty:       bun run scripts-tmp-gen-advocacy-v2.ts --all-empty
 * Dry-run (no DB write):   bun run scripts-tmp-gen-advocacy-v2.ts california --dry
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const FC_KEY = process.env.FIRECRAWL_API_KEY!;
const LOV_KEY = process.env.LOVABLE_API_KEY!;
const MODEL = "google/gemini-2.5-pro";

if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Missing Supabase env");
if (!FC_KEY) throw new Error("Missing FIRECRAWL_API_KEY");
if (!LOV_KEY) throw new Error("Missing LOVABLE_API_KEY");

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const STATE_FROM_SLUG: Record<string, string> = {
  alabama: "Alabama", alaska: "Alaska", arizona: "Arizona", arkansas: "Arkansas",
  california: "California", colorado: "Colorado", connecticut: "Connecticut",
  delaware: "Delaware", florida: "Florida", georgia: "Georgia", hawaii: "Hawaii",
  idaho: "Idaho", illinois: "Illinois", indiana: "Indiana", iowa: "Iowa",
  kansas: "Kansas", kentucky: "Kentucky", louisiana: "Louisiana", maine: "Maine",
  maryland: "Maryland", massachusetts: "Massachusetts", michigan: "Michigan",
  minnesota: "Minnesota", mississippi: "Mississippi", missouri: "Missouri",
  montana: "Montana", nebraska: "Nebraska", nevada: "Nevada",
  "new-hampshire": "New Hampshire", "new-jersey": "New Jersey",
  "new-mexico": "New Mexico", "new-york": "New York",
  "north-carolina": "North Carolina", "north-dakota": "North Dakota",
  ohio: "Ohio", oklahoma: "Oklahoma", oregon: "Oregon",
  pennsylvania: "Pennsylvania", "rhode-island": "Rhode Island",
  "south-carolina": "South Carolina", "south-dakota": "South Dakota",
  tennessee: "Tennessee", texas: "Texas", utah: "Utah", vermont: "Vermont",
  virginia: "Virginia", washington: "Washington",
  "west-virginia": "West Virginia", wisconsin: "Wisconsin", wyoming: "Wyoming",
};

type SearchHit = { url: string; title: string; description?: string };

async function fcSearch(query: string, limit = 5): Promise<SearchHit[]> {
  const r = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FC_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, limit }),
  });
  if (!r.ok) {
    console.warn(`  search failed (${r.status}) for: ${query}`);
    return [];
  }
  const j = await r.json();
  const data = j?.data?.web ?? j?.data ?? [];
  return data
    .map((d: { url?: string; title?: string; description?: string }) => ({
      url: d.url ?? "",
      title: d.title ?? "",
      description: d.description ?? "",
    }))
    .filter((d: SearchHit) => d.url);
}

async function fcScrape(url: string): Promise<string | null> {
  try {
    const r = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FC_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 25000,
      }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const md = j?.data?.markdown ?? j?.markdown ?? null;
    if (!md) return null;
    return String(md).slice(0, 12000);
  } catch {
    return null;
  }
}

async function gatherSources(state: string): Promise<Array<{ url: string; title: string; text: string }>> {
  const queries = [
    `${state} short-term rental law statute registration`,
    `${state} short-term rental ordinance city county permit`,
    `${state} pool barrier fence code residential safety act`,
    `${state} HOA short-term rental preemption ${new Date().getFullYear()}`,
    `${state} swimming pool rental Swimply permit news`,
    `${state} business license home occupation residential rental`,
  ];

  const seen = new Set<string>();
  const picks: SearchHit[] = [];
  for (const q of queries) {
    const hits = await fcSearch(q, 4);
    for (const h of hits) {
      try {
        const host = new URL(h.url).hostname;
        if (seen.has(h.url)) continue;
        if (/pinterest|youtube|tiktok|facebook|reddit\.com\/r\/[^/]+\/comments/.test(h.url)) continue;
        seen.add(h.url);
        picks.push(h);
        if (picks.length >= 12) break;
      } catch {
        /* ignore bad url */
      }
    }
    if (picks.length >= 12) break;
  }

  console.log(`  found ${picks.length} candidate sources, scraping top 8…`);
  const top = picks.slice(0, 8);
  const scraped: Array<{ url: string; title: string; text: string }> = [];
  for (const p of top) {
    const text = await fcScrape(p.url);
    if (text && text.length > 400) {
      scraped.push({ url: p.url, title: p.title, text });
      console.log(`    ✓ ${p.url.slice(0, 80)} (${text.length} chars)`);
    } else {
      console.log(`    ✗ ${p.url.slice(0, 80)}`);
    }
  }
  return scraped;
}

function buildPrompt(state: string, sources: Array<{ url: string; title: string; text: string }>): string {
  const sourceBlocks = sources
    .map(
      (s, i) =>
        `### Source [${i + 1}] — ${s.title}\nURL: ${s.url}\n\n${s.text}\n`,
    )
    .join("\n---\n\n");

  return `You are Derek Bowen, CEO of Pool Rental Near Me, writing a thorough, citation-grade state guide for hourly pool rental hosts in ${state}. The audience is a homeowner deciding whether and how to legally rent their backyard pool by the hour ($40–$150/hr).

I am giving you ${sources.length} scraped sources below — state statutes, county/city ordinances, news, and HOA legal commentary specific to ${state}. Use ONLY facts you can support from these sources or from broadly known state-level facts. Do NOT invent ordinance numbers, fee amounts, or dates that are not in the sources. Cite sources inline with markdown links pointing at the actual source URLs, e.g. "Los Angeles requires STR registration with the Department of City Planning ([source](https://planning.lacity.gov/...))".

Write 2200–2800 words of markdown. Structure exactly:

# ${state} pool rental host guide

(Opening: 3–4 sentences. Be honest about the ${state} market — season length, climate, demand, top 2–3 metro markets. No banned words.)

## The legal landscape in ${state}

(1–2 paragraphs covering state-level law: is there a statewide STR registry? An HOA preemption statute? State pool barrier/fence code? Reference the specific statute name and number ONLY if the source supports it. Cite inline.)

## Counties and cities that drive the rule

(THIS IS THE MOST IMPORTANT SECTION. Pick the 3–5 counties or cities in ${state} that actually drive pool-host compliance. For each one, write 1 short paragraph naming: the specific ordinance or program name, the fee range if known, what triggers it (overnight vs hourly, primary residence rule, etc), and what a host should do first. Use subheadings like "### Los Angeles County (Los Angeles, Long Beach)". Cite each fact inline with a markdown link to the source URL.)

## Permits and registrations you actually need

(Bullet list of 4–7 items: STR registration, business license, sales/lodging tax registration, health department review if applicable, ${state}-specific items. For each bullet, say whether it's typically required, sometimes required, or rare. Cite where possible.)

## Pool safety code in ${state}

(1 paragraph on the state pool barrier law — name and reference the specific code if a source supports it, e.g. California Title 24 / Florida Residential Swimming Pool Safety Act. Explain how it applies to a commercial rental pool vs a private pool.)

## HOA exposure

(1 paragraph on how HOAs typically treat hourly pool rentals in ${state}. If the state has any HOA pre-emption law for STRs, name and cite it. Link to our HOA defense kit: /p/hoa-pool-rental-defense-kit.)

## Insurance for ${state} hosts

(1 short paragraph: standard homeowners excludes commercial pool use; PRNM includes $2M Hartford-backed liability per booking; link to /p/pool-rental-insurance-explained for the deep dive.)

## Earnings outlook

(A small markdown table: Region | Typical hourly rate | Season length. Use realistic $40–$150/hr ranges and honest season-length numbers for ${state}'s climate. 1 sentence below the table on realistic monthly income at typical 8–12 hr/week summer occupancy.)

## What to do before you list

(Numbered list of 6–8 concrete next steps a ${state} homeowner should take, in order. Each item one sentence.)

## Sources cited

(A clean numbered list of every URL you cited above, in order, formatted as: 1. [Title](URL))

STRICT VOICE RULES:
- Sentence case headings (already shown above).
- Second person ("you", "your pool").
- No em dashes. Use commas, periods, or restructure.
- BANNED words: leverage, utilize, seamlessly, robust, dive into, elevate, game-changer, unlock, journey, landscape, bustling, thriving, vibrant, state-of-the-art, cutting-edge.
- BANNED phrases: "in this article", "in conclusion", "it's worth noting", "thousands of hosts", "Pool Rental Near Me is the leading".
- Numbers under 10 spelled out, 10+ as numerals.
- Dollar amounts as $X/hour, never "per hour".
- Never invent statistics, ordinance numbers, or fee amounts. If a source doesn't support it, say "check with your city or county clerk" instead.
- Differentiators to mention naturally where relevant: 10% flat host fee, $2M Hartford-backed liability insurance per booking.

Return ONLY the markdown body starting with "# ${state} pool rental host guide". No preamble.

SOURCES:

${sourceBlocks}`;
}

async function generateWithGemini(prompt: string): Promise<string> {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOV_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`AI gateway ${r.status}: ${t.slice(0, 300)}`);
  }
  const j = await r.json();
  const content = j?.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned no content");
  return String(content).trim();
}

async function processOne(stateSlug: string, opts: { dry: boolean }) {
  const name = STATE_FROM_SLUG[stateSlug];
  if (!name) throw new Error(`Unknown state slug: ${stateSlug}`);
  const dbSlug = `host-advocacy-${stateSlug}`;

  console.log(`\n=== ${name} (${dbSlug}) ===`);

  const sources = await gatherSources(name);
  if (sources.length < 3) {
    console.warn(`  ⚠ only ${sources.length} usable sources — skipping`);
    return;
  }

  console.log(`  → calling Gemini 2.5 Pro with ${sources.length} sources…`);
  const md = await generateWithGemini(buildPrompt(name, sources));
  console.log(`  ✓ generated ${md.length} chars (~${Math.round(md.split(/\s+/).length)} words)`);

  if (opts.dry) {
    console.log("\n--- DRY RUN PREVIEW (first 2000 chars) ---\n");
    console.log(md.slice(0, 2000));
    console.log("\n--- (truncated) ---");
    return;
  }

  const { error } = await sb
    .from("content_pages")
    .update({
      content: md,
      body_markdown: md,
      status: "published",
      updated_at: new Date().toISOString(),
      content_refreshed_at: new Date().toISOString(),
    })
    .eq("slug", dbSlug);
  if (error) throw error;
  console.log(`  ✓ wrote to content_pages where slug=${dbSlug}`);
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry");
  const allEmpty = args.includes("--all-empty");
  const positional = args.filter((a) => !a.startsWith("--"));

  let slugs: string[] = [];
  if (allEmpty) {
    const { data, error } = await sb
      .from("content_pages")
      .select("slug,content")
      .eq("template_type", "host_advocacy_state");
    if (error) throw error;
    slugs = (data ?? [])
      .filter((r) => !r.content || r.content.length < 500)
      .map((r) => r.slug!.replace(/^host-advocacy-/, ""))
      .filter((s) => STATE_FROM_SLUG[s]);
    console.log(`Found ${slugs.length} empty/thin state pages to fill`);
  } else if (positional.length > 0) {
    slugs = positional;
  } else {
    console.error("Usage: bun scripts-tmp-gen-advocacy-v2.ts <state-slug> [--dry]");
    console.error("   or: bun scripts-tmp-gen-advocacy-v2.ts --all-empty [--dry]");
    process.exit(1);
  }

  for (const s of slugs) {
    try {
      await processOne(s, { dry });
    } catch (e) {
      console.error(`  ✗ ${s}: ${(e as Error).message}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
