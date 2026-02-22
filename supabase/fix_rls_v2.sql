-- FIX RLS POLICIES V2 (Robust Reset)
-- Run this in the Supabase SQL Editor

BEGIN;

-- 1. Dynamic Drop of ALL policies on 'conversations' to ensure no conflicts remain
DO $$ 
DECLARE 
    pol record; 
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'conversations' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON conversations', pol.policyname); 
    END LOOP; 
END $$;

-- 2. Dynamic Drop of ALL policies on 'messages'
DO $$ 
DECLARE 
    pol record; 
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'messages' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON messages', pol.policyname); 
    END LOOP; 
END $$;

-- 3. Re-Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. Create Correct Policies for CONVERSATIONS

-- View: Part of the convo
CREATE POLICY "view_conversation" ON conversations
  FOR SELECT USING (
    auth.uid() = guest_id OR auth.uid() = owner_id
  );

-- Insert: Must be the participant (usually the guest initiating, or owner)
CREATE POLICY "insert_conversation" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = guest_id OR auth.uid() = owner_id
  );

-- Update: Needed for 'last_message_at' updates
CREATE POLICY "update_conversation" ON conversations
  FOR UPDATE USING (
    auth.uid() = guest_id OR auth.uid() = owner_id
  );

-- 5. Create Correct Policies for MESSAGES

-- View: If you can see the conversation, you can see the messages
CREATE POLICY "view_messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND (guest_id = auth.uid() OR owner_id = auth.uid())
    )
  );

-- Insert: Sender must be you, and you must belong to the conversation
CREATE POLICY "insert_messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND (guest_id = auth.uid() OR owner_id = auth.uid())
    )
  );

-- Update: (e.g. marking as read)
CREATE POLICY "update_messages" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND (guest_id = auth.uid() OR owner_id = auth.uid())
    )
  );

COMMIT;
