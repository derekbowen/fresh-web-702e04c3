/**
 * Emergency export: pull every Sharetribe-derived row out of Supabase to disk.
 *
 * WHY THIS EXISTS
 * ---------------
 * The Sharetribe subscription lapsed and the marketplace is offline. The st_*
 * mirror tables in OUR Supabase hold a lossless copy of what Sharetribe had --
 * every row keeps the original API response in a `raw` jsonb column -- and
 * synced_listings holds the signed imgix URLs for every listing photo.
 *
 * That data lives in our account, not Sharetribe's, so it is not at risk from
 * the lapsed bill. It IS at risk from everything else that can happen to one
 * Supabase project, which is the whole point of taking a copy off-platform.
 *
 * Run this FIRST, then run download-listing-images.ts against its output.
 *
 *   SUPABASE_URL=https://<ref>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
 *   bun scripts/export-all-data.ts --out ./prnm-export
 *
 * Needs no npm install and no project dependencies -- plain fetch against
 * PostgREST -- so it runs even when `bun install` cannot reach the registry.
 *
 * Safe: reads only. It issues no INSERT, UPDATE or DELETE.
 */

const argv = process.argv.slice(2);
const argOf = (name: string, fallback: string): string => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const OUT = argOf("out", "./prnm-export");
const PAGE = Number(argOf("page-size", "1000"));

if (!SUPABASE_URL || !KEY) {
  console.error(
    "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Both are in the Supabase dashboard under Project Settings > API.\n" +
      "The service role key bypasses RLS, so keep it out of shell history:\n" +
      "  read -s SUPABASE_SERVICE_ROLE_KEY && export SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

/**
 * Everything worth keeping, most irreplaceable first.
 *
 * The st_* tables are the Sharetribe mirror. synced_listings is the pSEO read
 * model and is the ONLY place the signed imgix photo URLs are stored -- the
 * st_listings.raw payload holds image IDs, and an imgix URL without its
 * signature is a 403, so those ids alone cannot bring a photo back.
 */
const TABLES = [
  "synced_listings", // signed photo URLs — the one that cannot be reconstructed
  "st_listings",
  "st_users",
  "st_transactions",
  "st_messages",
  "st_security_alerts",
  "st_sync_state",
];

/** Tables we try but do not fail the run over — they may not exist in every project. */
const OPTIONAL = new Set(["st_security_alerts", "st_sync_state"]);

async function fetchPage(table: string, offset: number): Promise<unknown[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&order=id.asc&limit=${PAGE}&offset=${offset}`;
  const res = await fetch(url, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${table}: HTTP ${res.status} ${body.slice(0, 300)}`);
  }
  return (await res.json()) as unknown[];
}

async function exportTable(table: string): Promise<{ table: string; rows: number; file: string | null; error?: string }> {
  const rows: unknown[] = [];
  let offset = 0;

  try {
    for (;;) {
      const page = await fetchPage(table, offset);
      rows.push(...page);
      process.stdout.write(`\r  ${table}: ${rows.length} rows`);
      // A short page means the end. Equal-to-PAGE means there may be more.
      if (page.length < PAGE) break;
      offset += PAGE;
    }
  } catch (e) {
    const msg = (e as Error).message;
    process.stdout.write("\n");
    if (OPTIONAL.has(table)) {
      console.warn(`  ${table}: skipped (${msg.slice(0, 120)})`);
      return { table, rows: 0, file: null, error: msg };
    }
    // Keep whatever we got rather than losing a partial export to a late failure.
    if (rows.length > 0) {
      const file = `${OUT}/${table}.PARTIAL.json`;
      await Bun.write(file, JSON.stringify(rows, null, 2));
      console.error(`  ${table}: FAILED after ${rows.length} rows — wrote ${file}`);
      return { table, rows: rows.length, file, error: msg };
    }
    console.error(`  ${table}: FAILED — ${msg}`);
    return { table, rows: 0, file: null, error: msg };
  }

  const file = `${OUT}/${table}.json`;
  await Bun.write(file, JSON.stringify(rows, null, 2));
  process.stdout.write(`\r  ${table}: ${rows.length} rows -> ${file}\n`);
  return { table, rows: rows.length, file };
}

async function main(): Promise<void> {
  console.log(`Exporting from ${SUPABASE_URL} into ${OUT}/\n`);
  const results = [];
  for (const t of TABLES) results.push(await exportTable(t));

  // Count how many photos are actually recoverable, since that is the finding
  // that decides whether anything is being permanently lost right now.
  let photoUrls = 0;
  let listingsWithPhotos = 0;
  try {
    const raw = await Bun.file(`${OUT}/synced_listings.json`).text();
    for (const row of JSON.parse(raw) as Array<Record<string, unknown>>) {
      const urls = (row.image_urls as string[] | null) || [];
      const primary = row.primary_image_url as string | null;
      const n = urls.length || (primary ? 1 : 0);
      if (n > 0) listingsWithPhotos += 1;
      photoUrls += n;
    }
  } catch {
    /* synced_listings failed to export; the summary below says so. */
  }

  const manifest = {
    exported_from: SUPABASE_URL,
    tables: results,
    photos: { listings_with_photos: listingsWithPhotos, photo_urls: photoUrls },
    next_step:
      photoUrls > 0
        ? `bun scripts/download-listing-images.ts --in ${OUT} --out ${OUT}/images`
        : "No photo URLs found — do not delete anything, and check synced_listings exported correctly.",
  };
  await Bun.write(`${OUT}/MANIFEST.json`, JSON.stringify(manifest, null, 2));

  console.log("\n─────────────────────────────────────────────");
  for (const r of results) {
    console.log(`  ${r.error ? "FAILED " : "ok     "} ${r.table.padEnd(20)} ${r.rows} rows`);
  }
  console.log(`\n  ${photoUrls} photo URLs across ${listingsWithPhotos} listings.`);
  console.log(`\nNext: ${manifest.next_step}`);

  if (results.some((r) => r.error && !OPTIONAL.has(r.table))) {
    console.error("\nSome required tables failed. Do NOT treat this export as complete.");
    process.exit(1);
  }
}

main();
