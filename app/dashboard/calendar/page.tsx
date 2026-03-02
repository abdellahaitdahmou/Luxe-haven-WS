"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ChevronLeft, ChevronRight, Loader2, Building2, DollarSign,
    CalendarDays, Users, X, ArrowRight,
} from "lucide-react";
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    eachDayOfInterval, isSameDay, isWithinInterval, isToday as dfIsToday,
} from "date-fns";
import { toast } from "sonner";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

type BookingStatus = "confirmed" | "pending" | "cancelled";

const STATUS_STYLES: Record<BookingStatus, string> = {
    confirmed: "bg-emerald-500 text-white",
    pending: "bg-amber-500  text-black",
    cancelled: "bg-red-500/40 text-white/60",
};

const STATUS_DOT: Record<BookingStatus, string> = {
    confirmed: "bg-emerald-500",
    pending: "bg-amber-500",
    cancelled: "bg-red-500/50",
};

function getStyle(date: Date, booking: any): string | null {
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    const last = new Date(checkOut); last.setDate(last.getDate() - 1);

    const inRange = isWithinInterval(date, { start: checkIn, end: last });
    if (!inRange) return null;

    const isStart = isSameDay(date, checkIn);
    const isEnd = isSameDay(date, last);
    const status = (booking.status ?? "pending") as BookingStatus;
    const base = `absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 flex items-center cursor-pointer transition hover:brightness-110 ${STATUS_STYLES[status]} `;

    if (isStart && isEnd) return base + "rounded-lg mx-1";
    if (isStart) return base + "rounded-l-lg ml-1 pr-0";
    if (isEnd) return base + "rounded-r-lg mr-1 pl-0";
    return base;
}

