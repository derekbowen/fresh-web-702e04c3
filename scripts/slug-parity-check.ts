/**
 * Differential check: our ported createSlug vs the marketplace's original.
 *
 * The Phase 1C doc claims a 20,000-case identical result. A statistic nobody can
 * re-run is exactly the kind of claim the operating notes forbid, so this is the
 * harness that produces it. Run it and you get the number yourself.
 *
 *   bun scripts/slug-parity-check.ts [--marketplace <path-to-poolrentalnearme-web>]
 *                                    [--cases 20000] [--seed 1]
 *
 * It loads `createSlug` from the marketplace repo's src/util/urlHelpers.js at
 * runtime rather than vendoring a copy, because a vendored copy is just another
 * thing that silently drifts. Exits non-zero on any divergence.
 */
import { readFileSync } from "node:fs";
import { createSlug as ported } from "../src/lib/listing-url";

const argv = process.argv.slice(2);
const argOf = (name: string, fallback: string): string => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const MARKETPLACE = argOf("marketplace", "/home/user/poolrentalnearme-web");
const CASES = Number(argOf("cases", "20000"));
const SEED = Number(argOf("seed", "1"));
const SOURCE = `${MARKETPLACE}/src/util/urlHelpers.js`;

/**
 * Pull `createSlug` out of the marketplace module without importing it — that
 * file pulls in the whole app's config graph, which will not load here.
 */
function loadOriginal(): (s: unknown) => string {
  const src = readFileSync(SOURCE, "utf8");
  const start = src.indexOf("export const createSlug");
  if (start === -1) throw new Error(`createSlug not found in ${SOURCE}`);
  // Balance braces from the arrow body to find the end of the function.
  const bodyStart = src.indexOf("{", start);
  let depth = 0;
  let end = -1;
  for (let i = bodyStart; i < src.length; i += 1) {
    if (src[i] === "{") depth += 1;
    else if (src[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end === -1) throw new Error("could not find end of createSlug");
  const fnSrc = src.slice(start, end).replace("export const createSlug =", "return");
  // eslint-disable-next-line no-new-func
  return new Function(`${fnSrc};`)() as (s: unknown) => string;
}

/** Deterministic PRNG (mulberry32) so a failing case is reproducible from the seed. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ALPHABET = [
  ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  ..." -_/\\.,:;!?'\"()[]{}#@&*+=|<>~`$%^",
  ..."ÀÁÂÃÄÅÆĀĂĄÇĆĈČÐĎĐÞÈÉÊËĒĔĖĘĚĜĞĢǴĤḦÌÍÎÏĨĪĮİĴĲĶĹĻĽŁḾÑŃŅŇÒÓÔÕÖØŌŎŐŒṕŔŖŘßŚŜŞŠŢŤ",
  ..."ÙÚÛÜŨŪŬŮŰŲƯẀẂẄŶŸÝŹŻŽ",
  ..."日本語中文한국어",
  ..."🏊🌊☀️",
];

const HAND_PICKED = [
  "20x40 Heated Salt Water Pool",
  "  leading and trailing  ",
  "Backyard Oasis — Your Private Poolside Paradise!",
  "Café Straße",
  "ÀÉÎÕÜ",
  "日本語のプール",
  "pool 🏊 party",
  "multiple   inner   spaces",
  "---leading-dashes---",
  "a".repeat(300),
  "",
  "!!!",
  "MiXeD CaSe",
  "slash/and\\backslash",
  "tabs\tand\nnewlines",
];

function main(): void {
  const original = loadOriginal();
  const mismatches: Array<{ input: string; original: string; ported: string }> = [];

  const check = (input: string): void => {
    const a = original(input);
    const b = ported(input);
    if (a !== b) mismatches.push({ input, original: a, ported: b });
  };

  HAND_PICKED.forEach(check);
  const handPicked = HAND_PICKED.length;

  const rand = rng(SEED);
  for (let i = 0; i < CASES; i += 1) {
    const len = Math.floor(rand() * 40);
    let s = "";
    for (let j = 0; j < len; j += 1) {
      s += ALPHABET[Math.floor(rand() * ALPHABET.length)];
    }
    check(s);
  }

  const total = handPicked + CASES;
  console.log(`marketplace source: ${SOURCE}`);
  console.log(`hand-picked: ${handPicked}, random: ${CASES} (seed ${SEED})`);
  console.log(`${total - mismatches.length}/${total} identical`);

  // Known and deliberate: the marketplace does str.toString() and so throws on
  // null/undefined; the port returns "no-slug" because it is called with mirror
  // rows whose title can be null. Documented in src/lib/listing-url.ts.
  let threw = false;
  try {
    original(null);
  } catch {
    threw = true;
  }
  console.log(
    `null handling — marketplace: ${threw ? "throws" : "returns " + original(null)}, ` +
      `port: ${JSON.stringify(ported(null as unknown as string))} (deliberate divergence)`,
  );

  if (mismatches.length > 0) {
    console.error(`\n${mismatches.length} MISMATCHES:`);
    for (const m of mismatches.slice(0, 20)) {
      console.error(`  input:      ${JSON.stringify(m.input)}`);
      console.error(`  marketplace:${JSON.stringify(m.original)}`);
      console.error(`  port:       ${JSON.stringify(m.ported)}`);
    }
    process.exit(1);
  }
  console.log("\nNo divergence. The port agrees with the marketplace.");
}

main();
