import * as React from "react";
import { Link } from "@tanstack/react-router";

// Stable across SSR + hydration. Bumped at build time, not at request time.
const FOOTER_YEAR = 2026;

// Legacy backend (signup, /s search, /p/* marketing pages) is served on the same
// host as this app. Use root-relative hrefs so links resolve on www, custom
// domain, and preview hosts without hardcoding the production URL.
//
// `rel()` prefixes Vite's BASE_URL so links keep working when the app is
// served behind a reverse proxy under a sub-path (e.g. "/app/"). When BASE_URL
// is "/" (the default), the path is returned unchanged.
function rel(path: string): string {
  if (/^([a-z]+:|\/\/|#|mailto:|tel:)/i.test(path)) return path;
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  if (!base) return path;
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M2 18c1.5 0 2.5-1 4-1s2.5 1 4 1 2.5-1 4-1 2.5 1 4 1 2.5-1 4-1v3c-1.5 0-2.5 1-4 1s-2.5-1-4-1-2.5 1-4 1-2.5-1-4-1-2.5 1-4 1v-3zM6 14V5a3 3 0 0 1 6 0v9M12 9h6a3 3 0 0 1 0 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Pool Rental Near Me
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }}>Home</Link>
          <a href="https://www.poolrentalnearme.com/public-pools" className="text-sm font-medium text-muted-foreground hover:text-foreground">Public Pools</a>
          <a href="https://www.poolrentalnearme.com/amenities" className="text-sm font-medium text-muted-foreground hover:text-foreground">Amenities</a>
          <a href={rel("/p/how-it-works")} className="text-sm font-medium text-muted-foreground hover:text-foreground">How It Works</a>
          <a href={rel("/s")} className="text-sm font-medium text-muted-foreground hover:text-foreground">Search</a>
        </nav>
        <a href={rel("/l/draft/00000000-0000-0000-0000-000000000000/new/details")} className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-glow">
          List Your Pool
        </a>
      </div>
    </header>
  );
}

const EXPLORE = [
  { label: "Search Listings", href: "/s" },
  { label: "How It Works", href: "/p/how-it-works" },
  { label: "Start a Business", href: "/p/hosting" },
  { label: "Swimply Alternative", href: "/p/swimply-alternative" },
  { label: "Sign a Waiver", href: "/p/sign-a-waiver" },
  { label: "Public Pools", href: "https://www.poolrentalnearme.com/public-pools" },
];

const HOSTS = [
  { label: "List Your Pool for Free", href: "/l/draft/00000000-0000-0000-0000-000000000000/new/details" },
  { label: "How Hosting Works", href: "/p/hosting" },
  { label: "Find Locations Near You", href: "/p/all-locations" },
  { label: "Earnings Calculator", href: "/p/earnings-calculator" },
  { label: "Host Pro Tools", href: "/p/free-host-tools" },
  { label: "Host Connect", href: "https://connect.poolrentalnearme.com" },
  { label: "HOA Defense Kit", href: "/p/hoa-pool-rental-defense-kit" },
  { label: "Host Make More $$$", href: "/p/hosting" },
];

const COMPANY = [
  { label: "About", href: "/p/about" },
  { label: "Careers", href: "/p/careers" },
  { label: "Investors", href: "/p/investors" },
  { label: "Terms", href: "/terms-of-service" },
  { label: "Privacy", href: "/privacy-policy" },
  { label: "Video Chat Support", href: "https://meetn.com/poolrentalnearme" },
  { label: "Refer Pool Owners", href: "/referral" },
];

const POPULAR_MARKETS = [
  { name: "Los Angeles, CA", slug: "los-angeles-ca" },
  { name: "San Diego, CA", slug: "san-diego-ca" },
  { name: "Riverside, CA", slug: "riverside-ca" },
  { name: "Sacramento, CA", slug: "sacramento-ca" },
  { name: "Tampa, FL", slug: "tampa-fl" },
  { name: "Scottsdale, AZ", slug: "scottsdale-az" },
  { name: "Nashville, TN", slug: "nashville-tn" },
  { name: "Katy, TX", slug: "katy-tx" },
];

