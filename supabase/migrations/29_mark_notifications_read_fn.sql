-- Migration 29: Clear notifications by link
-- Adds a function to mark notifications as read when a user views a specific page.

CREATE OR REPLACE FUNCTION public.mark_notifications_read_by_link(p_link TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE notifications 
    SET is_read = TRUE 
    WHERE user_id = auth.uid() 
      AND link = p_link
      AND is_read = FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_notifications_read_by_link(TEXT) TO authenticated;
