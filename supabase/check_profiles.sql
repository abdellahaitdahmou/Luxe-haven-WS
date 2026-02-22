
-- Check policies on profiles table
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Check definition of profiles table to ensure avatar_url exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';
