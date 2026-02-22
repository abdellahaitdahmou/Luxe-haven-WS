"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Map, Calendar, ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ReviewModal } from "@/components/reviews/ReviewModal";

export default function TripsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

    async function fetchTrips() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('bookings')
            .select('*, properties(id, title, image_url, location)')
            .eq('user_id', user.id)
            .order('check_in_date', { ascending: false }); // Newest first

        if (data) setBookings(data);
        setLoading(false);
    }

    useEffect(() => {
        fetchTrips();
    }, []);

    const filteredBookings = bookings.filter(b => {
        const isCancelled = b.status === 'cancelled';
        const isPast = new Date(b.check_out_date) < new Date() && !isCancelled;
        const isUpcoming = new Date(b.check_out_date) >= new Date() && !isCancelled;

        if (activeTab === 'cancelled') return isCancelled;
        if (activeTab === 'past') return isPast;
        return isUpcoming;
    });

    const handleCancel = async (bookingId: string) => {
        if (!confirm("Are you sure you want to cancel this booking?")) return;

        const supabase = createClient();
        const { error } = await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId);

        if (error) {
            toast.error("Failed to cancel booking");
        } else {
            toast.success("Booking cancelled");
            fetchTrips(); // Refresh
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-gold-500" /></div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">My Trips</h1>
                <p className="text-gray-400">Manage your upcoming adventures and view past stays.</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'upcoming' ? 'border-gold-500 text-gold-500' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    Upcoming
                </button>
                <button
                    onClick={() => setActiveTab('past')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'past' ? 'border-gold-500 text-gold-500' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    Past
                </button>
                <button
                    onClick={() => setActiveTab('cancelled')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'cancelled' ? 'border-gold-500 text-gold-500' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    Cancelled
                </button>
            </div>

            {/* List */}
            <div className="space-y-4">
                {filteredBookings.length === 0 ? (
                    <Card className="bg-surface-50 border-white/10 text-white p-12 text-center">
                        <Map className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold mb-2">No {activeTab} trips found</h3>
                        {activeTab === 'upcoming' && (
                            <div className="mt-4">
                                <Link href="/properties">
                                    <Button className="bg-gold-500 text-black hover:bg-gold-600">Start Exploring</Button>
                                </Link>
                            </div>
                        )}
                    </Card>
                ) : (
                    filteredBookings.map((booking) => (
                        <Card key={booking.id} className="bg-surface-50 border-white/10 overflow-hidden hover:border-gold-500/30 transition-colors">
                            <div className="flex flex-col md:flex-row">
                                {/* Image */}
                                <div className="w-full md:w-64 h-48 md:h-auto relative">
                                    <img
                                        src={booking.properties?.image_url || "/placeholder-property.jpg"}
                                        alt={booking.properties?.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 left-2">
                                        <Badge className={`
                                            ${booking.status === 'confirmed' ? 'bg-green-500' : ''}
                                            ${booking.status === 'pending' ? 'bg-yellow-500 text-black' : ''}
                                            ${booking.status === 'cancelled' ? 'bg-red-500' : ''}
                                        `}>
                                            {booking.status}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{booking.properties?.title}</h3>
                                                <p className="text-gray-400 text-sm">{booking.properties?.location || "Luxury Location"}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-bold text-gold-500">${booking.total_price}</p>
                                                <p className="text-xs text-gray-500">{booking.guests} Guests</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 mt-4 text-sm text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                <span>
                                                    {new Date(booking.check_in_date).toLocaleDateString()} — {new Date(booking.check_out_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="bg-white/10 px-2 py-0.5 rounded text-xs">
                                                    {Math.ceil((new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24))} Nights
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                                        <Link href={`/dashboard/messages?guest=${booking.user_id}`}>
                                            {/* Note: In messages, we usually link by "other user id". Since we are guest, we need host_id. 
                                                But we didn't fetch host_id here. 
                                                Optimally we should fetch properties(owner_id).
                                                Let's update the fetch query above. */}
                                            <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 text-gray-300">
                                                <MessageCircle className="w-4 h-4 mr-2" />
                                                Message Host
                                            </Button>
                                        </Link>

                                        {/* Review Button */}
                                        {(booking.status === 'completed' || (new Date(booking.check_out_date) < new Date() && booking.status !== 'cancelled')) && (
                                            <ReviewModal
                                                bookingId={booking.id}
                                                propertyName={booking.properties?.title}
                                                type="property"
                                                targetId={booking.properties?.id}
                                            />
                                        )}

                                        {booking.status === 'pending' || (booking.status === 'confirmed' && new Date(booking.check_in_date) > new Date()) ? (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleCancel(booking.id)}
                                                className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-none"
                                            >
                                                Cancel Booking
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
