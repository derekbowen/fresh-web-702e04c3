import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const { data, error } = await sb
  .from("content_pages")
  .select("id, slug, body_markdown")
  .in("template_type", ["host_advocacy_state","host_advocacy_hub"]);
if (error) throw error;
const bad = (data ?? []).filter((r:any) => r.body_markdown && (r.body_markdown.length < 2000 || /maintenance mode/i.test(r.body_markdown)));
console.log("Reverting", bad.length);
for (const r of bad) {
  await sb.from("content_pages").update({ body_markdown: null, raw_html: null, scraped_at: null, status: "pending" }).eq("id", r.id);
  console.log("  -", r.slug, r.body_markdown.length);
}
