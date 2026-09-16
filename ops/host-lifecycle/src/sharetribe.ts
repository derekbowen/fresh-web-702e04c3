/**
 * Read-only Sharetribe Integration API access for the lifecycle sync.
 * Fetches every user, listing (with image counts) and transaction, and maps
 * them to the minimal shapes in src/lib/host-lifecycle/state.ts.
 */
import type { StBooking, StListing, StUser } from "../../../src/lib/host-lifecycle/state";
import { BOOKING_TRANSITIONS } from "../../../src/lib/host-lifecycle/state";
import type { EngineConfig } from "./config";

const BASE = "https://flex-integ-api.sharetribe.com";

function uuid(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && v && "uuid" in (v as any)) return String((v as any).uuid);
  return null;
}

export class SharetribeReader {
  private token: string | null = null;
  constructor(private cfg: EngineConfig) {}

  private async auth(): Promise<string> {
    if (this.token) return this.token;
    if (!this.cfg.sharetribeClientId || !this.cfg.sharetribeClientSecret) throw new Error("SHARETRIBE_INTEG_CLIENT_ID / SECRET missing");
    const res = await fetch(`${BASE}/v1/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.cfg.sharetribeClientId,
        client_secret: this.cfg.sharetribeClientSecret,
        grant_type: "client_credentials",
        scope: "integ",
      }),
    });
    if (!res.ok) throw new Error(`Sharetribe auth ${res.status}`);
    this.token = ((await res.json()) as { access_token: string }).access_token;
    return this.token;
  }

  private async get(path: string, params: Record<string, string>): Promise<any> {
    const token = await this.auth();
    const url = `${BASE}/v1/integration_api/${path}?${new URLSearchParams(params)}`;
    for (let attempt = 0; attempt < 4; attempt++) {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
      if (res.status === 429) { await new Promise((r) => setTimeout(r, 1500 * (attempt + 1))); continue; }
      if (!res.ok) throw new Error(`Sharetribe ${path} ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return res.json();
    }
    throw new Error(`Sharetribe ${path}: rate limited`);
  }

  private async pages(path: string, params: Record<string, string>, maxPages = 60): Promise<{ data: any[]; included: any[] }> {
    const data: any[] = []; const included: any[] = [];
    for (let page = 1; page <= maxPages; page++) {
      const r = await this.get(path, { ...params, perPage: "100", page: String(page) });
      data.push(...(r.data ?? [])); included.push(...(r.included ?? []));
      if (page >= (r.meta?.totalPages ?? 1)) break;
    }
    return { data, included };
  }

  async users(): Promise<StUser[]> {
    const { data } = await this.pages("users/query", {});
    return data.map((u: any) => {
      const a = u.attributes ?? {}; const p = a.profile ?? {};
      return {
        id: uuid(u.id)!,
        email: String(a.email ?? "").toLowerCase(),
        firstName: p.firstName ?? null,
        createdAt: a.createdAt,
        emailVerified: !!a.emailVerified,
        banned: !!a.banned,
        deleted: !!a.deleted,
        stripeConnected: !!a.stripeConnected,
        userType: (p.publicData?.userType ?? null) as string | null,
      };
    }).filter((u: StUser) => u.id && u.email);
  }

  async listings(): Promise<StListing[]> {
    const { data } = await this.pages("listings/query", {
      states: "draft,pendingApproval,published,closed",
      include: "images,author",
    });
    return data.map((l: any) => {
      const a = l.attributes ?? {}; const pd = a.publicData ?? {};
      const images = (l.relationships?.images?.data ?? []) as any[];
      const loc = pd.location;
      return {
        id: uuid(l.id)!,
        authorId: uuid(l.relationships?.author?.data?.id) ?? "",
        title: a.title ?? null,
        description: a.description ?? null,
        state: a.state,
        hasGeolocation: !!a.geolocation,
        hasAddress: !!(loc && typeof loc === "object" && loc.address),
        hasPrice: !!(a.price && typeof a.price.amount === "number" && a.price.amount > 0),
        photoCount: images.length,
        createdAt: a.createdAt,
      } as StListing;
    }).filter((l: StListing) => l.id && l.authorId);
  }

  async bookings(): Promise<StBooking[]> {
    const { data } = await this.pages("transactions/query", { include: "provider" }, 80);
    const out: StBooking[] = [];
    for (const t of data) {
      const a = t.attributes ?? {};
      const provider = uuid(t.relationships?.provider?.data?.id);
      if (!provider) continue;
      const transitions = (a.transitions ?? []) as Array<{ transition: string; createdAt: string }>;
      const hit = transitions.find((x) => BOOKING_TRANSITIONS.has(x.transition));
      if (!hit) continue;
      out.push({ providerId: provider, transactionId: uuid(t.id)!, bookedAt: hit.createdAt });
    }
    return out;
  }
}
