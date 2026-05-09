import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

/**
 * Detects a Sharetribe authenticated session.
 *
 * Sharetribe sets a `st-{clientId}-token` cookie for BOTH anonymous and
 * authenticated sessions, so its mere presence does not indicate login.
 * The reliable signal is `st-authinfo`, a URL-encoded JSON blob that
 * includes `isAnonymous: true|false`. Only when `isAnonymous` is explicitly
 * false do we treat the visitor as logged in.
 */
export const getSharetribeAuthState = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ isAuthed: boolean }> => {
    try {
      const cookieHeader = getRequestHeader("cookie") || "";
      if (!cookieHeader) return { isAuthed: false };

      const match = cookieHeader.match(/(?:^|;\s*)st-authinfo=([^;]+)/i);
      if (!match) return { isAuthed: false };

      let raw = match[1];
      try {
        raw = decodeURIComponent(raw);
      } catch {
        // fall through with raw value
      }

      // Value can be JSON or a URL-encoded query-style string. Look for
      // an explicit isAnonymous=false / "isAnonymous":false signal.
      const isAuthed =
        /"isAnonymous"\s*:\s*false/i.test(raw) ||
        /isAnonymous=false/i.test(raw);

      return { isAuthed };
    } catch {
      return { isAuthed: false };
    }
  },
);
