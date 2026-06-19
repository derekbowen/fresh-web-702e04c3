// Parallel content generator for content_pages.
// Pulls pending /p/* rows, calls Lovable AI Gateway (gemini flash), writes back.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
const KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.MODEL || "google/gemini-2.5-flash";
const BATCH = Number(process.env.BATCH || 60);
const CONC = Number(process.env.CONC || 8);

if (!SUPABASE_URL || !SR || !KEY) { console.error("missing env"); process.exit(1); }
const sb = createClient(SUPABASE_URL, SR, { auth: { persistSession: false } });

const STATE_NAMES = {al:"Alabama",ak:"Alaska",az:"Arizona",ar:"Arkansas",ca:"California",co:"Colorado",ct:"Connecticut",de:"Delaware",fl:"Florida",ga:"Georgia",hi:"Hawaii",id:"Idaho",il:"Illinois",in:"Indiana",ia:"Iowa",ks:"Kansas",ky:"Kentucky",la:"Louisiana",me:"Maine",md:"Maryland",ma:"Massachusetts",mi:"Michigan",mn:"Minnesota",ms:"Mississippi",mo:"Missouri",mt:"Montana",ne:"Nebraska",nv:"Nevada",nh:"New Hampshire",nj:"New Jersey",nm:"New Mexico",ny:"New York",nc:"North Carolina",nd:"North Dakota",oh:"Ohio",ok:"Oklahoma",or:"Oregon",pa:"Pennsylvania",ri:"Rhode Island",sc:"South Carolina",sd:"South Dakota",tn:"Tennessee",tx:"Texas",ut:"Utah",vt:"Vermont",va:"Virginia",wa:"Washington",wv:"West Virginia",wi:"Wisconsin",wy:"Wyoming",dc:"District of Columbia"};
const STATE_LONG = Object.fromEntries(Object.entries(STATE_NAMES).map(([c,n])=>[n.toLowerCase().replace(/\s+/g,"-"),c.toUpperCase()]));
const tc = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

function classify(slug, tt) {
  const m = slug.match(/^become-a-(?:swimming-)?pool-host-+(.+?)-(?:([a-z]{2})|([a-z-]+))$/i);
  if (m) {
    const city = tc(m[1].replace(/-/g," "));
    const code = m[2]?.toUpperCase() || STATE_LONG[m[3]];
    if (code) return { kind:"host_city", city, stateCode: code, stateName: STATE_NAMES[code.toLowerCase()] || code };
  }
  const a = slug.match(/^([a-z-]+)-pool-host-advocacy-guide$/i);
  if (a) { const code = STATE_LONG[a[1].toLowerCase()]; if (code) return { kind:"state_advocacy", stateCode: code, stateName: STATE_NAMES[code.toLowerCase()] }; }
  if (tt === "public_pool" || /public-pool/.test(slug)) return { kind:"public_pool", topic: tc(slug.replace(/-/g," ")) };
  if (tt === "event_guide") return { kind:"event_guide", topic: tc(slug.replace(/-/g," ")) };
  return { kind:"resource", topic: tc(slug.replace(/-/g," ")) };
}

const SYS = `You write SEO content for Pool Rental Near Me (PRNM), a marketplace where homeowners rent out private pools by the hour.
Differentiators (use naturally, don't list): 10% flat host fee (vs Swimply 15%+), $2M liability insurance included, 5,100+ city pages.
Markdown only. ## and ### headings. Short paragraphs. Useful, specific content. Never invent statistics.
Internal links: /s, /s?address={City%2C+ST}, /p/hosting, /p/all-locations, /p/earnings-calculator, /p/how-it-works, /p/sign-a-waiver, /p/hoa-pool-rental-defense-kit.
List Your Pool CTA: /l/draft/00000000-0000-0000-0000-000000000000/new/details
Return ONLY by calling write_page.`;

