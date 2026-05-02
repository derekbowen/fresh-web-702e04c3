// One-shot seeder: accepts an array of provider rows and upserts to public.providers
// Auth: requires the SERVICE_ROLE key in the Authorization header.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    // One-shot seeder; access controlled by knowing the function URL + a constant token.
    const ONE_SHOT = "seed-pool-builders-2026";
    if ((req.headers.get("x-seed-secret") ?? "") !== ONE_SHOT) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json();
    const rows = body.providers as Array<Record<string, unknown>>;
    if (!Array.isArray(rows)) {
      return new Response(JSON.stringify({ error: "providers array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert in chunks of 100 to stay within request limits
    let total = 0;
    const errors: string[] = [];
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error, count } = await supabase
        .from("providers")
        .upsert(chunk, { onConflict: "slug", count: "exact" });
      if (error) errors.push(`chunk ${i}: ${error.message}`);
      else total += count ?? chunk.length;
    }

    return new Response(JSON.stringify({ upserted: total, errors }), {
      status: errors.length ? 207 : 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
