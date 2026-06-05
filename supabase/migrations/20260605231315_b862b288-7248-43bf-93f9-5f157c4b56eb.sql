-- 1. Clear out un-sent rows from the old sequence first
DELETE FROM public.renter_emails WHERE status IN ('pending','failed','skipped','cancelled');

-- 2. Replace kind check constraint with new sequence kinds
ALTER TABLE public.renter_emails DROP CONSTRAINT IF EXISTS renter_emails_kind_check;
ALTER TABLE public.renter_emails
  ADD CONSTRAINT renter_emails_kind_check
  CHECK (kind = ANY (ARRAY['warm_up'::text, 'new_pools'::text, 'booking_nudge'::text]));

-- 3. Reset subscribers so the next poll re-queues the new sequence
UPDATE public.renter_subscribers SET sequence_scheduled = false;