-- 1. Restrict profiles public SELECT — only owner can read their own profile.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Revoke email/submitter_email column access from anon on providers.
--    Public directory listings expose phone (intentional business contact),
--    but email fields are internal-only.
REVOKE SELECT (email, submitter_email) ON public.providers FROM anon;
REVOKE SELECT (email, submitter_email) ON public.providers FROM authenticated;
-- Server code uses supabaseAdmin (service role) which bypasses these grants.