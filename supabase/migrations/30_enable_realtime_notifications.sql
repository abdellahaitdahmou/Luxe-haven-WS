-- Migration 30: Enable Realtime for notifications
-- This allows Supabase to broadcast changes to the notifications table in real-time.

DO $$
BEGIN
    -- 1. Ensure the table has REPLICA IDENTITY FULL for robust real-time tracking
    ALTER TABLE public.notifications REPLICA IDENTITY FULL;

    -- 2. Add the notifications table to the supabase_realtime publication (if not already there)
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'notifications'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
        END IF;
    END IF;
END
$$;
