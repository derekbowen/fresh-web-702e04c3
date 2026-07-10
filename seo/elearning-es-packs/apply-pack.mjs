// Generic ES academy pack apply — STAGE + HOLD (DRY by default).
// Usage:  node apply-pack.mjs <packDir>          # dry preview
//         DRY=false node apply-pack.mjs <packDir> # insert for real (idempotent by slug)
// packDir is relative to this file, e.g. getting-started | pricing | legal
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, isAbsolute } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const pack = process.argv[2];
if (!pack) { console.error("usage: node apply-pack.mjs <packDir>"); process.exit(1); }
const packDir = isAbsolute(pack) ? pack : join(HERE, pack);

const URL = process.env.SUPABASE_URL || "https://qbzpjsiahqgyoazjurqy.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || readFileSync("/tmp/.sk", "utf8").trim();
const DRY = process.env.DRY !== "false";
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const files = readdirSync(packDir).filter(f => f.endsWith(".mjs")).sort();
const courses = [];
for (const f of files) courses.push((await import(join(packDir, f))).default);
console.log(`pack=${pack} loaded ${courses.length}: ${files.join(", ")}`);

const exists = async (slug) => {
  const r = await fetch(`${URL}/rest/v1/courses?slug=eq.${encodeURIComponent(slug)}&select=slug`, { headers: H });
  if (!r.ok) throw new Error(`check ${slug}: ${r.status} ${await r.text()}`);
  return (await r.json()).length > 0;
};

let inserted = 0, skipped = 0;
for (const c of courses) {
  if (await exists(c.slug)) { console.log(`SKIP (exists) ${c.slug}`); skipped++; continue; }
  const row = {
    slug: c.slug, title: c.title, subtitle: c.subtitle ?? null, excerpt: c.excerpt ?? null,
    description: c.description ?? null, category: c.category, language: c.language,
    tier: c.tier ?? null, level: c.level ?? null, duration_minutes: c.duration_minutes ?? null,
    is_featured: !!c.is_featured, is_published: !!c.is_published,
    seo_title: c.seo_title ?? null, seo_description: c.seo_description ?? null,
    long_form_content: c.long_form_content ?? null, published_at: new Date().toISOString(),
  };
  if (DRY) { console.log(`DRY ${c.slug} | ${c.category}/${c.language} | body=${(c.long_form_content||"").length}ch`); continue; }
  const r = await fetch(`${URL}/rest/v1/courses`, { method: "POST", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify([row]) });
  if (!r.ok) { console.log(`FAIL ${c.slug}: ${r.status} ${await r.text()}`); continue; }
  inserted++; console.log(`OK ${c.slug}`);
}
console.log(`\n${DRY ? "DRY-RUN" : "APPLIED"}: ${courses.length}, ${DRY ? 0 : inserted} inserted, ${skipped} skipped`);
