-- Migration 27: SECURITY DEFINER function to mark messages as read
-- Bypasses RLS to ensure unread counts are cleared correctly.

CREATE OR REPLACE FUNCTION public.mark_messages_read(p_conversation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Update all messages in this conversation where I am NOT the sender 
    -- and they are currently unread.
    UPDATE messages
    SET is_read = TRUE
    WHERE conversation_id = p_conversation_id
      AND sender_id != v_user_id
      AND is_read = FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_messages_read(UUID) TO authenticated;

NOTIFY pgrst, 'reload config';
