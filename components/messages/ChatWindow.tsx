"use client";

import { useEffect, useRef, useState, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { sendMessage, markAsRead } from "@/app/actions/messages";
import { Button } from "@/components/ui/button";
import {
    Send, ArrowLeft, MapPin, BedDouble,
    CalendarCheck, MessageCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { toast } from "sonner";

type MessageType = "message" | "reservation_request";

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    is_read: boolean;
    message_type?: MessageType;
}

interface PropertyData {
    id?: string;
    title: string;
    image_urls?: string[] | null;
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
    const [mode, setMode] = useState<MessageType>("message");
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
                message_type: mode,
            });
        });

        try {
            await sendMessage(conversationId, content, mode);
        } catch (err: any) {
            toast.error(err?.message || "Failed to send message. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    const coverImage = property?.image_urls?.[0] ?? null;

    return (
        <div className="flex flex-col h-full">
            {/* ── Top bar ── */}
            <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/60 backdrop-blur-md">
                <Button
                    variant="ghost" size="icon"
                    className="md:hidden shrink-0 text-gray-400 hover:text-white"
                    onClick={() => router.push("/dashboard/messages")}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="shrink-0 border border-white/10">
                    <AvatarImage src={otherUser?.avatar_url} />
                    <AvatarFallback className="bg-yellow-500 text-black font-bold">
                        {otherUser?.full_name?.[0] ?? "?"}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate leading-tight">
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
                <div className="shrink-0 border-b border-white/10">
                    <button
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition text-left"
                        onClick={() => setShowPropertyCard(v => !v)}
                    >
                        {coverImage && (
                            <img
                                src={coverImage}
                                alt={property.title}
                                className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/10"
                            />
                        )}
                        {!coverImage && (
                            <div className="w-14 h-14 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0 border border-white/10">
                                <BedDouble className="w-6 h-6 text-yellow-500" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm truncate">{property.title}</p>
                            {property.city && (
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    {property.city}
                                </p>
                            )}
                            {property.price_per_night && (
                                <p className="text-xs text-yellow-400 font-semibold mt-0.5">
                                    ${property.price_per_night.toLocaleString()}
                                    <span className="text-gray-500 font-normal"> / night</span>
                                </p>
                            )}
                        </div>
                        <div className="text-gray-500 shrink-0">
                            {showPropertyCard ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                    </button>

                    {showPropertyCard && property.id && (
                        <div className="px-4 pb-3 flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-xs border-white/20 text-gray-300 hover:bg-white/10"
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
                        <p className="text-gray-400 text-sm">No messages yet</p>
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

                    if (isRequest) {
                        return (
                            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] md:max-w-[65%] rounded-2xl overflow-hidden border shadow-lg ${isMe ? "border-yellow-500/40" : "border-white/10"}`}>
                                    {/* Reservation request header */}
                                    <div className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold ${isMe ? "bg-yellow-500 text-black" : "bg-yellow-500/20 text-yellow-400"}`}>
                                        <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
                                        Reservation Request
                                    </div>
                                    {/* Property mini-card */}
                                    {property && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border-b border-white/5">
                                            {coverImage && (
                                                <img src={coverImage} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-xs text-white font-medium truncate">{property.title}</p>
                                                {property.price_per_night && (
                                                    <p className="text-[10px] text-yellow-400">${property.price_per_night.toLocaleString()} / night</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {/* Message body */}
                                    <div className={`px-4 py-3 ${isMe ? "bg-yellow-500/10" : "bg-white/5"}`}>
                                        <p className="text-sm text-white leading-relaxed">{msg.content}</p>
                                        <p className="text-[10px] text-gray-500 mt-1 text-right">
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
                            <div className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-3 shadow-md border border-white/5 ${isMe ? "bg-yellow-500 text-black rounded-tr-none" : "bg-white/10 text-white rounded-tl-none"}`}>
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                <div className={`text-[10px] mt-1 text-right ${isMe ? "text-black/60" : "text-gray-400"}`}>
                                    {format(new Date(msg.created_at), "h:mm a")}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Input area ── */}
            <div className="shrink-0 border-t border-white/10 bg-black/60 backdrop-blur-md">
                {/* Mode switcher — only shown for guests */}
                {!isOwner && (
                    <div className="flex border-b border-white/5">
                        <button
                            onClick={() => setMode("message")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition ${mode === "message" ? "text-white border-b-2 border-yellow-500" : "text-gray-500 hover:text-gray-300"}`}
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Message
                        </button>
                        <button
                            onClick={() => setMode("reservation_request")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition ${mode === "reservation_request" ? "text-yellow-400 border-b-2 border-yellow-500" : "text-gray-500 hover:text-gray-300"}`}
                        >
                            <CalendarCheck className="w-3.5 h-3.5" />
                            Reservation Request
                        </button>
                    </div>
                )}

                <form onSubmit={handleSend} className="flex items-end gap-2 p-3">
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as any); } }}
                        placeholder={
                            mode === "reservation_request"
                                ? "Describe your stay — dates, number of guests, special requests…"
                                : "Type a message…"
                        }
                        rows={mode === "reservation_request" ? 3 : 1}
                        disabled={isSending}
                        className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500/50 transition disabled:opacity-50"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || isSending}
                        className={`shrink-0 rounded-xl w-10 h-10 ${mode === "reservation_request" ? "bg-yellow-500 hover:bg-yellow-400" : "bg-yellow-500 hover:bg-yellow-400"} text-black disabled:opacity-40`}
                    >
                        {mode === "reservation_request" ? (
                            <CalendarCheck className="w-4 h-4" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </form>

                {mode === "reservation_request" && (
                    <p className="text-[10px] text-gray-500 text-center pb-2">
                        This will be sent as a reservation request — the host will review it.
                    </p>
                )}
            </div>
        </div>
    );
}
