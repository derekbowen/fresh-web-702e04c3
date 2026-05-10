/**
 * Availability validation utilities — pure, isomorphic (safe for client + server).
 */

export interface ValidSlot {
  start: string;
  end: string;
  seats: number;
}

/**
 * Returns a normalized slot if start/end parse to valid dates and end > start.
 * Otherwise returns null. Coerces seats to a finite positive integer (default 1).
 */
export function isValidIsoPair(
  start: unknown,
  end: unknown,
  seats: unknown = 1,
): ValidSlot | null {
  if (typeof start !== "string" || typeof end !== "string" || !start || !end) {
    return null;
  }
  const sMs = Date.parse(start);
  const eMs = Date.parse(end);
  if (!Number.isFinite(sMs) || !Number.isFinite(eMs)) return null;
  if (eMs <= sMs) return null;
  const seatsNum = Number(seats);
  return {
    start,
    end,
    seats: Number.isFinite(seatsNum) && seatsNum > 0 ? Math.floor(seatsNum) : 1,
  };
}

export function normalizeSlotArray(input: unknown): ValidSlot[] {
  if (!Array.isArray(input)) return [];
  const out: ValidSlot[] = [];
  for (const s of input) {
    const v = isValidIsoPair(
      (s as any)?.start,
      (s as any)?.end,
      (s as any)?.seats,
    );
    if (v) out.push(v);
  }
  return out;
}
