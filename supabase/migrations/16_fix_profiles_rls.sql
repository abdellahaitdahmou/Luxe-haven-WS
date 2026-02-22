-- Legacy support: Ensure user_role type exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'owner', 'guest', 'manager');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Ensure 'role' column exists in profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'guest';

-- 2. Enable RLS (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 4. Create Policies

-- VIEW: Allow users to view their own profile. 
-- (Optional: Allow viewing other profiles for messaging/booking names)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING ( true );

-- INSERT: Allow users to insert their *own* profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK ( auth.uid() = id );

-- UPDATE: Allow users to update their *own* profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING ( auth.uid() = id );
