/**
 * Public hook: Fix 1 — host_acq_city tail rewrites + empty-body full generations.
 *
 * Picks pages from content_pages where template_type='host_acq_city' AND
 * status='published' AND either body_markdown is empty (→ full ~1,200 word
 * generation) OR contains the "Related Pool Owner Guides" boilerplate tail
 * (→ strip + replace with a city-specific ~800 char closing block).
 *
 * Idempotent via content_refreshed_at marker (set on success).
 *
 * Body: { limit?: number (default 20, max 40) }
 * Returns: { ok, processed, succeeded_full, succeeded_tail, failed, remaining, errors }
 */
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { authorizeHookRequest } from "@/server/hook-auth.server";

const STATE_NAMES: Record<string, string> = {
  al: "Alabama", ak: "Alaska", az: "Arizona", ar: "Arkansas", ca: "California",
  co: "Colorado", ct: "Connecticut", de: "Delaware", fl: "Florida", ga: "Georgia",
  hi: "Hawaii", id: "Idaho", il: "Illinois", in: "Indiana", ia: "Iowa",
  ks: "Kansas", ky: "Kentucky", la: "Louisiana", me: "Maine", md: "Maryland",
  ma: "Massachusetts", mi: "Michigan", mn: "Minnesota", ms: "Mississippi",
  mo: "Missouri", mt: "Montana", ne: "Nebraska", nv: "Nevada", nh: "New Hampshire",
  nj: "New Jersey", nm: "New Mexico", ny: "New York", nc: "North Carolina",
  nd: "North Dakota", oh: "Ohio", ok: "Oklahoma", or: "Oregon", pa: "Pennsylvania",
  ri: "Rhode Island", sc: "South Carolina", sd: "South Dakota", tn: "Tennessee",
  tx: "Texas", ut: "Utah", vt: "Vermont", va: "Virginia", wa: "Washington",
  wv: "West Virginia", wi: "Wisconsin", wy: "Wyoming", dc: "District of Columbia",
};

const STATE_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAMES).map(([code, name]) => [name.toLowerCase().replace(/\s+/g, "-"), code])
);

async function parseCityState(slug: string): Promise<{ city: string; state: string; stCode: string } | null> {
  const titleize = (s: string) => s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  // Pattern A: ...-{city}-{xx}
  let m = slug.match(/^become-a-(?:swimming-)?pool-host-(.+)-([a-z]{2})$/);
  if (m && STATE_NAMES[m[2]]) {
    return { city: titleize(m[1]), state: STATE_NAMES[m[2]], stCode: m[2].toUpperCase() };
  }
  // Pattern B: ...-{city}-{full-state-name} (e.g. -tucson-arizona, -lake-tahoe-nevada-california → take last 1-2 tokens)
  m = slug.match(/^become-a-(?:swimming-)?pool-host-(.+)$/);
  if (m) {
    const tokens = m[1].split("-");
    // try last-1 then last-2 tokens as state name
    for (const take of [1, 2]) {
      if (tokens.length <= take) continue;
      const stateKey = tokens.slice(-take).join("-");
      const code = STATE_NAME_TO_CODE[stateKey];
      if (code) {
        return { city: titleize(tokens.slice(0, -take).join("-")), state: STATE_NAMES[code], stCode: code.toUpperCase() };
      }
    }
    // Pattern C: stateless — lookup in cities table by name
    const cityName = titleize(tokens.join("-"));
    const { data } = await (supabaseAdmin as any)
      .from("cities").select("name, state, state_code")
      .ilike("name", cityName).eq("is_published", true).limit(1).maybeSingle();
    if (data?.state_code) {
      return { city: data.name, state: data.state, stCode: data.state_code };
    }
  }
  return null;
}

