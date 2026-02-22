"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import PaymentWrapper from "@/components/checkout/PaymentForm";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/context/CurrencyContext";

import { Suspense } from "react";

function CheckoutContent() {
    const searchParams = useSearchParams();
    const bookingId = searchParams.get("booking_id");
    const { format } = useCurrency();

    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    async function fetchBooking() {
        const supabase = createClient();
        const { data } = await supabase
            .from("bookings")
            .select(`
                *,
                properties (title, price_per_night, cleaning_fee, images)
            `)
            .eq("id", bookingId)
            .single();

        if (data) {
            setBooking(data);
        }
        setLoading(false);
    }

    useEffect(() => {
        if (bookingId) {
            fetchBooking();
        }
    }, [bookingId]);

    if (!bookingId) {
        return <div className="p-10 text-white">Invalid Checkout Session. No Booking ID found.</div>;
    }

    if (loading) {
        return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-gold-500" /></div>;
    }

    if (!booking) {
        return <div className="p-10 text-white">Booking not found.</div>;
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Order Summary */}
                <div className="space-y-6">
                    <h1 className="text-3xl font-bold">Checkout</h1>

                    <Card className="bg-surface-50 border-white/10 text-white">
                        <CardHeader>
                            <CardTitle>Your Trip</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-xl font-bold text-gold-500">{booking.properties.title}</h3>
                                <p className="text-gray-400">
                                    {new Date(booking.check_in_date).toDateString()} - {new Date(booking.check_out_date).toDateString()}
                                </p>
                            </div>

                            <div className="border-t border-white/10 pt-4 space-y-2">
                                <div className="flex justify-between">
                                    <span>Total Price</span>
                                    <span className="font-bold">{format(booking.total_price)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payment Form */}
                <div>
                    <PaymentWrapper
                        bookingId={booking.id}
                        propertyId={booking.property_id}
                        checkIn={booking.check_in_date}
                        checkOut={booking.check_out_date}
                        guests={1} // Default or fetch from booking
                    />
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
