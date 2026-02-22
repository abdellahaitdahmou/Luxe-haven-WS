-- Create a new user in auth.users
-- NOTE: Passwords cannot be set directly via SQL in Supabase due to hashing.
-- You must sign up this user via the Client App (Signup Page) first, 
-- OR use the Supabase Dashboard "Authentication" tab to create the user manually.

-- 1. AFTER YOU CREATE THE USER (ahmed505ait@gmail.com), RUN THIS:
-- This will upgrade their role to 'admin'

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'ahmed505ait@gmail.com';

-- Verify the update
SELECT * FROM public.profiles WHERE email = 'ahmed505ait@gmail.com';
