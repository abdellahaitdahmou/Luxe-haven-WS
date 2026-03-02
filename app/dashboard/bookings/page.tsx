"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
    Loader2, Search, Eye, MessageCircle, Calendar, DollarSign,
    TrendingUp, Clock, ChevronLeft, ChevronRight, Building2, BedDouble,
    CheckCircle2, XCircle, User, Mail, CalendarCheck, Pencil
} from "lucide-react";
import Link from "next/link";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import { updateBookingStatus } from "@/app/actions/bookings";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
const PAGE_SIZE = 10;

function getStatusStyle(status: string) {
    switch (status) {
        case "confirmed": return "bg-green-500/20 text-green-400 border-green-500/50";
        case "pending": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
        case "cancelled": return "bg-red-500/20 text-red-400 border-red-500/50";
        case "completed": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
        default: return "bg-gray-500/20 text-[var(--muted-text)] border-gray-500/50";
    }
}

function nightsBetween(checkIn: string, checkOut: string) {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 1);
}

export default function BookingsPage() {
    const [allBookings, setAllBookings] = useState<any[]>([]);
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));
    const [selectedMonth, setSelectedMonth] = useState("all");
    const [selectedProperty, setSelectedProperty] = useState("all");
    const [selectedBedrooms, setSelectedBedrooms] = useState("all");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    // Detail Dialog
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [showReschedule, setShowReschedule] = useState(false);
    const [rescheduleIn, setRescheduleIn] = useState("");
    const [rescheduleOut, setRescheduleOut] = useState("");
    const [rescheduleLoading, setRescheduleLoading] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, search, selectedYear, selectedMonth, selectedProperty, selectedBedrooms]);

    const fetchBookings = async () => {
        setLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch properties
        const { data: props } = await supabase
            .from("properties")
            .select("id, title, bedrooms")
            .eq("owner_id", user.id);
        setProperties(props || []);

        const propertyIds = props?.map((p) => p.id) || [];
        if (propertyIds.length === 0) {
            setLoading(false);
            return;
        }

        // Fetch bookings — use guest_id (correct FK)
        const { data: bookingsData } = await supabase
            .from("bookings")
            .select(`*, profiles:guest_id (id, full_name, email, avatar_url), properties (title, bedrooms, image_urls)`)
            .in("property_id", propertyIds)
            .order("created_at", { ascending: false });

        setAllBookings(bookingsData || []);
        setLoading(false);
    };

    // Filtered bookings
    const filteredBookings = useMemo(() => {
        return allBookings.filter((b) => {
            const bookingDate = new Date(b.check_in_date);

            // Status
            const statusMatch =
                statusFilter === "all" ? true :
                    statusFilter === "pending" ? b.status === "pending" :
                        statusFilter === "upcoming" ? new Date(b.check_in_date) > new Date() && b.status === "confirmed" :
                            statusFilter === "completed" ? new Date(b.check_out_date) < new Date() && b.status !== "cancelled" :
                                statusFilter === "cancelled" ? b.status === "cancelled" : true;

            // Search
            const searchMatch = !search ||
                b.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                b.properties?.title?.toLowerCase().includes(search.toLowerCase());

            // Year
            const yearMatch = bookingDate.getFullYear() === parseInt(selectedYear);

            // Month
            const monthMatch = selectedMonth === "all" || bookingDate.getMonth() === parseInt(selectedMonth);

            // Property
            const propMatch = selectedProperty === "all" || b.property_id === selectedProperty;

            // Bedrooms
            const bedroomMatch = selectedBedrooms === "all" || (b.properties?.bedrooms || 0) === parseInt(selectedBedrooms);

            return statusMatch && searchMatch && yearMatch && monthMatch && propMatch && bedroomMatch;
        });
    }, [allBookings, statusFilter, search, selectedYear, selectedMonth, selectedProperty, selectedBedrooms]);

    // Stats
    const stats = useMemo(() => {
        const revenue = filteredBookings.reduce((acc, b) => acc + (b.total_price || 0), 0);
        const upcoming = filteredBookings.filter((b) => new Date(b.check_in_date) > new Date() && b.status !== "cancelled").length;
        const totalNights = filteredBookings.reduce((acc, b) => acc + nightsBetween(b.check_in_date, b.check_out_date), 0);
        const avgDuration = filteredBookings.length > 0 ? (totalNights / filteredBookings.length).toFixed(1) : "0";
        return { count: filteredBookings.length, revenue, upcoming, avgDuration };
    }, [filteredBookings]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
    const paginatedBookings = filteredBookings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const showingFrom = filteredBookings.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const showingTo = Math.min(currentPage * PAGE_SIZE, filteredBookings.length);

    // Bedroom options
    const bedroomOptions = useMemo(() => {
        const set = new Set(properties.map((p) => p.bedrooms).filter(Boolean));
        return Array.from(set).sort((a: any, b: any) => a - b);
    }, [properties]);

    // Actions — goes through API so notifications are sent
    const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
        setActionLoading(bookingId);
        try {
            const result = await updateBookingStatus(bookingId, newStatus as 'confirmed' | 'cancelled');
            if (result.success) {
                const label = newStatus === "confirmed" ? "accepted" : "declined";
                toast.success(`Booking ${label}!`);
                setAllBookings((prev) =>
                    prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
                );
                if (selectedBooking?.id === bookingId) {
                    setSelectedBooking((prev: any) => ({ ...prev, status: newStatus }));
                }
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to update booking");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReschedule = async () => {
        if (!selectedBooking || !rescheduleIn || !rescheduleOut) return;
        setRescheduleLoading(true);
        try {
            const res = await fetch(`/api/bookings/${selectedBooking.id}/reschedule`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ check_in_date: rescheduleIn, check_out_date: rescheduleOut }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to reschedule");
            toast.success("Dates updated and guest notified!");
            setAllBookings((prev) =>
                prev.map((b) => b.id === selectedBooking.id
                    ? { ...b, check_in_date: rescheduleIn, check_out_date: rescheduleOut, total_price: data.total_price }
                    : b)
            );
            setSelectedBooking((prev: any) => ({
                ...prev,
                check_in_date: rescheduleIn,
                check_out_date: rescheduleOut,
                total_price: data.total_price,
            }));
            setShowReschedule(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to reschedule");
        } finally {
            setRescheduleLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-1">Bookings</h1>
                <p className="text-[var(--muted-text)]">Manage and track all your guest reservations.</p>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-4 bg-[var(--card-bg)] border border-white/10 rounded-lg p-4">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-[var(--muted-text)] font-medium">Year</label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[120px] bg-[var(--surface-100)] border-white/10 text-[var(--page-text)]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--surface-100)] border-white/10 text-[var(--page-text)]">
                            {YEARS.map((y) => (
                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-[var(--muted-text)] font-medium">Month</label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[140px] bg-[var(--surface-100)] border-white/10 text-[var(--page-text)]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--surface-100)] border-white/10 text-[var(--page-text)]">
                            <SelectItem value="all">All Months</SelectItem>
                            {MONTHS.map((m, idx) => (
                                <SelectItem key={idx} value={String(idx)}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-[var(--muted-text)] font-medium">Property</label>
                    <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                        <SelectTrigger className="w-[200px] bg-[var(--surface-100)] border-white/10 text-[var(--page-text)]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--surface-100)] border-white/10 text-[var(--page-text)]">
                            <SelectItem value="all">All Properties</SelectItem>
                            {properties.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-[var(--muted-text)] font-medium">Bedrooms</label>
                    <Select value={selectedBedrooms} onValueChange={setSelectedBedrooms}>
                        <SelectTrigger className="w-[130px] bg-[var(--surface-100)] border-white/10 text-[var(--page-text)]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--surface-100)] border-white/10 text-[var(--page-text)]">
                            <SelectItem value="all">All</SelectItem>
                            {bedroomOptions.map((b: any) => (
                                <SelectItem key={b} value={String(b)}>{b} Bedroom{b > 1 ? "s" : ""}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card className="bg-[var(--card-bg)] border-white/10 text-[var(--page-text)]">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-gold-500/10 rounded-lg">
                            <Calendar className="w-5 h-5 text-gold-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.count}</p>
                            <p className="text-xs text-[var(--muted-text)]">Total Bookings</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-[var(--card-bg)] border-white/10 text-[var(--page-text)]">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gold-500">${stats.revenue.toFixed(2)}</p>
                            <p className="text-xs text-[var(--muted-text)]">Total Revenue</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-[var(--card-bg)] border-white/10 text-[var(--page-text)]">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.upcoming}</p>
                            <p className="text-xs text-[var(--muted-text)]">Upcoming</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-[var(--card-bg)] border-white/10 text-[var(--page-text)]">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Clock className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.avgDuration}</p>
                            <p className="text-xs text-[var(--muted-text)]">Avg. Nights</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Status Tabs */}
            <Card className="bg-[var(--card-bg)] border-white/10 text-[var(--page-text)]">
                <CardHeader className="pb-2">
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--muted-text)]" />
                            <Input
                                placeholder="Search guest or property..."
                                className="pl-10 bg-[var(--surface-100)] border-[var(--card-border)]"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Tabs defaultValue="all" onValueChange={setStatusFilter} className="w-full md:w-auto">
                            <TabsList className="bg-[var(--surface-100)] border border-[var(--card-border)]">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="pending" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
                                    Pending {allBookings.filter(b => b.status === 'pending').length > 0 && (
                                        <span className="ml-1.5 bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                            {allBookings.filter(b => b.status === 'pending').length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                                <TabsTrigger value="completed">Completed</TabsTrigger>
                                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Table */}
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-white/5">
                                <TableHead className="text-[var(--muted-text)]">Guest</TableHead>
                                <TableHead className="text-[var(--muted-text)]">Property</TableHead>
                                <TableHead className="text-[var(--muted-text)]">Dates</TableHead>
                                <TableHead className="text-[var(--muted-text)]">Nights</TableHead>
                                <TableHead className="text-[var(--muted-text)]">Total</TableHead>
                                <TableHead className="text-[var(--muted-text)]">Status</TableHead>
                                <TableHead className="text-right text-[var(--muted-text)]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedBookings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-[var(--muted-text)]">
                                        <div className="flex flex-col items-center gap-2">
                                            <Calendar className="w-10 h-10 text-gray-600" />
                                            <p>No bookings match your filters.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedBookings.map((booking) => (
                                    <TableRow
                                        key={booking.id}
                                        className="border-white/10 hover:bg-white/5 cursor-pointer transition-colors"
                                        onClick={() => setSelectedBooking(booking)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-500 font-bold text-sm shrink-0">
                                                    {booking.profiles?.full_name?.charAt(0)?.toUpperCase() || "G"}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white text-sm">{booking.profiles?.full_name || "Guest"}</p>
                                                    <p className="text-xs text-[var(--muted-text)]">{booking.profiles?.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-white max-w-[180px]">
                                            <p className="truncate text-sm">{booking.properties?.title}</p>
                                            {booking.properties?.bedrooms && (
                                                <p className="text-xs text-[var(--muted-text)] flex items-center gap-1 mt-0.5">
                                                    <BedDouble className="w-3 h-3" /> {booking.properties.bedrooms} bed{booking.properties.bedrooms > 1 ? "s" : ""}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-[var(--muted-text)]">
                                            <div className="flex flex-col text-xs">
                                                <span>{new Date(booking.check_in_date).toLocaleDateString()}</span>
                                                <span className="text-gray-600">→ {new Date(booking.check_out_date).toLocaleDateString()}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[var(--muted-text)] text-sm">
                                            {nightsBetween(booking.check_in_date, booking.check_out_date)}
                                        </TableCell>
                                        <TableCell className="font-bold text-gold-500">
                                            ${booking.total_price}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getStatusStyle(booking.status)}>
                                                {booking.status?.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="hover:bg-white/10 h-8 w-8"
                                                    onClick={() => setSelectedBooking(booking)}
                                                >
                                                    <Eye className="w-4 h-4 text-[var(--muted-text)]" />
                                                </Button>

                                                {/* Review Guest Button */}
                                                {(booking.status === 'completed' || (new Date(booking.check_out_date) < new Date() && booking.status !== 'cancelled')) && (
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <ReviewModal
                                                            bookingId={booking.id}
                                                            guestName={booking.profiles?.full_name}
                                                            type="guest"
                                                            targetId={booking.profiles?.id}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {filteredBookings.length > 0 && (
                        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-4">
                            <p className="text-sm text-[var(--muted-text)]">
                                Showing {showingFrom}–{showingTo} of {filteredBookings.length} booking{filteredBookings.length !== 1 ? "s" : ""}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => p - 1)}
                                    className="bg-[var(--surface-100)] border-white/10 text-white hover:bg-white/10 disabled:opacity-30"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                                </Button>
                                <span className="text-sm text-[var(--muted-text)] px-2">
                                    {currentPage} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                    className="bg-[var(--surface-100)] border-white/10 text-white hover:bg-white/10 disabled:opacity-30"
                                >
                                    Next <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Booking Detail Dialog */}
            <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
                <DialogContent className="bg-[var(--surface-100)] border-white/10 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Booking Details</DialogTitle>
                    </DialogHeader>
                    {selectedBooking && (
                        <div className="space-y-5 pt-2">
                            {/* Guest Info */}
                            <div className="flex items-center gap-4 p-4 bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)]">
                                <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-500 font-bold text-lg shrink-0">
                                    {selectedBooking.profiles?.full_name?.charAt(0)?.toUpperCase() || "G"}
                                </div>
                                <div>
                                    <p className="font-bold text-white text-lg">{selectedBooking.profiles?.full_name || "Guest"}</p>
                                    <p className="text-sm text-[var(--muted-text)] flex items-center gap-1">
                                        <Mail className="w-3 h-3" /> {selectedBooking.profiles?.email || "N/A"}
                                    </p>
                                </div>
                            </div>

                            {/* Property & Details Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)]">
                                    <p className="text-xs text-[var(--muted-text)] mb-1 flex items-center gap-1"><Building2 className="w-3 h-3" /> Property</p>
                                    <p className="font-medium text-white text-sm">{selectedBooking.properties?.title}</p>
                                </div>
                                <div className="p-3 bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)]">
                                    <p className="text-xs text-[var(--muted-text)] mb-1 flex items-center gap-1"><BedDouble className="w-3 h-3" /> Bedrooms</p>
                                    <p className="font-medium text-white text-sm">{selectedBooking.properties?.bedrooms || "—"}</p>
                                </div>
                                <div className="p-3 bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)]">
                                    <p className="text-xs text-[var(--muted-text)] mb-1">Check-in</p>
                                    <p className="font-medium text-white text-sm">{new Date(selectedBooking.check_in_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p>
                                </div>
                                <div className="p-3 bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)]">
                                    <p className="text-xs text-[var(--muted-text)] mb-1">Check-out</p>
                                    <p className="font-medium text-white text-sm">{new Date(selectedBooking.check_out_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p>
                                </div>
                            </div>

                            {/* Price & Status */}
                            <div className="flex items-center justify-between p-4 bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)]">
                                <div>
                                    <p className="text-xs text-[var(--muted-text)] mb-1">Total Price</p>
                                    <p className="text-2xl font-bold text-gold-500">${selectedBooking.total_price}</p>
                                    <p className="text-xs text-[var(--muted-text)]">{nightsBetween(selectedBooking.check_in_date, selectedBooking.check_out_date)} night{nightsBetween(selectedBooking.check_in_date, selectedBooking.check_out_date) > 1 ? "s" : ""}</p>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className={`text-sm px-3 py-1 ${getStatusStyle(selectedBooking.status)}`}>
                                        {selectedBooking.status?.toUpperCase()}
                                    </Badge>
                                    <p className="text-xs text-[var(--muted-text)] mt-2">
                                        Booked {new Date(selectedBooking.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            {selectedBooking.status === "pending" && (
                                <div className="flex gap-3 pt-1">
                                    <Button
                                        onClick={() => handleStatusUpdate(selectedBooking.id, "confirmed")}
                                        disabled={actionLoading === selectedBooking.id}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-[var(--page-text)]"
                                    >
                                        {actionLoading === selectedBooking.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                        )}
                                        Accept Request
                                    </Button>
                                    <Button
                                        onClick={() => handleStatusUpdate(selectedBooking.id, "cancelled")}
                                        disabled={actionLoading === selectedBooking.id}
                                        variant="outline"
                                        className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Decline
                                    </Button>
                                </div>
                            )}

                            {selectedBooking.status === "confirmed" && (
                                <div className="space-y-3 pt-1">
                                    {/* Change dates toggle */}
                                    <Button
                                        onClick={() => {
                                            setShowReschedule(v => !v);
                                            setRescheduleIn(selectedBooking.check_in_date);
                                            setRescheduleOut(selectedBooking.check_out_date);
                                        }}
                                        variant="outline"
                                        className="w-full border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                                    >
                                        <Pencil className="w-4 h-4 mr-2" />
                                        Change Dates
                                    </Button>

                                    {/* Inline reschedule form */}
                                    {showReschedule && (
                                        <div className="rounded-xl border border-[var(--card-border)] p-4 space-y-3 bg-[var(--page-bg)]">
                                            <p className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider">New Dates</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs text-[var(--muted-text)] mb-1 block">Check-in</label>
                                                    <input
                                                        type="date"
                                                        value={rescheduleIn}
                                                        onChange={e => setRescheduleIn(e.target.value)}
                                                        className="w-full bg-[var(--surface-100)] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500/50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-[var(--muted-text)] mb-1 block">Check-out</label>
                                                    <input
                                                        type="date"
                                                        value={rescheduleOut}
                                                        onChange={e => setRescheduleOut(e.target.value)}
                                                        className="w-full bg-[var(--surface-100)] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500/50"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={handleReschedule}
                                                    disabled={rescheduleLoading || !rescheduleIn || !rescheduleOut}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                                >
                                                    {rescheduleLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CalendarCheck className="w-4 h-4 mr-2" />}
                                                    Save & Notify Guest
                                                </Button>
                                                <Button
                                                    onClick={() => setShowReschedule(false)}
                                                    variant="ghost"
                                                    className="text-[var(--muted-text)] hover:bg-white/10"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Cancel booking */}
                                    <Button
                                        onClick={() => handleStatusUpdate(selectedBooking.id, "cancelled")}
                                        disabled={actionLoading === selectedBooking.id}
                                        variant="outline"
                                        className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                    >
                                        {actionLoading === selectedBooking.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                            <XCircle className="w-4 h-4 mr-2" />
                                        )}
                                        Cancel Booking
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
