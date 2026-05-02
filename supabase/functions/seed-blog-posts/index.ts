import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { posts, secret } = await req.json();
    if (secret !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.slice(-12)) {
      return new Response("forbidden", { status: 403, headers: cors });
    }
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const rows = posts.map((p: any) => ({ ...p, author: "PoolRentalNearMe Editorial", is_published: true, published_at: new Date().toISOString() }));
    const { error, count } = await supa.from("blog_posts").upsert(rows, { onConflict: "slug", count: "exact" });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ ok: true, count }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
