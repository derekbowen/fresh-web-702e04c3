import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import sharetribeSdk from "sharetribe-flex-sdk";
import { getSdk, sdkErrorMessage } from "@/integrations/sharetribe/sdk.server";
import { CARD_FIELDS, CARD_CATEGORIES } from "@/lib/sharetribe/listing-config";

// Allowlist of publicData keys that may be sent to Sharetribe. Any key not in
// this set is dropped before the request is built — Sharetribe rejects unknown
// keys with "disallowed key" errors, so we filter defensively on both client
// and server.
export const ALLOWED_PUBLIC_DATA_KEYS: ReadonlySet<string> = new Set([
  "listingType",
  "categoryLevel1",
  "categoryLevel2",
  "printingId",
  "gameSlug",
  ...CARD_FIELDS.map((f) => f.key),
]);

export function sanitizePublicData(
  input: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!input) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (!ALLOWED_PUBLIC_DATA_KEYS.has(k)) continue;
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}

const VALID_CATEGORY_L1 = new Set(CARD_CATEGORIES.map((c) => c.value));
function isValidCategoryPair(l1: string, l2?: string): boolean {
  const c1 = CARD_CATEGORIES.find((c) => c.value === l1);
  if (!c1) return false;
  if (!l2) return (c1.subcategories?.length ?? 0) === 0 ? true : false;
  return !!c1.subcategories?.some((s) => s.value === l2);
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export interface ClientListing {
  id: string;
  title: string;
  description: string;
  priceAmount: number | null; // minor units
  priceCurrency: string | null;
  state: string;
  imageUrl: string | null;
  imageUrls: string[];
  createdAt: string | null;
  publicData: Record<string, JsonValue>;
  authorId: string | null;
  authorName: string | null;
}

interface ListingAttributes {
  title?: string;
  description?: string;
  state?: string;
  createdAt?: string;
  price?: { amount?: number; currency?: string } | null;
  publicData?: Record<string, unknown>;
}

interface ImageAttributes {
  variants?: Record<string, { url?: string }>;
}

interface UserAttributes {
  profile?: { displayName?: string };
}

interface SdkResource<A> {
  id: { uuid: string } | string;
  type: string;
  attributes: A;
  relationships?: {
    images?: { data?: Array<{ id: { uuid: string } | string }> };
    author?: { data?: { id: { uuid: string } | string } };
  };
}

function rid(id: { uuid: string } | string): string {
  return typeof id === "string" ? id : id.uuid;
}

function pickImageUrl(
  img: SdkResource<ImageAttributes> | undefined,
  prefer: string[],
): string | null {
  const variants = img?.attributes.variants;
  if (!variants) return null;
  for (const k of prefer) {
    if (variants[k]?.url) return variants[k]!.url!;
  }
  const first = Object.values(variants)[0]?.url;
  return first ?? null;
}

function toListing(
  resource: SdkResource<ListingAttributes>,
  included: Array<SdkResource<unknown>> | undefined,
): ClientListing {
  const a = resource.attributes;
  const imgsRel = resource.relationships?.images?.data ?? [];
  const imageUrls: string[] = [];
  let imageUrl: string | null = null;
  if (included && imgsRel.length) {
    for (const ref of imgsRel) {
      const wantedId = rid(ref.id);
      const img = included.find((i) => i.type === "image" && rid(i.id) === wantedId) as
        | SdkResource<ImageAttributes>
        | undefined;
      const url = pickImageUrl(img, ["scaled-large", "default", "square-small"]);
      if (url) imageUrls.push(url);
    }
    imageUrl = imageUrls[0] ?? null;
  }

  let authorId: string | null = null;
  let authorName: string | null = null;
  const authorRel = resource.relationships?.author?.data;
  if (authorRel && included) {
    authorId = rid(authorRel.id);
    const author = included.find((i) => i.type === "user" && rid(i.id) === authorId) as
      | SdkResource<UserAttributes>
      | undefined;
    authorName = author?.attributes.profile?.displayName ?? null;
  }

  return {
    id: rid(resource.id),
    title: a.title ?? "Untitled listing",
    description: a.description ?? "",
    priceAmount: a.price?.amount ?? null,
    priceCurrency: a.price?.currency ?? null,
    state: a.state ?? "unknown",
    imageUrl,
    imageUrls,
    createdAt: a.createdAt ?? null,
    publicData: (a.publicData ?? {}) as Record<string, JsonValue>,
    authorId,
    authorName,
  };
}

const querySchema = z.object({
  keywords: z.string().max(200).optional(),
  page: z.number().int().min(1).max(100).default(1),
  perPage: z.number().int().min(1).max(50).default(24),
  category: z.string().max(64).optional(),
  condition: z.string().max(64).optional(),
  rarity: z.string().max(64).optional(),
  priceMin: z.number().int().min(0).optional(),
  priceMax: z.number().int().min(0).optional(),
  authorId: z.string().max(64).optional(),
});

export const queryListings = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => querySchema.parse(d ?? {}))
  .handler(
    async ({
      data,
    }): Promise<{ listings: ClientListing[]; total: number; totalPages: number; page: number }> => {
      const sdk = getSdk();
      try {
        const params: Record<string, unknown> = {
          page: data.page,
          perPage: data.perPage,
          include: ["images", "author"],
          "fields.image": ["variants.square-small", "variants.scaled-large", "variants.default"],
        };
        if (data.keywords) params.keywords = data.keywords;
        if (data.category) params.pub_categoryLevel1 = data.category;
        if (data.condition) params.pub_card_condition = data.condition;
        if (data.rarity) params.pub_rarity = data.rarity;
        if (data.authorId) params.author_id = data.authorId;
        if (data.priceMin != null || data.priceMax != null) {
          const min = data.priceMin ?? 0;
          const max = data.priceMax ?? 100000000;
          params.price = `${min},${max}`;
        }

        const res = await sdk.listings.query(params);
        const items = (res.data?.data ?? []) as Array<SdkResource<ListingAttributes>>;
        const included = (res.data?.included ?? []) as Array<SdkResource<unknown>>;
        const meta = (res.data?.meta ?? {}) as {
          totalItems?: number;
          totalPages?: number;
          page?: number;
        };
        return {
          listings: items.map((it) => toListing(it, included)),
          total: meta.totalItems ?? items.length,
          totalPages: meta.totalPages ?? 1,
          page: meta.page ?? data.page,
        };
      } catch (err) {
        throw new Error(sdkErrorMessage(err));
      }
    },
  );

