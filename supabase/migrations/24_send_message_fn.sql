-- Migration 24: SECURITY DEFINER function for sending messages
-- Bypasses RLS on both messages INSERT and conversations SELECT subquery.
-- Also handles last_message_at update and gracefully ignores missing message_type column.

CREATE OR REPLACE FUNCTION public.send_message(
    p_conversation_id UUID,
    p_content         TEXT,
    p_message_type    TEXT DEFAULT 'message'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id         UUID := auth.uid();
    v_message_id      UUID;
    v_is_participant  BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verify the caller is actually part of this conversation
    SELECT EXISTS (
        SELECT 1 FROM conversations
        WHERE id = p_conversation_id
          AND (guest_id = v_user_id OR owner_id = v_user_id)
    ) INTO v_is_participant;

    IF NOT v_is_participant THEN
        RAISE EXCEPTION 'Access denied: you are not a participant in this conversation';
    END IF;

    -- Insert the message (try with message_type, fall back without if column missing)
    BEGIN
        INSERT INTO messages (conversation_id, sender_id, content, message_type)
        VALUES (p_conversation_id, v_user_id, p_content, p_message_type)
        RETURNING id INTO v_message_id;
    EXCEPTION WHEN undefined_column THEN
        -- message_type column doesn't exist yet (migration 22 not run) — insert without it
        INSERT INTO messages (conversation_id, sender_id, content)
        VALUES (p_conversation_id, v_user_id, p_content)
        RETURNING id INTO v_message_id;
    END;

    -- Update conversation's last_message_at
    UPDATE conversations
       SET last_message_at = NOW()
     WHERE id = p_conversation_id;

    RETURN v_message_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_message(UUID, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload config';