const BOILER_RE = /\n#+\s*Related Pool Owner Guides[\s\S]*$/i;
const MAKE_MONEY_RE = /\n[\*\-]\s*\[Make Money Renting Out Your Pool\][\s\S]*$/i;
const LEGACY_LINK_RE = /\n[\*\-]\s*\[\/make_money_renting_out_your_pool[\s\S]*$/i;

function stripBoiler(body: string): string {
  if (!body) return "";
  let out = body;
  out = out.replace(BOILER_RE, "");
  out = out.replace(MAKE_MONEY_RE, "");
  out = out.replace(LEGACY_LINK_RE, "");
  return out.trimEnd();
}

const VOICE_RULES = `Voice: founder-mentor to homeowner. Second person ("your pool"). Sentence case headings.
No em dashes. Numbers under 10 spelled out, 10+ numerals. Dollar amounts $X/hour.
Banned words: leverage, utilize, seamlessly, robust, dive into, elevate, game-changer, unlock, journey, landscape, bustling, thriving, vibrant, state-of-the-art, cutting-edge.
Banned phrases: "in this article", "in conclusion", "it's worth noting", "thousands of hosts", "proven track record".
Real numbers only: hourly rates $40-150, monthly $3,000-$10,000 in season.
If unsure of specific neighborhood names in this city, use phrasing like "neighborhoods near downtown {city}" or "{city}'s east side" — do not invent names.`;

function tailPrompt(city: string, state: string): string {
  return `Write a city-specific closing block for a pool-rental host acquisition page about ${city}, ${state}.

REQUIREMENTS:
- 700-900 characters of markdown
- Start with an H2 like "## Why ${city} pools earn" or "## Renting your ${city} pool"
- Must mention: ${city}, ${state}, 2-3 real neighborhoods or districts in ${city}, one climate/season detail specific to ${city} (months pools are usable, summer highs, monsoon, humidity, etc.)
- One CTA paragraph with a markdown link to /p/hosting
- Mention Pool Rental Near Me's 10% flat host fee and $2M liability insurance naturally, once
${VOICE_RULES}

Output ONLY the markdown block. No preamble, no commentary, no code fence.`;
}

function fullPrompt(city: string, state: string, stCode: string): string {
  return `Write a complete ~1,200-word host acquisition page in markdown for pool owners in ${city}, ${state} (${stCode}).

STRUCTURE (use these exact H2 headings in order):
1. # Rent your pool in ${city}, ${state} (H1, one line)
2. ## Why ${city} backyard pools earn (climate, pool season months, why local demand is real — ~200 words)
3. ## What you can earn in ${city} (hourly $40-150, monthly $3,000-$10,000 in season, one math example — ~200 words)
4. ## Neighborhoods where pools rent fastest (2-3 real neighborhoods or districts in ${city} with one sentence each on why — ~200 words)
5. ## What hosting actually looks like (booking, $2M liability insurance, 10% flat host fee, payouts — ~200 words)
6. ## ${city} vs other side hustles (vs Airbnb short-term rental, vs Turo, vs dog boarding — ~150 words)
7. ## Get started in ${city} (numbered steps, link to /p/hosting and /signup — ~150 words)

${VOICE_RULES}

Output ONLY the markdown. No preamble, no code fence.`;
}

async function callAi(apiKey: string, prompt: string): Promise<{ ok: true; text: string } | { ok: false; err: string }> {
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (resp.status === 402) return { ok: false, err: "AI credits exhausted" };
    if (resp.status === 429) return { ok: false, err: "rate limited" };
    if (!resp.ok) return { ok: false, err: `gateway ${resp.status}` };
    const json = await resp.json() as any;
    const text = json?.choices?.[0]?.message?.content;
    if (!text || typeof text !== "string") return { ok: false, err: "empty AI response" };
    return { ok: true, text: text.trim().replace(/^```(?:markdown)?\s*/i, "").replace(/```\s*$/, "").trim() };
  } catch (e: any) {
    return { ok: false, err: `fetch_error:${e?.message || "unknown"}` };
  }
}

interface Row { id: string; slug: string; body_markdown: string | null; }

