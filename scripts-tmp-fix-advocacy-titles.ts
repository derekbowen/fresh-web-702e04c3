// Rewrite title / seo_title / seo_description for all host_advocacy_* rows.
// The edge generator preserved any pre-existing title, so most rows still show
// slug-format or homepage-leftover H1s. Force the canonical human title.
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const STATE_FROM_SLUG: Record<string, string> = {
  alabama: "Alabama", alaska: "Alaska", arizona: "Arizona", arkansas: "Arkansas",
  california: "California", colorado: "Colorado", connecticut: "Connecticut",
  delaware: "Delaware", florida: "Florida", georgia: "Georgia", hawaii: "Hawaii",
  idaho: "Idaho", illinois: "Illinois", indiana: "Indiana", iowa: "Iowa",
  kansas: "Kansas", kentucky: "Kentucky", louisiana: "Louisiana", maine: "Maine",
  maryland: "Maryland", massachusetts: "Massachusetts", michigan: "Michigan",
  minnesota: "Minnesota", mississippi: "Mississippi", missouri: "Missouri",
  montana: "Montana", nebraska: "Nebraska", nevada: "Nevada",
  "new-hampshire": "New Hampshire", "new-jersey": "New Jersey",
  "new-mexico": "New Mexico", "new-york": "New York",
  "north-carolina": "North Carolina", "north-dakota": "North Dakota",
  ohio: "Ohio", oklahoma: "Oklahoma", oregon: "Oregon", pennsylvania: "Pennsylvania",
  "rhode-island": "Rhode Island", "south-carolina": "South Carolina",
  "south-dakota": "South Dakota", tennessee: "Tennessee", texas: "Texas",
  utah: "Utah", vermont: "Vermont", virginia: "Virginia", washington: "Washington",
  "west-virginia": "West Virginia", wisconsin: "Wisconsin", wyoming: "Wyoming",
  "pa-what-every-host-needs-to-know": "Pennsylvania",
};

const { data: rows, error } = await sb
  .from("content_pages")
  .select("id, slug, template_type, title")
  .in("template_type", ["host_advocacy_state", "host_advocacy_hub"]);
if (error) throw error;

let updated = 0;
for (const r of (rows ?? []) as any[]) {
  let title: string;
  let seoTitle: string;
  let seoDesc: string;

  if (r.template_type === "host_advocacy_hub") {
    title = "Pool host advocacy hub | Pool Rental Near Me";
    seoTitle = "Pool host advocacy hub: laws, HOAs, insurance | Pool Rental Near Me";
    seoDesc =
      "Find your state's pool host advocacy guide. Laws, HOA rules, insurance, and income expectations for pool owners renting their pool by the hour.";
  } else {
    const stateSlug = (r.slug as string).replace(/^host-advocacy-/, "");
    const state = STATE_FROM_SLUG[stateSlug];
    if (!state) {
      console.log(`skip ${r.slug} (unknown state)`);
      continue;
    }
    title = `${state} pool host guide | Rent your pool in ${state}`;
    seoTitle = `${state} pool host guide: laws, HOAs, income | Pool Rental Near Me`;
    seoDesc = `Complete guide for ${state} pool owners considering hourly pool rentals. HOA guidance, income estimates, regulations, and host tips for ${state}.`;
  }

  const { error: upErr } = await sb
    .from("content_pages")
    .update({ title, seo_title: seoTitle, seo_description: seoDesc })
    .eq("id", r.id);
  if (upErr) {
    console.log(`fail ${r.slug} ${upErr.message}`);
    continue;
  }
  updated++;
  console.log(`ok ${r.slug} -> ${title}`);
}
console.log(`\nDONE: updated ${updated} of ${rows?.length ?? 0}`);
