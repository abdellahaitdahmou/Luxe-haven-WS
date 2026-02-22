-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- 1. Admins have full access (Read/Write everything)
CREATE POLICY "Admins have full access to settings"
ON admin_settings FOR ALL
USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- 2. Public/Authenticated Users can read specific non-sensitive settings
-- (Needed for Checkout page to know which payment methods are enabled)
CREATE POLICY "Public can view public settings"
ON admin_settings FOR SELECT
USING (
  key IN ('global_cancellation_policy', 'payment_methods', 'payout_methods')
);

-- Reload schema cache to fix PGRST205
NOTIFY pgrst, 'reload config';
