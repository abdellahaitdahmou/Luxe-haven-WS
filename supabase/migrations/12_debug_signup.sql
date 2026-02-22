-- 1. Create a table to log errors
CREATE TABLE IF NOT EXISTS public.signup_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_message TEXT,
  error_detail TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (public read/write for now to ensure we can debug easily)
ALTER TABLE public.signup_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write errors" ON public.signup_errors FOR ALL USING (true) WITH CHECK (true);

-- 2. Update the handle_new_user function to LOG errors instead of crashing
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, email)
    VALUES (
      new.id, 
      new.raw_user_meta_data->>'full_name', 
      new.raw_user_meta_data->>'avatar_url',
      new.email
    );
  EXCEPTION WHEN OTHERS THEN
    -- Capture the exact error
    INSERT INTO public.signup_errors (error_message, error_detail)
    VALUES (SQLERRM, SQLSTATE);
    -- We swallow the error to allow the transaction to commit, 
    -- so we can read the error log.
  END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
