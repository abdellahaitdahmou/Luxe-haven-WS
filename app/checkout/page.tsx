"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
    Loader2, CheckCircle, CalendarDays, Moon, MapPin,
    ChevronLeft, Shield, Star, Info
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { Suspense } from "react";
import { toast } from "sonner";
import { format, differenceInCalendarDays } from "date-fns";

// ── PAYMENT DISABLED FOR TESTING ─────────────────────────────────────────────
// To re-enable: replace <BypassPayment /> with <PaymentWrapper ... />
// and re-import PaymentWrapper from "@/components/checkout/PaymentForm"
// ─────────────────────────────────────────────────────────────────────────────

function BypassPayment({ bookingId }: { bookingId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/bookings/${bookingId}/confirm`, { method: "PATCH" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to confirm");
            toast.success("Booking request sent! Awaiting host approval.");
            router.push(`/checkout/success?booking_id=${bookingId}`);
        } catch (err: any) {
            toast.error(err.message);
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black font-bold py-4 rounded-xl transition-all shadow-lg shadow-gold-500/20 disabled:opacity-60 text-base"
        >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            {loading ? "Sending request…" : "Request Reservation"}
        </button>
    );
}

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const bookingId = searchParams.get("booking_id");
    const { format: formatCcy } = useCurrency();

    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!bookingId) return;
        const supabase = createClient();
        supabase
            .from("bookings")
            .select("*, properties (id, title, price_per_night, image_urls, city, address)")
            .eq("id", bookingId)
            .single()
            .then(({ data }) => {
                setBooking(data);
                setLoading(false);
            });
    }, [bookingId]);

    if (!bookingId) return <div className="p-10 text-[var(--page-text)]">Invalid checkout session — no booking ID found.</div>;
    if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-gold-500" /></div>;
    if (!booking) return <div className="p-10 text-[var(--page-text)]">Booking not found.</div>;

    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    const nights = Math.max(differenceInCalendarDays(checkOut, checkIn), 1);
    const coverImg = booking.properties?.image_urls?.[0] ?? null;
    const pricePerNight = booking.properties?.price_per_night ?? 0;
    const cleaningFee = Math.round(pricePerNight * 0.1);
    const serviceFee = Math.round(booking.total_price * 0.12);
    const subtotal = booking.total_price;

    return (
        <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-text)]">

            {/* Top nav */}
            <div className="sticky top-0 z-20 bg-[var(--page-bg)]/80 backdrop-blur-md border-b border-[var(--card-border)]">
                <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-white/10 transition">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-lg">Confirm & Request</span>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12">

                {/* ── LEFT COLUMN ──────────────────────────────────────────── */}
                <div className="space-y-8">

                    {/* Step: Your trip */}
                    <section>
                        <h2 className="text-2xl font-bold mb-6">Your trip</h2>

                        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] divide-y divide-[var(--card-border)] overflow-hidden">
                            {/* Dates */}
                            <div className="flex items-center justify-between p-5">
                                <div className="flex items-start gap-3">
                                    <CalendarDays className="w-5 h-5 text-gold-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-semibold">Dates</p>
                                        <p className="text-[var(--muted-text)] text-sm mt-0.5">
                                            {format(checkIn, "MMM d")} – {format(checkOut, "MMM d, yyyy")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="flex items-center justify-between p-5">
                                <div className="flex items-start gap-3">
                                    <Moon className="w-5 h-5 text-gold-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-semibold">Duration</p>
                                        <p className="text-[var(--muted-text)] text-sm mt-0.5">
                                            {nights} night{nights !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Location */}
                            {(booking.properties?.city || booking.properties?.address) && (
                                <div className="flex items-center justify-between p-5">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-gold-500 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-semibold">Location</p>
                                            <p className="text-[var(--muted-text)] text-sm mt-0.5">
                                                {booking.properties?.address || booking.properties?.city}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Step: Ground rules */}
                    <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 space-y-3">
                        <div className="flex items-center gap-2 font-semibold">
                            <Shield className="w-5 h-5 text-gold-500" />
                            Reservation policy
                        </div>
                        <ul className="text-sm text-[var(--muted-text)] space-y-2 list-disc list-inside">
                            <li>Your reservation is pending until the host accepts it.</li>
                            <li>You won't be charged until the host confirms.</li>
                            <li>Present a valid ID document upon check-in.</li>
                            <li>Contact the host if you need to change dates.</li>
                        </ul>
                    </section>

                    {/* Info box */}
                    <div className="flex gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
                        <Info className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>This is a <strong>request</strong>. The host will review it and accept or decline. You'll be notified immediately.</span>
                    </div>

                    {/* CTA — mobile only */}
                    <div className="lg:hidden">
                        <BypassPayment bookingId={booking.id} />
                    </div>
                </div>

                {/* ── RIGHT COLUMN — property card ─────────────────────────── */}
                <div className="space-y-6">

                    {/* Property card */}
                    <div className="sticky top-24 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden shadow-2xl">

                        {/* Cover image */}
                        <div className="relative w-full h-52">
                            {coverImg ? (
                                <img src={coverImg} alt={booking.properties?.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gold-900/40 to-gold-700/20 flex items-center justify-center">
                                    <Star className="w-10 h-10 text-gold-500/40" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>

                        {/* Property title */}
                        <div className="p-5 border-b border-[var(--card-border)]">
                            <h3 className="font-bold text-lg leading-tight">{booking.properties?.title}</h3>
                            {booking.properties?.city && (
                                <p className="text-[var(--muted-text)] text-sm mt-1 flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" /> {booking.properties.city}
                                </p>
                            )}
                        </div>

                        {/* Price breakdown */}
                        <div className="p-5 space-y-3">
                            <h4 className="font-semibold text-sm uppercase tracking-wider text-[var(--muted-text)] mb-4">Price breakdown</h4>

                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--muted-text)]">
                                    {formatCcy(pricePerNight)} × {nights} night{nights !== 1 ? "s" : ""}
                                </span>
                                <span>{formatCcy(pricePerNight * nights)}</span>
                            </div>

                            <div className="flex justify-between text-sm text-[var(--muted-text)]">
                                <span>Luxe Haven service fee</span>
                                <span>{formatCcy(serviceFee)}</span>
                            </div>

                            <div className="border-t border-[var(--card-border)] pt-3 flex justify-between font-bold">
                                <span>Total</span>
                                <span className="text-gold-500">{formatCcy(subtotal)}</span>
                            </div>
                        </div>

                        {/* CTA — desktop */}
                        <div className="p-5 pt-0 hidden lg:block">
                            <BypassPayment bookingId={booking.id} />
                        </div>

                        {/* Stay period visual */}
                        <div className="mx-5 mb-5 grid grid-cols-2 border border-[var(--card-border)] rounded-xl overflow-hidden text-sm">
                            <div className="p-3 border-r border-[var(--card-border)]">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-text)]">Check-in</p>
                                <p className="font-semibold mt-0.5">{format(checkIn, "EEE, MMM d")}</p>
                                <p className="text-[var(--muted-text)] text-xs">After 3:00 PM</p>
                            </div>
                            <div className="p-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-text)]">Checkout</p>
                                <p className="font-semibold mt-0.5">{format(checkOut, "EEE, MMM d")}</p>
                                <p className="text-[var(--muted-text)] text-xs">Before 11:00 AM</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-gold-500" /></div>}>
            <CheckoutContent />
        </Suspense>
    );
}
