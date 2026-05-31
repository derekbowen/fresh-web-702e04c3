import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getCanonicalOrigin } from "@/server/canonical.server";
import { PROD_ORIGIN } from "./site-origin";

export const getRouteOriginFromRequest = createServerFn({ method: "GET" })
  .handler(async (): Promise<string> => {
    try {
      return getCanonicalOrigin(getRequest());
    } catch {
      return PROD_ORIGIN;
    }
  });