const SOCIALS: Array<{ label: string; href: string; icon: React.ReactNode }> = [
  { label: "Facebook", href: "https://www.facebook.com/poolrentalnearme", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.3.2 2.3.2v2.5h-1.3c-1.3 0-1.7.8-1.7 1.6V12h2.9l-.5 2.9h-2.4v7A10 10 0 0 0 22 12z"/></svg> },
  { label: "X", href: "https://x.com/poolrentalnearme", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M18.244 2H21l-6.52 7.46L22 22h-6.79l-4.78-6.26L4.8 22H2.04l6.97-7.97L2 2h6.96l4.32 5.71L18.24 2zm-2.38 18h1.88L7.27 4H5.27l10.6 16z"/></svg> },
  { label: "YouTube", href: "https://www.youtube.com/@poolrentalnearme", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.4 4 12 4 12 4s-7.4 0-9.4.4A3 3 0 0 0 .5 6.5C0 8.5 0 12 0 12s0 3.5.5 5.5a3 3 0 0 0 2.1 2.1C4.6 20 12 20 12 20s7.4 0 9.4-.4a3 3 0 0 0 2.1-2.1C24 15.5 24 12 24 12s0-3.5-.5-5.5zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg> },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/poolrentalnearme", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm7 0h3.8v1.7h.1c.5-1 1.9-2 3.9-2 4.2 0 5 2.8 5 6.4V21h-4v-5.3c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21h-4V9z"/></svg> },
  { label: "Instagram", href: "https://www.instagram.com/poolrentalnearme", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2 0 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.9.9 1.4.2.4.4 1 .4 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.9.7-1.4.9-.4.2-1 .4-2.2.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.9-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.9-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.2.4-.3 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1zm0 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zm5.2-3.1a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z"/></svg> },
  { label: "TikTok", href: "https://www.tiktok.com/@poolrentalnearme", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M19.6 6.7a5.5 5.5 0 0 1-3.3-1.1V15a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v2.6a3 3 0 1 0 2.1 2.8V2h2.5a5.5 5.5 0 0 0 3.3 4.7v.1z"/></svg> },
  { label: "Pinterest", href: "https://www.pinterest.com/poolrentalnearme", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 2a10 10 0 0 0-3.7 19.3c-.1-.8-.2-2 0-2.9.2-.8 1.1-4.7 1.1-4.7s-.3-.6-.3-1.4c0-1.3.8-2.3 1.7-2.3.8 0 1.2.6 1.2 1.4 0 .8-.5 2-.8 3.2-.2.9.5 1.7 1.4 1.7 1.7 0 3-1.8 3-4.4 0-2.3-1.6-3.9-4-3.9-2.7 0-4.3 2-4.3 4.1 0 .8.3 1.7.7 2.2.1.1.1.2.1.3l-.3 1c0 .2-.2.2-.3.1-1.2-.6-2-2.4-2-3.9 0-3.1 2.3-6 6.6-6 3.5 0 6.2 2.5 6.2 5.8 0 3.4-2.2 6.2-5.2 6.2-1 0-2-.5-2.3-1.1l-.6 2.4c-.2.8-.8 1.9-1.2 2.5A10 10 0 1 0 12 2z"/></svg> },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Brand + contact + social */}
          <div className="lg:col-span-3">
            <Link to="/" aria-label="Pool Rental Near Me" className="inline-flex">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden="true">
                  <path d="M2 18c1.5 0 2.5-1 4-1s2.5 1 4 1 2.5-1 4-1 2.5 1 4 1 2.5-1 4-1v3c-1.5 0-2.5 1-4 1s-2.5-1-4-1-2.5 1-4 1-2.5-1-4-1-2.5 1-4 1v-3z" />
                </svg>
              </div>
            </Link>
            <p className="mt-5 text-sm text-foreground">
              <a href="tel:18889404247" className="hover:text-primary">Call us 888-940-4247</a>
              <span className="text-muted-foreground"> 10am - 5pm PST</span>
            </p>
            <p className="mt-2 text-sm">
              <a href="mailto:support@poolrentalnearme.com" className="text-foreground hover:text-primary">
                support@poolrentalnearme.com
              </a>
            </p>
            <ul className="mt-5 flex flex-wrap items-center gap-3 text-muted-foreground">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-secondary hover:text-primary"
                  >
                    {s.icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <FooterColumn title="Explore" items={EXPLORE} />
          {/* Become a Host */}
          <FooterColumn title="Become a Host" items={HOSTS} />
          {/* Company */}
          <FooterColumn title="Company" items={COMPANY} />
          {/* Popular Markets */}
          <div className="lg:col-span-2">
            <h4 className="text-base font-semibold text-foreground">Popular Markets</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {POPULAR_MARKETS.map((m) => (
                <li key={m.slug}>
                  <a href={rel(`/s?address=${encodeURIComponent(m.name)}`)} className="hover:text-primary">
                    {m.name}
                  </a>
                </li>
              ))}
              <li>
                <a href={rel("/p/all-locations")} className="hover:text-primary">All Locations</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-10">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div>
              <h4 className="text-lg font-semibold text-foreground">Get the Pool Rental Near Me app</h4>
              <p className="mt-1 text-sm text-muted-foreground">Book pools, message hosts, and manage trips on the go.</p>
            </div>
            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
              <a
                dir="ltr"
                href="https://apps.apple.com/app/pool-rental-near-me/id6502249246"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download on the App Store"
                className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-foreground px-5 text-background shadow-sm transition-transform hover:scale-[1.03] sm:h-16 sm:w-auto sm:justify-start sm:gap-3 sm:rounded-2xl sm:px-6"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 shrink-0 sm:h-9 sm:w-9" aria-hidden="true">
                  <path d="M16.365 1.43c0 1.14-.42 2.22-1.18 3.04-.83.9-2.16 1.6-3.27 1.51-.14-1.12.4-2.27 1.16-3.06.83-.86 2.27-1.5 3.29-1.49zM20.5 17.36c-.56 1.29-.83 1.87-1.55 3.01-1 1.59-2.41 3.57-4.16 3.59-1.55.01-1.95-1.01-4.06-1-2.11.01-2.55 1.02-4.1 1-1.75-.02-3.09-1.81-4.09-3.4C0 17.86-.34 13.61 1.4 11.27c1.23-1.66 3.18-2.63 5-2.63 1.86 0 3.03 1.02 4.57 1.02 1.5 0 2.41-1.02 4.56-1.02 1.62 0 3.34.88 4.56 2.41-4.01 2.2-3.36 7.93.41 9.31z" />
                </svg>
                <div className="flex flex-col leading-tight text-start">
                  <span className="text-[10px] uppercase tracking-wide opacity-80">Download on the</span>
                  <span className="text-base font-semibold sm:text-xl">App Store</span>
                </div>
              </a>
              <a
                dir="ltr"
                href="https://play.google.com/store/apps/details?id=com.poolrentalnearme.app.prod"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get it on Google Play"
                className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-foreground px-5 text-background shadow-sm transition-transform hover:scale-[1.03] sm:h-16 sm:w-auto sm:justify-start sm:gap-3 sm:rounded-2xl sm:px-6"
              >
                <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0 sm:h-9 sm:w-9" aria-hidden="true">
                  <path d="M3.6 1.6c-.4.3-.6.8-.6 1.5v17.8c0 .7.2 1.2.6 1.5l10.1-10.4L3.6 1.6z" fill="#34A853" />
                  <path d="M17.5 8.6 13.7 12l3.8 3.4 4.5-2.6c1.3-.7 1.3-2.7 0-3.4l-4.5-2.8z" fill="#FBBC04" />
                  <path d="m3.6 22.4 10.1-10.4L17.5 15.4 5.4 22.7c-.7.4-1.4.2-1.8-.3z" fill="#EA4335" />
                  <path d="M3.6 1.6c.4-.5 1.1-.7 1.8-.3l12.1 7.3-3.8 3.4L3.6 1.6z" fill="#4285F4" />
                </svg>
                <div className="flex flex-col leading-tight text-start">
                  <span className="text-[10px] uppercase tracking-wide opacity-80">GET IT ON</span>
                  <span className="text-base font-semibold sm:text-xl">Google Play</span>
                </div>
              </a>
            </div>
          </div>
          <div className="mt-8 text-xs text-muted-foreground">
            © {FOOTER_YEAR} PRNM CORP Riverside, Ca 92509
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; href: string; internal?: boolean }>;
}) {
  return (
    <div className="lg:col-span-2">
      <h4 className="text-base font-semibold text-foreground">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {items.map((it) => (
          <li key={it.label}>
            {it.internal ? (
              <Link to={it.href} className="hover:text-primary">{it.label}</Link>
            ) : (
              <a href={rel(it.href)} className="hover:text-primary">{it.label}</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
