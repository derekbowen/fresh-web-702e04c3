import type { LiveListing } from "@/lib/live-inventory";
import type { CityInventory, InventoryListing } from "@/server/city-inventory.functions";
import { formatSyncDate } from "@/lib/city-intent";

/**
 * Server-rendered listing cards. The markup is present in the initial HTML —
 * no client fetch, no loading state — so Google sees titles, links and
 * locations without executing JavaScript.
 */

type CardListing = {
  id: string;
  slug: string;
  title: string;
  city: string | null;
  stateCode: string | null;
  price: number | null;
  img: string | null;
  capacity?: number | null;
  amenities?: string[];
  mi?: number;
};

function fromLive(l: LiveListing & { mi?: number }): CardListing {
  return {
    id: l.id, slug: l.slug, title: l.title, city: l.city || null,
    // No price from the build-time snapshot. Its `price` is the HOST BASE rate
    // (no 15% renter fee) frozen at build time: /phoenix showed $45/hr for a
    // pool that is $150 base / $172.50 all-in today. PoolCard assumes an all-in
    // amount that matches checkout to the penny; a stale base price cannot, so
    // the card omits it rather than state a wrong one.
    stateCode: l.state || null, price: null, img: l.img ?? null, mi: l.mi,
  };
}

/**
 * One pool card. `eager` is passed for the first row so the LCP image is not
 * lazy; everything below the fold stays lazy so a city page never ships eight
 * full-resolution images up front.
 */
