"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { isSameDay } from "date-fns"
import { PropertyCalendar, SeasonalPrice } from "./PropertyCalendar"
import { DateRange } from "react-day-picker"
import { Loader2, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { useVerification } from "@/components/providers/VerificationProvider";
import { useCurrency } from "@/context/CurrencyContext";
import { startConversation } from "@/app/actions/messages";

interface BookingWidgetProps {
    price: number
    seasonalPrices: SeasonalPrice[]
    blockedDates: Date[]
    propertyId: string
    ownerId?: string
    isLoggedIn?: boolean
}

export function BookingWidget({ price, seasonalPrices, blockedDates, propertyId, ownerId, isLoggedIn }: BookingWidgetProps) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { format } = useCurrency()

    const calculateTotal = () => {
        if (!dateRange?.from || !dateRange?.to) return 0

        let total = 0
        const current = new Date(dateRange.from)
        const end = new Date(dateRange.to)
        // Loop until day BEFORE checkout (checkout day is not charged)
        const lastNight = new Date(end)
        lastNight.setDate(lastNight.getDate() - 1)

        while (current <= lastNight) {
            const seasonal = seasonalPrices.find(p => isSameDay(p.date, current))
            total += seasonal ? seasonal.price : price
            current.setDate(current.getDate() + 1)
        }
        return total
    }

    const total = calculateTotal()
    const nights = dateRange?.from && dateRange?.to
        ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
        : 0

    const { isVerified, openVerification } = useVerification();
    const [contactLoading, setContactLoading] = useState(false);

    const handleContactHost = async () => {
        if (!isLoggedIn) {
            router.push("/login?redirect=/properties/" + propertyId);
            return;
        }
        if (!ownerId) return;
        try {
            setContactLoading(true);
            const result = await startConversation(propertyId, ownerId);
            if (result.error) { toast.error(result.error); return; }
            router.push(`/dashboard/messages/${result.conversationId}`);
        } catch {
            toast.error("Failed to start conversation.");
        } finally {
            setContactLoading(false);
        }
    };

    const handleReserve = async () => {
        if (!dateRange?.from || !dateRange?.to) {
            toast.error("Please select check-in and check-out dates.")
            return
        }

        if (!isVerified) {
            toast.error("Please verify your ID to continue booking.");
            openVerification();
            return;
        }

        setLoading(true)

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyId,
                    checkIn: dateRange.from,
                    checkOut: dateRange.to,
                    guests: 1 // Default for now, add guest picker later
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create booking')
            }

            router.push(`/checkout?booking_id=${data.bookingId}`)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative">
            <div className="sticky top-28 space-y-6">
                <div className="bg-white rounded-2xl shadow-xl border p-4 sm:p-6 text-black">


                    {/* Calendar Component */}
                    <div className="mb-4">
                        <PropertyCalendar
                            blockedDates={blockedDates}
                            seasonalPrices={seasonalPrices}
                            onRangeSelect={setDateRange}
                            className="w-full border-0 shadow-none p-0 bg-transparent"
                        />
                    </div>

                    {nights > 0 && (
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span>{format(price)} x {nights} nights</span>
                                <span>{format(total)}</span>
                            </div>
                            <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                                <span>Total</span>
                                <span>{format(total)}</span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleReserve}
                        disabled={loading || !dateRange?.from || !dateRange?.to}
                        className="w-full bg-black text-white py-3 rounded-xl font-semibold text-lg hover:bg-gray-800 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reserve"}
                    </button>

                    <div className="text-center text-xs text-gray-400 mt-4">
                        You won&apos;t be charged yet
                    </div>

                    {/* Divider */}
                    {ownerId && (
                        <>
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="bg-white px-2 text-gray-400">or</span>
                                </div>
                            </div>

                            <button
                                onClick={handleContactHost}
                                disabled={contactLoading}
                                className="w-full flex items-center justify-center gap-2 border-2 border-black text-black py-3 rounded-xl font-semibold text-base hover:bg-black hover:text-white transition transform active:scale-95 disabled:opacity-50"
                            >
                                {contactLoading
                                    ? <Loader2 className="w-5 h-5 animate-spin" />
                                    : <MessageCircle className="w-5 h-5" />}
                                {contactLoading ? "Opening chat..." : "Message Host"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
