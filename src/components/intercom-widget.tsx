import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import Intercom, { update, shutdown } from "@intercom/messenger-js-sdk";
import { supabase } from "@/integrations/supabase/client";
import { getIntercomAppId, getIntercomUserJwt } from "@/server/intercom.functions";

/** Pull useful IDs out of the current path for support context. */
function deriveContext(pathname: string) {
  const ctx: Record<string, string | boolean> = { current_url: pathname };

  // /l/<slug>/<id> — listing detail
  const listing = pathname.match(/^\/l\/[^/]+\/([^/?#]+)/);
  if (listing) ctx.listing_id = listing[1];

  // /admin/* — admin surfaces
  if (pathname.startsWith("/admin")) {
    ctx.is_admin_page = true;
    const adminSection = pathname.match(/^\/admin\/([^/?#]+)/);
    if (adminSection) ctx.admin_section = adminSection[1];
    // /admin/learning/<userId>
    const learner = pathname.match(/^\/admin\/learning\/([^/?#]+)/);
    if (learner) ctx.learner_user_id = learner[1];
  }

  // /p/<slug> — content page
  const contentPage = pathname.match(/^\/p\/([^/?#]+)/);
  if (contentPage) ctx.content_page_slug = contentPage[1];

  const isTracy = pathname === "/p/become-a-swimming-pool-host-tracy-ca";
  ctx.vertical_padding = isTracy ? 80 : 20;
  return ctx;
}

/**
 * Boots the Intercom messenger widget. Identifies the signed-in user when
 * a Supabase session is present; otherwise boots anonymously. Updates
 * Intercom with current URL + relevant IDs on every route change.
 */
export function IntercomWidget() {
  const fetchAppId = useServerFn(getIntercomAppId);
  const fetchUserJwt = useServerFn(getIntercomUserJwt);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | undefined;
    let booted = false;
    let currentAppId = "";

    // Diagnostic logger — prefixed so it's easy to filter in prod consoles.
    const log = (...args: unknown[]) => {
      // eslint-disable-next-line no-console
      console.log("[Intercom]", ...args);
    };
    const warn = (...args: unknown[]) => {
      // eslint-disable-next-line no-console
      console.warn("[Intercom]", ...args);
    };

    // Patch fetch + XHR once to log all intercom.io network traffic
    // (ping, launcher, messenger frames). Idempotent across remounts.
    const w = window as unknown as { __intercomNetPatched?: boolean };
    if (!w.__intercomNetPatched) {
      w.__intercomNetPatched = true;
      const isIntercom = (u: string) => /intercom(\.io|cdn|assets)/i.test(u);
      const origFetch = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        const t0 = performance.now();
        try {
          const res = await origFetch(input as RequestInfo, init);
          if (isIntercom(url)) {
            log("fetch", res.status, url, `${Math.round(performance.now() - t0)}ms`);
          }
          return res;
        } catch (err) {
          if (isIntercom(url)) warn("fetch failed", url, err);
          throw err;
        }
      };
      const OrigXHR = window.XMLHttpRequest;
      class LoggedXHR extends OrigXHR {
        private _url = "";
        open(method: string, url: string | URL, ...rest: unknown[]) {
          this._url = typeof url === "string" ? url : url.toString();
          // @ts-expect-error - passthrough
          return super.open(method, url, ...rest);
        }
        send(body?: Document | XMLHttpRequestBodyInit | null) {
          if (isIntercom(this._url)) {
            this.addEventListener("loadend", () => {
              log("xhr", this.status, this._url);
            });
          }
          return super.send(body as XMLHttpRequestBodyInit | null);
        }
      }
      window.XMLHttpRequest = LoggedXHR as unknown as typeof XMLHttpRequest;
    }

    const boot = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      const ctx = deriveContext(window.location.pathname);

      let userJwt: string | null = null;
      if (user) {
        try {
          const res = await fetchUserJwt();
          userJwt = res.token;
        } catch (err) {
          warn("user JWT fetch failed", err);
          userJwt = null;
        }
      }

      log("boot()", {
        app_id: currentAppId,
        host: window.location.host,
        origin: window.location.origin,
        authState: user ? "authenticated" : "anonymous",
        user_id: user?.id ?? null,
        email: user?.email ?? null,
        has_jwt: !!userJwt,
        identity_verification: user ? (userJwt ? "signed" : "unsigned") : "n/a",
        ctx,
      });

      try {
        Intercom({
          app_id: currentAppId,
          api_base: "https://api-iam.intercom.io",
          session_duration: 86_400_000,
          ...(user
            ? {
                user_id: user.id,
                email: user.email ?? undefined,
                name:
                  (user.user_metadata?.full_name as string | undefined) ??
                  (user.user_metadata?.name as string | undefined),
                ...(user.created_at
                  ? { created_at: Math.floor(new Date(user.created_at).getTime() / 1000) }
                  : {}),
                ...(userJwt ? { intercom_user_jwt: userJwt } : {}),
              }
            : {}),
          ...ctx,
        });
        booted = true;
        log("Intercom() called successfully — booted=true");

        // Probe DOM for launcher after Intercom has had a chance to inject it.
        window.setTimeout(() => {
          const launcher = document.querySelector(
            "#intercom-container, .intercom-lightweight-app, [class*='intercom-launcher']",
          );
          const frames = document.querySelectorAll("iframe[name^='intercom']");
          log("launcher probe", {
            launcher_in_dom: !!launcher,
            launcher_tag: launcher?.tagName ?? null,
            iframe_count: frames.length,
          });
          if (!launcher && frames.length === 0) {
            warn(
              "No launcher in DOM 3s after boot. Likely causes: (1) workspace messenger is disabled for Web, (2) host not in Intercom 'Whitelist of allowed websites', (3) identity verification enforced and anon visitor rejected, (4) ad/script blocker.",
            );
          }
        }, 3000);
      } catch (err) {
        warn("Intercom() threw", err);
      }
    };

    // Defer Intercom boot until the browser is idle (or after first user
    // interaction) to avoid blocking the main thread during initial load.
    // Hardcoded public workspace ID — safe to ship and used as a fallback
    // so the widget always boots even if the server fn is unreachable.
    const FALLBACK_APP_ID = "nuuc4281";

    const startBoot = async () => {
      let appId = FALLBACK_APP_ID;
      let source: "server-fn" | "fallback" = "fallback";
      try {
        const res = await fetchAppId();
        if (res?.appId) {
          appId = res.appId;
          source = "server-fn";
        } else {
          warn("getIntercomAppId returned empty appId, using fallback");
        }
      } catch (err) {
        warn("getIntercomAppId failed, using fallback", err);
      }
      log("resolved app_id", { appId, source });
      if (cancelled || !appId) return;
      currentAppId = appId;
      await boot();

      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        log("auth state change", event);
        shutdown();
        booted = false;
        void boot();
      });
      unsub = () => sub.subscription.unsubscribe();
    };

    let scheduled = false;
    const schedule = (reason: string) => {
      if (scheduled) return;
      scheduled = true;
      log("scheduling boot via", reason);
      void startBoot();
    };
    const fallbackHandle = window.setTimeout(() => schedule("8s timeout"), 8000);
    const interactionEvents: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "scroll", "touchstart"];
    const onInteraction = (e: Event) => schedule(`interaction:${e.type}`);
    interactionEvents.forEach((e) =>
      window.addEventListener(e, onInteraction, { once: true, passive: true }),
    );

    const cleanupSchedulers = () => {
      clearTimeout(fallbackHandle);
      interactionEvents.forEach((e) => window.removeEventListener(e, onInteraction));
    };

    (window as unknown as { __intercomBooted?: () => boolean }).__intercomBooted = () => booted;

    return () => {
      cancelled = true;
      cleanupSchedulers();
      unsub?.();
      try {
        shutdown();
      } catch {
        /* noop */
      }
    };
  }, [fetchAppId, fetchUserJwt]);

  // Push updated metadata on every client-side navigation.
  useEffect(() => {
    const isBooted = (window as unknown as { __intercomBooted?: () => boolean }).__intercomBooted?.();
    if (!isBooted) return;
    try {
      update(deriveContext(pathname));
    } catch {
      /* noop */
    }
  }, [pathname]);

  return null;
}
