
-- Reset full_name to NULL where it matches the email username
-- This allows the frontend fallback to Google metadata (user_metadata) to work correctly
UPDATE profiles
SET full_name = NULL
WHERE full_name = split_part(email, '@', 1);
