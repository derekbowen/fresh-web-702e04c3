import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSdk, sdkErrorMessage } from "@/integrations/sharetribe/sdk.server";

// Shape we return to the client. Sharetribe attribute names kept verbatim where
// possible so the UI maps cleanly to docs.
export interface ClientUser {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  displayName: string;
  bio: string | null;
  // CardBay-specific bits stored in protectedData / publicData.
  isSeller: boolean;
}

interface SdkUserAttributes {
  email?: string;
  emailVerified?: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    bio?: string | null;
    publicData?: Record<string, unknown>;
    protectedData?: Record<string, unknown>;
  };
}

interface SdkResource<A> {
  id: { uuid: string } | string;
  type: string;
  attributes: A;
}

function normalizeId(id: { uuid: string } | string): string {
  return typeof id === "string" ? id : id.uuid;
}

function toClientUser(resource: SdkResource<SdkUserAttributes>): ClientUser {
  const { attributes } = resource;
  const profile = attributes.profile ?? {};
  const publicData = (profile.publicData ?? {}) as Record<string, unknown>;
  const firstName = profile.firstName ?? "";
  const lastName = profile.lastName ?? "";
  const displayName = profile.displayName ?? `${firstName} ${lastName}`.trim();
  return {
    id: normalizeId(resource.id),
    email: attributes.email ?? "",
    emailVerified: attributes.emailVerified ?? false,
    firstName,
    lastName,
    displayName,
    bio: profile.bio ?? null,
    isSeller: publicData.isSeller === true,
  };
}

// ---------- currentUser ----------

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<ClientUser | null> => {
    const sdk = getSdk();
    try {
      const res = await sdk.currentUser.show();
      const data = (res.data?.data ?? null) as SdkResource<SdkUserAttributes> | null;
      return data ? toClientUser(data) : null;
    } catch {
      return null;
    }
  },
);

// ---------- login ----------

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
});

export const login = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => loginSchema.parse(d))
  .handler(async ({ data }): Promise<{ user: ClientUser | null; error?: string }> => {
    const sdk = getSdk();
    try {
      await sdk.login({ username: data.email, password: data.password });
      const res = await sdk.currentUser.show();
      const u = (res.data?.data ?? null) as SdkResource<SdkUserAttributes> | null;
      return { user: u ? toClientUser(u) : null };
    } catch (err) {
      const status = (err as { status?: number })?.status;
      // Sharetribe returns 401 for bad credentials — surface a friendly message
      // instead of leaking the raw "Request failed with status code 401".
      if (status === 401 || status === 403) {
        return { user: null, error: "Incorrect email or password." };
      }
      return { user: null, error: sdkErrorMessage(err) };
    }
  });

// ---------- signup ----------

const signupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(256),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  isSeller: z.boolean().default(false),
});

export const signup = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => signupSchema.parse(d))
  .handler(async ({ data }): Promise<{ user: ClientUser | null; error?: string }> => {
    const sdk = getSdk();
    try {
      await sdk.currentUser.create({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        publicData: { isSeller: data.isSeller },
      });
      // Create does not log the user in. Do that next.
      await sdk.login({ username: data.email, password: data.password });
      const res = await sdk.currentUser.show();
      const u = (res.data?.data ?? null) as SdkResource<SdkUserAttributes> | null;
      return { user: u ? toClientUser(u) : null };
    } catch (err) {
      return { user: null, error: sdkErrorMessage(err) };
    }
  });

// ---------- logout ----------

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const sdk = getSdk();
  try {
    await sdk.logout();
  } catch {
    // even if logout fails, the cookie is gone
  }
  return { ok: true };
});

// ---------- update profile ----------

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(2000).optional(),
  isSeller: z.boolean().optional(),
});

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => updateProfileSchema.parse(d))
  .handler(async ({ data }): Promise<ClientUser> => {
    const sdk = getSdk();
    try {
      const params: Record<string, unknown> = {};
      if (data.firstName !== undefined) params.firstName = data.firstName;
      if (data.lastName !== undefined) params.lastName = data.lastName;
      if (data.displayName !== undefined) params.displayName = data.displayName;
      if (data.bio !== undefined) params.bio = data.bio;
      if (data.isSeller !== undefined) params.publicData = { isSeller: data.isSeller };
      await sdk.currentUser.updateProfile(params);
      const res = await sdk.currentUser.show();
      const u = res.data!.data as SdkResource<SdkUserAttributes>;
      return toClientUser(u);
    } catch (err) {
      throw new Error(sdkErrorMessage(err));
    }
  });

// ---------- change password ----------

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(8).max(256),
});

export const changePassword = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => changePasswordSchema.parse(d))
  .handler(async ({ data }) => {
    const sdk = getSdk();
    try {
      await sdk.currentUser.changePassword(data);
      return { ok: true as const };
    } catch (err) {
      throw new Error(sdkErrorMessage(err));
    }
  });

// ---------- password reset ----------

const requestResetSchema = z.object({ email: z.string().email().max(254) });

export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => requestResetSchema.parse(d))
  .handler(async ({ data }) => {
    const sdk = getSdk();
    try {
      await sdk.passwordReset.request({ email: data.email });
      return { ok: true as const };
    } catch (err) {
      throw new Error(sdkErrorMessage(err));
    }
  });

const resetPasswordSchema = z.object({
  email: z.string().email().max(254),
  passwordResetToken: z.string().min(1).max(2048),
  newPassword: z.string().min(8).max(256),
});

export const resetPassword = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => resetPasswordSchema.parse(d))
  .handler(async ({ data }) => {
    const sdk = getSdk();
    try {
      await sdk.passwordReset.reset(data);
      return { ok: true as const };
    } catch (err) {
      throw new Error(sdkErrorMessage(err));
    }
  });
