"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { sendNewMessageEmail } from "@/lib/email";

export async function getConversations() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // Use SECURITY DEFINER RPC to bypass RLS on conversations SELECT
    const { data: rows, error } = await supabase.rpc('get_conversations');

    if (error || !rows || rows.length === 0) {
        if (error) console.error("Error fetching conversations:", JSON.stringify(error));
        return [];
    }

    // Batch-fetch all unique profile IDs and property IDs
    const profileIds = [...new Set(rows.flatMap((c: { guest_id: string; owner_id: string }) => [c.guest_id, c.owner_id]).filter(Boolean))];
    const propertyIds = [...new Set(rows.map((c: { property_id: string }) => c.property_id).filter(Boolean))];
    const conversationIds = rows.map((c: any) => c.id);

    const [profilesRes, propertiesRes, unreadRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, avatar_url').in('id', profileIds),
        supabase.from('properties').select('id, title').in('id', propertyIds),
        supabase.from('messages')
            .select('conversation_id')
            .in('conversation_id', conversationIds)
            .eq('is_read', false)
            .neq('sender_id', user.id),
    ]);

    const profileMap: Record<string, { id: string, full_name: string | null, avatar_url: string | null }> = {};
    (profilesRes.data || []).forEach(p => { profileMap[p.id] = p; });

    const propertyMap: Record<string, { id: string, title: string }> = {};
    (propertiesRes.data || []).forEach(p => { propertyMap[p.id] = p; });

    const unreadCounts: Record<string, number> = {};
    (unreadRes.data || []).forEach(msg => {
        unreadCounts[msg.conversation_id] = (unreadCounts[msg.conversation_id] || 0) + 1;
    });

    return rows.map((conv: any) => {
        const isOwner = conv.owner_id === user.id;
        const guest = profileMap[conv.guest_id] || null;
        const owner = profileMap[conv.owner_id] || null;
        const otherUser = isOwner ? guest : owner;
        return {
            ...conv,
            property: propertyMap[conv.property_id] || null,
            guest,
            owner,
            otherUser,
            isOwner,
            unreadCount: unreadCounts[conv.id] || 0,
        };
    });
}



export async function getMessages(conversationId: string) {
    const supabase = await createClient();

    const { data: rows, error } = await supabase
        .rpc('get_messages', { p_conversation_id: conversationId });

    if (error) {
        console.error("Error fetching messages:", JSON.stringify(error));
        return [];
    }

    // Map msg_ prefixed columns back to original names for the UI
    return (rows || []).map((m: {
        msg_id: string;
        msg_conversation_id: string;
        msg_sender_id: string;
        msg_content: string;
        msg_is_read: boolean;
        msg_type: string;
        msg_created_at: string;
    }) => ({
        id: m.msg_id,
        conversation_id: m.msg_conversation_id,
        sender_id: m.msg_sender_id,
        content: m.msg_content,
        is_read: m.msg_is_read,
        message_type: m.msg_type,
        created_at: m.msg_created_at
    }));
}

export async function getConversation(conversationId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Use SECURITY DEFINER RPC to bypass RLS for the SELECT.
    // The function validates auth.uid() = guest_id OR owner_id internally.
    const { data: rows, error } = await supabase
        .rpc('get_conversation', { p_conversation_id: conversationId });

    if (error || !rows || rows.length === 0) {
        console.error("Error fetching conversation:", JSON.stringify(error));
        return null;
    }

    const conv = rows[0];

    // Fetch profiles and property separately (avoids PostgREST ambiguous FK join)
    const [guestRes, ownerRes, propertyRes] = await Promise.all([
        supabase.from('profiles').select('full_name, avatar_url, email').eq('id', conv.guest_id).single(),
        supabase.from('profiles').select('full_name, avatar_url, email').eq('id', conv.owner_id).single(),
        supabase.from('properties').select('id, title, image_urls, price_per_night, city, address').eq('id', conv.property_id).single(),
    ]);

    const guest = guestRes.data;
    const owner = ownerRes.data;
    const property = propertyRes.data;

    const isOwner = conv.owner_id === user.id;
    const otherUser = isOwner ? guest : owner;

    return {
        ...conv,
        property,
        guest,
        owner,
        otherUser,
        isOwner,
    };
}



export async function sendMessage(
    conversationId: string,
    content: string,
    messageType: 'message' | 'reservation_request' = 'message'
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Use SECURITY DEFINER RPC to bypass RLS on messages INSERT
    // (the messages INSERT policy does a subquery on conversations, also RLS-blocked)
    const { error } = await supabase
        .rpc('send_message', {
            p_conversation_id: conversationId,
            p_content: content,
            p_message_type: messageType,
        });

    if (error) {
        console.error("Error sending message:", JSON.stringify(error));
        throw new Error(error.message || "Failed to send message");
    }

    // --- Notifications & Emails (Non-blocking) ---
    try {
        const conversation = await getConversation(conversationId);
        if (conversation) {
            const recipientId = conversation.isOwner ? conversation.guest_id : conversation.owner_id;
            const recipient = conversation.isOwner ? conversation.guest : conversation.owner;
            const senderName = conversation.isOwner ? conversation.owner?.full_name : conversation.guest?.full_name;
            const propertyName = conversation.property?.title || "Property";

            console.log(`[DEBUG] Sender: ${user.id}, Recipient: ${recipientId}, senderName: ${senderName}`);

            // 1. Dashboard Notification
            const { error: notifError } = await supabase.rpc('create_notification', {
                p_user_id: recipientId,
                p_type: 'message',
                p_title: `New message from ${senderName || 'User'}`,
                p_content: content.length > 50 ? content.substring(0, 47) + '...' : content,
                p_link: `/dashboard/messages/${conversationId}`
            });

            if (notifError) {
                console.error("RPC create_notification error:", JSON.stringify(notifError));
            }

            // 2. Email Notification (to host's Gmail - if sender is guest)
            if (recipient?.email) {
                console.log(`Attempting to send email alert to ${recipient.email}...`);
                const emailResult = await sendNewMessageEmail({
                    to: recipient.email,
                    recipientName: recipient.full_name || 'User',
                    senderName: senderName || 'User',
                    propertyName: propertyName,
                    messageContent: content,
                    chatLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/messages/${conversationId}`
                });

                if (!emailResult.success) {
                    console.error("Email send failed:", emailResult.error);
                } else {
                    console.log("Email sent successfully!");
                }
            }
        }
    } catch (alertError) {
        console.error("Failed to trigger notifications/emails:", alertError);
    }

    revalidatePath(`/dashboard/messages/${conversationId}`);
    return { success: true };
}

export async function startConversation(propertyId: string, ownerId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    // Use a SECURITY DEFINER RPC function to bypass RLS safely.
    // The function uses auth.uid() server-side so the guest_id cannot be faked.
    const { data: conversationId, error } = await supabase
        .rpc('start_conversation', {
            p_property_id: propertyId,
            p_owner_id: ownerId,
        });

    if (error) {
        console.error("Error creating conversation:", error);
        return { error: error.message || "Failed to create conversation" };
    }

    revalidatePath('/dashboard/messages');
    return { conversationId: conversationId as string };
}

export async function markAsRead(conversationId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Use SECURITY DEFINER RPC to bypass RLS on messages UPDATE
    await supabase.rpc('mark_messages_read', { p_conversation_id: conversationId });

    // Also clear notifications for this conversation
    await supabase.rpc('mark_notifications_read_by_link', {
        p_link: `/dashboard/messages/${conversationId}`
    });

    revalidatePath(`/dashboard/messages`);
}
