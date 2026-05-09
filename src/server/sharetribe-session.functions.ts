import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

/**
 * Detects a Sharetribe session by sniffing for a cookie named
 * `st-{clientId}-token`. Sharetribe issues this cookie on login through the
 * marketplace; the nginx proxy forwards cookies to fresh-web, so we can read
 * it during SSR without any Sharetribe API calls.
 *
 * Presence is enough for header UI state. We don't validate the token — if
 * it's expired, Sharetribe handles redirect on the marketplace side.
 */
export const getSharetribeAuthState = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ isAuthed: boolean }> => {
    try {
      const cookieHeader = getRequestHeader("cookie") || "";
      if (!cookieHeader) return { isAuthed: false };
      // Cookie names look like: st-f812b9fc-645b-4363-86ae-404da7f6fac8-token
      const isAuthed = /(?:^|;\s*)st-[0-9a-f-]{8,}-token=/i.test(cookieHeader);
      return { isAuthed };
    } catch {
      return { isAuthed: false };
    }
  },
);
