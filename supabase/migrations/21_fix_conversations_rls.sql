-- Migration 21: Fix Conversations RLS via SECURITY DEFINER function
-- This solves the "new row violates row-level security policy" error
-- by handling conversation creation inside a trusted DB function.

-- 1. Drop existing INSERT policy that was blocking the insert
DROP POLICY IF EXISTS "Users can insert conversations they are part of" ON conversations;

-- 2. Create a SECURITY DEFINER function that safely creates or finds a conversation.
--    Using auth.uid() inside the function guarantees the guest_id cannot be faked.
CREATE OR REPLACE FUNCTION public.start_conversation(
    p_property_id UUID,
    p_owner_id    UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_guest_id        UUID;
    v_conversation_id UUID;
BEGIN
    -- Must be authenticated
    v_guest_id := auth.uid();
    IF v_guest_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Return existing conversation if found
    SELECT id INTO v_conversation_id
    FROM conversations
    WHERE property_id = p_property_id
      AND guest_id    = v_guest_id
      AND owner_id    = p_owner_id;

    IF v_conversation_id IS NOT NULL THEN
        RETURN v_conversation_id;
    END IF;

    -- Create new conversation
    INSERT INTO conversations (property_id, guest_id, owner_id)
    VALUES (p_property_id, v_guest_id, p_owner_id)
    RETURNING id INTO v_conversation_id;

    RETURN v_conversation_id;
END;
$$;

-- 3. Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.start_conversation(UUID, UUID) TO authenticated;

-- Reload schema cache
NOTIFY pgrst, 'reload config';
