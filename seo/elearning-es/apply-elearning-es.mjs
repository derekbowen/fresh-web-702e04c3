// Spanish Health pack — staged INSERTs into `courses` (prnm-content-production).
// STAGE + HOLD: DRY by default (DRY=false to apply). Idempotent: checks slug
// first and skips existing rows, so a re-run never duplicates.
//
//   node apply-elearning-es.mjs           # dry run (prints what WOULD insert)
//   DRY=false node apply-elearning-es.mjs # apply for real
//
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const URL = process.env.SUPABASE_URL || "https://qbzpjsiahqgyoazjurqy.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || readFileSync("/tmp/.sk", "utf8").trim();
const DRY = process.env.DRY !== "false";
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const files = readdirSync(join(HERE, "courses")).filter(f => f.endsWith(".mjs")).sort();
const courses = [];
for (const f of files) {
  const mod = await import(join(HERE, "courses", f));
  courses.push(mod.default);
}
console.log(`loaded ${courses.length} course(s): ${files.join(", ")}`);

const exists = async (slug) => {
  const r = await fetch(`${URL}/rest/v1/courses?slug=eq.${encodeURIComponent(slug)}&select=slug`, { headers: H });
  if (!r.ok) throw new Error(`check ${slug}: ${r.status} ${await r.text()}`);
  return (await r.json()).length > 0;
};

let inserted = 0, skipped = 0;
for (const c of courses) {
  const already = await exists(c.slug);
  if (already) { console.log(`SKIP (exists) ${c.slug}`); skipped++; continue; }
  const row = {
    slug: c.slug, title: c.title, subtitle: c.subtitle ?? null, excerpt: c.excerpt ?? null,
    description: c.description ?? null, category: c.category, language: c.language,
    tier: c.tier ?? null, level: c.level ?? null, duration_minutes: c.duration_minutes ?? null,
    is_featured: !!c.is_featured, is_published: !!c.is_published,
    seo_title: c.seo_title ?? null, seo_description: c.seo_description ?? null,
    long_form_content: c.long_form_content ?? null,
    published_at: new Date().toISOString(),
  };
  if (DRY) {
    console.log(`DRY insert ${c.slug} | ${c.category}/${c.language} | "${c.title}" | body=${(c.long_form_content||"").length}ch`);
    continue;
  }
  const r = await fetch(`${URL}/rest/v1/courses`, {
    method: "POST", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify([row]),
  });
  if (!r.ok) { console.log(`FAIL ${c.slug}: ${r.status} ${await r.text()}`); continue; }
  inserted++; console.log(`OK insert ${c.slug}`);
}
console.log(`\n${DRY ? "DRY-RUN" : "APPLIED"}: ${courses.length} course(s), ${DRY ? 0 : inserted} inserted, ${skipped} skipped(existing)`);
