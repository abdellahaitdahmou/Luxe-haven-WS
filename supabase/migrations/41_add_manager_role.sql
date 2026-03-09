-- 1. Add 'manager' to user_role enum
DO $$ BEGIN
    ALTER TYPE user_role ADD VALUE 'manager';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update the handle_new_user trigger to support all host roles
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
  invited_role user_role;
BEGIN
  -- Check if there is a pending invitation for this email
  SELECT role INTO invited_role 
  FROM public.user_invitations 
  WHERE email = new.email 
  LIMIT 1;

  -- Insert the new profile, using the invited role if it exists, otherwise default to 'guest'
  INSERT INTO public.profiles (id, role, full_name, avatar_url)
  VALUES (
    new.id, 
    COALESCE(invited_role, 'guest'::user_role), 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );

  -- If there was an invitation, delete it
  IF invited_role IS NOT NULL THEN
    DELETE FROM public.user_invitations WHERE email = new.email;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix missing profiles for users who already signed up but failed due to missing 'manager' role
INSERT INTO public.profiles (id, role, full_name)
SELECT 
    au.id, 
    COALESCE((SELECT role FROM public.user_invitations ui WHERE ui.email = au.email LIMIT 1), 'guest'::user_role),
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 4. Clean up used invitations for those who just got profiles
DELETE FROM public.user_invitations ui
USING auth.users au
WHERE ui.email = au.email;
