/**
 * Per-request "this request cannot be answered: a database read failed" flag.
 *
 * Why a flag and a middleware, rather than a status set by the route
 * (read in node_modules, @tanstack/react-start 1.167.39 / router-core):
 *
 * - An SSR page's HTTP status is `router.stores.statusCode`, and router-core
 *   only ever sets it to a redirect's status, 404 (notFound), 500 (a match in
 *   error) or 200 (router.ts, `load`). A route cannot ask for 503.
 * - `setResponseStatus()` writes to the h3 event, and h3 applies the event's
 *   status only when the handler returns a non-Response value. The SSR handler
 *   returns a Response, so the status is ignored there (h3 `prepareResponse`).
 *   It IS honoured for server-function RPC responses, which are built from the
 *   event's status (start-server-core, server-functions-handler.ts).
 * - A request middleware (`createMiddleware().server`) wraps the whole request
 *   and may return its own Response. That is the supported place to replace
 *   the page response; `src/start.ts` does it with `failedReadMiddleware`.
 *
 * So: server code that hits a failed read on a request it cannot answer calls
 * `markRequestUnavailable()`. For an RPC call that alone makes the response a
 * 503. For a page request the middleware is waiting on `signal` and answers
 * 503 immediately, without waiting for the rest of the render (whose other
 * loaders may be stuck on the same database).
 */
import { getRequest, setResponseStatus } from "@tanstack/react-start/server";
import {
  guardedRead,
  ReadUnavailableError,
  type ReadData,
  type ReadResult,
} from "@/lib/failed-read";

export interface UnavailableWatch {
  marked: boolean;
  /** Resolves when the request is marked unavailable; never rejects. */
  signal: Promise<void>;
  resolve: () => void;
}

const watches = new WeakMap<object, UnavailableWatch>();

/** The current request's watch, or null outside a request (boot-time warm-ups, scripts). */
export function watchRequestUnavailable(): UnavailableWatch | null {
  let request: object;
  try {
    request = getRequest();
  } catch {
    return null;
  }
  let watch = watches.get(request);
  if (!watch) {
    let resolve!: () => void;
    const signal = new Promise<void>((r) => {
      resolve = r;
    });
    watch = { marked: false, signal, resolve };
    watches.set(request, watch);
  }
  return watch;
}

export function markRequestUnavailable(): void {
  const watch = watchRequestUnavailable();
  if (!watch) return;
  watch.marked = true;
  try {
    setResponseStatus(503);
  } catch {
    // no h3 event; the middleware flag above is what matters
  }
  watch.resolve();
}

/** Mark the request unavailable and throw. For reads the caller cannot do without. */
export function failRequestUnavailable(label: string): never {
  markRequestUnavailable();
  throw new ReadUnavailableError(label);
}

/**
 * A read whose "no row" answer the caller turns into a 404 (or an empty page).
 * Returns the data when the read succeeded; when it failed, flags the request
 * unavailable and throws, so "could not read" is never mistaken for "no row".
 */
export async function readOrFailRequest<R extends ReadResult<unknown>>(
  label: string,
  run: (signal: AbortSignal) => PromiseLike<R>,
): Promise<ReadData<R> | null> {
  const outcome = await guardedRead<never, R>(label, run);
  if (!outcome.ok) failRequestUnavailable(label);
  return outcome.data;
}
