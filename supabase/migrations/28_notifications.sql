-- Migration 28: Notifications system
-- Stores dashboard alerts for users.

CREATE TABLE IF NOT EXISTS public.notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type        TEXT NOT NULL, -- 'message', 'booking', 'system'
    title       TEXT NOT NULL,
    content     TEXT,
    link        TEXT, -- URL to navigate to
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- SECURITY DEFINER function to create a notification (to bypass RLS for system-generated alerts)
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_type    TEXT,
    p_title   TEXT,
    p_content TEXT DEFAULT NULL,
    p_link    TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_notif_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, content, link)
    VALUES (p_user_id, p_type, p_title, p_content, p_link)
    RETURNING id INTO v_notif_id;
    
    RETURN v_notif_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- Function to get unread count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (SELECT count(*) FROM notifications WHERE user_id = auth.uid() AND is_read = FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unread_notification_count() TO authenticated;

NOTIFY pgrst, 'reload config';
