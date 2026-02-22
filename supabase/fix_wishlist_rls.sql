-- FIX WISHLIST RLS POLICIES
-- Run this in Supabase SQL Editor

BEGIN;

-- 1. Ensure Table Exists (idempotent)
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- 2. Enable RLS
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- 3. Dynamic Drop of ALL existing policies to avoid conflicts
DO $$ 
DECLARE 
    pol record; 
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'wishlist' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON wishlist', pol.policyname); 
    END LOOP; 
END $$;

-- 4. Create Correct Policies

-- VIEW: Users can view their own wishlist items
CREATE POLICY "view_own_wishlist" ON wishlist
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Users can add to their own wishlist
CREATE POLICY "insert_own_wishlist" ON wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can remove from their own wishlist
CREATE POLICY "delete_own_wishlist" ON wishlist
  FOR DELETE USING (auth.uid() = user_id);

COMMIT;
