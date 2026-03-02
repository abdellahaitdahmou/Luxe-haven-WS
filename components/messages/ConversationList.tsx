"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Search, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

const DEFAULT_PROPERTY_IMAGE = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80";

interface Conversation {
    id: string;
    last_message_at: string;
    property: { title: string; image_urls?: string[] | null; images?: any[] | null; city?: string | null } | null;
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
        <div className="flex flex-col h-full bg-[var(--surface-50)] border-r border-[var(--card-border)] w-full md:w-80 lg:w-96">
            {/* Header */}
            <div className="p-4 border-b border-[var(--card-border)] space-y-3">
                <h2 className="text-xl font-bold text-[var(--page-text)]">Messages</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-text)]" />
                    <Input
                        placeholder="Search…"
                        className="pl-9 bg-[var(--surface-100)] border-[var(--card-border)] text-[var(--page-text)] placeholder-[var(--muted-text)]"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-3">
                        <div className="w-12 h-12 bg-[var(--surface-100)] rounded-full flex items-center justify-center">
                            <MessageCircle className="w-6 h-6 text-[var(--muted-text)]" />
                        </div>
                        <p className="text-[var(--muted-text)] text-sm font-medium">No conversations yet</p>
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
                                className={`block p-4 border-b border-[var(--card-border)] transition hover:bg-[var(--surface-100)] ${isActive ? "bg-[var(--surface-100)] border-l-2 border-l-yellow-500" : ""}`}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Avatar Group */}
                                    <div className="relative shrink-0 w-[52px] h-[52px]">
                                        {/* Main Property Image (Rounded square) */}
                                        <div className="w-full h-full rounded-xl overflow-hidden bg-[var(--surface-200)] border border-[var(--card-border)] flex items-center justify-center shadow-sm">
                                            <img
                                                src={conv.property?.images?.[0]?.url || conv.property?.image_urls?.[0] || DEFAULT_PROPERTY_IMAGE}
                                                alt={conv.property?.title || "Property"}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Overlapping User Avatars (Bottom Right) */}
                                        {/* Back Avatar (Platform/Host placeholder) */}
                                        <div className="absolute -bottom-1 -right-0.5 rounded-full border-2 border-[var(--card-bg)] bg-[var(--surface-200)] shadow-sm z-0">
                                            <Avatar className="w-[20px] h-[20px]">
                                                <AvatarFallback className="bg-[var(--surface-100)] text-[var(--muted-text)] font-bold text-[8px]">
                                                    LH
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>

                                        {/* Front Avatar (Other User) */}
                                        <div className="absolute -bottom-1.5 -right-3.5 rounded-full border-2 border-[var(--card-bg)] bg-[var(--surface-100)] shadow-sm z-10">
                                            <Avatar className="w-6 h-6">
                                                <AvatarImage src={conv.otherUser?.avatar_url ?? ""} />
                                                <AvatarFallback className="bg-yellow-500 text-black font-bold text-[10px]">
                                                    {conv.otherUser?.full_name?.[0] ?? "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>

                                        {/* Unread dot floating */}
                                        {hasUnread && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-[var(--card-bg)] shadow-sm" />
                                        )}
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center ml-2 space-y-[2px]">
                                        {/* Line 1: Name & Time */}
                                        <div className="flex justify-between items-center">
                                            <span className={`text-[13.5px] truncate ${hasUnread ? "text-[var(--page-text)] font-semibold" : "text-[var(--page-text)] font-medium"}`}>
                                                {conv.otherUser?.full_name ?? "Unknown User"}
                                            </span>
                                            {conv.last_message_at && (
                                                <span className="text-[10px] text-[var(--muted-text)] whitespace-nowrap ml-2 shrink-0 font-medium tracking-wide">
                                                    {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false }).replace("about ", "")}
                                                </span>
                                            )}
                                        </div>
                                        {/* Line 2: Message/Update Preview */}
                                        <p className={`text-[12px] truncate ${hasUnread ? "text-[var(--page-text)] font-semibold" : "text-[var(--muted-text)]"}`}>
                                            {hasUnread ? `New message${conv.unreadCount! > 1 ? "s" : ""} - Tap to view` : "Message thread - Tap to open chat"}
                                        </p>
                                        {/* Line 3: Property Details */}
                                        <p className="text-[11.5px] truncate text-[var(--muted-text)] font-medium opacity-80">
                                            {conv.property?.city ? `${conv.property.city} · ` : ""}{conv.property?.title ?? "Property Inquiry"}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
