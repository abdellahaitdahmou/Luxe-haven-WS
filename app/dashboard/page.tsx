"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Users, Star, Calendar, Loader2, TrendingUp, Building2, Map, ArrowRight, MessageCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// ... (Host Dashboard Constants & Logic - Keeping existing code structure but wrapping in a component)

function HostDashboard({ user }: { user: any }) {
    // ... (Paste existing Host Dashboard Logic here)
    // For brevity in this tool call, I will include the full code below.
    // This is a placeholder comment to indicate structure.

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ earnings: 0, totalBookings: 0, averageRating: 0, activeListings: 0 });
    const [allBookings, setAllBookings] = useState<any[]>([]);
    const [properties, setProperties] = useState<any[]>([]);

    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const CURRENT_YEAR = new Date().getFullYear();
    const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

    // Filters
    const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));
    const [selectedMonth, setSelectedMonth] = useState("all");
    const [selectedProperty, setSelectedProperty] = useState("all");
    const [selectedBedrooms, setSelectedBedrooms] = useState("all");

    async function fetchDashboardData() {
        const supabase = createClient();

        // Fetch Properties
        const { data: props } = await supabase
            .from("properties")
            .select("id, title, rating, bedrooms")
            .eq("owner_id", user.id);
        setProperties(props || []);

        const propertyIds = props?.map((p) => p.id) || [];
        const activeListings = props?.length || 0;
        const totalRating = props?.reduce((acc, curr) => acc + (curr.rating || 0), 0) || 0;
        const averageRating = activeListings > 0 ? parseFloat((totalRating / activeListings).toFixed(1)) : 0;

        // Fetch ALL Bookings
        let bookingsData: any[] = [];
        if (propertyIds.length > 0) {
            const { data } = await supabase
                .from("bookings")
                .select(`*, profiles:user_id (full_name, email), properties (title, bedrooms)`)
                .in("property_id", propertyIds)
                .order("created_at", { ascending: false });
            bookingsData = data || [];
        }
        setAllBookings(bookingsData);

        // Wallet
        const { data: wallet } = await supabase
            .from("wallets")
            .select("available_balance, pending_balance")
            .eq("user_id", user.id)
            .single();
        const earnings = (wallet?.available_balance || 0) + (wallet?.pending_balance || 0);

        setStats({ earnings, totalBookings: bookingsData.length, averageRating, activeListings });
        setLoading(false);
    }

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Filtered Bookings
    const filteredBookings = useMemo(() => {
        return allBookings.filter((b) => {
            const bookingDate = new Date(b.check_in_date);
            const yearMatch = bookingDate.getFullYear() === parseInt(selectedYear);
            const monthMatch = selectedMonth === "all" || bookingDate.getMonth() === parseInt(selectedMonth);
            const propMatch = selectedProperty === "all" || b.property_id === selectedProperty;
            const bedroomMatch = selectedBedrooms === "all" || (b.properties?.bedrooms || 0) === parseInt(selectedBedrooms);
            return yearMatch && monthMatch && propMatch && bedroomMatch;
        });
    }, [allBookings, selectedYear, selectedMonth, selectedProperty, selectedBedrooms]);

    // Chart Data
    const chartData = useMemo(() => {
        return MONTHS.map((month, idx) => {
            const monthBookings = filteredBookings.filter((b) => {
                const d = new Date(b.check_in_date);
                return d.getMonth() === idx;
            });
            const revenue = monthBookings.reduce((acc, b) => acc + (b.total_price || 0), 0);
            return { name: month, revenue, bookings: monthBookings.length };
        });
    }, [filteredBookings]);

    // Dynamic stats
    const filteredStats = useMemo(() => {
        const revenue = filteredBookings.reduce((acc, b) => acc + (b.total_price || 0), 0);
        return { revenue, count: filteredBookings.length };
    }, [filteredBookings]);

    // Unique bedroom counts
    const bedroomOptions = useMemo(() => {
        const set = new Set(properties.map((p) => p.bedrooms).filter(Boolean));
        return Array.from(set).sort((a, b) => a - b);
    }, [properties]);

    if (loading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold-500" /></div>;
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Host Dashboard</h1>
                <p className="text-gray-400">Welcome back! Here's what's happening with your listings.</p>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-4 bg-surface-50 border border-white/10 rounded-lg p-4">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 font-medium">Year</label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[120px] bg-surface-100 border-white/10 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-surface-100 border-white/10 text-white">
                            {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 font-medium">Month</label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[140px] bg-surface-100 border-white/10 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-surface-100 border-white/10 text-white">
                            <SelectItem value="all">All Months</SelectItem>
                            {MONTHS.map((m, idx) => <SelectItem key={idx} value={String(idx)}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 font-medium">Property</label>
                    <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                        <SelectTrigger className="w-[200px] bg-surface-100 border-white/10 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-surface-100 border-white/10 text-white">
                            <SelectItem value="all">All Properties</SelectItem>
                            {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 font-medium">Bedrooms</label>
                    <Select value={selectedBedrooms} onValueChange={setSelectedBedrooms}>
                        <SelectTrigger className="w-[130px] bg-surface-100 border-white/10 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-surface-100 border-white/10 text-white">
                            <SelectItem value="all">All</SelectItem>
                            {bedroomOptions.map((b) => <SelectItem key={b} value={String(b)}>{b} Bedroom{b > 1 ? "s" : ""}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-surface-50 border-white/10 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total Earnings</CardTitle>
                        <DollarSign className="h-4 w-4 text-gold-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.earnings.toFixed(2)}</div>
                        <p className="text-xs text-gray-500 mt-1">Wallet balance (all time)</p>
                    </CardContent>
                </Card>
                <Card className="bg-surface-50 border-white/10 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Filtered Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-gold-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gold-500">${filteredStats.revenue.toFixed(2)}</div>
                        <p className="text-xs text-gray-500 mt-1">Based on current filters</p>
                    </CardContent>
                </Card>
                <Card className="bg-surface-50 border-white/10 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Filtered Bookings</CardTitle>
                        <Users className="h-4 w-4 text-gold-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{filteredStats.count}</div>
                        <p className="text-xs text-gray-500 mt-1">of {stats.totalBookings} total</p>
                    </CardContent>
                </Card>
                <Card className="bg-surface-50 border-white/10 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Average Rating</CardTitle>
                        <Star className="h-4 w-4 text-gold-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.averageRating}</div>
                        <p className="text-xs text-gray-500 mt-1">{stats.activeListings} active listings</p>
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            <Card className="bg-surface-50 border-white/10 text-white p-6">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-lg">Revenue & Bookings — {selectedYear}</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EAB308" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                                <YAxis yAxisId="left" stroke="#6B7280" fontSize={12} tickFormatter={(v) => `$${v}`} />
                                <YAxis yAxisId="right" orientation="right" stroke="#6B7280" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }}
                                    formatter={(value: any, name: any) => [name === "revenue" ? `$${value.toFixed(2)}` : value, name === "revenue" ? "Revenue" : "Bookings"]}
                                />
                                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#EAB308" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                                <Area yAxisId="right" type="monotone" dataKey="bookings" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorBookings)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Bookings */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">
                    Recent Bookings
                    {filteredBookings.length !== allBookings.length && <span className="text-sm font-normal text-gray-400 ml-2">(Showing {filteredBookings.length} of {allBookings.length})</span>}
                </h2>
                {filteredBookings.length === 0 ? (
                    <Card className="bg-surface-50 border-white/10 text-white p-6 text-center text-gray-400">No bookings match your filters.</Card>
                ) : (
                    <div className="grid gap-4">
                        {filteredBookings.slice(0, 8).map((booking) => (
                            <div key={booking.id} className="bg-surface-50 border border-white/10 rounded-lg p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-500 font-bold">{booking.profiles?.full_name?.charAt(0) || "G"}</div>
                                    <div>
                                        <p className="font-bold text-white">{booking.profiles?.full_name || "Guest"}</p>
                                        <p className="text-sm text-gray-400">{booking.properties?.title}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center justify-end space-x-2 mb-1">
                                        <span className="font-bold text-gold-500">${booking.total_price}</span>
                                        <Badge variant="outline" className={`${booking.status === "confirmed" ? "bg-green-500/20 text-green-500 border-green-500/50" : ""} ${booking.status === "pending" ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/50" : ""} ${booking.status === "cancelled" ? "bg-red-500/20 text-red-500 border-red-500/50" : ""}`}>{booking.status}</Badge>
                                    </div>
                                    <p className="text-xs text-gray-500">{new Date(booking.check_in_date).toLocaleDateString()} — {new Date(booking.check_out_date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function TravelerDashboard({ user }: { user: any }) {
    const [upcomingTrip, setUpcomingTrip] = useState<any>(null);
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient();

            // 1. Fetch Upcoming Trip
            const { data: trip } = await supabase
                .from('bookings')
                .select('*, properties(title, image_url)')
                .eq('user_id', user.id)
                .gte('check_in_date', new Date().toISOString())
                .order('check_in_date', { ascending: true })
                .limit(1)
                .maybeSingle(); // Fix .single() error if no trip exists
            setUpcomingTrip(trip);

            // 2. Fetch All Properties (Active)
            const { data: props } = await supabase
                .from('properties')
                .select('*, owner:profiles(full_name, avatar_url)')
                .eq('status', 'active') // Ensure we only show active properties
                .order('created_at', { ascending: false });
            setProperties(props || []);

            setLoading(false);
        }
        fetchData();
    }, [user.id]);

    return (
        <div className="max-w-7xl mx-auto space-y-12">
            <div>
                <h1 className="text-4xl font-bold text-white mb-4">
                    Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || "Traveler"} 👋
                </h1>
                <p className="text-gray-400 text-lg">Find your next extraordinary stay.</p>
            </div>

            {/* Upcoming Trip Section (Only if exists) */}
            {upcomingTrip && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-white">Your Upcoming Trip</h2>
                        <Link href="/dashboard/trips" className="text-sm text-gold-500 hover:underline">View all trips</Link>
                    </div>
                    <div className="bg-surface-50 border border-white/10 rounded-xl overflow-hidden hover:border-gold-500/50 transition-colors group relative max-w-4xl">
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-10"></div>
                        <img
                            src={upcomingTrip.properties?.image_url || "/placeholder-property.jpg"}
                            alt={upcomingTrip.properties?.title}
                            className="w-full h-48 object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                        />
                        <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs font-bold text-gold-500 uppercase tracking-wider mb-1">
                                        {new Date(upcomingTrip.check_in_date).toLocaleDateString()}
                                    </p>
                                    <h3 className="text-2xl font-bold text-white">{upcomingTrip.properties?.title}</h3>
                                </div>
                                <Link href={`/dashboard/trips`}>
                                    <Button variant="outline" className="border-white/20 text-white hover:bg-white hover:text-black">
                                        View Details
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* All Properties Grid */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Explore Properties</h2>
                    <div className="flex gap-2">
                        {/* Categories/Filters could go here */}
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-80 bg-surface-50 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {properties.map((property) => (
                            <Link href={`/properties/${property.id}`} key={property.id} className="group block">
                                <div className="bg-surface-50 border border-white/10 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-gold-500/30 transition-all duration-300 h-full flex flex-col">
                                    {/* Image */}
                                    <div className="relative aspect-[4/3] overflow-hidden">
                                        <img
                                            src={property.image_urls?.[0] || property.images?.[0] || "/placeholder-property.jpg"}
                                            alt={property.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-sm font-bold flex items-center gap-1 border border-white/10">
                                            <Star className="w-3 h-3 text-gold-500 fill-gold-500" />
                                            <span>
                                                {(property.review_count > 0 && property.average_rating) ? property.average_rating : "New"}
                                            </span>
                                        </div>
                                        <div className="absolute top-4 left-4">
                                            {/* Wishlist Button could go here */}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-white text-lg group-hover:text-gold-500 transition-colors line-clamp-1">{property.title}</h3>
                                                <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                                                    <Map className="w-3 h-3" />
                                                    {property.city || "Unknown City"}, {property.country || "Unknown Country"}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-1">
                                            {property.description}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <Users className="w-4 h-4" />
                                                <span>{property.max_guests} guests</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xl font-bold text-white">${property.price_per_night}</span>
                                                <span className="text-sm text-gray-500"> / night</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkUser() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                setRole(profile?.role || 'guest');
            }
            setLoading(false);
        }
        checkUser();
    }, []);

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-gold-500" /></div>;
    if (!user) return null;

    const isHost = role === 'admin' || role === 'owner' || role === 'host';

    return isHost ? <HostDashboard user={user} /> : <TravelerDashboard user={user} />;
}
