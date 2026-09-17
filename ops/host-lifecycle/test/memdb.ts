/**
 * Stateful in-memory stand-in for the slice of supabase-js the engine uses,
 * so the regression tests can drive the REAL evaluate and send code end to
 * end (enqueue → lease → record/send → re-evaluate) without a database.
 * Supports: from().select/eq/in/gte/ilike/not/or/order/limit/maybeSingle,
 * upsert(onConflict, ignoreDuplicates), insert, update().eq, delete().eq,
 * select(count: exact, head: true), rpc('lease_communication_jobs').
 */
export type Row = Record<string, any>;

const TABLES: Record<string, string> = {
  communication_jobs: "jobs", host_lifecycle_state: "hosts", host_lifecycle_runs: "runs",
  suppressed_emails: "suppressed", email_unsubscribe_tokens: "tokens", host_subscribers: "hostSubs", composer_unsubscribes: "composer",
};

export class MemDb {
  jobs: Row[] = []; hosts: Row[] = []; runs: Row[] = []; suppressed: Row[] = []; tokens: Row[] = []; hostSubs: Row[] = []; composer: Row[] = [];
  private seq = 0;
  nextId(): string { this.seq++; return `00000000-0000-4000-8000-${String(this.seq).padStart(12, "0")}`; }
  table(name: string): Row[] { const k = TABLES[name]; if (!k) throw new Error(`memdb: unknown table ${name}`); return (this as any)[k]; }
  from(name: string) { return new Query(this, name); }
  async rpc(fn: string, args: Row) {
    if (fn !== "lease_communication_jobs") throw new Error(`memdb: unknown rpc ${fn}`);
    const now = new Date().toISOString();
    const due = this.jobs.filter((j) => j.status === "queued" && j.scheduled_at <= now).sort((a, b) => (a.scheduled_at < b.scheduled_at ? -1 : 1)).slice(0, args.p_limit);
    for (const j of due) { j.status = "leased"; j.leased_at = now; j.leased_by = args.p_worker; j.attempt_count = (j.attempt_count ?? 0) + 1; }
    return { data: due.map((j) => ({ ...j })), error: null };
  }
  snapshot(name: string): string { return JSON.stringify(this.table(name)); }
}

type Filter = (r: Row) => boolean;

class Query implements PromiseLike<any> {
  private filters: Filter[] = [];
  private op: { kind: "select" } | { kind: "upsert"; rows: Row[]; onConflict?: string; ignoreDuplicates?: boolean } | { kind: "insert"; rows: Row[] } | { kind: "update"; patch: Row } | { kind: "delete" } = { kind: "select" };
  private count = false; private head = false; private orderKey: string | null = null; private asc = true; private lim: number | null = null; private one = false;
  constructor(private db: MemDb, private name: string) {}
  select(_cols?: string, o?: { count?: string; head?: boolean }) { if (o?.count) this.count = true; if (o?.head) this.head = true; return this; }
  eq(k: string, v: any) { this.filters.push((r) => r[k] === v); return this; }
  in(k: string, vs: any[]) { this.filters.push((r) => vs.includes(r[k])); return this; }
  gte(k: string, v: any) { this.filters.push((r) => r[k] != null && r[k] >= v); return this; }
  ilike(k: string, v: any) { const s = String(v).toLowerCase(); this.filters.push((r) => String(r[k] ?? "").toLowerCase() === s); return this; }
  not(k: string, _op: string, v: any) { this.filters.push((r) => r[k] !== v && r[k] != null); return this; }
  or(expr: string) {
    const parts = expr.split(",").map((p) => p.split("."));
    this.filters.push((r) => parts.some(([k, op, v]) => (op === "eq" ? r[k] === v : String(r[k] ?? "").toLowerCase() === String(v).toLowerCase())));
    return this;
  }
  order(k: string, o?: { ascending?: boolean }) { this.orderKey = k; this.asc = o?.ascending !== false; return this; }
  limit(n: number) { this.lim = n; return this; }
  maybeSingle() { this.one = true; return this; }
  single() { this.one = true; return this; }
  upsert(row: Row | Row[], o?: { onConflict?: string; ignoreDuplicates?: boolean }) { this.op = { kind: "upsert", rows: Array.isArray(row) ? row : [row], onConflict: o?.onConflict, ignoreDuplicates: o?.ignoreDuplicates }; return this; }
  insert(row: Row | Row[]) { this.op = { kind: "insert", rows: Array.isArray(row) ? row : [row] }; return this; }
  update(patch: Row) { this.op = { kind: "update", patch }; return this; }
  delete() { this.op = { kind: "delete" }; return this; }
  private matches(): Row[] {
    let rows = this.db.table(this.name).filter((r) => this.filters.every((f) => f(r)));
    if (this.orderKey) { const k = this.orderKey; rows = [...rows].sort((a, b) => (a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0) * (this.asc ? 1 : -1)); }
    if (this.lim != null) rows = rows.slice(0, this.lim);
    return rows;
  }
  private run(): any {
    const t = this.db.table(this.name); const now = new Date().toISOString();
    const op = this.op;
    if (op.kind === "select") {
      const rows = this.matches();
      if (this.one) return { data: rows[0] ? { ...rows[0] } : null, error: null };
      return { data: this.head ? null : rows.map((r) => ({ ...r })), count: this.count ? rows.length : null, error: null };
    }
    if (op.kind === "insert" || op.kind === "upsert") {
      const out: Row[] = [];
      for (const row of op.rows) {
        const key = op.kind === "upsert" ? op.onConflict : (this.name === "communication_jobs" ? "idempotency_key" : undefined);
        const existing = key ? t.find((r) => r[key] === row[key]) : undefined;
        if (existing) {
          if (op.kind === "insert") return { data: null, error: { message: `duplicate key value violates unique constraint (${key})` } };
          if (op.ignoreDuplicates) continue;
          Object.assign(existing, row, { updated_at: now }); out.push({ ...existing }); continue;
        }
        const full = { id: this.db.nextId(), created_at: now, updated_at: now, attempt_count: 0, ...row };
        t.push(full); out.push({ ...full });
      }
      if (this.one) return { data: out[0] ?? null, error: null };
      return { data: out, error: null };
    }
    if (op.kind === "update") { const rows = this.matches(); for (const r of rows) Object.assign(r, op.patch, { updated_at: op.patch.updated_at ?? now }); return { data: rows.map((r) => ({ ...r })), error: null }; }
    if (op.kind === "delete") { const rows = this.matches(); for (const r of rows) t.splice(t.indexOf(r), 1); return { data: rows, error: null }; }
    return { data: null, error: null };
  }
  then<R1 = any, R2 = never>(onfulfilled?: ((v: any) => R1 | PromiseLike<R1>) | null, onrejected?: ((e: any) => R2 | PromiseLike<R2>) | null): PromiseLike<R1 | R2> {
    return Promise.resolve().then(() => this.run()).then(onfulfilled as any, onrejected as any);
  }
}
