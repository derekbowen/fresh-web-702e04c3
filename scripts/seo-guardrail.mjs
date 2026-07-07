#!/usr/bin/env node
/**
 * SEO GUARDRAIL — deploy-checklist regression check for the top-30 money pages.
 *
 * Captures the ranking-critical signals (HTTP status, <title>, canonical,
 * meta/header robots, first <h1>, visible word count) for the pages that earn
 * ~59% of organic clicks (GSC 2026-07-06), and compares a live run against a
 * known-good baseline so any deploy that damages a money page is caught instantly.
 *
 *   node seo-guardrail.mjs --snapshot   # capture current live state -> baseline.json
 *   node seo-guardrail.mjs              # verify current vs baseline (exit 1 on FAIL)
 *   node seo-guardrail.mjs --json       # verify + emit machine-readable JSON
 *
 * Standing policy (infra doc): no title/canonical/H1/URL/robots change on any
 * page in targets without explicit owner sign-off.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIR = dirname(fileURLToPath(import.meta.url));
const TARGETS = JSON.parse(readFileSync(join(DIR, 'seo-guardrail.targets.json'), 'utf8'));
const BASELINE = join(DIR, 'seo-guardrail.baseline.json');
const SNAPSHOT = process.argv.includes('--snapshot');
const JSON_OUT = process.argv.includes('--json');
const UA = 'PRNM-SEO-Guardrail/1.0';

const pick = (re, s) => { const m = s.match(re); return m ? m[1].trim() : null; };
const stripText = s => s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ').trim();

async function probe(path) {
  const url = TARGETS.base + path;
  const r = { path };
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    const html = await res.text();
    r.status = res.status;
    r.finalUrl = res.url;
    r.xRobots = res.headers.get('x-robots-tag') || null;
    r.title = pick(/<title[^>]*>([^<]*)<\/title>/i, html);
    r.canonical = pick(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i, html)
      || pick(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i, html);
    const robots = pick(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["']/i, html) || '';
    r.robots = robots || null;
    r.noindex = /noindex/i.test(robots) || /noindex/i.test(r.xRobots || '');
    r.h1 = pick(/<h1[^>]*>([\s\S]*?)<\/h1>/i, html);
    if (r.h1) r.h1 = stripText(r.h1).slice(0, 120);
    r.words = stripText(html).split(' ').filter(Boolean).length;
  } catch (e) {
    r.status = 0; r.error = String(e).slice(0, 120);
  }
  return r;
}

async function run() {
  const cur = [];
  for (const p of TARGETS.paths) { cur.push(await probe(p)); }

  if (SNAPSHOT) {
    writeFileSync(BASELINE, JSON.stringify({ capturedAt: new Date().toISOString(), pages: cur }, null, 2));
    console.log(`✅ Baseline captured: ${cur.length} pages -> ${BASELINE}`);
    const bad = cur.filter(p => p.status !== 200);
    if (bad.length) console.log(`⚠️  ${bad.length} page(s) were NOT 200 at snapshot time:`, bad.map(b => `${b.status} ${b.path}`).join(', '));
    return 0;
  }

  if (!existsSync(BASELINE)) { console.error('No baseline. Run with --snapshot first.'); return 2; }
  const base = JSON.parse(readFileSync(BASELINE, 'utf8'));
  const bmap = Object.fromEntries(base.pages.map(p => [p.path, p]));

  const fails = [], warns = [];
  for (const c of cur) {
    const b = bmap[c.path];
    if (!b) { warns.push([c.path, 'new page not in baseline']); continue; }
    // CRITICAL regressions
    if (c.status !== 200 && b.status === 200) fails.push([c.path, `status ${b.status}->${c.status}${c.error ? ' ('+c.error+')' : ''}`]);
    if (c.noindex && !b.noindex) fails.push([c.path, `NOINDEX appeared (was indexable)`]);
    if (b.canonical && !c.canonical) fails.push([c.path, `canonical DISAPPEARED (was ${b.canonical})`]);
    if (b.words > 100 && c.words < b.words * 0.6) fails.push([c.path, `content dropped ${b.words}->${c.words} words (blank-shell risk)`]);
    // WARNINGS (review — may be intentional)
    if (b.canonical && c.canonical && b.canonical !== c.canonical) warns.push([c.path, `canonical: ${b.canonical} -> ${c.canonical}`]);
    if (b.title !== c.title) warns.push([c.path, `title: "${b.title}" -> "${c.title}"`]);
    if ((b.h1 || '') !== (c.h1 || '')) warns.push([c.path, `H1: "${b.h1}" -> "${c.h1}"`]);
    if (b.words > 100 && c.words >= b.words * 0.6 && c.words < b.words * 0.8) warns.push([c.path, `content dipped ${b.words}->${c.words} words`]);
  }

  if (JSON_OUT) { console.log(JSON.stringify({ ok: fails.length === 0, fails, warns }, null, 2)); return fails.length ? 1 : 0; }

  console.log(`\n🛡️  SEO GUARDRAIL — ${cur.length} money pages vs baseline (${base.capturedAt})\n`);
  if (!fails.length && !warns.length) console.log('✅ PASS — all money pages match baseline (status, title, canonical, robots, content).');
  if (fails.length) { console.log(`❌ ${fails.length} CRITICAL regression(s):`); for (const [p, m] of fails) console.log(`   ✖ ${p}\n       ${m}`); }
  if (warns.length) { console.log(`\n⚠️  ${warns.length} change(s) to review (may be intentional):`); for (const [p, m] of warns) console.log(`   • ${p}\n       ${m}`); }
  console.log(`\n${fails.length ? '❌ GUARDRAIL FAILED — investigate before/after deploy.' : '✅ GUARDRAIL PASSED.'}`);
  return fails.length ? 1 : 0;
}
run().then(c => process.exit(c));
