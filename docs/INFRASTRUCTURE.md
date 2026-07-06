# PRNM Infrastructure Runbook

_Source of truth for what runs where, which keys live in which files, and what still needs doing._
_Generated 2026-07-06. Key **values** are never stored here — only their locations._

> **Status:** Content database migrated to an owned project. All PRNM content now lives on
> `prnm-content-production` (`qbzpjsiahqgyoazjurqy`) under **derekbowencorp**, us-east-1.
> The old, unowned project is untouched and kept only as rollback. The previously broken
> write path (waitlist / email) is fixed.

## Action items

| When | Item | Notes |
|---|---|---|
| **set 2026-07-06 · do after 24h** | 🔴 Rotate/deactivate AWS `claude-deploy` key | IAM user `claude-deploy`, key `AKIA…KAEI` (full ID in the IAM console under user `claude-deploy`). Used for EC2 Instance Connect tunneling. Deactivate in IAM once migration is stable (~2026-07-07). **Remind at this mark.** |
| **≈2026-07-07 (after 24h)** | 🟡 Decommission old Supabase project | `ptfjspcphskifoseidut` is the rollback. Keep live through the 24h window, then pause/delete. **Remind at this mark.** |
| **Phase 2** | 🟡 Content-gen pipeline — deploy, hold the cron | 9 edge functions + `pg_cron` (`auto-generate-content-batch`, every 5 min). Deploy functions; **do NOT enable the cron until explicit go.** |
| optional | 🔵 Rotate new DB password + service_role key | Both transited chat during setup; rotate + re-run env swap when convenient. |

## Supabase projects

- **`qbzpjsiahqgyoazjurqy` — prnm-content-production (LIVE)** · derekbowencorp org · us-east-1 · Pro.
  Holds 8,306 rows / 11 content tables + 2 storage buckets (course-covers, city-heroes) + full schema.
  Used by the EAST box only.
- **`ptfjspcphskifoseidut` — old content project (ROLLBACK)** · abandoned, untouched. Its
  `SERVICE_ROLE_KEY` slot held an **anon** key — root cause of the silent write failures.
- **`attycbfvijoyqhnppyai` — public-pools backend (SEPARATE)** · edge functions for
  `/public-pools.xml` + directory sitemap (splash-search-hub / Lovable). Unrelated; left as-is.

DB access: PostgREST via anon/service_role keys (HTTPS); DDL via pooler
`aws-0-us-east-1.pooler.supabase.com:5432` (session) with the DB password. Direct `db.<ref>:5432` is blocked from EAST.

## Boxes

| Box | Serves | Region / IPs | Instance · EICE | Deploy |
|---|---|---|---|---|
| **EAST** (pSEO / fresh-web) | all `/p/*`, sitemaps, state hubs, directory (TanStack SSR) | us-east-1 · 3.222.110.146 · 172.31.24.81 | i-060692efd53e6e853 · eice-070b326465e4cf01a | edit `/home/ubuntu/fresh-web` → `npm run build` → `pm2 restart fresh-web`. Repo derekbowen/fresh-web-702e04c3 |
| **WEST prod** (marketplace) | Sharetribe `/`, `/s`, `/l`, checkout, auth, account; nginx front door; merlin wizard :3099 | us-west-1 · 13.56.113.85 · 172.31.12.192 | i-0a711c88043788b2b · eice-0875a23cab30f8180 | Docker `poolrentalnearme-production` rebuild → restart. Source `/home/ubuntu/build`. No Supabase. |
| **WEST test** (staging) | marketplace staging | us-west-1 · 13.56.89.89 | i-0c5a4f9c653c3bc82 | same as WEST prod |

**nginx** (WEST, `/etc/nginx/sites-enabled/default`) routes by path: `/p/*`, `/_serverFn/`, sitemaps, `/blog` → EAST;
`/public-pools/*`, `/amenity/*` → Lovable apps; else → Sharetribe :3000. Back up outside `sites-enabled/` before edits.

## Env vars & secret locations (names only)

**EAST `/home/ubuntu/fresh-web/.env`:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (real service_role),
`SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
(all → new project; VITE_* are baked at build), `SHARETRIBE_CLIENT_ID`, `SHARETRIBE_INTEG_CLIENT_ID/_SECRET`.
- Migration-tooling secrets (chmod 600, outside git): `/home/ubuntu/migration_new.env` (new URL, anon, service_role, DB password);
  `/home/ubuntu/fresh-web.env.bak.precutover.*` (pre-cutover .env = rollback values).
- Email/Resend: no key in this `.env` — routes via Supabase (vault/edge function); confirm in Phase 2.

**WEST `/home/ubuntu/build/.env`** (no Supabase): Sharetribe SDK creds, `VITE_STRIPE_PUBLISHABLE_KEY`,
`TWILIO_*`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_APP_SECRET`, `APPLE_*`, `VITE_GOOGLE_MAPS_API_KEY`,
`VITE_MAPBOX_ACCESS_TOKEN`, `RABBITMQ_*`.

## Migration record (2026-07-06)

- Schema: 185 migrations + drift fixes (content_pages had 23 dashboard-only columns) + new `pool_waitlist.source`.
- Data: 8,306 rows / 11 tables — counts matched source exactly.
- Storage: 136 images; all URLs rewritten old→new.
- Verified: all template types render off new DB; a real `pool_waitlist` write landed.
- Commits: `d7cf0a4b`, `dc04b1f2`.

**Rollback (instant):** restore `/home/ubuntu/fresh-web.env.bak.precutover.*` → `.env` → `npm run build` →
`pm2 restart fresh-web`. Old project is untouched.
