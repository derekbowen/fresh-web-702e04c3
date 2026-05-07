/**
 * Returns the top published cities (by population if available, else name)
 * for use in hub-page "Top cities" reciprocal-link blocks.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type TopCity = {
  slug: string;
  name: string;
  state_code: string | null;
  hostAcqHref: string;
};

export const getTopCities = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ limit: z.number().int().min(1).max(60).default(24) }).parse(d ?? {}))
  .handler(async ({ data }): Promise<TopCity[]> => {
    try {
      const { data: rows } = await (supabaseAdmin as any)
        .from("cities")
        .select("slug, name, state_code, population")
        .eq("is_published", true)
        .order("population", { ascending: false, nullsFirst: false })
        .limit(data.limit);
      return ((rows || []) as Array<{ slug: string; name: string; state_code: string | null }>).map((r) => {
        const stateLow = r.state_code ? r.state_code.toLowerCase() : null;
        const hostAcqSlug = stateLow
          ? `become-a-swimming-pool-host-${r.slug}${r.slug.endsWith(`-${stateLow}`) ? "" : `-${stateLow}`}`
          : `become-a-swimming-pool-host-${r.slug}`;
        return { slug: r.slug, name: r.name, state_code: r.state_code, hostAcqHref: `/p/${hostAcqSlug}` };
      });
    } catch (err) {
      console.error("getTopCities failed:", err);
      return [];
    }
  });