function userPrompt(row) {
  const slug = row.slug || row.url_path.replace(/^\/p\//,"");
  const cls = classify(slug, row.template_type);
  if (cls.kind === "host_city") return `Host-recruitment landing page for ${cls.city}, ${cls.stateCode}. 800-1100 words. Title: "Become a Pool Host in ${cls.city}, ${cls.stateCode}". Sections (## headings, paraphrase): local opportunity, what pools rent best in ${cls.city}, peak seasons for ${cls.stateName}, pricing tips, why PRNM (10% fee, insurance) link /p/earnings-calculator and /p/hosting, 3-5 nearby cities, FAQ (5 Q's). End with CTA linking /l/draft/00000000-0000-0000-0000-000000000000/new/details. seo_title ≤60: "Become a Pool Host in ${cls.city}, ${cls.stateCode} | PRNM". seo_description ≤155 chars.`;
  if (cls.kind === "state_advocacy") return `Pool Host Advocacy & Legality guide for ${cls.stateName} (${cls.stateCode}). 1000-1400 words. Cautious language ("typically", "in most jurisdictions"). Sections: legality status, permits/licenses, HOA defense (link /p/hoa-pool-rental-defense-kit), insurance ($2M included), tax (Sched E vs C, lodging), compliant ops (link /p/sign-a-waiver), 5-Q FAQ. End CTA linking /l/draft/00000000-0000-0000-0000-000000000000/new/details.`;
  if (cls.kind === "public_pool") return `Article about: "${cls.topic}" — likely a public pool / community pool topic for renters. 700-1000 words. Practical info, then pivot to renting a private pool nearby on PRNM (link /s and /p/how-it-works). 3+ internal links.`;
  if (cls.kind === "event_guide") return `Event/city guide article: "${cls.topic}". 700-1000 words. Useful local info for someone planning the event/visit, mention renting a pool venue on PRNM (link /s?address= with the city if obvious). 3+ internal links.`;
  return `Genuinely useful article on: "${cls.topic}" (slug: "${slug}"). 800-1200 words. ## section headings. Specific tips. 3-5 internal links naturally placed. End with appropriate short CTA.`;
}

const TOOL = { type:"function", function:{ name:"write_page", description:"Return generated page content.", parameters:{ type:"object", properties:{ title:{type:"string"}, seo_title:{type:"string"}, seo_description:{type:"string"}, body_markdown:{type:"string"} }, required:["title","seo_title","seo_description","body_markdown"], additionalProperties:false } } };

async function callAI(row) {
  const body = { model: MODEL, messages: [{role:"system",content:SYS},{role:"user",content:userPrompt(row)}], tools:[TOOL], tool_choice:{type:"function",function:{name:"write_page"}} };
  for (let i=1;i<=4;i++){
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", { method:"POST", headers:{Authorization:`Bearer ${KEY}`,"Content-Type":"application/json"}, body: JSON.stringify(body) });
    if (r.status === 429) { await new Promise(res=>setTimeout(res, 1500*i)); continue; }
    if (r.status === 402) throw new Error("402 credits exhausted");
    if (!r.ok) { const t=await r.text(); throw new Error(`AI ${r.status}: ${t.slice(0,200)}`); }
    const data = await r.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("no tool call");
    const p = JSON.parse(args);
    if (!p.body_markdown || p.body_markdown.length < 400) throw new Error(`short body ${p.body_markdown?.length}`);
    return p;
  }
  throw new Error("rate-limited after retries");
}

async function processOne(row) {
  try {
    const g = await callAI(row);
    const { error } = await sb.from("content_pages").update({
      title: g.title, seo_title: g.seo_title.slice(0,70), seo_description: g.seo_description.slice(0,160),
      body_markdown: g.body_markdown, status: "published", updated_at: new Date().toISOString()
    }).eq("id", row.id);
    if (error) throw new Error(error.message);
    return { ok:true, url: row.url_path, words: g.body_markdown.split(/\s+/).length };
  } catch (e) { return { ok:false, url: row.url_path, error: String(e.message||e) }; }
}

async function main() {
  const { data: rows, error } = await sb.from("content_pages")
    .select("id, slug, url_path, template_type, body_markdown, status, priority")
    .like("url_path","/p/%").neq("status","published")
    .order("priority",{ascending:false,nullsFirst:false})
    .limit(BATCH * 3);
  if (error) { console.error(error); process.exit(1); }
  const candidates = (rows||[]).filter(r=>!r.body_markdown || r.body_markdown.length<200).slice(0, BATCH);
  console.log(`processing ${candidates.length} rows with concurrency=${CONC} model=${MODEL}`);

  let i=0, ok=0, fail=0;
  async function worker(){ while(i<candidates.length){ const row=candidates[i++]; const res=await processOne(row); if(res.ok){ok++; console.log(`✓ ${res.url} (${res.words}w)`);} else {fail++; console.log(`✗ ${res.url} — ${res.error}`);} } }
  await Promise.all(Array.from({length:CONC}, worker));
  console.log(`\nDONE: ${ok} ok / ${fail} failed (of ${candidates.length})`);
}
main().catch(e=>{console.error(e);process.exit(1);});
