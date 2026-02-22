"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ChevronLeft, ChevronRight, Loader2, Building2, DollarSign,
    CalendarDays, TrendingUp, Users
} from "lucide-react";
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    eachDayOfInterval, isSameDay, isWithinInterval,
} from "date-fns";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const getBookingStyle = (date: Date, booking: any) => {
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    checkOut.setDate(checkOut.getDate() - 1);

    const isStart = isSameDay(date, checkIn);
    const isEnd = isSameDay(date, checkOut);
    const isMiddle = isWithinInterval(date, { start: checkIn, end: checkOut });
    if (!isMiddle) return null;

    let cls = "h-8 mt-1 text-xs font-medium flex items-center justify-center truncate px-1 cursor-pointer transition-all hover:brightness-110 relative z-10 ";
    if (booking.status === "confirmed") cls += "bg-green-600 text-white ";
    else if (booking.status === "pending") cls += "bg-yellow-600 text-white ";
    else if (booking.status === "cancelled") cls += "bg-red-600/50 text-white/50 ";
    else cls += "bg-gray-600 text-white ";

    if (isStart && isEnd) cls += "rounded-md mx-1";
    else if (isStart) cls += "rounded-l-md ml-1";
    else if (isEnd) cls += "rounded-r-md mr-1";

    return cls;
};

