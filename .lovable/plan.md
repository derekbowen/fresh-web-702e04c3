## Goal

Make the availability calendar render safely for every payload shape the Sharetribe `/timeslots/query` endpoint (or its cache row) can return — including missing fields, non-array `data`, malformed ISO strings, null `attributes`, HTTP failures, empty results, and bad cached rows. The page must never crash or render `Invalid Date`.

## Files to change

1. `src/server/sharetribe.server.ts` — `fetchAvailableTimeSlots`
2. `src/lib/availability.functions.ts` — `getListingAvailability` + `expandToHourlySlots`
3. `src/components/availability-calendar.tsx`

## Changes

### 1. `fetchAvailableTimeSlots` (sharetribe.server.ts)

Tolerate every malformed branch from the upstream API:
- Treat non-object `json`, missing `json.data`, or non-array `json.data` as `[]`.
- Use optional chaining on each item: `d?.attributes?.start`, `d?.attributes?.end`.
- Validate each pair with `isValidIsoPair(start, end)` helper (parse to `Date`, check `!isNaN`, ensure `end > start`); drop slots that fail.
- Coerce `seats` to a finite positive number, default `1`.
- Wrap the entire `.map().filter().sort()` chain in try/catch returning `[]`.
- Keep existing outer try/catch returning `[]`.

### 2. `availability.functions.ts`

`getListingAvailability`:
- When reading `availability_cache`, after the `Array.isArray(row.slots)` check, normalize each cached slot through the same `isValidIsoPair` filter. If the normalized array is empty AND the raw cache had entries, treat the cache as stale (skip and refetch).
- Wrap `new Date(row.fetched_at).getTime()` in a finite check; if invalid, ignore the cache row.
- In the catch block for the Sharetribe call, also catch synchronous errors from `expandToHourlySlots` (move the call inside the try, which it already is — confirm).
- Return shape stays `{ listingId, fetchedAt, slots: [], error }` on any failure (already correct).

`expandToHourlySlots`:
- Guard `blocks` with `Array.isArray(blocks) ? blocks : []` at the top.
- Inside the loop, also guard `b?.start` / `b?.end` (currently assumes block has them).
- Cap output length at a sane limit (e.g. 24 * days) to prevent runaway loops if `bEnd - bStart` is huge from bad data.

### 3. `availability-calendar.tsx`

- Treat `data` as `Partial<AvailabilityResult> | null` defensively. Coerce `data?.slots` to `Array.isArray(data?.slots) ? data.slots : []` everywhere it's read (currently uses `data?.slots ?? []`, which fails if `slots` is a non-array value).
- In `slotsByDay` builder, validate each slot:
  - `s?.start` and `s?.end` are non-empty strings,
  - `new Date(s.start)` is a valid date (`!isNaN(d.getTime())`),
  - `new Date(s.end) > new Date(s.start)`.
  Drop invalid slots silently.
- In `formatHour`, return `"--"` (or empty) for invalid ISO inputs instead of `NaNAM`.
- In `buildBookingUrl`, guard `bookingBaseUrl` with `String(bookingBaseUrl ?? "https://poolrentalnearme.com")` before `.replace`.
- In `selectedSlots.map`, skip slots whose `formatHour` returns the fallback (defense in depth).
- Wrap the entire returned `<section>` body in a try/catch via a small inner `<CalendarBody />` component plus a top-level error boundary fallback that renders the same "Calendar temporarily unavailable" panel with the direct-book CTA. (TanStack/React doesn't catch render errors without a boundary — use a tiny class component `AvailabilityErrorBoundary` colocated in the same file.)

### 4. Shared helper

Add `isValidIsoPair(start: unknown, end: unknown): { start: string; end: string } | null` to `availability.functions.ts` (or a small `src/lib/availability.utils.ts` if both files need it). Export from there and re-use in `fetchAvailableTimeSlots` to keep validation consistent across server and client paths.

## Out of scope

- No UI/visual redesign, no new copy beyond the existing error panel.
- No changes to caching TTL or DB schema.
- No changes to Sharetribe auth or request shape.

## Verification

- `bunx vitest` if any availability tests exist (none currently — skip).
- Manually invoke server function with: valid listingId, listingId returning empty `data`, simulated bad payload by temporarily forcing `fetchAvailableTimeSlots` to return `[{}]` / `[{ attributes: null }]` / `null` — confirm component renders the empty-state message and never throws.
- Use `stack_modern--server-function-logs` after deploy to confirm no new exceptions.
