function isValidIsoPair(start, end, seats = 1) {
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
    seats: Number.isFinite(seatsNum) && seatsNum > 0 ? Math.floor(seatsNum) : 1
  };
}
function normalizeSlotArray(input) {
  if (!Array.isArray(input)) return [];
  const out = [];
  for (const s of input) {
    const v = isValidIsoPair(
      s?.start,
      s?.end,
      s?.seats
    );
    if (v) out.push(v);
  }
  return out;
}
export {
  isValidIsoPair,
  normalizeSlotArray
};
