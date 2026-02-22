-- Migration 25: SECURITY DEFINER function to list all conversations for the current user
-- Bypasses RLS SELECT on conversations so the sidebar always loads correctly.

CREATE OR REPLACE FUNCTION public.get_conversations()
RETURNS TABLE (
    id              UUID,
    property_id     UUID,
    guest_id        UUID,
    owner_id        UUID,
    last_message_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ
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
    WHERE (c.guest_id = v_user_id OR c.owner_id = v_user_id)
    ORDER BY c.last_message_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_conversations() TO authenticated;

NOTIFY pgrst, 'reload config';
