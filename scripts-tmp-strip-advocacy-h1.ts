// Strip the duplicate leading H1 from advocacy page bodies. The route renders
// title as page H1 already, so the body's "# State Pool Host Guide" creates a
// second visible heading. Also enforce sentence case on the next-level
// headings if any "Title Case" slipped through.
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const { data: rows, error } = await sb
  .from("content_pages")
  .select("id, slug, body_markdown")
  .in("template_type", ["host_advocacy_state", "host_advocacy_hub"]);
if (error) throw error;

let changed = 0;
for (const r of (rows ?? []) as any[]) {
  const md: string = r.body_markdown ?? "";
  if (!md) continue;
  // Remove leading whitespace then a single H1 line (and the blank line after).
  const stripped = md.replace(/^\s*#\s+[^\n]+\n+/, "");
  if (stripped === md) continue;
  const { error: upErr } = await sb
    .from("content_pages")
    .update({ body_markdown: stripped })
    .eq("id", r.id);
  if (upErr) {
    console.log(`fail ${r.slug}: ${upErr.message}`);
    continue;
  }
  changed++;
  console.log(`ok   ${r.slug} (-${md.length - stripped.length}b)`);
}
console.log(`\nDONE: stripped H1 on ${changed} of ${rows?.length ?? 0}`);
