import { createRouter, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { routeTree } from "./routeTree.gen";

function extractFirstLocation(stack?: string): string | null {
  if (!stack) return null;
  const lines = stack.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    // Match "at fn (file:line:col)" or "file:line:col"
    const m = line.match(/\(?([^()\s]+:\d+:\d+)\)?$/);
    if (m) return m[1];
  }
  return null;
}

function hashCode(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36).toUpperCase().slice(0, 6);
}

function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const name = error?.name || "Error";
  const message = error?.message || "Unknown error";
  const location = extractFirstLocation(error?.stack) || "unknown location";
  const path = typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
  const timestamp = new Date().toISOString();
  const code = `ERR-${hashCode(`${name}|${message}|${location}`)}`;

  // Auto-recover from stale-deploy chunk errors: if a dynamic import failed because a
  // newer deploy rehashed/deleted the old chunk, reload to fetch fresh HTML + chunks.
  // The time-window guard prevents reload loops but still recovers from later deploys.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!/dynamically imported module|Importing a module script failed|error loading dynamically imported/i.test(message)) return;
    const k = "fw_chunk_reload_at";
    const last = Number(sessionStorage.getItem(k) || 0);
    if (Date.now() - last > 10000) {
      sessionStorage.setItem(k, String(Date.now()));
      window.location.reload();
    }
  }, [message]);

  const details =
    `Code: ${code}\n` +
    `Name: ${name}\n` +
    `Message: ${message}\n` +
    `Location: ${location}\n` +
    `Path: ${path}\n` +
    `Time: ${timestamp}\n` +
    `Stack:\n${error?.stack ?? "(no stack)"}`;

  const copy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(details).catch(() => {});
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h1 className="text-center text-2xl font-bold tracking-tight text-foreground">Something went wrong</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Copy the details below so it can be fixed fast.
        </p>

        <div className="mt-6 rounded-lg border border-destructive/30 bg-muted/40 p-4 text-left">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-destructive px-2 py-1 font-mono font-bold text-destructive-foreground">{code}</span>
            <span className="rounded bg-background px-2 py-1 font-mono text-foreground">{name}</span>
            <span className="ml-auto font-mono text-muted-foreground">{timestamp}</span>
          </div>
          <dl className="mt-3 space-y-2 font-mono text-xs">
            <div>
              <dt className="text-muted-foreground">Message</dt>
              <dd className="break-words text-destructive">{message}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Location</dt>
              <dd className="break-all text-foreground">{location}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Path</dt>
              <dd className="break-all text-foreground">{path || "(ssr)"}</dd>
            </div>
          </dl>
          {error?.stack && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-muted-foreground">Stack trace</summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded bg-background p-2 font-mono text-[11px] text-foreground">
{error.stack}
              </pre>
            </details>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={copy}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Copy error details
          </button>
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
  });

  // Proactively auto-reload when Vite fails to preload a chunk (e.g. a deploy
  // rehashed/deleted chunks while a tab was open). Same guard to avoid reload loops.
  if (typeof window !== "undefined") {
    window.addEventListener("vite:preloadError", () => {
      const k = "fw_chunk_reload_at";
      const last = Number(sessionStorage.getItem(k) || 0);
      if (Date.now() - last > 10000) {
        sessionStorage.setItem(k, String(Date.now()));
        window.location.reload();
      }
    });
  }

  return router;
};
