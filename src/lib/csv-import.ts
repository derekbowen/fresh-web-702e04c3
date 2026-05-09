// Shared CSV helpers usable on both client and server.

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ",") {
        row.push(cur);
        cur = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cur);
        cur = "";
        rows.push(row);
        row = [];
      } else cur += ch;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""));
}

export function coerceValue(raw: string): unknown {
  if (raw === "") return null;
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fall through
    }
  }
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return raw;
}

export function applyMapping(
  header: string[],
  mapping?: Record<string, string>,
): { effective: string[]; map: (string | null)[] } {
  const m = header.map((h) => {
    if (!mapping) return h;
    if (!(h in mapping)) return h;
    const v = mapping[h];
    return v && v.length > 0 ? v : null;
  });
  const effective: string[] = [];
  m.forEach((v) => { if (v) effective.push(v); });
  return { effective, map: m };
}