function PoolCard({ l, eager }: { l: CardListing; eager: boolean }) {
  // Minor units, already all-in (see city-inventory.functions.ts). Show the
  // cents when there are any, so the card matches the listing page to the penny
  // — $51.75 here and $51.75 there. A missing price renders nothing at all
  // rather than a fake "$0".
  const price =
    typeof l.price === "number" && l.price > 0
      ? `$${(l.price / 100).toFixed(l.price % 100 === 0 ? 0 : 2)}/hr`
      : null;
  const where = [l.city, l.stateCode].filter(Boolean).join(", ");
  return (
    <a
      href={`/l/${l.slug}/${l.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    >
      {l.img ? (
        <img
          src={l.img}
          alt={l.title}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          width={640}
          height={360}
          className="aspect-video w-full object-cover transition group-hover:scale-[1.02]"
        />
      ) : (
        // No image: keep the grid cell the same height so the layout holds.
        <div className="flex aspect-video w-full items-center justify-center bg-muted text-sm text-muted-foreground">
          Photo coming soon
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="line-clamp-2 min-h-[2.75rem] font-semibold text-foreground">
          {l.title}
        </div>
        <div className="mt-1 flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="line-clamp-1">{where || "United States"}</span>
          {price ? <span className="shrink-0 font-semibold text-primary">{price}</span> : null}
        </div>
        {(l.capacity || (l.amenities && l.amenities.length > 0)) ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {l.capacity ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Up to {l.capacity} guests
              </span>
            ) : null}
            {(l.amenities ?? []).slice(0, 3).map((a) => (
              <span key={a} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {a}
              </span>
            ))}
          </div>
        ) : null}
        <span className="mt-3 text-sm font-semibold text-primary group-hover:underline">
          View pool
        </span>
      </div>
    </a>
  );
}

function Grid({ listings }: { listings: CardListing[] }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((l, i) => (
        <PoolCard key={l.id} l={l} eager={i < 3} />
      ))}
    </div>
  );
}

/** Legacy snapshot-backed section, still used by the hand-built hub routes. */
export function LiveInventory({
  listings,
  heading,
}: {
  listings: (LiveListing & { mi?: number })[];
  heading: string;
}) {
  if (!listings.length) return null;
  return (
    <section className="border-b border-border py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{heading}</h2>
        <Grid listings={listings.slice(0, 9).map(fromLive)} />
      </div>
    </section>
  );
}

/**
 * THE reusable inventory section for pSEO city pages. Exact-city supply is
 * rendered first under its own heading; nearby supply is only ever shown under
 * a separate "near" heading so a pool is never described as being in a city it
 * is not in. Every count it prints is a count from synced_listings.
 *
 * `framing`:
 *   "renter" (default) — a page for someone looking for a pool. With no pool to
 *            show it says so plainly ("There are no pools listed in {City} yet.")
 *            and links to browse all pools — but only when the radius lookup
 *            ran. A city with no coordinates (nearby not checked) says only that
 *            no pool has it as its city, with no claim that nothing is near and
 *            no promise of a search around it (without coordinates there is no
 *            bounded search, and WEST ignores an address on its own): browse
 *            all pools. After a failed read it says nothing about how many
 *            pools there are.
 *   "host"   — a page recruiting pool owners. Renders ONLY when real pools exist
 *            ("Pools already listed near {City}"); otherwise nothing at all, so a
 *            host page never opens on an empty-marketplace notice.
 */
export function CityInventorySection({
  inventory,
  cityName,
  browseAllHref = "/s",
  framing = "renter",
}: {
  inventory: CityInventory;
  cityName: string;
  browseAllHref?: string;
  framing?: "renter" | "host";
}) {
  const { exact, nearby } = inventory;
  const exactTotal = Math.max(inventory.exactTotal ?? 0, exact.length);
  const nearbyTotal = Math.max(inventory.nearbyTotal ?? 0, nearby.length);
  const has = exact.length > 0 || nearby.length > 0;
  const pools = (n: number) => `${n} ${n === 1 ? "pool" : "pools"}`;
  const radius = inventory.radiusMi;

  if (framing === "host" && !has) return null;

  const exactHeading =
    framing === "host"
      ? `${pools(exactTotal)} already listed in ${cityName}`
      : `Private pools listed in ${cityName}`;
  const exactLede =
    framing === "host"
      ? `Pools listed on Pool Rental Near Me in ${cityName}.`
      : `${pools(exactTotal)} listed in ${cityName} on Pool Rental Near Me. Open one to see its photos and details.`;
  const nearbyHeading =
    exact.length > 0
      ? `More pools near ${cityName}`
      : framing === "host"
        ? `Pools already listed near ${cityName}`
        : `Pools near ${cityName}`;
  // Count and radius only. No "none in {City} itself" clause: exact matching
  // reads the listing's city field, and a listing filed under a neighbourhood
  // ("Jamaica" for Queens) or with no city can sit inside the city.
  const nearbyLede = `${pools(nearbyTotal)} ${nearbyTotal === 1 ? "is" : "are"} listed ${
    radius ? `within ${radius} miles of ${cityName}` : `near ${cityName}`
  }${nearby.length < nearbyTotal ? `; the ${nearby.length} nearest are shown` : ""}. Distances are approximate straight-line miles.`;
  const asOf = formatSyncDate(inventory.syncedAt);

  return (
    <section
      className="border-b border-border py-10 sm:py-14"
      id={framing === "host" ? "pools-listed" : "pools-available"}
      data-inventory={framing}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {exact.length > 0 ? (
          <>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{exactHeading}</h2>
            <p className="mt-2 text-muted-foreground">{exactLede}</p>
            <Grid listings={exact as unknown as CardListing[]} />
          </>
        ) : null}

        {nearby.length > 0 ? (
          <div className={exact.length > 0 ? "mt-12" : ""}>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{nearbyHeading}</h2>
            <p className="mt-2 text-muted-foreground">{nearbyLede}</p>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(nearby as unknown as CardListing[]).map((l, i) => (
                <div key={l.id}>
                  <PoolCard l={l} eager={exact.length === 0 && i < 3} />
                  {typeof l.mi === "number" ? (
                    <div className="mt-1.5 text-xs text-muted-foreground">
                      {l.mi < 1 ? "Under 1 mile" : `About ${Math.round(l.mi)} miles`} from {cityName}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {!has ? (
          <>
            {inventory.readFailed ? (
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                Browse private pools
              </h2>
            ) : !inventory.nearbyChecked ? (
              <>
                <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                  Browse private pools
                </h2>
                <p className="mt-2 max-w-2xl text-muted-foreground" data-nearby-unchecked="">
                  No pools are listed with {cityName} as their city yet.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                  No pools listed in {cityName} yet
                </h2>
                <p className="mt-2 max-w-2xl text-muted-foreground" data-empty-inventory="">
                  There are no pools listed in {cityName} yet.
                </p>
              </>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={browseAllHref}
                className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Browse all pools
              </a>
            </div>
          </>
        ) : null}

        {has && asOf ? (
          <p className="mt-6 text-xs text-muted-foreground" data-inventory-as-of="">
            Listing data as of {asOf}.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export type { InventoryListing };
