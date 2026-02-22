-- 1. Update PROFILES to store Stripe Connected Account ID
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- 2. Update BOOKINGS for financial breakdown
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_status booking_status DEFAULT 'pending', -- Reusing enum or creating new text constraint if needed. Schema v2 has 'pending' in booking_status, let's verify.
-- Actually schema_v2 defined booking_status as ('pending', 'confirmed', 'cancelled', 'completed', 'disputed'). 
-- It seems 'payment_status' was requested as a separate field: "unpaid", "paid".
ADD COLUMN IF NOT EXISTS payment_status_text TEXT DEFAULT 'unpaid' CHECK (payment_status_text IN ('unpaid', 'paid', 'refunded')),
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS host_amount DECIMAL(10, 2) DEFAULT 0.00;

-- 3. WALLETS Table (Internal Ledger)
CREATE TABLE IF NOT EXISTS wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  available_balance DECIMAL(10, 2) DEFAULT 0.00,
  pending_balance DECIMAL(10, 2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet"
ON wallets FOR SELECT
USING (auth.uid() = user_id);

-- Only system/triggers should update wallets usually, but for now allow admins or self (if logic is client-side, but ideally server-side)
-- We will stick to server-side updates via API (Service Role) for security.
-- So no INSERT/UPDATE policy for public/authenticated users generally, except maybe reading.

-- 4. PAYOUTS Table
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'rejected');

CREATE TABLE IF NOT EXISTS payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status payout_status DEFAULT 'pending',
  stripe_transfer_id TEXT, -- ID from Stripe Payout/Transfer
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Payouts
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can view their own payouts"
ON payouts FOR SELECT
USING (auth.uid() = host_id);

CREATE POLICY "Hosts can insert payout requests"
ON payouts FOR INSERT
WITH CHECK (auth.uid() = host_id);

-- 5. Update TRANSACTIONS Table (Refining inputs)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'booking', -- booking, payout, fee
ADD COLUMN IF NOT EXISTS reference_id UUID; -- Link to booking_id or payout_id generic

-- Trigger to create wallet for new users (Optional but good practice)
-- OR we can just create it on the fly when needed. Let's create on profile creation.

CREATE OR REPLACE FUNCTION public.create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id) VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on Profile creation (if not exists)
DROP TRIGGER IF EXISTS on_profile_created_create_wallet ON profiles;
CREATE TRIGGER on_profile_created_create_wallet
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE PROCEDURE public.create_wallet_for_new_user();

-- Backfill wallets for existing users
INSERT INTO public.wallets (user_id)
SELECT id FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.wallets);

-- Reload config
NOTIFY pgrst, 'reload config';
