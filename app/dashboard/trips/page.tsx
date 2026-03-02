"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Loader2, MapPin, Calendar, Moon, MessageCircle,
    Clock, CheckCircle2, XCircle, Building2, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import { format, differenceInCalendarDays } from "date-fns";

type Tab = "pending" | "upcoming" | "past" | "cancelled";

function statusBadge(status: string) {
    const map: Record<string, string> = {
        confirmed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
        pending: "bg-amber-500/20 text-amber-400 border-amber-500/40",
        cancelled: "bg-red-500/20 text-red-400 border-red-500/40",
        completed: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    };
    return map[status] ?? "bg-white/10 text-white/60 border-white/10";
}

function statusIcon(status: string) {
    if (status === "confirmed") return <CheckCircle2 className="w-3.5 h-3.5" />;
    if (status === "pending") return <Clock className="w-3.5 h-3.5" />;
    if (status === "cancelled") return <XCircle className="w-3.5 h-3.5" />;
    return null;
}

export default function TripsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>("upcoming");
    const [cancelLoading, setCancelLoading] = useState<string | null>(null);

    async function fetchTrips() {
        setLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data, error } = await supabase
            .from("bookings")
            .select("*, properties(id, title, image_urls, price_per_night, owner_id, address)")
            .eq("guest_id", user.id)
            .order("check_in_date", { ascending: false });

        if (error) {
            console.error("Trips fetch error:", error.message, error.details, error.hint);
            toast.error("Failed to load your trips.");
        }
        setBookings(data || []);
        setLoading(false);
    }

    useEffect(() => { fetchTrips(); }, []);

    const now = new Date();

    const filtered = bookings.filter(b => {
        const out = new Date(b.check_out_date);
        const inp = new Date(b.check_in_date);
        if (tab === "cancelled") return b.status === "cancelled";
        if (tab === "pending") return b.status === "pending";
        if (tab === "past") return out < now && b.status !== "cancelled" && b.status !== "pending";
        // upcoming = confirmed + check-out in future
        return inp >= now || (out >= now && b.status === "confirmed");
    });

    const pendingCount = bookings.filter(b => b.status === "pending").length;

    const handleCancel = async (bookingId: string) => {
        if (!confirm("Are you sure you want to cancel this booking request?")) return;
        setCancelLoading(bookingId);
        const supabase = createClient();
        const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
        if (error) toast.error("Failed to cancel booking");
        else {
            toast.success("Booking cancelled");
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "cancelled" } : b));
        }
        setCancelLoading(null);
    };

    const TABS: { key: Tab; label: string }[] = [
        { key: "upcoming", label: "Upcoming" },
        { key: "pending", label: pendingCount > 0 ? `Pending (${pendingCount})` : "Pending" },
        { key: "past", label: "Past" },
        { key: "cancelled", label: "Cancelled" },
    ];

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-gold-500" />
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-1">My Trips</h1>
                <p className="text-[var(--muted-text)]">Track your reservations and past stays.</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--card-border)]">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${tab === t.key
                            ? t.key === "pending"
                                ? "border-amber-500 text-amber-400"
                                : "border-gold-500 text-gold-500"
                            : "border-transparent text-[var(--muted-text)] hover:text-[var(--page-text)]"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Pending info banner */}
            {tab === "pending" && pendingCount > 0 && (
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm text-amber-300">
                    <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>These bookings are awaiting host approval. You'll be notified once the host responds.</span>
                </div>
            )}

            {/* Cards */}
            <div className="space-y-4">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl">
                        <Building2 className="w-12 h-12 text-[var(--muted-text)]/30 mb-3" />
                        <h3 className="font-bold text-lg mb-1">No {tab} trips</h3>
                        <p className="text-[var(--muted-text)] text-sm text-center max-w-xs mb-5">
                            {tab === "upcoming" && "Book a property to see your upcoming trips here."}
                            {tab === "pending" && "No pending requests right now."}
                            {tab === "past" && "Your completed stays will appear here."}
                            {tab === "cancelled" && "No cancelled bookings yet."}
                        </p>
                        {tab === "upcoming" && (
                            <Link href="/properties">
                                <Button className="bg-gold-500 text-black hover:bg-gold-400 font-bold">
                                    Explore Properties <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : filtered.map(booking => {
                    const checkIn = new Date(booking.check_in_date);
                    const checkOut = new Date(booking.check_out_date);
                    const nights = Math.max(differenceInCalendarDays(checkOut, checkIn), 1);
                    const cover = booking.properties?.image_urls?.[0] ?? null;
                    const isPast = checkOut < now;

                    return (
                        <div
                            key={booking.id}
                            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden hover:border-gold-500/30 transition-all group"
                        >
                            <div className="flex flex-col sm:flex-row">
                                {/* Cover image */}
                                <div className="relative w-full sm:w-52 h-44 sm:h-auto shrink-0">
                                    {cover ? (
                                        <img src={cover} alt={booking.properties?.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gold-900/30 to-black/50 flex items-center justify-center">
                                            <Building2 className="w-10 h-10 text-gold-500/30" />
                                        </div>
                                    )}
                                    {/* Status badge over image */}
                                    <div className="absolute top-3 left-3">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border backdrop-blur-sm ${statusBadge(booking.status)}`}>
                                            {statusIcon(booking.status)}
                                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                                    <div>
                                        {/* Title + price */}
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-lg leading-tight truncate">
                                                    {booking.properties?.title ?? "Property"}
                                                </h3>
                                                {booking.properties?.address && (
                                                    <p className="text-[var(--muted-text)] text-sm flex items-center gap-1 mt-0.5">
                                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                        {booking.properties.address}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-bold text-gold-500 text-lg">${booking.total_price}</p>
                                                <p className="text-xs text-[var(--muted-text)]">total</p>
                                            </div>
                                        </div>

                                        {/* Stay period */}
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="flex items-center gap-2 bg-[var(--page-bg)] rounded-lg px-3 py-2">
                                                <Calendar className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                                                <div>
                                                    <p className="text-[10px] text-[var(--muted-text)] uppercase tracking-wide leading-none mb-0.5">Check-in</p>
                                                    <p className="font-semibold text-xs">{format(checkIn, "MMM d, yyyy")}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 bg-[var(--page-bg)] rounded-lg px-3 py-2">
                                                <Calendar className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                                                <div>
                                                    <p className="text-[10px] text-[var(--muted-text)] uppercase tracking-wide leading-none mb-0.5">Check-out</p>
                                                    <p className="font-semibold text-xs">{format(checkOut, "MMM d, yyyy")}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-xs text-[var(--muted-text)] mt-2 flex items-center gap-1">
                                            <Moon className="w-3.5 h-3.5" />
                                            {nights} night{nights !== 1 ? "s" : ""} · ${booking.properties?.price_per_night}/night
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-wrap items-center justify-end gap-2 mt-4 pt-4 border-t border-[var(--card-border)]">
                                        {/* Message host */}
                                        <Link href="/dashboard/messages">
                                            <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 text-[var(--muted-text)] text-xs">
                                                <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> Message Host
                                            </Button>
                                        </Link>

                                        {/* View property */}
                                        {booking.properties?.id && (
                                            <Link href={`/properties/${booking.properties.id}`}>
                                                <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 text-[var(--muted-text)] text-xs">
                                                    View Listing
                                                </Button>
                                            </Link>
                                        )}

                                        {/* Review (past stays) */}
                                        {isPast && booking.status !== "cancelled" && (
                                            <ReviewModal
                                                bookingId={booking.id}
                                                propertyName={booking.properties?.title}
                                                type="property"
                                                targetId={booking.properties?.id}
                                            />
                                        )}

                                        {/* Cancel (only pending or upcoming confirmed) */}
                                        {(booking.status === "pending" || (booking.status === "confirmed" && !isPast)) && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={cancelLoading === booking.id}
                                                onClick={() => handleCancel(booking.id)}
                                                className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                                            >
                                                {cancelLoading === booking.id
                                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                                    : <XCircle className="w-3.5 h-3.5 mr-1" />
                                                }
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
