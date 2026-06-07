declare module "sharetribe-flex-sdk" {
  export interface TokenStore {
    getToken: () => unknown;
    setToken: (token: unknown) => void;
    removeToken: () => void;
  }

  export interface SdkResponse<T = unknown> {
    data: {
      data: T;
      included?: Array<unknown>;
      meta?: Record<string, unknown>;
    };
    status: number;
    statusText: string;
  }

  export interface SdkInstance {
    login: (params: { username: string; password: string }) => Promise<SdkResponse>;
    logout: () => Promise<SdkResponse>;
    currentUser: {
      show: (params?: Record<string, unknown>) => Promise<SdkResponse>;
      create: (params: Record<string, unknown>) => Promise<SdkResponse>;
      updateProfile: (
        params: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<SdkResponse>;
      changePassword: (params: {
        currentPassword: string;
        newPassword: string;
      }) => Promise<SdkResponse>;
    };
    passwordReset: {
      request: (params: { email: string }) => Promise<SdkResponse>;
      reset: (params: {
        email: string;
        passwordResetToken: string;
        newPassword: string;
      }) => Promise<SdkResponse>;
    };
    listings: {
      query: (params?: Record<string, unknown>) => Promise<SdkResponse>;
      show: (params: Record<string, unknown>) => Promise<SdkResponse>;
    };
    ownListings: {
      show: (params: Record<string, unknown>) => Promise<SdkResponse>;
      query: (params?: Record<string, unknown>) => Promise<SdkResponse>;
      create: (
        params: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<SdkResponse>;
      createDraft: (
        params: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<SdkResponse>;
      publishDraft: (
        params: { id: string },
        opts?: Record<string, unknown>,
      ) => Promise<SdkResponse>;
      update: (
        params: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<SdkResponse>;
      open: (params: { id: string }) => Promise<SdkResponse>;
      close: (params: { id: string }) => Promise<SdkResponse>;
      addImage: (params: { id: string; imageId: string }) => Promise<SdkResponse>;
    };
    stock: {
      compareAndSet: (
        params: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<SdkResponse>;
    };
    images: {
      upload: (params: { image: unknown }, opts?: Record<string, unknown>) => Promise<SdkResponse>;
    };
    transactions: {
      query: (params?: Record<string, unknown>) => Promise<SdkResponse>;
      show: (params: Record<string, unknown>) => Promise<SdkResponse>;
      initiate: (
        params: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<SdkResponse>;
      initiateSpeculative: (
        params: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<SdkResponse>;
      transition: (
        params: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<SdkResponse>;
      transitionSpeculative: (
        params: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<SdkResponse>;
    };
    messages: {
      query: (params: Record<string, unknown>) => Promise<SdkResponse>;
      send: (params: Record<string, unknown>) => Promise<SdkResponse>;
    };
    stripeAccount: {
      fetch: (params?: Record<string, unknown>) => Promise<SdkResponse>;
      create: (
        params: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<SdkResponse>;
      update: (
        params: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<SdkResponse>;
    };
    stripeAccountLinks: {
      create: (
        params: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<SdkResponse>;
    };
    stripeCustomer: {
      create: (
        params: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<SdkResponse>;
      addPaymentMethod: (
        params: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<SdkResponse>;
      deletePaymentMethod: (
        params: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<SdkResponse>;
    };
    stripeSetupIntents: {
      create: (
        params?: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<SdkResponse>;
    };
    loginWithIdp: (params: {
      idpId: string;
      idpClientId: string;
      idpToken: string;
    }) => Promise<SdkResponse>;
    exchangeToken: (params?: Record<string, unknown>) => Promise<SdkResponse<unknown>>;
  }

  interface CreateInstanceOptions {
    clientId: string;
    clientSecret?: string;
    tokenStore?: TokenStore;
    baseUrl?: string;
  }

  interface SdkStatic {
    createInstance(options: CreateInstanceOptions): SdkInstance;
    tokenStore: {
      memoryStore: () => TokenStore;
    };
    types: {
      Money: new (amount: number, currency: string) => { amount: number; currency: string };
      UUID: new (uuid: string) => { uuid: string };
      [k: string]: unknown;
    };
  }

  const sdk: SdkStatic;
  export default sdk;
}
