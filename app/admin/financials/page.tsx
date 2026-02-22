"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Check, X, Loader2, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminFinancialsPage() {
    const [payouts, setPayouts] = useState<any[]>([]);
    const [stats, setStats] = useState({ revenue: 0, pendingPayouts: 0 });
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        const supabase = createClient();

        // Fetch Payouts with Host details
        const { data: payoutsData } = await supabase
            .from("payouts")
            .select(`
                *,
                profiles (full_name, email, stripe_account_id)
            `)
            .order("created_at", { ascending: false });

        if (payoutsData) setPayouts(payoutsData);

        // Calculate Stats (Mock logic for revenue, real count for payouts)
        const pendingCount = payoutsData?.filter(p => p.status === 'pending').length || 0;

        // Fetch total platform revenue from transactions
        const { data: revenueData } = await supabase
            .from("transactions")
            .select("platform_fee")
            .eq("type", "booking");

        const totalRevenue = revenueData?.reduce((acc, curr) => acc + (curr.platform_fee || 0), 0) || 0;

        setStats({
            revenue: totalRevenue,
            pendingPayouts: pendingCount
        });

        setLoading(false);
    }

    async function handleAction(payoutId: string, action: 'approve' | 'reject') {
        setProcessingId(payoutId);
        try {
            const res = await fetch("/api/admin/payouts/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payoutId, action }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            toast.success(`Payout ${action}ed successfully`);
            fetchData(); // Refresh list
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setProcessingId(null);
        }
    }

    if (loading) return <div className="p-8"><Loader2 className="w-8 h-8 animate-spin text-gold-500" /></div>;

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Financial Overview</h1>
                    <p className="text-gray-400">Manage platform revenue and host payouts.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-surface-50 border-white/10 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total Platform Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold flex items-center text-gold-500">
                            <DollarSign className="w-6 h-6 mr-1" />
                            {stats.revenue.toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-surface-50 border-white/10 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Pending Payouts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">{stats.pendingPayouts}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Payout Requests Table */}
            <Card className="bg-surface-50 border-white/10 text-white">
                <CardHeader>
                    <CardTitle>Payout Requests</CardTitle>
                    <CardDescription>Approve or reject withdrawal requests from hosts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-white/5">
                                <TableHead className="text-gray-400">Host</TableHead>
                                <TableHead className="text-gray-400">Amount</TableHead>
                                <TableHead className="text-gray-400">Status</TableHead>
                                <TableHead className="text-gray-400">Date</TableHead>
                                <TableHead className="text-right text-gray-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payouts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">No payout requests found.</TableCell>
                                </TableRow>
                            ) : (
                                payouts.map((payout) => (
                                    <TableRow key={payout.id} className="border-white/10 hover:bg-white/5">
                                        <TableCell>
                                            <div className="font-medium">{payout.profiles?.full_name || "Unknown"}</div>
                                            <div className="text-xs text-gray-400">{payout.profiles?.email}</div>
                                        </TableCell>
                                        <TableCell className="font-bold">${payout.amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`
                                                ${payout.status === 'completed' ? 'bg-green-500/20 text-green-500 border-green-500/50' : ''}
                                                ${payout.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' : ''}
                                                ${payout.status === 'rejected' ? 'bg-red-500/20 text-red-500 border-red-500/50' : ''}
                                            `}>
                                                {payout.status.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-400">
                                            {new Date(payout.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {payout.status === 'pending' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAction(payout.id, 'approve')}
                                                        disabled={!!processingId}
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        {processingId === payout.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAction(payout.id, 'reject')}
                                                        disabled={!!processingId}
                                                        className="bg-red-600 hover:bg-red-700 text-white"
                                                    >
                                                        {processingId === payout.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                                    </Button>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
