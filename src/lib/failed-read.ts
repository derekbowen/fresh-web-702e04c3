/**
 * A database read that FAILED is not a read that found nothing.
 *
 * Until 2026-11 most Supabase reads here destructured only `data`
 * (`const { data: rows } = await ...`). supabase-js does not throw on a network
 * error, a PostgREST 5xx or a timeout: it resolves `{ data: null, error }`. So a
 * few seconds of database trouble read as "no rows", and "no rows" was answered
 * as a 404, as the become-a-host 301, or as an empty sitemap. Cloudflare caches
 * `/p/*` for 600 s whatever the status, which turned each blip into ten minutes
 * of dead pages (58 live pages logged as 404 on 2026-09-16, 193 on 2026-07-15).
 *
 * Everything in this file is pure (no path alias, no framework import) so it can
 * be imported directly by `node --test`.
 */

/** Seconds a crawler or browser is asked to wait before retrying a 503. */
export const UNAVAILABLE_RETRY_AFTER_SECONDS = 120;

const DEFAULT_READ_TIMEOUT_MS = 10_000;

/**
 * Upper bound for one guarded read. Override with SUPABASE_READ_TIMEOUT_MS
 * (milliseconds). Read on every call so a process can be re-tuned by restart
 * with a new environment and tests can change it between cases.
 */
export function readTimeoutMs(): number {
  const raw = typeof process !== "undefined" ? process.env?.SUPABASE_READ_TIMEOUT_MS : undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_READ_TIMEOUT_MS;
}

/** The `{ data, error }` shape supabase-js resolves with (count for head/count queries). */
export interface ReadResult<T> {
  data?: T | null;
  error?: unknown;
  count?: number | null;
}

/** The row type a `{ data, error }` result carries, without null/undefined. */
export type ReadData<R> = R extends { data?: infer D } ? NonNullable<D> : never;

/** Explicit `T` wins; otherwise the row type is taken from what `run` resolves with. */
type Resolved<T, R> = [T] extends [never] ? ReadData<R> : T;

export type ReadFailureReason = "error" | "thrown" | "timeout";

export type ReadOutcome<T> =
  | { ok: true; data: T | null; count: number | null }
  | { ok: false; reason: ReadFailureReason; error: unknown };

/**
 * Run one read and say whether it SUCCEEDED, separately from what it returned.
 *
 * `ok: false` covers all three ways a read fails: a returned `{ error }`, a
 * thrown exception, and no answer within the timeout. Only `ok: true` may be
 * used to conclude "there is no such row".
 *
 * `run` receives an AbortSignal that fires at the timeout; pass it to the query
 * (`.abortSignal(signal)`) so the underlying request is cancelled too. The
 * timeout is enforced here as well, so a `run` that ignores the signal still
 * cannot hang the caller.
 */
