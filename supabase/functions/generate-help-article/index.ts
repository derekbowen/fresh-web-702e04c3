import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are a senior SEO content writer for PoolRentalNearMe.com, a peer-to-peer pool rental marketplace (similar to Swimply). You write practical, friendly, expert help-center articles for pool hosts and guests in the United States.

Rules:
- Output GitHub-flavored Markdown only. No HTML, no code fences around the whole document, no preamble.
- Start with a single H1 (\`# Title\`).
- Follow with a short 2-3 sentence intro.
- Use clear H2 (\`##\`) sections, with H3 (\`###\`) sub-sections where useful.
- Include numbered steps and bulleted lists where appropriate.
- Use **bold** for emphasis on key terms.
- Include a \`## Frequently Asked Questions\` section near the end with 3-5 Q&A pairs (each question as \`### Question text\` then a 2-4 sentence answer).
- End with a \`## Related articles\` section listing the internal links provided.
- Tone: helpful, concrete, action-oriented, no fluff, no hallucinated statistics.
- Length: 800-1100 words.
- Mention support contacts where natural: support@poolrentalnearme.com and host support 866-420-3702.
- Never invent fake URLs. Only use the internal links provided in the user prompt.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY missing");
    if (!prompt) throw new Error("prompt required");

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      return new Response(JSON.stringify({ error: text, status: r.status }), {
        status: r.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
