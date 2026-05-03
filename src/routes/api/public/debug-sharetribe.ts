import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/debug-sharetribe")({
  server: {
    handlers: {
      GET: async () => {
        const clientId = process.env.SHARETRIBE_CLIENT_ID;
        const clientSecret = process.env.SHARETRIBE_CLIENT_SECRET;
        const marketplaceUrl = process.env.SHARETRIBE_MARKETPLACE_URL;
        if (!clientId || !clientSecret) {
          return Response.json({ error: "missing creds", hasId: !!clientId, hasSecret: !!clientSecret });
        }

        const result: Record<string, unknown> = {
          clientIdPrefix: clientId.slice(0, 8),
          clientIdLength: clientId.length,
          marketplaceUrl,
        };

        // Try integ scope
        try {
          const integBody = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "client_credentials",
            scope: "integ",
          });
          const integRes = await fetch("https://flex-integ-api.sharetribe.com/v1/auth/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: integBody,
          });
          const integText = await integRes.text();
          result.integAuth = { status: integRes.status, body: integText.slice(0, 400) };

          if (integRes.ok) {
            const json = JSON.parse(integText) as { access_token: string; scope?: string };
            result.integScope = json.scope;
            const queryRes = await fetch(
              "https://flex-integ-api.sharetribe.com/v1/integration_api/listings/query?perPage=1",
              { headers: { Authorization: `Bearer ${json.access_token}`, Accept: "application/json" } },
            );
            const queryText = await queryRes.text();
            result.integQuery = { status: queryRes.status, body: queryText.slice(0, 400) };
          }
        } catch (e) {
          result.integError = String(e);
        }

        // Try public-read scope on marketplace API
        try {
          const pubBody = new URLSearchParams({
            client_id: clientId,
            grant_type: "client_credentials",
            scope: "public-read",
          });
          const pubRes = await fetch("https://flex-api.sharetribe.com/v1/auth/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: pubBody,
          });
          const pubText = await pubRes.text();
          result.publicAuth = { status: pubRes.status, body: pubText.slice(0, 400) };
          if (pubRes.ok) {
            const json = JSON.parse(pubText) as { access_token: string };
            const qRes = await fetch(
              "https://flex-api.sharetribe.com/v1/api/listings/query?perPage=1",
              { headers: { Authorization: `Bearer ${json.access_token}`, Accept: "application/json" } },
            );
            const qText = await qRes.text();
            result.publicQuery = { status: qRes.status, body: qText.slice(0, 400) };
          }
        } catch (e) {
          result.publicError = String(e);
        }

        return Response.json(result);
      },
    },
  },
});
