/**
 * Fallback hero image generator. Used when scraping can't find a hero
 * image for a city. Generates a unique image via Lovable AI Gateway,
 * uploads it to the `city-heroes` Supabase Storage bucket, and returns
 * the public URL. Caller is responsible for persisting the URL into
 * `cities.hero_image_url`.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BUCKET = "city-heroes";
const MODEL = "google/gemini-3.1-flash-image-preview";

export type FallbackResult =
  | { ok: true; hero_url: string }
  | { ok: false; error: string };

function buildPrompt(cityName: string, state: string | null | undefined) {
  const where = state ? `${cityName}, ${state}` : cityName;
  // Avoid recognizable landmarks / people. Aim for an evocative, sun-soaked
  // backyard pool scene that feels appropriate for any North American city.
  return [
    `A photorealistic backyard swimming pool scene evoking ${where}.`,
    `Crystal-clear turquoise water, warm afternoon sun, lush landscaping,`,
    `comfortable lounge chairs and a tasteful patio. Wide cinematic 16:9 framing,`,
    `golden hour lighting, soft depth of field. No people, no text, no logos,`,
    `no recognizable landmarks. Suitable as a website hero image for a pool rental listing.`,
  ].join(" ");
}

function pickImageFromCompletion(json: unknown): string | null {
  // Lovable AI returns image-capable model results either as a data URL in
  // message.content, or as an `images` array on the message. Be defensive.
  type Msg = {
    content?: string;
    images?: Array<{ image_url?: { url?: string }; url?: string }>;
  };
  const choices = (json as { choices?: Array<{ message?: Msg }> }).choices;
  const msg = choices?.[0]?.message;
  if (!msg) return null;
  if (Array.isArray(msg.images)) {
    for (const img of msg.images) {
      const url = img?.image_url?.url ?? img?.url;
      if (typeof url === "string" && url.startsWith("data:image/")) return url;
      if (typeof url === "string" && /^https?:\/\//.test(url)) return url;
    }
  }
  if (typeof msg.content === "string") {
    const m = msg.content.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/);
    if (m) return m[0];
  }
  return null;
}

async function dataUrlOrFetchToBytes(src: string): Promise<{ bytes: Uint8Array; contentType: string }> {
  if (src.startsWith("data:")) {
    const [meta, b64] = src.split(",", 2);
    const ctMatch = meta.match(/data:([^;]+);base64/);
    const contentType = ctMatch?.[1] ?? "image/png";
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { bytes, contentType };
  }
  const res = await fetch(src);
  if (!res.ok) throw new Error(`fetch image ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") ?? "image/png";
  return { bytes: buf, contentType };
}

export async function generateAndUploadHero(
  citySlug: string,
  cityName: string,
  state: string | null | undefined,
): Promise<FallbackResult> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { ok: false, error: "LOVABLE_API_KEY is not configured" };

  const prompt = buildPrompt(cityName, state);

  let res: Response;
  try {
    res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        modalities: ["image", "text"],
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch (e) {
    return { ok: false, error: `gateway fetch failed: ${e instanceof Error ? e.message : String(e)}` };
  }

  if (res.status === 429) return { ok: false, error: "AI gateway rate limit (429)" };
  if (res.status === 402) return { ok: false, error: "AI gateway credits exhausted (402)" };
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    return { ok: false, error: `gateway ${res.status}: ${txt.slice(0, 200)}` };
  }

  const json = await res.json().catch(() => null);
  const imgRef = json ? pickImageFromCompletion(json) : null;
  if (!imgRef) return { ok: false, error: "no image returned by AI gateway" };

  let bytes: Uint8Array; let contentType: string;
  try {
    ({ bytes, contentType } = await dataUrlOrFetchToBytes(imgRef));
  } catch (e) {
    return { ok: false, error: `decode image failed: ${e instanceof Error ? e.message : String(e)}` };
  }

  const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg"
    : contentType.includes("webp") ? "webp" : "png";
  const path = `${citySlug}-${Date.now()}.${ext}`;

  const { error: upErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: true, cacheControl: "31536000" });
  if (upErr) return { ok: false, error: `storage upload: ${upErr.message}` };

  const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  if (!pub?.publicUrl) return { ok: false, error: "no public URL" };
  return { ok: true, hero_url: pub.publicUrl };
}
