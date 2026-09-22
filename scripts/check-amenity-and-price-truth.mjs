#!/usr/bin/env node
/**
 * check:amenity-and-price-truth -- live production must not
 *   1. assert an amenity the host's own poolAmenities does not contain
 *      (the Backyard Oasis CT "Heated pool" report, 2026-09-22),
 *   2. render "[object Object]" (paid add-ons stringified into amenity chips),
 *   3. render a one-decimal currency string ("$57.5").
 * env: BASE_URL (default https://www.poolrentalnearme.com)
 */
const BASE = (process.env.BASE_URL || "https://www.poolrentalnearme.com").replace(/\/$/, "");
const get = async (p) => { const r = await fetch(BASE + p, { redirect: "follow" }); return { status: r.status, body: await r.text() }; };
let fail = 0;
const bad = (m) => { console.error("  FAIL " + m); fail++; };
const ok = (m) => console.log("  ok   " + m);

// The reporting host: hot tub, NOT a heated pool. Base $50 -> all-in $57.50.
const LEDYARD = "/l/backyard-oasis-ct/6888401b-7fa7-4ba0-9c9d-95e529fcf533";
const PAGES = [
  LEDYARD,
  "/l/ophir-oasis/6a728317-8b62-400e-8e5c-0d506ece36fe",
  "/p/become-a-swimming-pool-host-carrollton-tx",
  "/p/become-a-swimming-pool-host-hudson-fl",
  "/p/jan",
  "/phoenix",
  "/riverside",
  "/s",
];
const ONE_DECIMAL = /\$\d[\d,]*\.\d(?!\d)/;

for (const p of PAGES) {
  const before = fail;
  const { status, body } = await get(p);
  if (status !== 200) { bad(`${p} -> ${status}`); continue; }
  if (body.includes("[object Object]")) bad(`${p}: renders "[object Object]"`);
  const m = body.match(ONE_DECIMAL);
  if (m) bad(`${p}: one-decimal currency ${JSON.stringify(m[0])}`);
  if (/85°|85°/.test(body)) bad(`${p}: unverifiable temperature claim`);
  if (body.includes("Lifeguard on duty")) bad(`${p}: "Lifeguard on duty" (no factual amenity can confirm it)`);
  if (fail === before) ok(p);
}
const led = (await get(LEDYARD)).body;
if (led.includes("Comfortable water even on cooler days")) bad("Ledyard still shows the Heated pool card");
else ok("Ledyard: no Heated pool card");
if (!led.includes("$57.50")) bad("Ledyard: all-in price $57.50 not rendered");
else ok("Ledyard: renders $57.50");

if (fail) { console.error(`\nFAILED -- ${fail} amenity/price truth violation(s).`); process.exit(1); }
console.log("\nPASS -- no uncorroborated amenity, no [object Object], no malformed currency.");
