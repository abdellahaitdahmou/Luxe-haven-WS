-- Add profile details columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS hobbies TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Create policy to allow users to update their own profile details
-- (Existing policies might cover this, but ensuring specific access to these columns is good practice if we had column-level security, but RLS on rows covers it)
-- We'll assume the existing "Users can update own profile" policy covers these new columns.

-- If not, ensuring RLS allows update:
-- CREATE POLICY "Users can update their own profile" ON profiles
--   FOR UPDATE USING (auth.uid() = id);
