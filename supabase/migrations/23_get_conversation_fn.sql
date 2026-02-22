-- Migration 23: SECURITY DEFINER function to fetch a conversation
-- Bypasses RLS for the SELECT while validating ownership in SQL.
-- This resolves the "{}" empty error from the anon-key client hitting RLS.

CREATE OR REPLACE FUNCTION public.get_conversation(p_conversation_id UUID)
RETURNS TABLE (
    id                UUID,
    property_id       UUID,
    guest_id          UUID,
    owner_id          UUID,
    last_message_at   TIMESTAMPTZ,
    created_at        TIMESTAMPTZ
)
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

    RETURN QUERY
    SELECT
        c.id, c.property_id, c.guest_id, c.owner_id,
        c.last_message_at, c.created_at
    FROM conversations c
    WHERE c.id = p_conversation_id
      AND (c.guest_id = v_user_id OR c.owner_id = v_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_conversation(UUID) TO authenticated;

NOTIFY pgrst, 'reload config';
