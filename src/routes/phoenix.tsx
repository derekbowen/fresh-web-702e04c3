import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { LiveInventory } from "@/components/live-inventory";
import { listingsNear } from "@/lib/live-inventory";
import { buildMeta } from "@/lib/seo";

const CITY = "Phoenix", ST = "AZ";
const POOLS = listingsNear(33.4484, -112.074, 45);
const HOODS = [{ label: "Scottsdale hosts", href: "/p/become-a-swimming-pool-host-scottsdale-az" }, { label: "Tempe hosts", href: "/p/become-a-swimming-pool-host-tempe-az" }, { label: "Chandler hosts", href: "/p/become-a-swimming-pool-host-chandler-az" }, { label: "Mesa hosts", href: "/p/become-a-swimming-pool-host-mesa-az" }];

export const Route = createFileRoute("/phoenix")({
  head: () => buildMeta({
    title: `Pool Rentals in ${CITY}, ${ST} — Book Private Pools by the Hour`,
    description: `Rent a private backyard pool in ${CITY} by the hour, or list yours with 0% host fees and keep 100% of every booking.`,
    path: "/phoenix",
  }),
  component: Page,
});

function Page() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="border-b border-border py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Pool rentals in {CITY}, {ST}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Private backyard pools you can book by the hour — no memberships, no
              crowds. Hosts keep 100% of every booking: 0% host fees, always.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/s" className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">
                Browse pools near {CITY}
              </a>
              <a href="/p/become-a-swimming-pool-host-phoenix-az" className="rounded-lg border border-border px-5 py-3 font-semibold text-foreground">
                List your {CITY} pool — 0% fees
              </a>
            </div>
          </div>
        </section>
        <LiveInventory listings={POOLS}
          heading={`Pools you can book right now near ${CITY}`} />
        <section className="border-b border-border py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground">Own a pool in the {CITY} area?</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              List free, set your own hourly rate and rules, and keep every dollar —
              Pool Rental Near Me charges hosts nothing. Payouts are initiated after the booking is completed; bank arrival times may vary.
            </p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm font-medium text-primary">
              <a href="/p/earnings-calculator" className="hover:underline">Earnings calculator →</a>
              <a href="/p/become-a-swimming-pool-host-phoenix-az" className="hover:underline">How hosting works in {CITY} →</a>
            </div>
          </div>
        </section>
        <section className="py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-foreground">Nearby</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {HOODS.map((h) => (
                <a key={h.href} href={h.href}
                   className="rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary">
                  {h.label}
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
