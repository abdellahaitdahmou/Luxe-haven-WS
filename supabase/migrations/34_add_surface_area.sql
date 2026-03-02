ALTER TABLE properties
ADD COLUMN IF NOT EXISTS surface_area INTEGER;

NOTIFY pgrst, 'reload config';
