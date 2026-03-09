-- Fix the assign_role_from_invitation trigger to correctly get the email from auth.users
CREATE OR REPLACE FUNCTION public.assign_role_from_invitation()
RETURNS TRIGGER AS $$
DECLARE
  invited_role user_role;
  user_email TEXT;
BEGIN
  -- Get the email from auth.users using the new profile ID
  SELECT email INTO user_email FROM auth.users WHERE id = new.id;

  -- Check if there is an invitation for this email
  SELECT role INTO invited_role
  FROM public.user_invitations
  WHERE email = lower(user_email);

  -- If an invitation exists, update the profile role
  IF invited_role IS NOT NULL THEN
    UPDATE public.profiles
    SET role = invited_role
    WHERE id = new.id;
    
    -- Delete the invitation after it has been used
    DELETE FROM public.user_invitations WHERE email = lower(user_email);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
