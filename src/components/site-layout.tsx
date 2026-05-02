import { Link } from "@tanstack/react-router";

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
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-foreground" }}
          >
            Home
          </Link>
          <Link
            to="/category/$slug"
            params={{ slug: "heated-pools" }}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Categories
          </Link>
          <Link
            to="/blog"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Blog
          </Link>
          <Link
            to="/providers"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Providers
          </Link>
        </nav>
        <a
          href="https://www.poolrentalnearme.com/signup"
          className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-glow"
        >
          List Your Pool
        </a>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Pool Rental Near Me
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Rent a private pool by the hour. Book instantly with $2M liability
              insurance included.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Explore</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-foreground">
                  Find a pool
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/providers" className="hover:text-foreground">
                  Providers
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Hosts</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://www.poolrentalnearme.com/signup"
                  className="hover:text-foreground"
                >
                  List your pool
                </a>
              </li>
              <li>
                <a
                  href="https://www.poolrentalnearme.com/login"
                  className="hover:text-foreground"
                >
                  Host login
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/about" className="hover:text-foreground">
                  About
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-foreground">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Pool Rental Near Me. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
