// Rescue generator for thin swim_instructor_city pages.
// One slug per call. Generates ~2k words via Lovable AI, updates content_pages.body_markdown.
// Protected by RESCUE_TOKEN header.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const US_STATES: Record<string, string> = {
  al:"Alabama",ak:"Alaska",az:"Arizona",ar:"Arkansas",ca:"California",co:"Colorado",
  ct:"Connecticut",de:"Delaware",fl:"Florida",ga:"Georgia",hi:"Hawaii",id:"Idaho",
  il:"Illinois","in":"Indiana",ia:"Iowa",ks:"Kansas",ky:"Kentucky",la:"Louisiana",
  me:"Maine",md:"Maryland",ma:"Massachusetts",mi:"Michigan",mn:"Minnesota",
  ms:"Mississippi",mo:"Missouri",mt:"Montana",ne:"Nebraska",nv:"Nevada",nh:"New Hampshire",
  nj:"New Jersey",nm:"New Mexico",ny:"New York",nc:"North Carolina",nd:"North Dakota",
  oh:"Ohio",ok:"Oklahoma",or:"Oregon",pa:"Pennsylvania",ri:"Rhode Island",
  sc:"South Carolina",sd:"South Dakota",tn:"Tennessee",tx:"Texas",ut:"Utah",vt:"Vermont",
  va:"Virginia",wa:"Washington",wv:"West Virginia",wi:"Wisconsin",wy:"Wyoming",
};

function parseSlug(slug: string) {
  const rest = slug.replace(/^swim-instructor-pool-rental-/, "");
  const m = rest.match(/^(.+)-([a-z]{2})$/);
  if (m && US_STATES[m[2]]) {
    const city = m[1].split("-").map(s => s.charAt(0).toUpperCase()+s.slice(1)).join(" ");
    return { city, sc: m[2].toUpperCase(), sn: US_STATES[m[2]] };
  }
  return { city: rest.replace(/-/g," "), sc: "", sn: "" };
}

const SYSTEM = `You write expert, locally-grounded SEO content for Pool Rental Near Me.

VOICE & RULES (strict):
- Sentence case headings, second person.
- No em dashes. Banned words: leverage, utilize, seamlessly, robust, dive into, elevate, game-changer, unlock, journey, landscape, bustling, thriving, vibrant, state-of-the-art, cutting-edge.
- Banned phrases: "in this article", "in conclusion", "it's worth noting".
- Numbers under 10 spelled out; 10+ numerals. Dollars as $X/hour.
- Real numbers only. Pool rental: $45-$120/hour. Lessons: $65-$110 per 30-min private, $30-$45/child small group.
- Weave naturally (not all at once): 10% flat host fee (vs Swimply 15%+), $2M liability insurance included.
- Tone: founder talking to a working swim instructor.

DO NOT include H1, the pricing-benchmark list, or the "What you need before your first class" list — the template renders those. Start with an H2. Output raw markdown only.`;

function userPrompt(city: string, sc: string, sn: string) {
  const where = sc ? `${city}, ${sc}` : city;
  return `Write a unique 1,900-2,300 word markdown article for "Rent a Pool to Teach Swim Lessons in ${where}". Audience: independent swim instructors, coaches, and small swim schools in or near ${where}.

Sections (H2 in order). Each must be specific to ${where} — real local context (climate/season length, school year rhythms, neighboring feeder cities, typical backyard pool styles). No invented statistics; describe directionally.

1. The ${where} swim instruction market in plain numbers (paragraph + 4-6 bullets: who books, age mix, peak months, why parents pay private vs YMCA)
2. Why private backyard pools beat community pools for instruction here (heated water, no lane sharing, custom schedule, shade common in ${city} backyards)
3. How to find ${city}-area host pools that allow lessons (filter tips, what to message hosts, red flags)
4. Building a profitable ${city} lesson business: pricing playbook with one worked example for ${where} that clears $80-$150/hour gross
5. Insurance, certification, and liability for instructors in ${sn || "your state"} (WSI, ASCA, USA Swimming; what the $2M baseline covers and doesn't; why you still need pro liability)
6. Curriculum playbook for a 4-week series (parent-tot, learn-to-swim levels, stroke clinics, adult triathlon) - what to teach in 45 min
7. Year-round vs seasonal demand in ${city} (write to the actual climate; indoor/heated options if cold, peak-summer crunch if warm)
8. Setting up the business side: LLC, EIN, 1099, simple booking + payment that pairs with hourly pool rentals
9. 4-6 ${city}-specific FAQs answered in 2-4 sentences each

End with one short paragraph (no heading) inviting readers to browse ${city} pools.

Paragraphs 2-4 sentences. Bullets for lists. Bold sparingly. Markdown only.`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  // One-shot rescue job; deleted after use. Token gate via fixed string.
  const token = req.headers.get("x-rescue-token");
  if (token !== "swim-rescue-2026-05-22") {
    return new Response("forbidden", { status: 403 });
  }

  let slug = "";
  try {
    const body = await req.json();
    slug = String(body?.slug || "");
  } catch {
    return new Response("bad json", { status: 400 });
  }
  if (!slug.startsWith("swim-instructor-pool-rental-")) {
    return new Response("bad slug", { status: 400 });
  }

  const { city, sc, sn } = parseSlug(slug);

  const aiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!aiKey) return Response.json({ error: "LOVABLE_API_KEY missing" }, { status: 500 });

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Skip-if-already-long guard
  const { data: existing } = await sb
    .from("content_pages")
    .select("body_markdown")
    .eq("slug", slug)
    .maybeSingle();
  const existingLen = (existing?.body_markdown || "").length;
  if (existingLen >= 8000) {
    return Response.json({ slug, ok: true, skipped: true, reason: "already-long", len: existingLen });
  }

  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${aiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt(city, sc, sn) },
      ],
    }),
  });

  if (!aiResp.ok) {
    const t = await aiResp.text();
    return Response.json({ slug, error: `ai ${aiResp.status}: ${t.slice(0,500)}` }, { status: 502 });
  }
  const aiJson = await aiResp.json();
  const md = aiJson?.choices?.[0]?.message?.content || "";
  if (!md || md.length < 1500) {
    return Response.json({ slug, error: "short output", len: md.length, preview: md.slice(0,300) }, { status: 500 });
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { error: upErr } = await sb
    .from("content_pages")
    .update({ body_markdown: md, updated_at: new Date().toISOString() })
    .eq("slug", slug);
  if (upErr) return Response.json({ slug, error: `db: ${upErr.message}` }, { status: 500 });

  return Response.json({ slug, ok: true, len: md.length, city: `${city}, ${sc}` });
});
