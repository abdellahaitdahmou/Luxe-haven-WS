-- Migration 22: Add message_type for Airbnb-style messaging
-- Differentiates regular messages from reservation requests

ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'message'
    CHECK (message_type IN ('message', 'reservation_request'));

-- Allow message senders to update their own messages (not needed, but good practice)
-- RLS already covers update for read status.

NOTIFY pgrst, 'reload config';
