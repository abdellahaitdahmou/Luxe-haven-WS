
-- Update Profiles to include Stripe Connect fields
ALTER TABLE profiles 
ADD COLUMN stripe_account_id TEXT,
ADD COLUMN host_fee_percent DECIMAL(5, 2) DEFAULT 10.0; -- Default 10% platform fee
