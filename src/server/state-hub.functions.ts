/**
 * State hub server fns. Powers /p/pool-rentals (50-state index) and
 * /p/pool-rentals-{state-slug} (per-state list of every host_acq_city page).
 *
 * Why: those city pages are orphans — Google reaches them via sitemap but
 * nothing on the site links to them, suppressing indexing. State hubs give
 * each city an internal link from a parent page.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { STATE_NAMES } from "@/lib/states";
import { parseCitySlug } from "@/lib/city-slug";

const HOST_ACQ_PREFIX = "become-a-swimming-pool-host-";

export interface StateHubCity {
  citySlug: string;       // e.g. "bardstown-ky"
  cityName: string;       // "Bardstown"
  pageSlug: string;       // "become-a-swimming-pool-host-bardstown-ky"
  url: string;            // "/p/become-a-swimming-pool-host-bardstown-ky"
}

export interface StateHubData {
  stateCode: string;      // "KY"
  stateName: string;      // "Kentucky"
  cities: StateHubCity[]; // sorted by cityName
}

export interface StateIndexEntry {
  stateCode: string;
  stateName: string;
  citySlug: string;       // /p/pool-rentals-{kentucky}
  cityCount: number;
}

function stateSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function stateNameFromSlug(slug: string): string | null {
  const target = slug.toLowerCase();
  for (const name of Object.values(STATE_NAMES)) {
    if (stateSlug(name) === target) return name;
  }
  return null;
}

function stateCodeForName(name: string): string | null {
  for (const [code, n] of Object.entries(STATE_NAMES)) {
    if (n === name) return code;
  }
  return null;
}

async function fetchAllHostAcqSlugs(): Promise<string[]> {
  const out: string[] = [];
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await (supabaseAdmin as never as {
      from: (t: string) => {
        select: (cols: string) => {
          like: (c: string, p: string) => {
            range: (a: number, b: number) => Promise<{ data: Array<{ slug: string }> | null; error: unknown }>;
          };
        };
      };
    })
      .from("content_pages")
      .select("slug")
      .like("slug", `${HOST_ACQ_PREFIX}%`)
      .range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    for (const r of data) out.push(r.slug);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

interface ParsedRow {
  pageSlug: string;
  citySlug: string;
  cityName: string;
  stateCode: string;
}

function parseRows(slugs: string[]): ParsedRow[] {
  const rows: ParsedRow[] = [];
  for (const pageSlug of slugs) {
    if (!pageSlug.startsWith(HOST_ACQ_PREFIX)) continue;
    const citySlug = pageSlug.slice(HOST_ACQ_PREFIX.length);
    if (!citySlug) continue;
    const { city, stateCode } = parseCitySlug(citySlug);
    if (!stateCode || !STATE_NAMES[stateCode]) continue;
    rows.push({ pageSlug, citySlug, cityName: city, stateCode });
  }
  return rows;
}

export const getStateHub = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ state: z.string().min(2).max(40) }).parse(data),
  )
  .handler(async ({ data }): Promise<StateHubData | null> => {
    try {
      const stateName = stateNameFromSlug(data.state);
      if (!stateName) return null;
      const stateCode = stateCodeForName(stateName);
      if (!stateCode) return null;

      const slugs = await fetchAllHostAcqSlugs();
      const rows = parseRows(slugs).filter((r) => r.stateCode === stateCode);

      // De-dupe by citySlug, keep stable city name.
      const byCity = new Map<string, ParsedRow>();
      for (const r of rows) if (!byCity.has(r.citySlug)) byCity.set(r.citySlug, r);

      const cities: StateHubCity[] = [...byCity.values()]
        .map((r) => ({
          citySlug: r.citySlug,
          cityName: r.cityName,
          pageSlug: r.pageSlug,
          url: `/p/${r.pageSlug}`,
        }))
        .sort((a, b) => a.cityName.localeCompare(b.cityName));

      return { stateCode, stateName, cities };
    } catch (err) {
      console.error("getStateHub failed:", err);
      return null;
    }
  });

export const getAllStateHubs = createServerFn({ method: "GET" }).handler(
  async (): Promise<StateIndexEntry[]> => {
    try {
      const slugs = await fetchAllHostAcqSlugs();
      const rows = parseRows(slugs);
      const counts = new Map<string, number>();
      for (const r of rows) {
        counts.set(r.stateCode, (counts.get(r.stateCode) ?? 0) + 1);
      }
      const entries: StateIndexEntry[] = [];
      for (const [code, name] of Object.entries(STATE_NAMES)) {
        const n = counts.get(code) ?? 0;
        if (n === 0) continue;
        entries.push({
          stateCode: code,
          stateName: name,
          citySlug: stateSlug(name),
          cityCount: n,
        });
      }
      return entries.sort((a, b) => a.stateName.localeCompare(b.stateName));
    } catch (err) {
      console.error("getAllStateHubs failed:", err);
      return [];
    }
  },
);

/** Pure helper used by sitemap generation (no DB). */
export function stateHubPath(stateName: string): string {
  return `/p/pool-rentals-${stateSlug(stateName)}`;
}
