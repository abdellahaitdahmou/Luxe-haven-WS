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
import { createBookingRequest } from "@/app/actions/bookings";

interface BookingWidgetProps {
    price: number
    seasonalPrices: SeasonalPrice[]
    blockedDates: Date[]
    propertyId: string
    ownerId?: string
    isLoggedIn?: boolean
    listingType?: string
    priceType?: string
}

export function BookingWidget({ price, seasonalPrices, blockedDates, propertyId, ownerId, isLoggedIn, listingType = 'rent', priceType = 'per_night' }: BookingWidgetProps) {
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

        // ── ID VERIFICATION DISABLED FOR TESTING ─────────────────────────
        // Uncomment the block below to re-enable ID verification gate:
        // if (!isVerified) {
        //     toast.error("Please verify your ID to continue booking.");
        //     openVerification();
        //     return;
        // }
        // ─────────────────────────────────────────────────────────────────

        setLoading(true)

        try {
            const result = await createBookingRequest({
                propertyId,
                checkIn: dateRange.from,
                checkOut: dateRange.to,
                guests: 1
            });

            if (result.bookingId) {
                toast.success("Request sent! The host will review your stay.");
                router.push("/dashboard/messages");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to create booking request");
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative">
            <div className="sticky top-28 space-y-6">
                <div className="bg-[var(--card-bg)] rounded-2xl shadow-xl border border-[var(--card-border)] p-4 sm:p-6 text-[var(--page-text)]">


                    {/* Calendar Component OR Fixed Price */}
                    {listingType === 'sale' ? (
                        <div className="text-center mb-6">
                            <div className="text-sm text-[var(--muted-text)] font-semibold uppercase tracking-wider mb-2">Asking Price</div>
                            <div className="text-3xl font-bold text-gold-500">{format(price)}</div>
                        </div>
                    ) : (
                        <div className="mb-4">
                            <PropertyCalendar
                                blockedDates={blockedDates}
                                seasonalPrices={seasonalPrices}
                                onRangeSelect={setDateRange}
                                className="w-full border-0 shadow-none p-0 bg-transparent"
                            />
                        </div>
                    )}

                    {listingType !== 'sale' && nights > 0 && (
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

                    {listingType !== 'sale' && (
                        <>
                            <button
                                onClick={handleReserve}
                                disabled={loading || !dateRange?.from || !dateRange?.to}
                                className="w-full bg-[var(--page-text)] text-[var(--card-bg)] py-3 rounded-xl font-semibold text-lg hover:opacity-90 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Request to Book"}
                            </button>

                            <div className="text-center text-xs text-[var(--muted-text)] mt-4">
                                You won&apos;t be charged yet
                            </div>
                        </>
                    )}

                    {/* Divider */}
                    {ownerId && (
                        <>
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-[var(--card-border)]" />
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="bg-[var(--card-bg)] px-2 text-[var(--muted-text)]">or</span>
                                </div>
                            </div>

                            <button
                                onClick={handleContactHost}
                                disabled={contactLoading}
                                className={`w-full flex items-center justify-center gap-2 border-2 border-[var(--page-text)] text-[var(--page-text)] py-3 rounded-xl font-semibold text-base hover:bg-[var(--page-text)] hover:text-[var(--card-bg)] transition transform active:scale-95 disabled:opacity-50 ${listingType === 'sale' ? 'bg-gold-500 text-black border-gold-500 hover:bg-gold-600 hover:border-gold-600 hover:text-black mt-4' : ''}`}
                            >
                                {contactLoading
                                    ? <Loader2 className="w-5 h-5 animate-spin" />
                                    : <MessageCircle className="w-5 h-5" />}
                                {contactLoading ? "Opening chat..." : listingType === 'sale' ? "Inquire to Buy" : "Message Host"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