export default function OwnerCalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [properties, setProperties] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalRevenue: 0, totalBookings: 0, occupiedNights: 0 });

    const days = useMemo(() => {
        return eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
    }, [currentDate]);

    async function fetchData() {
        setLoading(true);
        const supabase = createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        // Fetch only THIS owner's properties
        const { data: propsData } = await supabase
            .from("properties")
            .select("id, title, price_per_night, image_urls, bedrooms")
            .eq("owner_id", user.id)
            .order("title");

        const props = propsData || [];
        setProperties(props);

        if (props.length === 0) { setLoading(false); return; }

        const propIds = props.map((p: any) => p.id);
        const start = startOfMonth(currentDate).toISOString();
        const end = endOfMonth(currentDate).toISOString();

        // Fetch bookings for this owner's properties only
        const { data: bookingsData } = await supabase
            .from("bookings")
            .select("*, profiles:user_id(full_name, email, avatar_url)")
            .in("property_id", propIds)
            .neq("status", "cancelled")
            .or(`check_in_date.lte.${end},check_out_date.gte.${start}`);

        const bks = bookingsData || [];
        setBookings(bks);

        // Stats for this month (all time for this owner)
        const { data: allBookings } = await supabase
            .from("bookings")
            .select("total_price, check_in_date, check_out_date, status")
            .in("property_id", propIds)
            .eq("status", "confirmed");

        const monthBks = (allBookings || []).filter((b: any) => {
            const checkin = new Date(b.check_in_date);
            return checkin >= startOfMonth(currentDate) && checkin <= endOfMonth(currentDate);
        });

        const totalRevenue = (allBookings || []).reduce((s: number, b: any) => s + (b.total_price || 0), 0);
        const occupiedNights = monthBks.reduce((s: number, b: any) => {
            const nights = Math.ceil((new Date(b.check_out_date).getTime() - new Date(b.check_in_date).getTime()) / 86400000);
            return s + nights;
        }, 0);

        setStats({ totalRevenue, totalBookings: (allBookings || []).length, occupiedNights });
        setLoading(false);
    }

    useEffect(() => { fetchData(); }, [currentDate]);

    const getBookingForDate = (propertyId: string, date: Date) => {
        return bookings.find(b =>
            b.property_id === propertyId &&
            isWithinInterval(date, {
                start: new Date(b.check_in_date),
                end: new Date(new Date(b.check_out_date).setDate(new Date(b.check_out_date).getDate() - 1))
            })
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white mb-1">My Property Calendar</h1>
                <p className="text-gray-400 text-sm">View bookings and availability for your properties</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-surface-50 border border-white/5 rounded-xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-500">
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs mb-0.5">Total Revenue</p>
                        <p className="text-white font-bold text-xl">${stats.totalRevenue.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-surface-50 border border-white/5 rounded-xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs mb-0.5">Total Bookings</p>
                        <p className="text-white font-bold text-xl">{stats.totalBookings}</p>
                    </div>
                </div>
                <div className="bg-surface-50 border border-white/5 rounded-xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                        <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs mb-0.5">Occupied Nights (This Month)</p>
                        <p className="text-white font-bold text-xl">{stats.occupiedNights}</p>
                    </div>
                </div>
            </div>

            {/* No properties state */}
            {properties.length === 0 ? (
                <div className="bg-surface-50 border border-white/5 rounded-2xl p-16 text-center">
                    <div className="w-16 h-16 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-gold-500">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No Properties Yet</h3>
                    <p className="text-gray-400 text-sm">Your admin will assign properties to your account. Check back soon.</p>
                </div>
            ) : (
                <div className="bg-surface-50 border border-white/5 rounded-2xl overflow-hidden">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                        <span className="font-bold text-lg text-white">{format(currentDate, "MMMM yyyy")}</span>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="hover:bg-white/10">
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="text-gold-500 hover:text-gold-400 hover:bg-gold-500/10 text-xs">
                                Today
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="hover:bg-white/10">
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="overflow-auto">
                        <div className="inline-block min-w-full">
                            {/* Header row */}
                            <div className="flex sticky top-0 z-30 bg-[#111] border-b border-white/10">
                                <div className="sticky left-0 w-56 shrink-0 bg-black border-r border-white/10 p-3 font-semibold text-gray-400 text-sm z-50">
                                    Property
                                </div>
                                {days.map(day => {
                                    const isToday = isSameDay(day, new Date());
                                    return (
                                        <div key={day.toString()} className={`w-24 shrink-0 border-r border-white/5 p-2 text-center ${isToday ? "bg-gold-500/10" : ""}`}>
                                            <span className="text-[10px] text-gray-400 uppercase block">{format(day, "EEE")}</span>
                                            <span className={`text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center mx-auto ${isToday ? "bg-gold-500 text-black" : "text-white"}`}>
                                                {format(day, "d")}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Property rows */}
                            {properties.map((property: any) => (
                                <div key={property.id} className="flex border-b border-white/5">
                                    <div className="sticky left-0 w-56 shrink-0 bg-black border-r border-white/10 p-3 flex items-center gap-3 z-20">
                                        <div className="w-8 h-8 rounded-md bg-gray-800 overflow-hidden shrink-0 border border-white/10">
                                            {property.image_urls?.[0] ? (
                                                <img src={property.image_urls[0]} alt={property.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm text-white truncate">{property.title}</p>
                                            <p className="text-xs text-gray-500">${property.price_per_night}/night</p>
                                        </div>
                                    </div>

                                    {days.map(day => {
                                        const booking = getBookingForDate(property.id, day);
                                        const isToday = isSameDay(day, new Date());
                                        const styleClass = booking ? getBookingStyle(day, booking) : null;
                                        const isStart = booking && isSameDay(day, new Date(booking.check_in_date));

                                        return (
                                            <div key={`${property.id}-${day.toISOString()}`}
                                                className={`w-24 shrink-0 border-r border-white/5 relative h-14 ${isToday ? "bg-gold-500/5" : ""}`}>
                                                {booking && styleClass ? (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <div className={styleClass} title={booking.profiles?.full_name}>
                                                                {isStart && (
                                                                    <span className="truncate flex items-center gap-1">
                                                                        <Avatar className="w-4 h-4 border border-white/20">
                                                                            <AvatarImage src={booking.profiles?.avatar_url} />
                                                                            <AvatarFallback className="text-[8px] bg-black text-white">
                                                                                {booking.profiles?.full_name?.charAt(0)}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        {booking.profiles?.full_name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </DialogTrigger>
                                                        <DialogContent className="bg-surface-100 border-white/10 text-white">
                                                            <DialogHeader><DialogTitle>Booking Details</DialogTitle></DialogHeader>
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg">
                                                                    <Avatar className="w-12 h-12">
                                                                        <AvatarImage src={booking.profiles?.avatar_url} />
                                                                        <AvatarFallback>{booking.profiles?.full_name?.charAt(0)}</AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <p className="font-bold">{booking.profiles?.full_name}</p>
                                                                        <p className="text-sm text-gray-400">{booking.profiles?.email}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <p className="text-xs text-gray-500 uppercase">Check In</p>
                                                                        <p className="font-medium">{format(new Date(booking.check_in_date), "PPP")}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500 uppercase">Check Out</p>
                                                                        <p className="font-medium">{format(new Date(booking.check_out_date), "PPP")}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500 uppercase">Revenue</p>
                                                                        <p className="font-bold text-gold-500">${booking.total_price}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500 uppercase">Status</p>
                                                                        <Badge variant="outline" className="capitalize">{booking.status}</Badge>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-xs text-gray-700">${property.price_per_night}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 p-3 border-t border-white/5 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-600 inline-block" />Confirmed</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-yellow-600 inline-block" />Pending</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-600/50 inline-block" />Cancelled</span>
                    </div>
                </div>
            )}
        </div>
    );
}
