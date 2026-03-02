-- 32_add_booking_id_to_messages.sql

-- Add booking_id to messages to link them to specific reservations
ALTER TABLE messages ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;

-- Update the send_message function to accept booking_id
CREATE OR REPLACE FUNCTION send_message(
    p_conversation_id UUID,
    p_content TEXT,
    p_message_type TEXT DEFAULT 'message',
    p_booking_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_message_id UUID;
    v_sender_id UUID;
BEGIN
    v_sender_id := auth.uid();
    
    INSERT INTO messages (
        conversation_id,
        sender_id,
        content,
        message_type,
        booking_id
    )
    VALUES (
        p_conversation_id,
        v_sender_id,
        p_content,
        p_message_type,
        p_booking_id
    )
    RETURNING id INTO v_message_id;

    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
