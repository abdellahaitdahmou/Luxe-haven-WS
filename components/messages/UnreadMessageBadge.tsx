"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { usePathname } from "next/navigation";

export function UnreadMessageBadge() {
    const [count, setCount] = useState(0);
    const supabase = createClient();
    const pathname = usePathname();

    useEffect(() => {
        let isMounted = true;

        async function fetchUnreadCount() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !isMounted) return;

            const { count: unreadCount, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('is_read', false)
                .neq('sender_id', user.id);

            if (!error && unreadCount !== null && isMounted) {
                setCount(unreadCount);
            }
        }

        fetchUnreadCount();

        const channel = supabase
            .channel('unread-badge')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'messages' },
                () => {
                    fetchUnreadCount();
                }
            )
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [pathname]);

    if (count === 0) return null;

    return (
        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
            {count > 99 ? '99+' : count}
        </span>
    );
}
