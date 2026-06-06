// Server-only Intercom REST client.
// Docs: https://developers.intercom.com/docs/references/rest-api/

const API = "https://api.intercom.io";
const VERSION = "2.11";

function headers() {
  const token = process.env.INTERCOM_ACCESS_TOKEN;
  if (!token) throw new Error("INTERCOM_ACCESS_TOKEN not set");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "Intercom-Version": VERSION,
  };
}

async function ic<T = any>(
  method: string,
  path: string,
  body?: any,
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(
      `Intercom ${method} ${path} → ${res.status}: ${text.slice(0, 300)}`,
    );
    (err as any).status = res.status;
    throw err;
  }
  return (await res.json()) as T;
}

// ---------- Contacts ----------

export type IcContact = {
  id: string;
  email?: string | null;
  name?: string | null;
  external_id?: string | null;
  custom_attributes?: Record<string, any>;
};

export async function findContactByEmail(
  email: string,
): Promise<IcContact | null> {
  const out = await ic<{ data: IcContact[]; total_count: number }>(
    "POST",
    "/contacts/search",
    {
      query: {
        field: "email",
        operator: "=",
        value: email.toLowerCase(),
      },
    },
  );
  return out.data?.[0] ?? null;
}

export async function upsertContact(args: {
  email: string;
  name?: string | null;
  role?: "user" | "lead";
  customAttributes?: Record<string, any>;
  externalId?: string | null;
}): Promise<IcContact> {
  const email = args.email.toLowerCase();
  const existing = await findContactByEmail(email);

  const body: any = {
    role: args.role ?? "lead",
    email,
    name: args.name ?? undefined,
    external_id: args.externalId ?? undefined,
    custom_attributes: args.customAttributes ?? undefined,
  };

  if (existing) {
    return ic<IcContact>("PUT", `/contacts/${existing.id}`, body);
  }
  return ic<IcContact>("POST", "/contacts", body);
}

// ---------- Conversations ----------

export async function hasOpenConversation(email: string): Promise<boolean> {
  try {
    const out = await ic<{ total_count: number; data: any[] }>(
      "POST",
      "/conversations/search",
      {
        query: {
          operator: "AND",
          value: [
            { field: "source.author.email", operator: "=", value: email.toLowerCase() },
            { field: "open", operator: "=", value: true },
          ],
        },
        pagination: { per_page: 1 },
      },
    );
    return (out.total_count ?? 0) > 0;
  } catch (err: any) {
    // If Intercom is down, do NOT block the send loop. Log and proceed.
    console.warn("[intercom] hasOpenConversation failed", err?.message);
    return false;
  }
}
