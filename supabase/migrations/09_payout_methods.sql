-- Table to store saved payout methods for Hosts
CREATE TYPE payout_method_type AS ENUM ('paypal', 'bank_transfer', 'payoneer', 'stripe_connect');

CREATE TABLE IF NOT EXISTS user_payout_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  method_type payout_method_type NOT NULL,
  details JSONB NOT NULL, -- Stores email (PayPal), or partial IBAN/Bank ID (Bank), etc.
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can only see/manage their own methods
ALTER TABLE user_payout_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payout methods"
ON user_payout_methods FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payout methods"
ON user_payout_methods FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payout methods"
ON user_payout_methods FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payout methods"
ON user_payout_methods FOR DELETE
USING (auth.uid() = user_id);

-- Notify schema reload
NOTIFY pgrst, 'reload config';
