-- 1. Create table for tracking invitations
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'guest',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure email is lowercase for consistency
  CONSTRAINT email_lower_check CHECK (email = lower(email))
);

-- Enable RLS
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Only Admins can view/create/delete invitations
CREATE POLICY "Admins can manage invitations"
  ON user_invitations
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- 2. Create function to assign role on signup
CREATE OR REPLACE FUNCTION public.assign_role_from_invitation()
RETURNS TRIGGER AS $$
DECLARE
  invited_role user_role;
BEGIN
  -- Check if there is an invitation for this email
  SELECT role INTO invited_role
  FROM public.user_invitations
  WHERE email = lower(new.email);

  -- If invitation exists, update the profile role
  IF invited_role IS NOT NULL THEN
    UPDATE public.profiles
    SET role = invited_role
    WHERE id = new.id;
    
    -- Optional: Delete invitation after use (or keep for history)
    -- DELETE FROM public.user_invitations WHERE email = lower(new.email);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger on profiles table
-- This runs AFTER the profile is inserted (usually by handle_new_user trigger on auth.users)
DROP TRIGGER IF EXISTS on_profile_created_check_invitation ON public.profiles;

CREATE TRIGGER on_profile_created_check_invitation
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_role_from_invitation();

-- Reload schema cache to make new table visible immediately
NOTIFY pgrst, 'reload config';
