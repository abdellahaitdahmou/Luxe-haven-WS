"use client";

import { useEffect, useRef, useState, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { sendMessage, markAsRead } from "@/app/actions/messages";
import { updateBookingStatus } from "@/app/actions/bookings";
import { Button } from "@/components/ui/button";
import {
    Send, ArrowLeft, MapPin, BedDouble,
    CalendarCheck, MessageCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { toast } from "sonner";

const DEFAULT_PROPERTY_IMAGE = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80";

type MessageType = "message" | "reservation_request";

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    is_read: boolean;
    message_type?: MessageType;
    booking_id?: string;
}

interface PropertyData {
    id?: string;
    title: string;
    image_urls?: string[] | null;
    images?: any[] | null;
    price_per_night?: number | null;
    city?: string | null;
    address?: string | null;
}

interface ChatWindowProps {
    conversationId: string;
    initialMessages: Message[];
    currentUserId: string;
    isOwner: boolean;
    otherUser: { full_name: string; avatar_url: string } | null;
    property: PropertyData | null;
}

export function ChatWindow({
    conversationId,
    initialMessages,
    currentUserId,
    isOwner,
    otherUser,
    property,
}: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [bookingStatuses, setBookingStatuses] = useState<Record<string, string>>({});
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showPropertyCard, setShowPropertyCard] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();
    const router = useRouter();
    const [, startTransition] = useTransition();

    const [optimisticMessages, addOptimisticMessage] = useOptimistic(
        messages,
        (state, newMsg: Message) => [...state, newMsg]
    );

    useEffect(() => { setMessages(initialMessages); }, [initialMessages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [optimisticMessages]);

    // Real-time subscription
    useEffect(() => {
        const channel = supabase
            .channel(`conv-${conversationId}`)
            .on("postgres_changes", {
                event: "INSERT", schema: "public", table: "messages",
                filter: `conversation_id=eq.${conversationId}`,
            }, (payload) => {
                const newMsg = payload.new as Message;
                setMessages(cur => cur.find(m => m.id === newMsg.id) ? cur : [...cur, newMsg]);
                if (newMsg.sender_id !== currentUserId) markAsRead(conversationId);
            })
            .subscribe();

        markAsRead(conversationId);
        return () => { supabase.removeChannel(channel); };
    }, [conversationId, currentUserId, supabase]);

    // Fetch booking statuses for any reservation requests
    useEffect(() => {
        const fetchStatuses = async () => {
            const bookingIds = [...new Set(messages.map(m => m.booking_id).filter(Boolean))];
            if (bookingIds.length === 0) return;

            const { data, error } = await supabase
                .from('bookings')
                .select('id, status')
                .in('id', bookingIds);

            if (!error && data) {
                const statusMap: Record<string, string> = {};
                data.forEach(b => { statusMap[b.id] = b.status; });
                setBookingStatuses(cur => ({ ...cur, ...statusMap }));
            }
        };
        fetchStatuses();
    }, [messages, supabase]);

    const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
        setActionLoading(bookingId);
        try {
            const result = await updateBookingStatus(bookingId, newStatus as 'confirmed' | 'cancelled');
            if (result.success) {
                toast.success(`Booking ${newStatus === 'confirmed' ? 'accepted' : 'declined'}!`);
                setBookingStatuses(prev => ({ ...prev, [bookingId]: newStatus }));
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to update booking status");
        } finally {
            setActionLoading(null);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isSending) return;
        const content = input.trim();
        setInput("");
        setIsSending(true);

        // useOptimistic updates must be inside startTransition (React 19 requirement)
        startTransition(() => {
            addOptimisticMessage({
                id: `temp-${Date.now()}`,
                content,
                sender_id: currentUserId,
                created_at: new Date().toISOString(),
                is_read: false,
                message_type: "message",
            });
        });

        try {
            await sendMessage(conversationId, content, "message");
        } catch (err: any) {
            toast.error(err?.message || "Failed to send message. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    const coverImage = property?.images?.[0]?.url || property?.image_urls?.[0] || null;

    return (
        <div className="flex flex-col h-full">
            {/* ── Top bar ── */}
            <div className="shrink-0 flex items-center gap-4 px-4 py-3 border-b border-[var(--card-border)] bg-[var(--surface-100)]/80 backdrop-blur-md">
                <Button
                    variant="ghost" size="icon"
                    className="md:hidden shrink-0 text-[var(--muted-text)] hover:text-[var(--page-text)]"
                    onClick={() => router.push("/dashboard/messages")}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>

                {/* Avatar Group */}
                <div className="relative shrink-0 w-[42px] h-[42px]">
                    {/* Main Property Image (Rounded square) */}
                    <div className="w-full h-full rounded-lg overflow-hidden bg-[var(--surface-200)] border border-[var(--card-border)] flex items-center justify-center shadow-sm">
                        <img
                            src={coverImage || DEFAULT_PROPERTY_IMAGE}
                            alt={property?.title || "Property"}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Overlapping User Avatar (Bottom Right) */}
                    <div className="absolute -bottom-1.5 -right-1.5 rounded-full border-2 border-[var(--card-bg)] bg-[var(--surface-100)] shadow-sm z-10">
                        <Avatar className="w-[20px] h-[20px]">
                            <AvatarImage src={otherUser?.avatar_url} />
                            <AvatarFallback className="bg-yellow-500 text-black font-bold text-[8px]">
                                {otherUser?.full_name?.[0] ?? "?"}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--page-text)] text-sm truncate leading-tight">
                        {otherUser?.full_name ?? (isOwner ? "Guest" : "Host")}
                    </p>
                    {property && (
                        <p className="text-xs text-yellow-400 truncate">
                            {property.title}
                        </p>
                    )}
                </div>
            </div>

            {/* ── Property card (collapsible) ── */}
            {property && (
                <div className="shrink-0 border-b border-[var(--card-border)]">
                    <button
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-100)] transition text-left"
                        onClick={() => setShowPropertyCard(v => !v)}
                    >
                        <img
                            src={coverImage || DEFAULT_PROPERTY_IMAGE}
                            alt={property.title || "Property"}
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[var(--card-border)]"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[var(--page-text)] text-sm truncate">{property.title}</p>
                            {property.city && (
                                <p className="text-xs text-[var(--muted-text)] flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    {property.city}
                                </p>
                            )}
                            {property.price_per_night && (
                                <p className="text-xs text-yellow-400 font-semibold mt-0.5">
                                    ${property.price_per_night.toLocaleString()}
                                    <span className="text-[var(--muted-text)] font-normal"> / night</span>
                                </p>
                            )}
                        </div>
                        <div className="text-[var(--muted-text)] shrink-0">
                            {showPropertyCard ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                    </button>

                    {showPropertyCard && property.id && (
                        <div className="px-4 pb-3 flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-xs border-[var(--card-border)] text-[var(--muted-text)] hover:bg-[var(--surface-100)]"
                                onClick={() => router.push(`/properties/${property.id}`)}
                            >
                                View Listing
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Messages ── */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {optimisticMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center space-y-2">
                        <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-6 h-6 text-yellow-500" />
                        </div>
                        <p className="text-[var(--muted-text)] text-sm">No messages yet</p>
                        <p className="text-gray-600 text-xs">
                            {isOwner
                                ? "Wait for a message from the guest."
                                : "Send a message or a reservation request below."}
                        </p>
                    </div>
                )}

                {optimisticMessages.map((msg) => {
                    const isMe = msg.sender_id === currentUserId;
                    const isRequest = msg.message_type === "reservation_request";
                    const bookingStatus = msg.booking_id ? bookingStatuses[msg.booking_id] : null;

                    if (isRequest) {
                        return (
                            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl overflow-hidden border shadow-lg ${isMe ? "border-yellow-500/40" : "border-[var(--card-border)] bg-[var(--surface-100)]"}`}>
                                    {/* Reservation request header */}
                                    <div className={`flex items-center justify-between px-4 py-2 text-xs font-semibold ${isMe ? "bg-yellow-500 text-black" : "bg-yellow-500/20 text-yellow-400"}`}>
                                        <div className="flex items-center gap-2">
                                            <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
                                            Reservation Request
                                        </div>
                                        {bookingStatus && (
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider ${bookingStatus === 'confirmed' ? 'bg-green-500 text-white' :
                                                bookingStatus === 'cancelled' ? 'bg-red-500 text-white' :
                                                    'bg-yellow-500 text-black'
                                                }`}>
                                                {bookingStatus}
                                            </span>
                                        )}
                                    </div>

                                    {/* Dual-Image Display (Airbnb-style) */}
                                    <div className="relative px-4 py-4 bg-[var(--surface-100)] flex justify-center">
                                        <div className="relative">
                                            {/* Property Cover Photo */}
                                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-[var(--card-border)] shadow-md">
                                                <img
                                                    src={coverImage || DEFAULT_PROPERTY_IMAGE}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {/* Guest Avatar (Overlapping) */}
                                            <div className="absolute -bottom-2 -right-2 rounded-full border-4 border-[var(--surface-100)] bg-[var(--surface-100)] shadow-xl z-20">
                                                <Avatar className="w-12 h-12 md:w-16 md:h-16">
                                                    <AvatarImage src={isMe ? undefined : otherUser?.avatar_url} />
                                                    <AvatarFallback className="bg-yellow-500 text-black font-bold text-lg">
                                                        {(isMe ? "M" : otherUser?.full_name?.[0]) ?? "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Property mini-info */}
                                    {property && (
                                        <div className="px-4 py-2 border-t border-[var(--card-border)] bg-[var(--surface-200)]/30">
                                            <p className="text-xs text-[var(--page-text)] font-semibold truncate">{property.title}</p>
                                            {property.price_per_night && (
                                                <p className="text-[10px] text-[var(--muted-text)]">${property.price_per_night.toLocaleString()} / night</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Message body */}
                                    <div className="px-4 py-3 bg-[var(--surface-100)]/50 border-t border-[var(--card-border)]">
                                        <p className="text-sm text-[var(--page-text)] leading-relaxed italic">"{msg.content}"</p>

                                        {/* Host controls */}
                                        {isOwner && bookingStatus === 'pending' && msg.booking_id && (
                                            <div className="mt-4 flex gap-2">
                                                <Button
                                                    size="sm"
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9"
                                                    disabled={actionLoading === msg.booking_id}
                                                    onClick={() => handleUpdateBookingStatus(msg.booking_id!, 'confirmed')}
                                                >
                                                    {actionLoading === msg.booking_id ? "..." : "Accept"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10 h-9"
                                                    disabled={actionLoading === msg.booking_id}
                                                    onClick={() => handleUpdateBookingStatus(msg.booking_id!, 'cancelled')}
                                                >
                                                    Decline
                                                </Button>
                                            </div>
                                        )}

                                        <p className="text-[10px] text-[var(--muted-text)] mt-3 text-right">
                                            {format(new Date(msg.created_at), "h:mm a")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // Regular message bubble
                    return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-3 shadow-sm border ${isMe ? "bg-yellow-500 text-black border-yellow-500 rounded-tr-none" : "bg-[var(--surface-100)] text-[var(--page-text)] border-[var(--card-border)] rounded-tl-none"}`}>
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                <div className={`text-[10px] mt-1 text-right ${isMe ? "text-black/60" : "text-[var(--muted-text)]"}`}>
                                    {format(new Date(msg.created_at), "h:mm a")}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Input area ── */}
            <div className="shrink-0 border-t border-[var(--card-border)] bg-[var(--surface-100)]/80 backdrop-blur-md">

                <form onSubmit={handleSend} className="flex items-end gap-2 p-3">
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as any); } }}
                        placeholder="Type a message…"
                        rows={1}
                        disabled={isSending}
                        className="flex-1 resize-none bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--page-text)] placeholder:text-[var(--muted-text)] focus:outline-none focus:border-yellow-500/50 transition disabled:opacity-50"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || isSending}
                        className="shrink-0 rounded-xl w-10 h-10 bg-yellow-500 hover:bg-yellow-400 text-black disabled:opacity-40"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>

            </div>
        </div>
    );
}
