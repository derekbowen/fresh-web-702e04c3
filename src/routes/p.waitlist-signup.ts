import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTransactionalEmailServer } from "@/server/transactional-email.server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Public lead-capture endpoint for the marketplace's zero-results block.
 * POST { email, city } -> writes pool_waitlist (source='zero_results_search')
 * and best-effort enqueues the confirmation + internal-lead emails. Same-origin
 * from the Sharetribe /s page (nginx routes /p/* to this box). Static route, so
 * it is not shadowed by the /p/$slug content dispatcher.
 */
export const Route = createFileRoute("/p/waitlist-signup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid request" }, { status: 400 });
        }
        const email = String(body?.email ?? "").trim().toLowerCase();
        const city = body?.city ? String(body.city).slice(0, 160) : null;
        const allowedSources = new Set(["zero_results_search", "more_pools_banner"]);
        const reqSource = typeof body?.source === "string" ? body.source : "";
        const source = allowedSources.has(reqSource) ? reqSource : "zero_results_search";
        if (!EMAIL_RE.test(email) || email.length > 254) {
          return Response.json({ error: "Please enter a valid email." }, { status: 400 });
        }
        const userAgent = (request.headers.get("user-agent") || "").slice(0, 300) || null;

        const { error } = await (supabaseAdmin as any)
          .from("pool_waitlist")
          .insert({ email, city, source, user_agent: userAgent });
        if (error) {
          console.error("waitlist-signup insert failed:", error);
          return Response.json({ error: "Could not save your email. Please try again." }, { status: 500 });
        }

        // Best-effort emails (enqueue; delivery handled by the email worker).
        try {
          await sendTransactionalEmailServer({
            templateName: "pool-waitlist-confirmation",
            recipientEmail: email,
            idempotencyKey: `zrs-${email}`,
            templateData: { city, region: null, nearestMiles: null },
          });
        } catch (e) {
          console.error("waitlist-signup confirmation email failed:", e);
        }
        try {
          await sendTransactionalEmailServer({
            templateName: "internal-lead-notification",
            recipientEmail: "hello@poolrentalnearme.com",
            idempotencyKey: `zrs-notify-${email}-${Date.now()}`,
            templateData: {
              formType: "Zero-results search (host acquisition)",
              submitterEmail: email,
              city,
              source,
            },
          });
        } catch (e) {
          console.error("waitlist-signup internal notification failed:", e);
        }

        return Response.json({ ok: true });
      },
    },
  },
});
