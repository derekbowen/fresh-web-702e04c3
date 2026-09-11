import type { LiveListing } from "@/lib/live-inventory";

// Server-rendered listing cards. No client fetch, no loading state — the data is
// baked into the bundle, so this renders complete on first paint.
export function LiveInventory({ listings, heading }: {
  listings: (LiveListing & { mi?: number })[]; heading: string;
}) {
  if (!listings.length) return null;
  return (
    <section className="border-b border-border py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{heading}</h2>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.slice(0, 9).map((l) => (
            <a key={l.id} href={`/l/${l.slug}/${l.id}`}
               className="group overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-lg">
              {l.img ? (
                <img src={l.img} alt={l.title} loading="lazy" width={640} height={360}
                     className="aspect-video w-full object-cover transition group-hover:scale-[1.02]" />
              ) : null}
              <div className="p-4">
                <div className="line-clamp-1 font-semibold text-foreground">{l.title}</div>
                <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                  <span>{[l.city, l.state].filter(Boolean).join(", ")}</span>
                  {l.price ? (
                    <span className="font-semibold text-primary">
                      ${"{"}(l.price / 100).toFixed(0){"}"}/hr
                    </span>
                  ) : null}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
