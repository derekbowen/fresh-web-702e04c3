/**
 * Emergency photo rescue: download every listing photo we still have a URL for.
 *
 * WHY THIS IS THE URGENT ONE
 * --------------------------
 * Listing photos are the only irreplaceable thing here. Everything else --
 * users, listings, transactions, messages -- is already duplicated losslessly
 * in our own Supabase. The photos are not: they are bytes on Sharetribe's imgix
 * origin, and we hold only URLs pointing at it.
 *
 * Those URLs are SIGNED. Strip or change the `s=` parameter and imgix answers
 * 403, so the image IDs in st_listings.raw cannot be turned back into working
 * URLs. The signed URLs in synced_listings.image_urls are the only handle we
 * have, and they stop working whenever Sharetribe tears the account down.
 *
 * Hosts uploaded these. Losing them means asking every host to re-photograph
 * their pool, and most will not.
 *
 * Run export-all-data.ts first, then:
 *   bun scripts/download-listing-images.ts --in ./prnm-export --out ./prnm-export/images
 *
 * Resumable: re-running skips files already on disk, so an interrupted run
 * costs nothing. No npm install needed.
 */

const argv = process.argv.slice(2);
const argOf = (name: string, fallback: string): string => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const IN = argOf("in", "./prnm-export");
const OUT = argOf("out", "./prnm-export/images");
const CONCURRENCY = Math.max(1, Math.min(Number(argOf("concurrency", "6")), 16));
const LIMIT = Number(argOf("limit", "0")); // 0 = all

interface Job {
  listingId: string;
  title: string;
  index: number;
  url: string;
  isPrimary: boolean;
}

/** Extract the imgix image id from a Sharetribe URL: /<marketplaceId>/<imageId>?... */
function imageIdFromUrl(url: string): string | null {
  const m = /\/([0-9a-f-]{36})\/([0-9a-f-]{36})(?:\?|$)/.exec(url);
  return m ? m[2] : null;
}

function extFor(contentType: string | null): string {
  if (!contentType) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("avif")) return "avif";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

function buildJobs(rows: Array<Record<string, unknown>>): Job[] {
  const jobs: Job[] = [];
  for (const row of rows) {
    const listingId = String(row.sharetribe_id ?? row.id ?? "");
    if (!listingId) continue;
    const title = String(row.title ?? "");
    const primary = (row.primary_image_url as string | null) || null;
    const all = ((row.image_urls as string[] | null) || []).filter(Boolean);

    // Union, primary first, de-duplicated. primary_image_url is usually also
    // in image_urls, but not in every row, so neither alone is complete.
    const seen = new Set<string>();
    const ordered = [...(primary ? [primary] : []), ...all].filter((u) => {
      if (seen.has(u)) return false;
      seen.add(u);
      return true;
    });

    ordered.forEach((url, index) => {
      jobs.push({ listingId, title, index, url, isPrimary: url === primary });
    });
  }
  return jobs;
}

async function runPool<T>(items: T[], n: number, fn: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    for (;;) {
      const i = cursor;
      cursor += 1;
      if (i >= items.length) return;
      await fn(items[i]);
    }
  });
  await Promise.all(workers);
}