export async function guardedRead<T = never, R extends ReadResult<unknown> = ReadResult<T>>(
  label: string,
  run: (signal: AbortSignal) => PromiseLike<R>,
  options?: { timeoutMs?: number },
): Promise<ReadOutcome<Resolved<T, R>>> {
  type Data = Resolved<T, R>;
  const timeoutMs = options?.timeoutMs ?? readTimeoutMs();
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;
  const timeout = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      resolve("timeout");
    }, timeoutMs);
  });

  let outcome: ReadOutcome<Data>;
  try {
    const attempt = Promise.resolve().then(() => run(controller.signal));
    // The loser of the race may still reject later (an aborted fetch); it has
    // already been accounted for as a timeout.
    attempt.catch(() => {});
    const res = await Promise.race([attempt, timeout]);
    if (res === "timeout" || timedOut) {
      outcome = {
        ok: false,
        reason: "timeout",
        error: new Error(`no answer within ${timeoutMs} ms`),
      };
    } else if (!res || typeof res !== "object") {
      outcome = { ok: false, reason: "error", error: new Error("read returned no result") };
    } else if (res.error && !isNoSingleRow(res.error)) {
      outcome = { ok: false, reason: "error", error: res.error };
    } else {
      outcome = {
        ok: true,
        data: (res.data as Data | null | undefined) ?? null,
        count: res.count ?? null,
      };
    }
  } catch (err) {
    outcome = timedOut
      ? { ok: false, reason: "timeout", error: new Error(`no answer within ${timeoutMs} ms`) }
      : { ok: false, reason: "thrown", error: err };
  } finally {
    if (timer) clearTimeout(timer);
  }

  if (!outcome.ok) {
    // One line per failed read. During an outage this runs on every request,
    // so no stack traces.
    console.error(`[failed-read] ${label}: ${outcome.reason}: ${describeError(outcome.error)}`);
  }
  return outcome;
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  const e = error as { message?: unknown; code?: unknown; details?: unknown } | null;
  if (!e || typeof e !== "object") return String(error);
  const parts = [typeof e.message === "string" ? e.message : "unknown error"];
  if (e.code) parts.push(`code ${String(e.code)}`);
  if (typeof e.details === "string" && e.details) parts.push(e.details.split("\n")[0]!);
  return parts.join(" | ");
}

/**
 * PGRST116 is what `.single()` / `.maybeSingle()` report when the result is not
 * exactly one row. The read itself worked; the answer is "no single row".
 */
function isNoSingleRow(error: unknown): boolean {
  return (error as { code?: unknown } | null)?.code === "PGRST116";
}

export const READ_UNAVAILABLE_MESSAGE =
  "This page is temporarily unavailable. Please try again in a moment.";

/**
 * Thrown when an answer cannot be given because a read failed. The message is
 * fixed and user-safe: it is what route error components show, and it is how
 * the error is still recognised after crossing the server-function RPC
 * boundary (where the class identity is lost).
 */
export class ReadUnavailableError extends Error {
  label: string;
  constructor(label = "read") {
    super(READ_UNAVAILABLE_MESSAGE);
    this.name = "ReadUnavailableError";
    this.label = label;
  }
}

export function isReadUnavailable(err: unknown): boolean {
  if (err instanceof ReadUnavailableError) return true;
  const e = err as { name?: unknown; message?: unknown } | null | undefined;
  return (
    !!e &&
    typeof e === "object" &&
    (e.name === "ReadUnavailableError" || e.message === READ_UNAVAILABLE_MESSAGE)
  );
}

/** `guardedRead`, for callers that have no use for a failed read: it throws. */
export async function readOrThrow<T = never, R extends ReadResult<unknown> = ReadResult<T>>(
  label: string,
  run: (signal: AbortSignal) => PromiseLike<R>,
  options?: { timeoutMs?: number },
): Promise<{ data: Resolved<T, R> | null; count: number | null }> {
  const outcome = await guardedRead<T, R>(label, run, options);
  if (!outcome.ok) throw new ReadUnavailableError(label);
  return { data: outcome.data, count: outcome.count };
}

const UNAVAILABLE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Temporarily unavailable</title>
</head>
<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;text-align:center">
<h1>Temporarily unavailable</h1>
<p>We could not load this page just now. Please try again in a couple of minutes.</p>
<p><a href="">Try again</a></p>
</body>
</html>
`;

/**
 * The one answer for "a read failed, so this request cannot be answered":
 * HTTP 503, told to retry, never cached, never indexed. `html` is the body for
 * a page request, `text` for a sitemap or any other non-HTML resource.
 */
export function unavailableResponse(kind: "html" | "text" = "html"): Response {
  return new Response(
    kind === "html" ? UNAVAILABLE_HTML : "Temporarily unavailable. Please retry shortly.\n",
    {
      status: 503,
      headers: {
        "Content-Type": kind === "html" ? "text/html; charset=utf-8" : "text/plain; charset=utf-8",
        "Retry-After": String(UNAVAILABLE_RETRY_AFTER_SECONDS),
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}
