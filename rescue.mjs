import fs from "node:fs";
const SLUGS = fs.readFileSync("/tmp/thin_slugs.txt","utf8").split("\n").map(s=>s.trim()).filter(Boolean);
const URL = "https://ptfjspcphskifoseidut.supabase.co/functions/v1/rescue-swim-instructor";
const TOKEN = "swim-rescue-2026-05-22";
const ANON = process.env.SUPABASE_ANON_KEY;
const CONC = 8;

let i = 0, ok = 0, skip = 0, fail = 0, t0 = Date.now();
async function worker() {
  while (i < SLUGS.length) {
    const slug = SLUGS[i++];
    try {
      const r = await fetch(URL, {
        method: "POST",
        headers: { "content-type":"application/json", "x-rescue-token": TOKEN, "Authorization": `Bearer ${ANON}`, "apikey": ANON },
        body: JSON.stringify({ slug }),
      });
      const j = await r.json().catch(()=>({}));
      if (j.skipped) { skip++; }
      else if (j.ok) { ok++; }
      else { fail++; console.log("FAIL", slug, r.status, JSON.stringify(j).slice(0,200)); }
    } catch (e) { fail++; console.log("ERR", slug, e.message); }
    if ((ok+skip+fail) % 10 === 0) console.log(`progress ok=${ok} skip=${skip} fail=${fail} / ${SLUGS.length}  t=${((Date.now()-t0)/1000).toFixed(0)}s`);
  }
}
await Promise.all(Array.from({length:CONC}, worker));
console.log(`DONE ok=${ok} skip=${skip} fail=${fail} total=${SLUGS.length} time=${((Date.now()-t0)/1000).toFixed(0)}s`);
