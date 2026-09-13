-- Phase 1b — own the listing image bytes.
--
-- Every listing photo currently lives on sharetribe.imgix.net behind an imgix
-- signature we cannot re-mint. synced_listings persists only the resolved URL
-- string, so the moment Sharetribe's account goes away every photo 404s and the
-- bytes are unrecoverable. This migration is the storage side of moving those
-- bytes onto PRNM infrastructure.
--
-- Additive only. Nothing existing is altered or dropped, and the read path keeps
-- using image_urls / primary_image_url until PRNM_IMAGE_SOURCE=prnm is set.

-- ── Bucket ──────────────────────────────────────────────────────────────────
-- Public, same shape as city-heroes, so src/lib/hero-image.ts's existing
-- Supabase-object -> /storage/v1/render/image/public/ rewrite gives us derived
-- sizes without a second CDN. One stored asset per image, resized on demand.
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read listing-images" ON storage.objects;
CREATE POLICY "Public read listing-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');

-- Uploads happen server-side via the service role; this only lets an admin fix
-- one by hand from the dashboard.
DROP POLICY IF EXISTS "Admins manage listing-images" ON storage.objects;
CREATE POLICY "Admins manage listing-images"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'listing-images' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'listing-images' AND has_role(auth.uid(), 'admin'::app_role));

-- ── Per-image tracking ──────────────────────────────────────────────────────
-- One row per Sharetribe image. This is what makes the migration resumable and
-- auditable: the worker claims rows, records outcomes, and can be re-run
-- safely. Without it a partial run is indistinguishable from a complete one.
CREATE TYPE public.listing_image_status AS ENUM (
  'pending',    -- discovered upstream, bytes not fetched yet
  'stored',     -- bytes live in the bucket and public_url is set
  'failed',     -- fetch or upload failed; last_error says why, retryable
  'unavailable' -- upstream offers no usable variant; not retryable
);

CREATE TABLE public.listing_image_assets (
  -- The Sharetribe image UUID. Stable across variants and the only durable
  -- handle we have, since synced_listings never stored it as a column.
  sharetribe_image_id text PRIMARY KEY,
  listing_st_id text NOT NULL,
  -- Order within the listing, so prnm_image_urls can be rebuilt in the same
  -- order Sharetribe returns.
  position int NOT NULL DEFAULT 0,

  -- Where we fetched from, and which variant. Recorded because scaled-xlarge is
  -- the largest variant Sharetribe exposes — there is no way to obtain the true
  -- original — so the fidelity ceiling of this migration is a fact worth keeping.
  source_url text,
  source_variant text,

  -- Where it landed.
  storage_path text,
  public_url text,
  content_type text,
  bytes int,
  sha256 text,

  status public.listing_image_status NOT NULL DEFAULT 'pending',
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  stored_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_image_assets TO authenticated;
GRANT ALL ON public.listing_image_assets TO service_role;
ALTER TABLE public.listing_image_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_image_assets FORCE ROW LEVEL SECURITY;

CREATE POLICY "admins read listing_image_assets" ON public.listing_image_assets
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER tg_listing_image_assets_updated
  BEFORE UPDATE ON public.listing_image_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX listing_image_assets_listing_idx
  ON public.listing_image_assets (listing_st_id, position);
-- The worker's claim query: oldest pending first.
CREATE INDEX listing_image_assets_pending_idx
  ON public.listing_image_assets (created_at)
  WHERE status = 'pending';
CREATE INDEX listing_image_assets_failed_idx
  ON public.listing_image_assets (attempts, updated_at)
  WHERE status = 'failed';
-- Dedupe check: the same bytes uploaded twice under different image ids.
CREATE INDEX listing_image_assets_sha_idx
  ON public.listing_image_assets (sha256)
  WHERE sha256 IS NOT NULL;

-- ── Denormalized read columns on synced_listings ────────────────────────────
-- Deliberately NOT named image_urls/primary_image_url: both sets coexist so the
-- read path can prefer PRNM and fall back to Sharetribe per listing, and so
-- rolling back is a flag flip rather than a data restore.
--
-- runListingSync() must never include these in its upsert payload. PostgREST
-- builds ON CONFLICT DO UPDATE from the columns present in the request body, so
-- columns it omits are preserved — that is what keeps a sync run from wiping a
-- completed re-host. If you add them to that payload you will erase this work.
ALTER TABLE public.synced_listings
  ADD COLUMN IF NOT EXISTS prnm_image_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS prnm_primary_image_url text,
  ADD COLUMN IF NOT EXISTS prnm_images_synced_at timestamptz;

-- Progress query: which published listings still have no PRNM-hosted hero.
CREATE INDEX IF NOT EXISTS synced_listings_prnm_images_pending_idx
  ON public.synced_listings (updated_at DESC)
  WHERE state = 'published' AND is_deleted = false AND prnm_primary_image_url IS NULL;

COMMENT ON TABLE public.listing_image_assets IS
  'Phase 1b: per-image record of the Sharetribe -> PRNM byte migration. Resumable and idempotent on sharetribe_image_id.';
COMMENT ON COLUMN public.synced_listings.prnm_image_urls IS
  'PRNM-hosted listing images, ordered. Populated by the re-host worker; never written by runListingSync.';
