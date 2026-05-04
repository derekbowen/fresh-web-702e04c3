import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import Intercom, { shutdown } from "@intercom/messenger-js-sdk";
import { supabase } from "@/integrations/supabase/client";
import { getIntercomAppId } from "@/server/intercom.functions";

/**
 * Boots the Intercom messenger widget. Identifies the signed-in user when
 * a Supabase session is present; otherwise boots anonymously.
 */
export function IntercomWidget() {
  const fetchAppId = useServerFn(getIntercomAppId);

  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | undefined;

    (async () => {
      const { appId } = await fetchAppId();
      if (cancelled || !appId) return;

      const boot = async () => {
        const { data } = await supabase.auth.getUser();
        const user = data.user;
        Intercom({
          app_id: appId,
          ...(user
            ? {
                user_id: user.id,
                email: user.email ?? undefined,
                name:
                  (user.user_metadata?.full_name as string | undefined) ??
                  (user.user_metadata?.name as string | undefined),
              }
            : {}),
        });
      };

      await boot();

      const { data: sub } = supabase.auth.onAuthStateChange(() => {
        shutdown();
        void boot();
      });
      unsub = () => sub.subscription.unsubscribe();
    })();

    return () => {
      cancelled = true;
      unsub?.();
      try {
        shutdown();
      } catch {
        /* noop */
      }
    };
  }, [fetchAppId]);

  return null;
}
