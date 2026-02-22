-- Add images column to properties table to store rich metadata (category, caption, etc.)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'images') THEN 
        ALTER TABLE properties ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;
