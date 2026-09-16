// Bundles the engine (and its tests) with the repo's own esbuild so it runs on
// plain Node 20 on EAST: `node ops/host-lifecycle/dist/run.mjs …`.
import { build } from "esbuild";
import { readdirSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const common = { bundle: true, platform: "node", format: "esm", target: "node20", sourcemap: false, logLevel: "warning",
  external: ["@supabase/supabase-js"] };

mkdirSync(join(here, "dist"), { recursive: true });
await build({ ...common, entryPoints: [join(here, "src/run.ts")], outfile: join(here, "dist/run.mjs") });

const tests = readdirSync(join(here, "test")).filter((f) => f.endsWith(".test.ts"));
mkdirSync(join(here, "dist/test"), { recursive: true });
for (const t of tests) {
  await build({ ...common, entryPoints: [join(here, "test", t)], outfile: join(here, "dist/test", t.replace(/\.ts$/, ".mjs")) });
}
console.log(`built run.mjs + ${tests.length} test bundle(s)`);