/* ─── Booking Detail Panel ──────────────────────────────────────────────────── */
function BookingPanel({ booking, onClose }: { booking: any; onClose: () => void }) {
    if (!booking) return null;
    const status = (booking.status ?? "pending") as BookingStatus;
    const nights = Math.ceil(
        (new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / 86_400_000
    );

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end pointer-events-none">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={onClose} />

            {/* Panel */}
            <div className="relative pointer-events-auto w-full sm:w-96 sm:h-full sm:max-h-screen bg-[var(--card-bg)] border-l border-[var(--card-border)] shadow-2xl flex flex-col rounded-t-2xl sm:rounded-none overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[var(--card-border)]">
                    <h2 className="font-bold text-lg">Booking Details</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Guest */}
                    <div className="flex items-center gap-4 bg-[var(--page-bg)] rounded-xl p-4">
                        <Avatar className="w-12 h-12 border-2 border-[var(--card-border)]">
                            <AvatarImage src={booking.profiles?.avatar_url} />
                            <AvatarFallback className="bg-gold-500/20 text-gold-500 font-bold">
                                {booking.profiles?.full_name?.charAt(0) ?? "G"}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold">{booking.profiles?.full_name ?? "Guest"}</p>
                            <p className="text-sm text-[var(--muted-text)]">{booking.profiles?.email}</p>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: "Check-in", val: format(new Date(booking.check_in_date), "EEE, MMM d, yyyy") },
                            { label: "Check-out", val: format(new Date(booking.check_out_date), "EEE, MMM d, yyyy") },
                        ].map(({ label, val }) => (
                            <div key={label} className="bg-[var(--page-bg)] rounded-xl p-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-text)] mb-1">{label}</p>
                                <p className="text-sm font-semibold">{val}</p>
                            </div>
                        ))}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-[var(--page-bg)] rounded-xl p-3 text-center">
                            <p className="text-[10px] uppercase tracking-wider text-[var(--muted-text)] mb-1">Nights</p>
                            <p className="font-bold text-lg">{nights}</p>
                        </div>
                        <div className="bg-[var(--page-bg)] rounded-xl p-3 text-center">
                            <p className="text-[10px] uppercase tracking-wider text-[var(--muted-text)] mb-1">Revenue</p>
                            <p className="font-bold text-lg text-gold-500">${booking.total_price}</p>
                        </div>
                        <div className="bg-[var(--page-bg)] rounded-xl p-3 text-center">
                            <p className="text-[10px] uppercase tracking-wider text-[var(--muted-text)] mb-1">Status</p>
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${STATUS_STYLES[status]}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
                                {booking.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function OwnerCalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [properties, setProperties] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [stats, setStats] = useState({ totalRevenue: 0, totalBookings: 0, occupiedNights: 0 });

    const days = useMemo(
        () => eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) }),
        [currentDate]
    );

    async function fetchData() {
        setLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: propsData } = await supabase
            .from("properties")
            .select("id, title, price_per_night, image_urls")
            .eq("owner_id", user.id)
            .order("title");

        const props = propsData || [];
        setProperties(props);
        if (props.length === 0) { setLoading(false); return; }

        const propIds = props.map((p: any) => p.id);
        const start = startOfMonth(currentDate).toISOString();
        const end = endOfMonth(currentDate).toISOString();

        const { data: bookingsData } = await supabase
            .from("bookings")
            .select("*, profiles:guest_id(full_name, email, avatar_url)")
            .in("property_id", propIds)
            .neq("status", "cancelled")
            .or(`check_in_date.lte.${end},check_out_date.gte.${start}`);

        const bks = bookingsData || [];
        setBookings(bks);

        // All-time confirmed stats for this owner
        const { data: allBks } = await supabase
            .from("bookings")
            .select("total_price, check_in_date, check_out_date, status")
            .in("property_id", propIds)
            .eq("status", "confirmed");

        const monthBks = (allBks || []).filter((b: any) => {
            const ci = new Date(b.check_in_date);
            return ci >= startOfMonth(currentDate) && ci <= endOfMonth(currentDate);
        });

        setStats({
            totalRevenue: (allBks || []).reduce((s: number, b: any) => s + (b.total_price || 0), 0),
            totalBookings: (allBks || []).length,
            occupiedNights: monthBks.reduce((s: number, b: any) => {
                return s + Math.ceil((new Date(b.check_out_date).getTime() - new Date(b.check_in_date).getTime()) / 86_400_000);
            }, 0),
        });

        setLoading(false);
    }

    useEffect(() => { fetchData(); }, [currentDate]);

    const getBookingForDate = (propertyId: string, date: Date) =>
        bookings.find(b =>
            b.property_id === propertyId &&
            isWithinInterval(date, {
                start: new Date(b.check_in_date),
                end: new Date(new Date(b.check_out_date).setDate(new Date(b.check_out_date).getDate() - 1)),
            })
        );

    const PROP_COL_W = 220; // px — property name column
    const DAY_COL_W = 88;  // px — each day column

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden p-4 md:p-6 gap-4">

            {/* ── Top bar: title + month nav ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold">My Property Calendar</h1>
                    <p className="text-[var(--muted-text)] text-sm mt-0.5">Booking availability at a glance</p>
                </div>

                {/* Month navigation */}
                <div className="flex items-center gap-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 self-start sm:self-auto">
                    <button
                        onClick={() => setCurrentDate(d => subMonths(d, 1))}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-base min-w-[140px] text-center">
                        {format(currentDate, "MMMM yyyy")}
                    </span>
                    <button
                        onClick={() => setCurrentDate(d => addMonths(d, 1))}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="w-px h-5 bg-[var(--card-border)] mx-1" />
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="text-xs font-semibold text-gold-500 hover:text-gold-400 transition px-2 py-1 rounded-lg hover:bg-gold-500/10"
                    >
                        Today
                    </button>
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
                {[
                    { icon: <DollarSign className="w-3.5 h-3.5" />, label: "Total Revenue", val: `$${stats.totalRevenue.toLocaleString()}`, color: "text-gold-500 bg-gold-500/10" },
                    { icon: <Users className="w-3.5 h-3.5" />, label: "Confirmed", val: stats.totalBookings, color: "text-blue-400 bg-blue-500/10" },
                    { icon: <CalendarDays className="w-3.5 h-3.5" />, label: "Nights (Month)", val: stats.occupiedNights, color: "text-emerald-400 bg-emerald-500/10" },
                ].map(s => (
                    <div key={s.label} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${s.color}`}>{s.icon}</div>
                        <div className="min-w-0">
                            <p className="text-[var(--muted-text)] text-[10px] truncate leading-none mb-0.5">{s.label}</p>
                            <p className="font-bold text-sm leading-tight">{s.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Calendar container ── */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
                </div>
            ) : properties.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl">
                    <div className="w-14 h-14 bg-gold-500/10 rounded-full flex items-center justify-center mb-3 text-gold-500">
                        <Building2 className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">No Properties Yet</h3>
                    <p className="text-[var(--muted-text)] text-sm text-center max-w-xs">Your admin will assign properties to your account.</p>
                </div>
            ) : (
                <div className="flex-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl flex flex-col overflow-hidden min-h-0">

                    {/* The single scrollable zone — only horizontal */}
                    <div className="flex-1 overflow-x-auto overflow-y-auto">
                        <div style={{ minWidth: PROP_COL_W + days.length * DAY_COL_W }}>

                            {/* ── Sticky header row ── */}
                            <div className="flex sticky top-0 z-30 bg-[var(--card-bg)] border-b border-[var(--card-border)]">
                                {/* Corner cell */}
                                <div
                                    className="shrink-0 sticky left-0 z-40 bg-[var(--card-bg)] border-r border-[var(--card-border)] flex items-center px-4"
                                    style={{ width: PROP_COL_W }}
                                >
                                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-text)]">Property</span>
                                </div>

                                {/* Day headers */}
                                {days.map(day => {
                                    const today = dfIsToday(day);
                                    return (
                                        <div
                                            key={day.toString()}
                                            className={`shrink-0 border-r border-[var(--card-border)] flex flex-col items-center justify-center py-2 ${today ? "bg-gold-500/10" : ""}`}
                                            style={{ width: DAY_COL_W }}
                                        >
                                            <span className="text-[10px] font-semibold uppercase text-[var(--muted-text)]">{format(day, "EEE")}</span>
                                            <span className={`text-sm font-bold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full ${today ? "bg-gold-500 text-black" : ""}`}>
                                                {format(day, "d")}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ── Property rows ── */}
                            {properties.map((property: any, pi: number) => (
                                <div
                                    key={property.id}
                                    className={`flex border-b border-[var(--card-border)] last:border-0 ${pi % 2 === 1 ? "bg-white/[0.02]" : ""}`}
                                >
                                    {/* Property label — sticky left */}
                                    <div
                                        className="shrink-0 sticky left-0 z-20 bg-[var(--card-bg)] border-r border-[var(--card-border)] flex items-center gap-3 px-4 py-3"
                                        style={{ width: PROP_COL_W, backgroundImage: pi % 2 === 1 ? "linear-gradient(rgba(255,255,255,0.02),rgba(255,255,255,0.02))" : "none" }}
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-[var(--page-bg)] overflow-hidden shrink-0 border border-[var(--card-border)]">
                                            {property.image_urls?.[0]
                                                ? <img src={property.image_urls[0]} alt="" className="w-full h-full object-cover" />
                                                : <div className="w-full h-full flex items-center justify-center text-[var(--muted-text)]"><Building2 className="w-4 h-4" /></div>
                                            }
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm truncate">{property.title}</p>
                                            <p className="text-xs text-[var(--muted-text)]">${property.price_per_night}/night</p>
                                        </div>
                                    </div>

                                    {/* Day cells */}
                                    {days.map(day => {
                                        const booking = getBookingForDate(property.id, day);
                                        const today = dfIsToday(day);
                                        const styleClass = booking ? getStyle(day, booking) : null;
                                        const isStart = booking && isSameDay(day, new Date(booking.check_in_date));

                                        return (
                                            <div
                                                key={`${property.id}-${day.toISOString()}`}
                                                className={`shrink-0 border-r border-[var(--card-border)] relative h-14 ${today ? "bg-gold-500/[0.04]" : ""}`}
                                                style={{ width: DAY_COL_W }}
                                            >
                                                {booking && styleClass ? (
                                                    <div
                                                        className={styleClass}
                                                        onClick={() => setSelectedBooking(booking)}
                                                        title={booking.profiles?.full_name}
                                                    >
                                                        {isStart && (
                                                            <span className="truncate flex items-center gap-1 px-2 text-xs font-semibold">
                                                                <Avatar className="w-4 h-4 shrink-0 border border-white/20">
                                                                    <AvatarImage src={booking.profiles?.avatar_url} />
                                                                    <AvatarFallback className="text-[8px] bg-black/30">
                                                                        {booking.profiles?.full_name?.charAt(0) ?? "G"}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="truncate">{booking.profiles?.full_name}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-[11px] text-[var(--muted-text)]/40">${property.price_per_night}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Legend (outside scroll) ── */}
                    <div className="shrink-0 flex items-center gap-5 px-5 py-3 border-t border-[var(--card-border)] text-xs text-[var(--muted-text)]">
                        {[
                            { label: "Confirmed", cls: "bg-emerald-500" },
                            { label: "Pending", cls: "bg-amber-500" },
                            { label: "Cancelled", cls: "bg-red-500/50" },
                        ].map(l => (
                            <span key={l.label} className="flex items-center gap-1.5 font-medium">
                                <span className={`w-3 h-3 rounded-sm ${l.cls}`} />
                                {l.label}
                            </span>
                        ))}
                        <span className="ml-auto italic text-[var(--muted-text)]/50">← Scroll calendar horizontally</span>
                    </div>
                </div>
            )}

            {/* ── Booking detail side panel ── */}
            {selectedBooking && (
                <BookingPanel booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
            )}
        </div>
    );
}
