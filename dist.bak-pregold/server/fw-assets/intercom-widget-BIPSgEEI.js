import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import Intercom, { shutdown, update } from "@intercom/messenger-js-sdk";
import { s as supabase } from "./client-TSMcDHCK.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { r as requireSupabaseAuth } from "./auth-middleware-Bd-cw3tB.js";
import { c as createServerFn } from "../server.js";
import "@supabase/supabase-js";
import "zod";
import "./client.server-D5ro3rAQ.js";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
const getIntercomAppId = createServerFn({
  method: "GET"
}).handler(createSsrRpc("42da1772a8c46600a4194f9ea276674b6c087905f87a90e19f7362fd956a96da"));
const getIntercomUserJwt = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("4ac31434eeab273ed3e2330af0af0d54d6c4ee8e5b43cd2465842fca0c2ea1c5"));
function deriveContext(pathname) {
  const ctx = { current_url: pathname };
  const listing = pathname.match(/^\/l\/[^/]+\/([^/?#]+)/);
  if (listing) ctx.listing_id = listing[1];
  if (pathname.startsWith("/admin")) {
    ctx.is_admin_page = true;
    const adminSection = pathname.match(/^\/admin\/([^/?#]+)/);
    if (adminSection) ctx.admin_section = adminSection[1];
    const learner = pathname.match(/^\/admin\/learning\/([^/?#]+)/);
    if (learner) ctx.learner_user_id = learner[1];
  }
  const contentPage = pathname.match(/^\/p\/([^/?#]+)/);
  if (contentPage) ctx.content_page_slug = contentPage[1];
  const isTracy = pathname === "/p/become-a-swimming-pool-host-tracy-ca";
  ctx.vertical_padding = isTracy ? 80 : 20;
  return ctx;
}
function IntercomWidget() {
  const fetchAppId = useServerFn(getIntercomAppId);
  const fetchUserJwt = useServerFn(getIntercomUserJwt);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    let cancelled = false;
    let unsub;
    let booted = false;
    let currentAppId = "";
    const log = (...args) => {
      console.log("[Intercom]", ...args);
    };
    const warn = (...args) => {
      console.warn("[Intercom]", ...args);
    };
    const w = window;
    if (!w.__intercomNetPatched) {
      w.__intercomNetPatched = true;
      const isIntercom = (u) => /intercom(\.io|cdn|assets)/i.test(u);
      const origFetch = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        const t0 = performance.now();
        try {
          const res = await origFetch(input, init);
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
        _url = "";
        open(method, url, ...rest) {
          this._url = typeof url === "string" ? url : url.toString();
          return super.open(method, url, ...rest);
        }
        send(body) {
          if (isIntercom(this._url)) {
            this.addEventListener("loadend", () => {
              log("xhr", this.status, this._url);
            });
          }
          return super.send(body);
        }
      }
      window.XMLHttpRequest = LoggedXHR;
    }
    const boot = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      const ctx = deriveContext(window.location.pathname);
      let userJwt = null;
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
        identity_verification: user ? userJwt ? "signed" : "unsigned" : "n/a",
        ctx
      });
      try {
        Intercom({
          app_id: currentAppId,
          api_base: "https://api-iam.intercom.io",
          session_duration: 864e5,
          ...user ? {
            user_id: user.id,
            email: user.email ?? void 0,
            name: user.user_metadata?.full_name ?? user.user_metadata?.name,
            ...user.created_at ? { created_at: Math.floor(new Date(user.created_at).getTime() / 1e3) } : {},
            ...userJwt ? { intercom_user_jwt: userJwt } : {}
          } : {},
          ...ctx
        });
        booted = true;
        log("Intercom() called successfully — booted=true");
        window.setTimeout(() => {
          const launcher = document.querySelector(
            "#intercom-container, .intercom-lightweight-app, [class*='intercom-launcher']"
          );
          const frames = document.querySelectorAll("iframe[name^='intercom']");
          log("launcher probe", {
            launcher_in_dom: !!launcher,
            launcher_tag: launcher?.tagName ?? null,
            iframe_count: frames.length
          });
          if (!launcher && frames.length === 0) {
            warn(
              "No launcher in DOM 3s after boot. Likely causes: (1) workspace messenger is disabled for Web, (2) host not in Intercom 'Whitelist of allowed websites', (3) identity verification enforced and anon visitor rejected, (4) ad/script blocker."
            );
          }
        }, 3e3);
      } catch (err) {
        warn("Intercom() threw", err);
      }
    };
    const FALLBACK_APP_ID = "nuuc4281";
    const startBoot = async () => {
      let appId = FALLBACK_APP_ID;
      let source = "fallback";
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
    const schedule = (reason) => {
      if (scheduled) return;
      scheduled = true;
      log("scheduling boot via", reason);
      void startBoot();
    };
    const fallbackHandle = window.setTimeout(() => schedule("8s timeout"), 8e3);
    const interactionEvents = ["pointerdown", "keydown", "scroll", "touchstart"];
    const onInteraction = (e) => schedule(`interaction:${e.type}`);
    interactionEvents.forEach(
      (e) => window.addEventListener(e, onInteraction, { once: true, passive: true })
    );
    const cleanupSchedulers = () => {
      clearTimeout(fallbackHandle);
      interactionEvents.forEach((e) => window.removeEventListener(e, onInteraction));
    };
    window.__intercomBooted = () => booted;
    return () => {
      cancelled = true;
      cleanupSchedulers();
      unsub?.();
      try {
        shutdown();
      } catch {
      }
    };
  }, [fetchAppId, fetchUserJwt]);
  useEffect(() => {
    const isBooted = window.__intercomBooted?.();
    if (!isBooted) return;
    try {
      update(deriveContext(pathname));
    } catch {
    }
  }, [pathname]);
  return null;
}
export {
  IntercomWidget
};
