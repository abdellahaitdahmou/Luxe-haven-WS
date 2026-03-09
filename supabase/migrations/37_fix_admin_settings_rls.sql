-- Fix: Add 'platform_currency' to the public-readable admin_settings keys.
-- The CurrencyContext fetches this key on every page load, but the old policy
-- only allowed reading 'global_cancellation_policy', 'payment_methods', 'payout_methods'.
-- This caused a 406 error from PostgREST for unauthenticated / non-admin users.

DROP POLICY IF EXISTS "Public can view public settings" ON admin_settings;

CREATE POLICY "Public can view public settings"
ON admin_settings FOR SELECT
USING (
  key IN (
    'global_cancellation_policy',
    'payment_methods',
    'payout_methods',
    'platform_currency'
  )
);

NOTIFY pgrst, 'reload config';
