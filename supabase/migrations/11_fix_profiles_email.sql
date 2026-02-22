-- 1. Ensure email column exists in profiles
-- (This might be missing if installed via schema.sql vs schema_v2.sql)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.email -- Insert email from auth.users
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update existing profiles (Backfill) - Optional but good practice
-- We can't easily join auth.users in a simple update without permissions, 
-- but we can try if the user running this has access.
-- If this fails, we can comment it out, but usually for local dev it works.
-- DO $$
-- BEGIN
--   UPDATE public.profiles p
--   SET email = a.email
--   FROM auth.users a
--   WHERE p.id = a.id AND p.email IS NULL;
-- EXCEPTION WHEN OTHERS THEN
--   RAISE NOTICE 'Could not backfill emails: %', SQLERRM;
-- END;
-- $$;
