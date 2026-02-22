-- Add status column to properties if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'status') THEN 
        ALTER TABLE properties ADD COLUMN status TEXT DEFAULT 'active';
        -- Optional: Add a check constraint for valid statuses
        ALTER TABLE properties ADD CONSTRAINT allowed_status_values CHECK (status IN ('active', 'unlisted', 'archived'));
    END IF;
END $$;
