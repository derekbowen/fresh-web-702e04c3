import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSdk } from "@/integrations/sharetribe/sdk.server";

export interface PublicUser {
  id: string;
  displayName: string;
  bio: string | null;
  createdAt: string | null;
}

interface UserAttributes {
  createdAt?: string;
  profile?: {
    displayName?: string;
    bio?: string | null;
    publicData?: Record<string, unknown>;
  };
}

interface SdkResource<A> {
  id: { uuid: string } | string;
  type: string;
  attributes: A;
}

function rid(id: { uuid: string } | string): string {
  return typeof id === "string" ? id : id.uuid;
}

const showSchema = z.object({ id: z.string().min(1).max(64) });

// Sharetribe SDK does not expose a public users.show in the public client by
// default for arbitrary user IDs without a separate API. We use listings author
// expansion as a fallback path: query a single listing by that author to derive
// a profile snapshot. If nothing is found, return null.
export const showPublicUser = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => showSchema.parse(d))
  .handler(async ({ data }): Promise<PublicUser | null> => {
    const sdk = getSdk();
    try {
      const res = await sdk.listings.query({
        author_id: data.id,
        perPage: 1,
        include: ["author"],
      });
      const included = (res.data?.included ?? []) as Array<SdkResource<UserAttributes>>;
      const author = included.find((i) => i.type === "user" && rid(i.id) === data.id);
      if (!author) return null;
      const profile = author.attributes.profile ?? {};
      return {
        id: data.id,
        displayName: profile.displayName ?? "Collector",
        bio: profile.bio ?? null,
        createdAt: author.attributes.createdAt ?? null,
      };
    } catch {
      return null;
    }
  });
