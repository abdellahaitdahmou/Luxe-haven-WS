"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Search, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Conversation {
    id: string;
    last_message_at: string;
    property: { title: string } | null;
    otherUser: { full_name: string; avatar_url: string } | null;
    isOwner: boolean;
    unreadCount?: number;
}

interface ConversationListProps {
    initialConversations: Conversation[];
    userId: string;
}

export function ConversationList({ initialConversations, userId }: ConversationListProps) {
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
    const [filter, setFilter] = useState("");
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => { setConversations(initialConversations); }, [initialConversations]);

    // Real-time: refresh list when messages come in
    useEffect(() => {
        const channel = supabase
            .channel("conv-list")
            .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
                router.refresh();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [supabase, router]);

    const filtered = conversations.filter(c =>
        (c.otherUser?.full_name ?? "").toLowerCase().includes(filter.toLowerCase()) ||
        (c.property?.title ?? "").toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-black/50 border-r border-white/10 w-full md:w-80 lg:w-96">
            {/* Header */}
            <div className="p-4 border-b border-white/10 space-y-3">
                <h2 className="text-xl font-bold text-white">Messages</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                        placeholder="Search…"
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder-gray-500"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-3">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-6 h-6 text-gray-500" />
                        </div>
                        <p className="text-gray-400 text-sm font-medium">No conversations yet</p>
                        <p className="text-gray-600 text-xs max-w-[180px]">
                            Browse a property and tap <span className="text-yellow-500">Message Host</span> to start chatting.
                        </p>
                    </div>
                ) : (
                    filtered.map(conv => {
                        const isActive = pathname === `/dashboard/messages/${conv.id}`;
                        const hasUnread = (conv.unreadCount ?? 0) > 0;
                        return (
                            <Link
                                key={conv.id}
                                href={`/dashboard/messages/${conv.id}`}
                                className={`block p-4 border-b border-white/5 transition hover:bg-white/5 ${isActive ? "bg-white/10 border-l-2 border-l-yellow-500" : ""}`}
                            >
                                <div className="flex items-start gap-3">
                                    <Avatar className="shrink-0">
                                        <AvatarImage src={conv.otherUser?.avatar_url ?? ""} />
                                        <AvatarFallback className="bg-yellow-500 text-black font-bold text-sm">
                                            {conv.otherUser?.full_name?.[0] ?? "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <span className={`font-semibold text-sm truncate ${hasUnread ? "text-white" : "text-gray-200"}`}>
                                                {conv.otherUser?.full_name ?? "Unknown"}
                                            </span>
                                            {conv.last_message_at && (
                                                <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2 shrink-0">
                                                    {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }).replace("about ", "")}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-yellow-500/80 truncate mb-0.5">
                                            {conv.property?.title ?? "Property"}
                                        </p>
                                        <p className={`text-xs truncate ${hasUnread ? "text-white font-medium" : "text-gray-500"}`}>
                                            {hasUnread ? `${conv.unreadCount} new message${conv.unreadCount! > 1 ? "s" : ""}` : "Tap to open chat"}
                                        </p>
                                    </div>
                                    {hasUnread && (
                                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-1.5 shrink-0" />
                                    )}
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
