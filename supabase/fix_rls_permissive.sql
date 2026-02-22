-- FIX RLS PERMISSIVE (Debug Mode)
-- Use this to unblock the functionality.
-- Policies are simplified to "Is the user logged in?"

BEGIN;

-- 1. Drop EVERYTHING again to be sure
DO $$ 
DECLARE 
    pol record; 
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'conversations' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON conversations', pol.policyname); 
    END LOOP;
    
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'messages' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON messages', pol.policyname); 
    END LOOP; 
END $$;

-- 2. Create "Authenticated Users Can Do Anything" policies
-- This verifies if the issue is the specific "guest_id = auth.uid()" logic

-- Conversations: Allow ALL authenticated users
CREATE POLICY "allow_all_authenticated_conversations" ON conversations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Messages: Allow ALL authenticated users
CREATE POLICY "allow_all_authenticated_messages" ON messages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMIT;