export const Route = createFileRoute("/api/public/hooks/host-city-tail-fix")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = authorizeHookRequest(request);
        if (unauth) return unauth;

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ ok: false, error: "LOVABLE_API_KEY missing" }),
            { status: 500, headers: { "Content-Type": "application/json" } });
        }

        let body: any = {};
        try { body = await request.json(); } catch {}
        const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 40);

        // Pick work: empty bodies first (full generations), then boilerplate tails
        let work: Row[] = [];
        const { data: emptyRows } = await (supabaseAdmin as any)
          .from("content_pages")
          .select("id, slug, body_markdown")
          .eq("template_type", "host_acq_city")
          .eq("status", "published")
          .or("body_markdown.is.null,body_markdown.eq.")
          .is("content_refreshed_at", null)
          .limit(limit);
        work = (emptyRows ?? []) as Row[];
        if (work.length < limit) {
          const need = limit - work.length;
          const { data: tailRows } = await (supabaseAdmin as any)
            .from("content_pages")
            .select("id, slug, body_markdown")
            .eq("template_type", "host_acq_city")
            .eq("status", "published")
            .ilike("body_markdown", "%Related Pool Owner Guides%")
            .is("content_refreshed_at", null)
            .limit(need);
          work = work.concat((tailRows ?? []) as Row[]);
        }

        const errors: string[] = [];
        let succeeded_full = 0;
        let succeeded_tail = 0;
        let failed = 0;

        const CONC = 5;
        for (let i = 0; i < work.length; i += CONC) {
          const batch = work.slice(i, i + CONC);
          await Promise.all(batch.map(async (row) => {
            const parsed = await parseCityState(row.slug);
            if (!parsed) {
              failed++; errors.push(`unparseable:${row.slug}`);
              await (supabaseAdmin as any).from("content_pages")
                .update({ content_refreshed_at: new Date().toISOString() })
                .eq("id", row.id);
              return;
            }
            const { city, state, stCode } = parsed;
            const isFull = !row.body_markdown || row.body_markdown.trim().length === 0;
            const prompt = isFull ? fullPrompt(city, state, stCode) : tailPrompt(city, state);
            const aiRes = await callAi(apiKey, prompt);
            if (!aiRes.ok) {
              failed++;
              if (errors.length < 10) errors.push(`${row.slug}:${aiRes.err}`);
              return;
            }
            let newBody: string;
            if (isFull) {
              newBody = aiRes.text;
            } else {
              const stripped = stripBoiler(row.body_markdown || "");
              let tail = aiRes.text;
              if (!tail.includes("/p/hosting")) {
                tail += `\n\n[List your ${city} pool today](/p/hosting)`;
              }
              newBody = stripped + "\n\n" + tail + "\n";
            }
            const { error: upErr } = await (supabaseAdmin as any)
              .from("content_pages")
              .update({
                body_markdown: newBody,
                content_refreshed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", row.id);
            if (upErr) {
              failed++;
              if (errors.length < 10) errors.push(`${row.slug}:db:${upErr.message}`);
              return;
            }
            if (isFull) succeeded_full++; else succeeded_tail++;
          }));
        }

        // Remaining count
        const { count: remainingEmpty } = await (supabaseAdmin as any)
          .from("content_pages")
          .select("id", { count: "exact", head: true })
          .eq("template_type", "host_acq_city")
          .eq("status", "published")
          .or("body_markdown.is.null,body_markdown.eq.")
          .is("content_refreshed_at", null);
        const { count: remainingTail } = await (supabaseAdmin as any)
          .from("content_pages")
          .select("id", { count: "exact", head: true })
          .eq("template_type", "host_acq_city")
          .eq("status", "published")
          .ilike("body_markdown", "%Related Pool Owner Guides%")
          .is("content_refreshed_at", null);

        return new Response(JSON.stringify({
          ok: true,
          processed: work.length,
          succeeded_full,
          succeeded_tail,
          failed,
          remaining_full: remainingEmpty ?? 0,
          remaining_tail: remainingTail ?? 0,
          errors,
        }), { headers: { "Content-Type": "application/json" } });
      },
    },
  },
});
