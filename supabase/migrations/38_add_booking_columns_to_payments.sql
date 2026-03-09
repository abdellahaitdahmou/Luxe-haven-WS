-- Add booking-detail columns to received_payments
-- These are imported from Airbnb / booking CSV exports

ALTER TABLE public.received_payments
    ADD COLUMN IF NOT EXISTS check_out_date  DATE         NULL,
    ADD COLUMN IF NOT EXISTS guests          INTEGER      NULL,
    ADD COLUMN IF NOT EXISTS channel         TEXT         NULL,
    ADD COLUMN IF NOT EXISTS nights          INTEGER      NULL,
    ADD COLUMN IF NOT EXISTS price_per_night DECIMAL(12,2) NULL;

NOTIFY pgrst, 'reload schema';
