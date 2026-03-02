-- Add listing_type and price_type to properties table
DO $$ BEGIN
    CREATE TYPE property_listing_type AS ENUM ('rent', 'sale');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE property_price_type AS ENUM ('per_night', 'per_month', 'fixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS listing_type property_listing_type DEFAULT 'rent',
ADD COLUMN IF NOT EXISTS price_type property_price_type DEFAULT 'per_night';

-- Notify pgrst
NOTIFY pgrst, 'reload config';
