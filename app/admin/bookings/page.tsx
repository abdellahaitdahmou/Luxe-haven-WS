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
    Loader2, Search, Eye, Calendar, DollarSign,
    TrendingUp, Clock, ChevronLeft, ChevronRight, Building2, BedDouble,
    CheckCircle2, XCircle, User, Mail, ShieldAlert
} from "lucide-react";

const PAGE_SIZE = 10;

function getStatusStyle(status: string) {
    switch (status) {
        case "confirmed": return "bg-green-500/20 text-green-400 border-green-500/50";
        case "pending": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
        case "cancelled": return "bg-red-500/20 text-red-400 border-red-500/50";
        case "completed": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
        default: return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
}

function nightsBetween(checkIn: string, checkOut: string) {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 1);
}

export default function AdminBookingsPage() {
    const [allBookings, setAllBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    // Detail Dialog
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, search]);

    const fetchBookings = async () => {
        setLoading(true);
        const supabase = createClient();

        // Fetch ALL bookings (Admin privilege)
        // We include both Guest (user_id) and Host (property owner) info ideally, 
        // but property owner is linked via property.
        const { data: bookingsData, error } = await supabase
            .from("bookings")
            .select(`
                *,
                profiles:user_id (id, full_name, email, avatar_url),
                properties (
                    title, 
                    bedrooms, 
                    images,
                    owner:owner_id (full_name, email)
                )
            `)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching bookings:", error);
            toast.error("Failed to load bookings");
        } else {
            setAllBookings(bookingsData || []);
        }
        setLoading(false);
    };

    // Filtered bookings
    const filteredBookings = useMemo(() => {
        return allBookings.filter((b) => {
            // Status
            const statusMatch =
                statusFilter === "all" ? true :
                    statusFilter === "upcoming" ? new Date(b.check_in_date) > new Date() && b.status !== "cancelled" :
                        statusFilter === "completed" ? new Date(b.check_out_date) < new Date() && b.status !== "cancelled" :
                            statusFilter === "cancelled" ? b.status === "cancelled" : true;

            // Search (Guest Name, Property Title, or Host Name)
            const searchLower = search.toLowerCase();
            const searchMatch = !search ||
                b.profiles?.full_name?.toLowerCase().includes(searchLower) ||
                b.properties?.title?.toLowerCase().includes(searchLower) ||
                // @ts-ignore - Supabase join typing can be tricky
                b.properties?.owner?.full_name?.toLowerCase().includes(searchLower) ||
                b.id.toLowerCase().includes(searchLower);

            return statusMatch && searchMatch;
        });
    }, [allBookings, statusFilter, search]);

    // Stats
    const stats = useMemo(() => {
        const revenue = filteredBookings.reduce((acc, b) => acc + (b.total_price || 0), 0);
        const active = filteredBookings.filter((b) => b.status === "confirmed" || b.status === "pending").length;
        const cancelled = filteredBookings.filter((b) => b.status === "cancelled").length;

        return { count: filteredBookings.length, revenue, active, cancelled };
    }, [filteredBookings]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
    const paginatedBookings = filteredBookings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const showingFrom = filteredBookings.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const showingTo = Math.min(currentPage * PAGE_SIZE, filteredBookings.length);

    // Actions
    const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
        if (!confirm(`Are you sure you want to change this booking to ${newStatus}? This action is irreversible.`)) return;

        setActionLoading(bookingId);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("bookings")
                .update({ status: newStatus })
                .eq("id", bookingId);

            if (error) throw error;

            toast.success(`Booking ${newStatus} successfully!`);
            setAllBookings((prev) =>
                prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
            );
            if (selectedBooking?.id === bookingId) {
                setSelectedBooking((prev: any) => ({ ...prev, status: newStatus }));
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to update booking");
        } finally {
            setActionLoading(null);
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
                <h1 className="text-3xl font-bold text-white mb-1">Bookings Administration</h1>
                <p className="text-gray-400">Manage all bookings across the platform.</p>
            </div>

            {/* Stats Row */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card className="bg-surface-50 border-white/10 text-white">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-gold-500/10 rounded-lg">
                            <Calendar className="w-5 h-5 text-gold-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.count}</p>
                            <p className="text-xs text-gray-400">Total Bookings</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-surface-50 border-white/10 text-white">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gold-500">${stats.revenue.toFixed(2)}</p>
                            <p className="text-xs text-gray-400">Total Volume</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-surface-50 border-white/10 text-white">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.active}</p>
                            <p className="text-xs text-gray-400">Active / Pending</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-surface-50 border-white/10 text-white">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <XCircle className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.cancelled}</p>
                            <p className="text-xs text-gray-400">Cancelled</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card className="bg-surface-50 border-white/10 text-white">
                <CardHeader className="pb-2">
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search guest, host, booking ID..."
                                className="pl-10 bg-surface-100 border-white/10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Tabs defaultValue="all" onValueChange={setStatusFilter} className="w-full md:w-auto">
                            <TabsList className="bg-surface-100 border border-white/10">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                                <TabsTrigger value="completed">Completed</TabsTrigger>
                                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-white/5">
                                <TableHead className="text-gray-400">Guest</TableHead>
                                <TableHead className="text-gray-400">Property</TableHead>
                                <TableHead className="text-gray-400">Host</TableHead>
                                <TableHead className="text-gray-400">Dates</TableHead>
                                <TableHead className="text-gray-400">Total</TableHead>
                                <TableHead className="text-gray-400">Status</TableHead>
                                <TableHead className="text-right text-gray-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedBookings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Calendar className="w-10 h-10 text-gray-600" />
                                            <p>No bookings found.</p>
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
                                                    <p className="text-xs text-gray-500">{booking.profiles?.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-white max-w-[180px]">
                                            <p className="truncate text-sm font-medium">{booking.properties?.title}</p>
                                            <p className="text-xs text-gray-500 truncate">{booking.id}</p>
                                        </TableCell>
                                        <TableCell>
                                            {/* @ts-ignore - Supabase join typing workaround */}
                                            <p className="text-sm text-gray-300">{booking.properties?.owner?.full_name || "Unknown"}</p>
                                        </TableCell>
                                        <TableCell className="text-gray-400">
                                            <div className="flex flex-col text-xs">
                                                <span>{new Date(booking.check_in_date).toLocaleDateString()}</span>
                                                <span className="text-gray-600">→ {new Date(booking.check_out_date).toLocaleDateString()}</span>
                                            </div>
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
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="hover:bg-white/10 h-8 w-8"
                                                onClick={() => setSelectedBooking(booking)}
                                            >
                                                <Eye className="w-4 h-4 text-gray-400" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {filteredBookings.length > 0 && (
                        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-4">
                            <p className="text-sm text-gray-400">
                                Showing {showingFrom}–{showingTo} of {filteredBookings.length} bookings
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => p - 1)}
                                    className="bg-surface-100 border-white/10 text-white hover:bg-white/10 disabled:opacity-30"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                                </Button>
                                <span className="text-sm text-gray-400 px-2">
                                    {currentPage} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                    className="bg-surface-100 border-white/10 text-white hover:bg-white/10 disabled:opacity-30"
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
                <DialogContent className="bg-surface-100 border-white/10 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Booking Details</DialogTitle>
                    </DialogHeader>
                    {selectedBooking && (
                        <div className="space-y-5 pt-2">
                            {/* Guest Info */}
                            <div className="flex items-center gap-4 p-4 bg-surface-50 rounded-lg border border-white/5">
                                <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-500 font-bold text-lg shrink-0">
                                    {selectedBooking.profiles?.full_name?.charAt(0)?.toUpperCase() || "G"}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Guest</p>
                                    <p className="font-bold text-white text-lg">{selectedBooking.profiles?.full_name || "Guest"}</p>
                                    <p className="text-sm text-gray-400 flex items-center gap-1">
                                        <Mail className="w-3 h-3" /> {selectedBooking.profiles?.email || "N/A"}
                                    </p>
                                </div>
                            </div>

                            {/* Property Info */}
                            <div className="p-4 bg-surface-50 rounded-lg border border-white/5">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Property</p>
                                        <p className="font-medium text-white">{selectedBooking.properties?.title}</p>
                                    </div>
                                    <Badge variant="outline" className="border-gold-500/30 text-gold-500">
                                        ID: {selectedBooking.id.slice(0, 8)}...
                                    </Badge>
                                </div>
                                <div className="text-sm text-gray-400 border-t border-white/5 pt-3 mt-2 flex justify-between">
                                    <span>Host:</span>
                                    {/* @ts-ignore */}
                                    <span className="text-white">{selectedBooking.properties?.owner?.full_name || "Unknown"}</span>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-surface-50 rounded-lg border border-white/5">
                                    <p className="text-xs text-gray-400 mb-1">Check-in</p>
                                    <p className="font-medium text-white text-sm">{new Date(selectedBooking.check_in_date).toLocaleDateString()}</p>
                                </div>
                                <div className="p-3 bg-surface-50 rounded-lg border border-white/5">
                                    <p className="text-xs text-gray-400 mb-1">Check-out</p>
                                    <p className="font-medium text-white text-sm">{new Date(selectedBooking.check_out_date).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div className="flex items-center justify-between p-4 bg-surface-50 rounded-lg border border-white/5">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Total Amount</p>
                                    <p className="text-2xl font-bold text-gold-500">${selectedBooking.total_price}</p>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className={`text-sm px-3 py-1 ${getStatusStyle(selectedBooking.status)}`}>
                                        {selectedBooking.status?.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>

                            {/* Admin Actions */}
                            {selectedBooking.status !== "cancelled" && selectedBooking.status !== "completed" && (
                                <div className="pt-2">
                                    <p className="text-xs text-red-400 font-bold mb-2 flex items-center gap-1">
                                        <ShieldAlert className="w-3 h-3" /> ADMIN ZONE
                                    </p>
                                    <Button
                                        onClick={() => handleStatusUpdate(selectedBooking.id, "cancelled")}
                                        disabled={actionLoading === selectedBooking.id}
                                        variant="destructive"
                                        className="w-full bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/50"
                                    >
                                        {actionLoading === selectedBooking.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                            <XCircle className="w-4 h-4 mr-2" />
                                        )}
                                        Force Cancel Booking
                                    </Button>
                                    <p className="text-[10px] text-gray-500 mt-2 text-center">
                                        This action will cancel the booking without host/guest consent. Use with caution.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
