-- FIX RLS POLICIES FOR CONVERSATIONS

-- 1. Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Users can view conversations they are part of" ON conversations;
DROP POLICY IF EXISTS "Users can insert conversations they are part of" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations they are part of" ON conversations;
DROP POLICY IF EXISTS "Enable all for users" ON conversations;

-- 2. Create Robust Policies

-- ALLOW SELECT: guest or owner can see the conversation
CREATE POLICY "Users can view conversations they are part of" ON conversations
  FOR SELECT USING (
    auth.uid() = guest_id OR auth.uid() = owner_id
  );

-- ALLOW INSERT: Authenticated users can create a conversation if they are the participant
-- We assume the user is the 'guest' initiating the conversation, OR the 'owner' (less likely but possible)
CREATE POLICY "Users can insert conversations they are part of" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = guest_id OR auth.uid() = owner_id
  );

-- ALLOW UPDATE: needed for updating 'last_message_at'
CREATE POLICY "Users can update conversations they are part of" ON conversations
  FOR UPDATE USING (
    auth.uid() = guest_id OR auth.uid() = owner_id
  );

-- 3. Force Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 4. Check Messages Policies (Optional but good practice)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Ensure message policies exist (using IF NOT EXISTS logic via DO block or just recreating)
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;

CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND (guest_id = auth.uid() OR owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND (guest_id = auth.uid() OR owner_id = auth.uid())
    )
  );
