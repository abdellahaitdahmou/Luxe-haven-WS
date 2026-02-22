-- Add facility columns to properties
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'max_guests') THEN 
        ALTER TABLE properties ADD COLUMN max_guests INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'bedrooms') THEN 
        ALTER TABLE properties ADD COLUMN bedrooms INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'beds') THEN 
        ALTER TABLE properties ADD COLUMN beds INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'bathrooms') THEN 
        ALTER TABLE properties ADD COLUMN bathrooms DECIMAL(3, 1) DEFAULT 1.0;
    END IF;
END $$;
