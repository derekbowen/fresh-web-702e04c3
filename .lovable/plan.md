## Verify & lock down `content_pages` access

### Findings (verified)
- **RLS:** only one policy on `content_pages` — `Admins manage content pages` (ALL, `has_role admin`). No public/anon SELECT policy. ✅
- **Code paths** that read the table all use `supabaseAdmin` (service role, server-only):
  - `src/server/content-pages.functions.ts` → `lookupContentPage` (SSR for `/p/{slug}`)
  - `src/server/content-scrape.functions.ts` (admin-gated)
  - `src/lib/sitemap.ts` + all `sitemap-pages-*.xml.ts` + `sitemap.xml.ts`
  - Offline `scripts/*` (service role via env)
- No browser-side import of the table. `client.server.ts` import-protection prevents accidental client bundling.

**Conclusion:** the access path is already correct. Two improvements to harden it against future drift.

### Changes

**1. Migration — revoke table grants (defense-in-depth)**
```sql
REVOKE ALL ON TABLE public.content_pages FROM anon, authenticated;
COMMENT ON TABLE public.content_pages IS
  'Server-only access. Reads MUST go through supabaseAdmin in server functions. No public SELECT policy; anon/authenticated grants revoked.';
```
Even if someone later adds a permissive SELECT policy by mistake, PostgREST will still reject `anon`/`authenticated` requests at the grant layer. `service_role` is unaffected and `supabaseAdmin` continues to work.

**2. Code comment** at the top of `src/server/content-pages.functions.ts` documenting the access contract (no public SELECT, must use `supabaseAdmin`, never query from the browser client).

**3. Memory**
- New `mem://security/content-pages-access.md` with full RLS/grant/allowed-paths documentation.
- Add Core rule to `mem://index.md`: *"content_pages: server-only via supabaseAdmin. No public RLS SELECT; anon/authenticated grants revoked. Never query from browser client."*

### Out of scope
- No column or schema changes
- No changes to existing server function logic or routes