const showSchema = z.object({ id: z.string().min(1).max(64) });

export const showListing = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => showSchema.parse(d))
  .handler(async ({ data }): Promise<ClientListing | null> => {
    const sdk = getSdk();
    try {
      const res = await sdk.listings.show({
        id: data.id,
        include: ["images", "author"],
        "fields.image": ["variants.scaled-large", "variants.default"],
      } as unknown as { id: string });
      const item = (res.data?.data ?? null) as SdkResource<ListingAttributes> | null;
      const included = (res.data?.included ?? []) as Array<SdkResource<unknown>>;
      return item ? toListing(item, included) : null;
    } catch {
      return null;
    }
  });

// Authenticated current-user listings
const ownQuerySchema = z.object({
  page: z.number().int().min(1).max(100).default(1),
  perPage: z.number().int().min(1).max(50).default(24),
});

export const queryOwnListings = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => ownQuerySchema.parse(d ?? {}))
  .handler(async ({ data }): Promise<{ listings: ClientListing[]; total: number }> => {
    const sdk = getSdk();
    try {
      const res = await sdk.ownListings.query({
        page: data.page,
        perPage: data.perPage,
        include: ["images"],
        "fields.image": ["variants.square-small", "variants.default"],
      });
      const items = (res.data?.data ?? []) as Array<SdkResource<ListingAttributes>>;
      const included = (res.data?.included ?? []) as Array<SdkResource<unknown>>;
      const meta = (res.data?.meta ?? {}) as { totalItems?: number };
      return {
        listings: items.map((it) => toListing(it, included)),
        total: meta.totalItems ?? items.length,
      };
    } catch (err) {
      throw new Error(sdkErrorMessage(err));
    }
  });

// ---------- create listing ----------

const createListingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(10000),
  priceAmount: z.number().int().min(1).max(1000000000), // minor units
  priceCurrency: z.string().length(3).default("EUR"),
  categoryLevel1: z.string().min(1).max(64),
  categoryLevel2: z.string().min(1).max(64).optional(),
  imageIds: z.array(z.string().min(1).max(64)).max(20).default([]),
  publicData: z.record(z.string(), z.unknown()).default({}),
  publish: z.boolean().default(true),
  stock: z.number().int().min(0).max(10000).default(1),
});

export interface ListingValidationErrorPayload {
  kind: "ListingValidationError";
  message: string;
  fieldErrors: Record<string, string>;
}

export class ListingValidationError extends Error {
  readonly fieldErrors: Record<string, string>;
  constructor(fieldErrors: Record<string, string>, message = "Listing validation failed") {
    // Encode payload in message so it survives server-fn JSON serialization.
    const payload: ListingValidationErrorPayload = {
      kind: "ListingValidationError",
      message,
      fieldErrors,
    };
    super(JSON.stringify(payload));
    this.name = "ListingValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export function parseListingValidationError(e: unknown): ListingValidationErrorPayload | null {
  const msg = (e as { message?: unknown })?.message;
  if (typeof msg !== "string") return null;
  try {
    const parsed = JSON.parse(msg) as Partial<ListingValidationErrorPayload>;
    if (parsed && parsed.kind === "ListingValidationError" && parsed.fieldErrors) {
      return parsed as ListingValidationErrorPayload;
    }
  } catch {
    // not JSON
  }
  return null;
}

function validateListingInput(data: z.infer<typeof createListingSchema>): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  const pub = (data.publicData ?? {}) as Record<string, unknown>;

