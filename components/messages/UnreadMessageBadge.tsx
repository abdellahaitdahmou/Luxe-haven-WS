"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { usePathname } from "next/navigation";

export function UnreadMessageBadge() {
    const [count, setCount] = useState(0);
    const supabase = createClient();
    const pathname = usePathname();

    const fetchUnreadCount = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Count messages where I am NOT the sender and is_read is false
        // Complexity: identifying if I am in the conversation.
        // Easiest is to trust messages RLS: "Users can view messages in their conversations"
        // So I can count all messages where sender_id != me and is_read = false

        const { count: unreadCount, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false)
            .neq('sender_id', user.id);

        if (!error && unreadCount !== null) {
            setCount(unreadCount);
        }
    };

    useEffect(() => {
        fetchUnreadCount();

        // Subscribe to changes
        const channel = supabase
            .channel('unread-badge')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'messages' },
                () => {
                    // On any message change, re-fetch count
                    // We could be smarter and increment/decrement, but fetching is safer for consistency
                    fetchUnreadCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [pathname]); // Re-fetch on navigation too, just in case

    if (count === 0) return null;

    return (
        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
            {count > 99 ? '99+' : count}
        </span>
    );
}