async function main(): Promise<void> {
  let rows: Array<Record<string, unknown>>;
  try {
    rows = JSON.parse(await Bun.file(`${IN}/synced_listings.json`).text());
  } catch (e) {
    console.error(
      `Could not read ${IN}/synced_listings.json — run export-all-data.ts first.\n` +
        `  ${(e as Error).message}`,
    );
    process.exit(1);
  }

  let jobs = buildJobs(rows);
  if (LIMIT > 0) jobs = jobs.slice(0, LIMIT);

  console.log(`${rows.length} listings, ${jobs.length} photo URLs to fetch.`);
  console.log(`Writing to ${OUT}/ with ${CONCURRENCY} concurrent downloads.\n`);

  const manifest: Array<Record<string, unknown>> = [];
  let ok = 0;
  let skipped = 0;
  let failed = 0;
  let bytes = 0;
  const failures: Array<{ listingId: string; url: string; reason: string }> = [];

  await runPool(jobs, CONCURRENCY, async (job) => {
    const imageId = imageIdFromUrl(job.url) || `idx${job.index}`;
    const dir = `${OUT}/${job.listingId}`;

    // Resume: any existing non-empty file for this image is taken as done.
    for (const ext of ["jpg", "png", "webp", "avif", "gif"]) {
      const candidate = `${dir}/${imageId}.${ext}`;
      const f = Bun.file(candidate);
      if ((await f.exists()) && f.size > 0) {
        skipped += 1;
        manifest.push({ ...job, file: candidate, status: "already-present", bytes: f.size });
        process.stdout.write(`\r  ok ${ok} · skip ${skipped} · fail ${failed}   `);
        return;
      }
    }

    try {
      const res = await fetch(job.url, { signal: AbortSignal.timeout(45_000) });
      if (!res.ok) {
        failed += 1;
        const reason = `HTTP ${res.status}${res.status === 403 ? " (signature rejected or origin gone)" : ""}`;
        failures.push({ listingId: job.listingId, url: job.url, reason });
        manifest.push({ ...job, status: "failed", reason });
        process.stdout.write(`\r  ok ${ok} · skip ${skipped} · fail ${failed}   `);
        return;
      }

      const ct = res.headers.get("content-type");
      // An error page served as 200 text/html would otherwise be saved as a
      // .jpg and silently pass for a photo.
      if (!ct || !ct.startsWith("image/")) {
        failed += 1;
        const reason = `not an image (content-type: ${ct ?? "none"})`;
        failures.push({ listingId: job.listingId, url: job.url, reason });
        manifest.push({ ...job, status: "failed", reason });
        return;
      }

      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength === 0) {
        failed += 1;
        failures.push({ listingId: job.listingId, url: job.url, reason: "0 bytes" });
        manifest.push({ ...job, status: "failed", reason: "0 bytes" });
        return;
      }

      const file = `${dir}/${imageId}.${extFor(ct)}`;
      await Bun.write(file, buf);
      ok += 1;
      bytes += buf.byteLength;
      manifest.push({ ...job, file, status: "downloaded", bytes: buf.byteLength, contentType: ct });
      process.stdout.write(`\r  ok ${ok} · skip ${skipped} · fail ${failed}   `);
    } catch (e) {
      failed += 1;
      const reason = (e as Error).message;
      failures.push({ listingId: job.listingId, url: job.url, reason });
      manifest.push({ ...job, status: "failed", reason });
      process.stdout.write(`\r  ok ${ok} · skip ${skipped} · fail ${failed}   `);
    }
  });

  await Bun.write(`${OUT}/IMAGE-MANIFEST.json`, JSON.stringify(manifest, null, 2));

  console.log(`\n\n─────────────────────────────────────────────`);
  console.log(`  downloaded : ${ok}  (${(bytes / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`  already had: ${skipped}`);
  console.log(`  failed     : ${failed}`);
  console.log(`\n  Manifest (photo -> listing mapping): ${OUT}/IMAGE-MANIFEST.json`);

  if (failed > 0) {
    console.log(`\n  First failures:`);
    for (const f of failures.slice(0, 10)) {
      console.log(`    ${f.listingId}  ${f.reason}`);
    }
    console.log(
      `\n  A wave of 403s means the imgix origin is gone or the signatures were\n` +
        `  rejected. If that happens, STOP and check one URL by hand before\n` +
        `  concluding the photos are lost — and do not delete this export.`,
    );
    process.exit(1);
  }

  console.log(`\n  Every photo we had a URL for is now on local disk.`);
  console.log(`  Back this directory up somewhere off this machine before anything else.`);
}

main();
