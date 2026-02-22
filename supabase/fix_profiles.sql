-- This script fixes the "foreign key constraint" error by creating profiles for existing users

-- 1. Insert missing profiles for all users in auth.users
INSERT INTO public.profiles (id, full_name, role, avatar_url)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', 'Admin User'), 
    'admin', -- Default to admin for now, or 'owner'
    raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 2. Verify the fix
SELECT * FROM public.profiles;
