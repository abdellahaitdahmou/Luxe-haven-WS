-- Enable RLS on tables
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- WISHLIST POLICIES
CREATE POLICY "Users can view their own wishlist"
ON wishlist FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their wishlist"
ON wishlist FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their wishlist"
ON wishlist FOR DELETE
USING (auth.uid() = user_id);

-- CONVERSATIONS POLICIES
CREATE POLICY "Users can view their conversations"
ON conversations FOR SELECT
USING (auth.uid() = guest_id OR auth.uid() = owner_id);

CREATE POLICY "Users can start conversations"
ON conversations FOR INSERT
WITH CHECK (auth.uid() = guest_id);

-- MESSAGES POLICIES
-- Simple policy: if you can view the conversation, you can view the messages.
-- Ideally we check conversation participants, but complex joins in RLS can be slow.
-- For now, we trust the application logic or use a simpler check if possible.
-- A robust way is:
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
        AND (c.guest_id = auth.uid() OR c.owner_id = auth.uid())
    )
);

CREATE POLICY "Users can send messages in their conversations"
ON messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = conversation_id
        AND (c.guest_id = auth.uid() OR c.owner_id = auth.uid())
    )
);

-- Fix for storage users (if needed for avatar uploads later, but good to have)
-- insert into storage.buckets (id, name) values ('avatars', 'avatars') on conflict do nothing;
