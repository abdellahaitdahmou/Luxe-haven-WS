-- Migration 26: SECURITY DEFINER function to fetch messages for a conversation
-- Bypasses RLS to ensure participants can always see their chat history.
-- Fixed: Ambiguous column reference by renaming return table columns.
-- NOTE: Requires DROP FUNCTION first because the return type schema changed.

DROP FUNCTION IF EXISTS public.get_messages(UUID);

CREATE OR REPLACE FUNCTION public.get_messages(p_conversation_id UUID)
RETURNS TABLE (
    msg_id              UUID,
    msg_conversation_id UUID,
    msg_sender_id       UUID,
    msg_content         TEXT,
    msg_is_read         BOOLEAN,
    msg_type           TEXT,
    msg_created_at      TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_is_participant BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verify participation
    SELECT EXISTS (
        SELECT 1 FROM conversations
        WHERE id = p_conversation_id
          AND (guest_id = v_user_id OR owner_id = v_user_id)
    ) INTO v_is_participant;

    IF NOT v_is_participant THEN
        RETURN;
    END IF;

    -- Check if message_type column exists to handle migration 22 state gracefully
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'message_type'
    ) THEN
        RETURN QUERY
        SELECT 
            m.id, m.conversation_id, m.sender_id, m.content, 
            m.is_read, m.message_type, m.created_at
        FROM messages m
        WHERE m.conversation_id = p_conversation_id
        ORDER BY m.created_at ASC;
    ELSE
        RETURN QUERY
        SELECT 
            m.id, m.conversation_id, m.sender_id, m.content, 
            m.is_read, 'message'::TEXT, m.created_at
        FROM messages m
        WHERE m.conversation_id = p_conversation_id
        ORDER BY m.created_at ASC;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_messages(UUID) TO authenticated;

NOTIFY pgrst, 'reload config';