  if (!VALID_CATEGORY_L1.has(data.categoryLevel1)) {
    fieldErrors.categoryLevel1 = `Unknown category: ${data.categoryLevel1}`;
  } else if (!isValidCategoryPair(data.categoryLevel1, data.categoryLevel2)) {
    fieldErrors.categoryLevel2 = `Invalid subcategory for ${data.categoryLevel1}`;
  }

  for (const f of CARD_FIELDS) {
    const v = pub[f.key];
    const isEmpty = v === undefined || v === null || v === "";
    if (f.required && isEmpty) {
      fieldErrors[f.key] = `${f.label} is required`;
      continue;
    }
    if (!isEmpty && f.type === "enum") {
      const allowed = f.options?.some((o) => o.value === v);
      if (!allowed) fieldErrors[f.key] = `Invalid value for ${f.label}`;
    }
    if (!isEmpty && f.type === "number" && !Number.isFinite(Number(v))) {
      fieldErrors[f.key] = `${f.label} must be a number`;
    }
  }
  return fieldErrors;
}

export const createListing = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => createListingSchema.parse(d))
  .handler(async ({ data }): Promise<{ id: string }> => {
    const sdk = getSdk();
    const { Money, UUID } = sharetribeSdk.types;

    // Validate required fields, enums, and category pair BEFORE any SDK call
    // so invalid submissions never reach Sharetribe.
    const fieldErrors = validateListingInput(data);
    if (Object.keys(fieldErrors).length > 0) {
      console.warn("[createListing] validation rejected", { fieldErrors });
      throw new ListingValidationError(fieldErrors);
    }

    try {
      const params: Record<string, unknown> = {
        title: data.title,
        description: data.description,
        price: new Money(data.priceAmount, data.priceCurrency),
        publicData: {
          listingType: "trading_card",
          categoryLevel1: data.categoryLevel1,
          ...(data.categoryLevel2 ? { categoryLevel2: data.categoryLevel2 } : {}),
          ...sanitizePublicData(data.publicData),
        },
      };
      if (data.imageIds.length) {
        params.images = data.imageIds.map((id) => new UUID(id));
      }

      console.info("[createListing] params", {
        publicDataKeys: Object.keys(params.publicData as Record<string, unknown>),
        imageCount: data.imageIds.length,
        publish: data.publish,
        stock: data.stock,
      });
      const res = data.publish
        ? await sdk.ownListings.create(params, { expand: true })
        : await sdk.ownListings.createDraft(params, { expand: true });
      const item = res.data?.data as { id: { uuid: string } | string } | undefined;
      const id = item ? (typeof item.id === "string" ? item.id : item.id.uuid) : "";
      if (!id) throw new Error("Listing creation returned no id");

      // Stock is managed through the dedicated Stock API; ownListings.create
      // rejects inline stockUpdate as a disallowed body key.
      await sdk.stock.compareAndSet(
        {
          listingId: new UUID(id),
          oldTotal: null,
          newTotal: data.stock,
        },
        { expand: true },
      );

      return { id };
    } catch (err) {
      const e = err as { status?: number; data?: { errors?: Array<Record<string, unknown>> } };
      console.error("[createListing] sharetribe error", {
        status: e?.status,
        errors: JSON.stringify(e?.data?.errors ?? null),
      });
      throw new Error(sdkErrorMessage(err));
    }
  });

// ---------- upload image ----------
// Accepts a multipart/form-data body with field "image". Sending raw binary
// avoids the ~33% base64 bloat that was tripping the request body limit (413).

const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB per file

export const uploadListingImage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    if (!(d instanceof FormData)) {
      throw new Error("Expected multipart/form-data with an 'image' field");
    }
    const file = d.get("image");
    if (!(file instanceof File)) {
      throw new Error("Missing 'image' file in upload");
    }
    if (file.size === 0) throw new Error("Image file is empty");
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error(`Image too large (max ${MAX_IMAGE_BYTES / (1024 * 1024)} MB)`);
    }
    return { file };
  })
  .handler(async ({ data }): Promise<{ id: string }> => {
    const sdk = getSdk();
    try {
      const res = await sdk.images.upload({ image: data.file });
      const item = res.data?.data as { id: { uuid: string } | string } | undefined;
      const id = item ? (typeof item.id === "string" ? item.id : item.id.uuid) : "";
      if (!id) throw new Error("Image upload returned no id");
      return { id };
    } catch (err) {
      throw new Error(sdkErrorMessage(err));
    }
  });
