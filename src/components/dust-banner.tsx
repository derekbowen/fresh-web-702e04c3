import { useEffect, useState } from "react";

const STORAGE_KEY = "prnm_dust_banner_dismissed_v1";

export function DustBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setDismissed(true);
    } catch {
      // ignore
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (dismissed) return null;

  return (
    <aside
      role="region"
      aria-label="Site update notice"
      className="relative border-b border-amber-200 bg-amber-50 text-amber-950"
    >
      <div className="mx-auto max-w-5xl px-4 py-5 pr-12 sm:px-6 sm:py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
          Heads up
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
          Pardon our dust, we're rebuilding the whole experience.
        </h2>
        <p className="mt-3 text-sm leading-relaxed sm:text-base">
          We're ripping out the old booking front-end and replacing it with
          something built specifically for pool hosts and the people who
          actually book them. New search, new host tools, new everything. If a
          page looks rough or a link goes somewhere weird over the next few
          weeks, that's why.
        </p>
        <p className="mt-2 text-sm leading-relaxed sm:text-base">
          The 5,100+ city pages, the host playbooks, and the booking flow all
          still work. We're just upgrading the chassis underneath them.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <a
            href="/s"
            className="inline-flex items-center justify-center rounded-full bg-amber-900 px-5 py-2.5 text-sm font-semibold text-amber-50 transition-colors hover:bg-amber-800"
          >
            Browse pools
          </a>
          <a
            href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"
            className="inline-flex items-center justify-center rounded-full border border-amber-900 px-5 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
          >
            List your pool
          </a>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss notice"
        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-amber-900 transition-colors hover:bg-amber-100"
      >
        <span aria-hidden="true" className="text-xl leading-none">×</span>
      </button>
    </aside>
  );
}
