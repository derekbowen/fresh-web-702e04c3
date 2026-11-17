// F14: hosts pay a 0% host fee and keep 100% of their rate (guests pay the 15% booking fee).
// Guards the PRNM column of the host-city comparison table, which showed the old
// 10%-fee arithmetic ("You take home on $200: $180") on every host-acquisition city page.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/components/templates/host-acq-city.tsx", import.meta.url), "utf8");

test("host-city comparison: a host keeps the full $200 of a $200 booking", () => {
  const row = src.match(/\["You take home on \$200",\s*"([^"]*)"/);
  assert.ok(row, "take-home row not found in host-acq-city.tsx");
  assert.equal(row[1], "$200");
});

test("host-city comparison: the PRNM host fee cell says 0%", () => {
  const row = src.match(/\["Host service fee",\s*"([^"]*)"/);
  assert.ok(row, "host fee row not found in host-acq-city.tsx");
  assert.equal(row[1], "0%");
});
