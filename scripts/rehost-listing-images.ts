/**
 * Phase 1b CLI — move listing image bytes off Sharetribe onto PRNM storage.
 *
 * Reads Sharetribe, writes only Supabase. Never mutates Sharetribe. Resumable:
 * kill it and re-run, nothing is lost and nothing is double-stored.
 *
 * Run on EAST, where SHARETRIBE_INTEG_* and SUPABASE_SERVICE_ROLE_KEY exist.
 *
 *   bun scripts/rehost-listing-images.ts --progress
 *   bun scripts/rehost-listing-images.ts --dry-run --limit 20
 *   bun scripts/rehost-listing-images.ts --limit 500 --concurrency 4
 *   bun scripts/rehost-listing-images.ts --listing <uuid>
 *   bun scripts/rehost-listing-images.ts --retry-failed --limit 200
 *   bun scripts/rehost-listing-images.ts --discover-only
 *
 * Suggested first run: --progress, then --dry-run --limit 20 to confirm the
 * variant ladder and byte sizes look sane, then work up in batches. There is no
 * reason to do it in one pass; the job is resumable by design.
 *
 * Exit 1 on any recorded error so a wrapper can alert.
 */
import {
  discoverListingImages,
  listingImageRehostProgress,
  runListingImageRehost,
  type RehostStats,
} from "../src/server/listing-image-rehost.server";
import { resolveImageSource } from "../src/lib/listing-images";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function has(flag: string): boolean {
  return process.argv.includes(flag);
}

function mib(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}

function printStats(stats: RehostStats): void {
  console.log("");
  console.log(`  listings scanned:       ${stats.listingsScanned}`);
  console.log(`  images discovered:      ${stats.imagesDiscovered}`);
  console.log(`  stored:                 ${stats.stored}  (${mib(stats.bytesStored)})`);
  console.log(`  already stored/skipped: ${stats.skippedAlreadyStored}`);
  console.log(`  failed:                 ${stats.failed}`);
  console.log(`  unavailable:            ${stats.unavailable}`);
  console.log(`  listings backfilled:    ${stats.listingsBackfilled}`);
  if (stats.errors.length) {
    console.log("");
    console.log(`  errors (${stats.errors.length}):`);
    for (const e of stats.errors.slice(0, 20)) console.log(`    - ${e}`);
    if (stats.errors.length > 20) console.log(`    … ${stats.errors.length - 20} more`);
  }
}

async function printProgress(): Promise<void> {
  const p = await listingImageRehostProgress();
  const total = Object.values(p.byStatus).reduce((a, b) => a + b, 0);
  console.log("Listing image re-host progress");
  console.log("");
  for (const [status, count] of Object.entries(p.byStatus)) {
    const pct = total ? ((count / total) * 100).toFixed(1) : "0.0";
    console.log(`  ${status.padEnd(12)} ${String(count).padStart(7)}  ${pct.padStart(5)}%`);
  }
  console.log(`  ${"TOTAL".padEnd(12)} ${String(total).padStart(7)}`);
  console.log("");
  if (p.listingsPublished !== null && p.listingsWithPrnmHero !== null) {
    const pct = p.listingsPublished
      ? ((p.listingsWithPrnmHero / p.listingsPublished) * 100).toFixed(1)
      : "0.0";
    console.log(
      `  published listings with a PRNM hero: ${p.listingsWithPrnmHero}/${p.listingsPublished} (${pct}%)`,
    );
  }
  const src = resolveImageSource(process.env);
  console.log(
    `  PRNM_IMAGE_SOURCE = ${src.source}${src.invalid ? ` (invalid: "${src.raw}")` : ""}`,
  );
  if (src.source === "sharetribe") {
    console.log("  Nothing is serving PRNM images yet. Set PRNM_IMAGE_SOURCE=prnm when ready;");
    console.log("  un-migrated listings keep their Sharetribe URL, so it is safe before 100%.");
  }
}

async function main(): Promise<void> {
  if (has("--progress")) {
    await printProgress();
    return;
  }

  if (has("--discover-only")) {
    const listingId = arg("--listing");
    console.log(`Discovering listing images${listingId ? ` for ${listingId}` : ""}…`);
    const { stats, imageIds } = await discoverListingImages({ listingId });
    printStats(stats);
    console.log(`  distinct image ids seen: ${new Set(imageIds).size}`);
    if (stats.errors.length) process.exit(1);
    return;
  }

  const opts = {
    limit: Number(arg("--limit") ?? 200),
    listingId: arg("--listing"),
    retryFailed: has("--retry-failed"),
    concurrency: Number(arg("--concurrency") ?? 4),
    dryRun: has("--dry-run"),
    skipDiscovery: has("--skip-discovery"),
  };

  console.log(
    `Re-hosting listing images — limit=${opts.limit} concurrency=${opts.concurrency}` +
      `${opts.dryRun ? " DRY RUN (no uploads, no records)" : ""}` +
      `${opts.retryFailed ? " retrying previously failed" : ""}` +
      `${opts.listingId ? ` listing=${opts.listingId}` : ""}`,
  );

  const stats = await runListingImageRehost(opts);
  printStats(stats);

  if (opts.dryRun) {
    console.log("");
    console.log("  Dry run: bytes were fetched and measured, nothing was uploaded or recorded.");
  }

  if (stats.errors.length) process.exit(1);
}

main().catch((err) => {
  console.error("rehost-listing-images failed:", err);
  process.exit(1);
});
