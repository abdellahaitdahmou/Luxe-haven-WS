"use client";

import { useState, useMemo } from "react";
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    eachDayOfInterval, isSameDay, isWithinInterval, isSameMonth,
    startOfWeek, endOfWeek, getDay
} from "date-fns";
import { ChevronLeft, ChevronRight, X, User, Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

interface MobileCalendarProps {
    properties: any[];
    bookings: any[];
    dailyPrices: any[];
    currentDate: Date;
    onMonthChange: (date: Date) => void;
}

const STATUS_COLORS: Record<string, string> = {
    confirmed: "bg-green-500",
    pending: "bg-yellow-500",
    cancelled: "bg-red-400",
};

export function MobileCalendar({
    properties,
    bookings,
    dailyPrices,
    currentDate,
    onMonthChange,
}: MobileCalendarProps) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedProperty, setSelectedProperty] = useState<any | null>(null);

    // Build full 6-week grid (like Airbnb)
    const calendarDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const getBookingsForDay = (date: Date) => {
        return bookings.filter((b) => {
            const checkIn = new Date(b.check_in_date);
            const checkOut = new Date(b.check_out_date);
            checkOut.setDate(checkOut.getDate() - 1);
            return isWithinInterval(date, { start: checkIn, end: checkOut });
        });
    };

    const getPriceForDay = (property: any, date: Date) => {
        const override = dailyPrices.find(
            (dp: any) =>
                dp.property_id === property.id && isSameDay(new Date(dp.date), date)
        );
        return override ? override.price : property.price_per_night;
    };

    const selectedDayBookings = selectedDate ? getBookingsForDay(selectedDate) : [];

    const handleDayClick = (date: Date) => {
        if (!isSameMonth(date, currentDate)) return;
        setSelectedDate((prev) => (prev && isSameDay(prev, date) ? null : date));
        setSelectedProperty(null);
    };

    const today = new Date();

    return (
        <div className="flex flex-col gap-4">
            {/* Month Switcher */}
            <div className="flex items-center justify-between px-1">
                <button
                    onClick={() => onMonthChange(subMonths(currentDate, 1))}
                    className="p-2 rounded-full bg-[var(--surface-100)] border border-[var(--card-border)] text-[var(--page-text)] hover:bg-[var(--surface-200)] transition active:scale-95"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-[var(--page-text)]">
                    {format(currentDate, "MMMM yyyy")}
                </h2>
                <button
                    onClick={() => onMonthChange(addMonths(currentDate, 1))}
                    className="p-2 rounded-full bg-[var(--surface-100)] border border-[var(--card-border)] text-[var(--page-text)] hover:bg-[var(--surface-200)] transition active:scale-95"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 text-center mb-1">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <div key={d} className="text-xs font-semibold text-[var(--muted-text)] py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-1">
                {calendarDays.map((day) => {
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isToday = isSameDay(day, today);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const dayBookings = isCurrentMonth ? getBookingsForDay(day) : [];
                    const hasBookings = dayBookings.length > 0;

                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => handleDayClick(day)}
                            disabled={!isCurrentMonth}
                            className={`relative flex flex-col items-center justify-start py-1.5 rounded-xl transition-all active:scale-95 group min-h-[52px] ${!isCurrentMonth
                                ? "opacity-20 cursor-default"
                                : isSelected
                                    ? "bg-gold-500 text-black shadow-lg shadow-gold-500/30"
                                    : isToday
                                        ? "bg-[var(--surface-100)] ring-2 ring-gold-500"
                                        : "hover:bg-[var(--surface-100)]"
                                }`}
                        >
                            <span
                                className={`text-sm font-semibold leading-none ${isSelected
                                    ? "text-black"
                                    : isToday
                                        ? "text-gold-500"
                                        : "text-[var(--page-text)]"
                                    }`}
                            >
                                {format(day, "d")}
                            </span>

                            {/* Booking dots */}
                            {hasBookings && (
                                <div className="flex flex-wrap justify-center gap-0.5 mt-1 px-1">
                                    {dayBookings.slice(0, 3).map((b: any, i: number) => (
                                        <span
                                            key={i}
                                            className={`w-1.5 h-1.5 rounded-full ${isSelected
                                                ? "bg-black/70"
                                                : (STATUS_COLORS[b.status] || "bg-gray-400")
                                                }`}
                                        />
                                    ))}
                                    {dayBookings.length > 3 && (
                                        <span className={`text-[8px] font-bold ${isSelected ? "text-black/70" : "text-[var(--muted-text)]"}`}>
                                            +{dayBookings.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 px-1 pt-2 border-t border-[var(--card-border)]">
                <span className="text-xs text-[var(--muted-text)]">Status:</span>
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                    <div key={status} className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${color}`} />
                        <span className="text-xs capitalize text-[var(--muted-text)]">{status}</span>
                    </div>
                ))}
            </div>

            {/* Selected Day Panel */}
            <AnimatePresence>
                {selectedDate && (
                    <motion.div
                        key="day-detail"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden shadow-xl"
                    >
                        {/* Panel Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--card-border)]">
                            <div>
                                <p className="text-xs text-[var(--muted-text)] uppercase tracking-wide font-semibold">
                                    {format(selectedDate, "EEEE")}
                                </p>
                                <p className="text-xl font-bold text-[var(--page-text)]">
                                    {format(selectedDate, "MMMM d, yyyy")}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedDate(null)}
                                className="p-2 rounded-full hover:bg-[var(--surface-100)] text-[var(--muted-text)] transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Bookings for this day */}
                        <div className="px-5 py-4 space-y-3">
                            {selectedDayBookings.length === 0 ? (
                                <div className="text-center py-6">
                                    <div className="w-12 h-12 rounded-full bg-[var(--surface-100)] flex items-center justify-center mx-auto mb-3">
                                        <User className="w-6 h-6 text-[var(--muted-text)]" />
                                    </div>
                                    <p className="text-[var(--muted-text)] text-sm">No bookings on this day</p>
                                    <p className="text-xs text-[var(--muted-text)]/60 mt-1">All properties are available</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wide">
                                        {selectedDayBookings.length} Booking{selectedDayBookings.length !== 1 ? "s" : ""}
                                    </p>
                                    {selectedDayBookings.map((booking: any) => {
                                        const property = properties.find((p) => p.id === booking.property_id);
                                        const isExpanded = selectedProperty?.id === booking.id;
                                        return (
                                            <motion.div
                                                key={booking.id}
                                                layout
                                                onClick={() => setSelectedProperty(isExpanded ? null : booking)}
                                                className="rounded-xl border border-[var(--card-border)] bg-[var(--surface-100)] overflow-hidden cursor-pointer hover:border-gold-500/50 transition-all"
                                            >
                                                {/* Booking Summary Row */}
                                                <div className="flex items-center gap-3 px-4 py-3">
                                                    <div className={`w-1 self-stretch rounded-full ${STATUS_COLORS[booking.status] || "bg-gray-500"}`} />
                                                    <Avatar className="w-9 h-9 border border-[var(--card-border)] shrink-0">
                                                        <AvatarImage src={booking.profiles?.avatar_url} />
                                                        <AvatarFallback className="bg-gold-500 text-black text-xs font-bold">
                                                            {booking.profiles?.full_name?.charAt(0) || "?"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-[var(--page-text)] truncate">
                                                            {booking.profiles?.full_name || "Unknown Guest"}
                                                        </p>
                                                        <p className="text-xs text-[var(--muted-text)] truncate">
                                                            {property?.title || "Unknown Property"}
                                                        </p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <Badge
                                                            className={`text-[10px] capitalize px-2 py-0.5 border-0 ${booking.status === "confirmed"
                                                                ? "bg-green-500/15 text-green-500"
                                                                : booking.status === "pending"
                                                                    ? "bg-yellow-500/15 text-yellow-500"
                                                                    : "bg-red-500/15 text-red-400"
                                                                }`}
                                                        >
                                                            {booking.status}
                                                        </Badge>
                                                        <p className="text-xs font-bold text-gold-500 mt-0.5">
                                                            {booking.total_price} DH
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Expanded Details */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="border-t border-[var(--card-border)] px-4 py-3 space-y-3"
                                                        >
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="bg-[var(--card-bg)] rounded-lg p-3">
                                                                    <p className="text-[10px] uppercase font-semibold text-[var(--muted-text)] mb-1 tracking-wide">Check In</p>
                                                                    <p className="text-sm font-bold text-[var(--page-text)]">
                                                                        {format(new Date(booking.check_in_date), "MMM d, yyyy")}
                                                                    </p>
                                                                </div>
                                                                <div className="bg-[var(--card-bg)] rounded-lg p-3">
                                                                    <p className="text-[10px] uppercase font-semibold text-[var(--muted-text)] mb-1 tracking-wide">Check Out</p>
                                                                    <p className="text-sm font-bold text-[var(--page-text)]">
                                                                        {format(new Date(booking.check_out_date), "MMM d, yyyy")}
                                                                    </p>
                                                                </div>
                                                                <div className="bg-[var(--card-bg)] rounded-lg p-3">
                                                                    <p className="text-[10px] uppercase font-semibold text-[var(--muted-text)] mb-1 tracking-wide">Total</p>
                                                                    <p className="text-sm font-bold text-gold-500 flex items-center gap-1">
                                                                        <Coins className="w-3 h-3" />
                                                                        {booking.total_price} DH
                                                                    </p>
                                                                </div>
                                                                <div className="bg-[var(--card-bg)] rounded-lg p-3">
                                                                    <p className="text-[10px] uppercase font-semibold text-[var(--muted-text)] mb-1 tracking-wide">Email</p>
                                                                    <p className="text-xs text-[var(--page-text)] truncate">
                                                                        {booking.profiles?.email || "—"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        );
                                    })}
                                </>
                            )}
                        </div>

                        {/* Property Prices Row */}
                        <div className="px-5 pb-5">
                            <p className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wide mb-3">
                                Property Prices
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {properties.slice(0, 4).map((property: any) => {
                                    const price = getPriceForDay(property, selectedDate);
                                    const isBooked = selectedDayBookings.some((b: any) => b.property_id === property.id);
                                    return (
                                        <div
                                            key={property.id}
                                            className={`rounded-xl p-3 border flex items-center justify-between gap-2 ${isBooked
                                                ? "border-green-500/30 bg-green-500/5"
                                                : "border-[var(--card-border)] bg-[var(--surface-100)]"
                                                }`}
                                        >
                                            <p className="text-xs font-medium text-[var(--page-text)] truncate flex-1">
                                                {property.title}
                                            </p>
                                            <div className="text-right shrink-0">
                                                {isBooked ? (
                                                    <span className="text-[10px] text-green-500 font-bold">Booked</span>
                                                ) : (
                                                    <span className="text-xs font-bold text-gold-500">{price} DH</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {properties.length > 4 && (
                                <p className="text-xs text-center text-[var(--muted-text)] mt-2">
                                    + {properties.length - 4} more properties
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
