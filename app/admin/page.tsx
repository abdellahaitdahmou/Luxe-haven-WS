"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Building2, Calendar, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CURRENT_YEAR = new Date().getFullYear();

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalProperties: 0,
        totalBookings: 0,
        totalRevenue: 0
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const supabase = createClient();

        // Parallel fetching for speed
        const [
            { count: usersCount },
            { count: propsCount },
            { count: bookingsCount },
            { data: revenueData },
            { data: allBookings }
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('properties').select('*', { count: 'exact', head: true }),
            supabase.from('bookings').select('*', { count: 'exact', head: true }),
            supabase.from('transactions').select('platform_fee').eq('type', 'booking'),
            supabase.from('bookings').select('total_price, created_at').gte('created_at', `${CURRENT_YEAR}-01-01`)
        ]);

        const totalRevenue = revenueData?.reduce((acc, curr) => acc + (curr.platform_fee || 0), 0) || 0;

        setStats({
            totalUsers: usersCount || 0,
            totalProperties: propsCount || 0,
            totalBookings: bookingsCount || 0,
            totalRevenue
        });

        // Process Chart Data
        const monthlyData = MONTHS.map((month, idx) => {
            const monthBookings = allBookings?.filter(b => {
                const d = new Date(b.created_at);
                return d.getMonth() === idx;
            }) || [];

            const revenue = monthBookings.reduce((acc, b) => acc + (b.total_price || 0), 0);

            return {
                name: month,
                revenue,
                bookings: monthBookings.length
            };
        });

        setChartData(monthlyData);
        setLoading(false);
    };

    if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold-500" /></div>;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
                <p className="text-gray-400">Platform overview and system health.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-surface-50 border-white/10 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-gold-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-gray-400 mt-1">Platform fees collected</p>
                    </CardContent>
                </Card>
                <Card className="bg-surface-50 border-white/10 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-gold-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-gray-400 mt-1">Guests & Hosts</p>
                    </CardContent>
                </Card>
                <Card className="bg-surface-50 border-white/10 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total Properties</CardTitle>
                        <Building2 className="h-4 w-4 text-gold-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalProperties}</div>
                        <p className="text-xs text-gray-400 mt-1">Active Listings</p>
                    </CardContent>
                </Card>
                <Card className="bg-surface-50 border-white/10 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total Bookings</CardTitle>
                        <Calendar className="h-4 w-4 text-gold-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalBookings}</div>
                        <p className="text-xs text-gray-400 mt-1">All time</p>
                    </CardContent>
                </Card>
            </div>

            {/* Platform Analytics Chart */}
            <Card className="bg-surface-50 border-white/10 text-white p-6">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-lg">Platform Growth — {CURRENT_YEAR}</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                    <div className="h-[400px] w-full">
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
                                    contentStyle={{
                                        backgroundColor: "#1a1a1a",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "8px",
                                        color: "#fff",
                                    }}
                                    formatter={(value: any, name: any) => [
                                        name === "revenue" ? `$${Number(value || 0).toLocaleString()}` : value,
                                        name === "revenue" ? "Revenue" : "Bookings",
                                    ]}
                                />
                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#EAB308"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                                <Area
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="bookings"
                                    stroke="#8B5CF6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorBookings)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
