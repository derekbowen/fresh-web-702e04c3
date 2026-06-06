import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Intercom webhook receiver.
 * Subscribed topics (configure in Intercom Developer Hub → Webhooks):
 *   - conversation.user.replied  → auto-pause drips for that contact
 *   - conversation.admin.closed  → clear the pause
 *   - contact.created / contact.tag.created (optional)
 *
 * Signature: Intercom signs the raw body with the app's client secret using
 * HMAC-SHA1. Header: X-Hub-Signature: sha1=<hex>
 * We use INTERCOM_IDENTITY_SECRET (same value as the app's client secret in
 * most Intercom workspaces). If signatures don't verify, the request is
 * rejected with 401.
 */
export const Route = createFileRoute("/api/public/hooks/intercom")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.INTERCOM_IDENTITY_SECRET;
        if (!secret) {
          return new Response("INTERCOM_IDENTITY_SECRET not set", { status: 500 });
        }

        const sigHeader = request.headers.get("x-hub-signature") || "";
        const body = await request.text();

        const expected = "sha1=" + createHmac("sha1", secret).update(body).digest("hex");
        const a = Buffer.from(sigHeader);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: any;
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const topic: string = payload?.topic || "unknown";
        const data = payload?.data?.item || payload?.data || {};

        // Best-effort email + contact id extraction across topics
        const contactId: string | null =
          data?.user?.id ||
          data?.contacts?.contacts?.[0]?.id ||
          data?.id ||
          null;
        const email: string | null = (
          data?.user?.email ||
          data?.source?.author?.email ||
          data?.contacts?.contacts?.[0]?.email ||
          data?.email ||
          null
        )?.toLowerCase() ?? null;

        // Log every event
        const { data: logRow } = await supabaseAdmin
          .from("intercom_events_log")
          .insert({
            topic,
            email,
            intercom_contact_id: contactId,
            payload: payload,
          })
          .select("id")
          .single();

        let result = "ignored";

        try {
          if (topic === "conversation.user.replied" && email) {
            // Pause future drips by marking intercom_paused_at
            const now = new Date().toISOString();
            const { data: h } = await supabaseAdmin
              .from("host_subscribers")
              .update({ intercom_paused_at: now })
              .eq("email", email)
              .select("id");
            const { data: r } = await supabaseAdmin
              .from("renter_subscribers")
              .update({ intercom_paused_at: now })
              .ilike("email", email)
              .select("id");

            // Cancel pending drip emails for this email
            if (h && h.length > 0) {
              await supabaseAdmin
                .from("host_drip_emails")
                .update({ status: "skipped", error: "intercom user replied" })
                .eq("status", "pending")
                .in("subscriber_id", h.map((x: any) => x.id));
            }
            if (r && r.length > 0) {
              await supabaseAdmin
                .from("renter_emails")
                .update({ status: "skipped", error: "intercom user replied" })
                .eq("status", "pending")
                .in("subscriber_id", r.map((x: any) => x.id));
            }
            result = `paused host:${h?.length ?? 0} renter:${r?.length ?? 0}`;
          } else if (topic === "conversation.admin.closed" && email) {
            await supabaseAdmin
              .from("host_subscribers")
              .update({ intercom_paused_at: null })
              .eq("email", email);
            await supabaseAdmin
              .from("renter_subscribers")
              .update({ intercom_paused_at: null })
              .ilike("email", email);
            result = "unpaused";
          }
        } catch (err: any) {
          result = `error: ${err?.message || String(err)}`;
        }

        if (logRow?.id) {
          await supabaseAdmin
            .from("intercom_events_log")
            .update({ processed_at: new Date().toISOString(), result })
            .eq("id", logRow.id);
        }

        return Response.json({ ok: true, topic, result });
      },
      // Intercom ping during webhook setup
      GET: async () => Response.json({ ok: true }),
    },
  },
});
