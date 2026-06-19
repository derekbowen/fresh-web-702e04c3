/**
 * Share-Kit caption generator.
 *
 * Given a listing, produces three ready-to-paste social captions (hype,
 * family, weekend-party) in PRNM founder voice. Reuses the same OpenRouter
 * pattern as auto-outreach.server.ts / email-composer.server.ts — one gateway,
 * one key (OPENROUTER_API_KEY), JSON-object response. No separate Anthropic path.
 */
const AI_URL = "https://openrouter.ai/api/v1/chat/completions";
const AI_MODEL = "google/gemini-3-flash-preview";

export type ShareCaptions = {
  hype: string;
  family: string;
  weekend: string;
};

type ListingCtx = {
  title: string | null;
  city: string | null;
  state: string | null;
  pricePerHourCents: number | null;
  shareUrl: string;
};

const SYSTEM = `You write short, ready-to-paste social captions for a Pool Rental Near Me host promoting their own pool. Pool Rental Near Me is a Swimply alternative: 10% flat host fee (vs 15%+), $2M liability insurance included, pools rent by the hour ($40-150/hr typical).
Voice: warm, second person, sentence case, no em dashes, no hype-cliches (no "dive in", "make a splash", "oasis", "paradise", "unforgettable"). Light emoji ok (max 1-2). Each caption is the host talking, first person about their pool.
Each caption ends with a soft call to book. Do not paste a URL; the host adds their link separately.`;

export async function generateShareCaptions(listing: ListingCtx): Promise<ShareCaptions | { error: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return { error: "OPENROUTER_API_KEY not set" };

  const price =
    listing.pricePerHourCents != null ? `$${Math.round(listing.pricePerHourCents / 100)}/hr` : "by the hour";
  const where = [listing.city, listing.state].filter(Boolean).join(", ") || "your area";
  const ctx = `Pool: ${listing.title ?? "my pool"} | location: ${where} | price: ${price}.
Return JSON {"hype": string, "family": string, "weekend": string}.
- hype: punchy, excitement, "my pool is open for booking".
- family: warm, safe, kid/grandkid friendly daytime swim.
- weekend: a weekend hang with friends, chill party energy (no wild-party framing).
Each 1-3 sentences, under 280 characters.`;

  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: ctx },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.warn("[share-kit] ai", res.status, t.slice(0, 200));
    return { error: `AI request failed (${res.status})` };
  }
  const j = await res.json();
  const txt = j?.choices?.[0]?.message?.content;
  if (!txt) return { error: "Empty AI response" };
  try {
    const p = JSON.parse(txt);
    if (!p.hype || !p.family || !p.weekend) return { error: "AI response missing a caption" };
    return { hype: String(p.hype), family: String(p.family), weekend: String(p.weekend) };
  } catch {
    return { error: "Could not parse AI response" };
  }
}
