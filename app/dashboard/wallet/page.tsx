"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, DollarSign, ArrowUpRight, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function WalletPage() {
    const [wallet, setWallet] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchWalletData();
    }, []);

    async function fetchWalletData() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch Wallet
        const { data: walletData } = await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (walletData) setWallet(walletData);

        // Fetch Payouts & Transactions
        // Ideally join multiple tables or just show payouts for simplicity
        const { data: txData } = await supabase
            .from("payouts")
            .select("*")
            .eq("host_id", user.id)
            .order("created_at", { ascending: false });

        if (txData) setTransactions(txData);

        setLoading(false);
    }

    async function handleWithdraw() {
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (amount > (wallet?.available_balance || 0)) {
            toast.error("Insufficient available funds");
            return;
        }

        setIsWithdrawing(true);
        try {
            const res = await fetch("/api/payouts/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            toast.success("Withdrawal request submitted!");
            setWithdrawAmount("");
            fetchWalletData(); // Refresh balance
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsWithdrawing(false);
        }
    }

    if (loading) return <div className="p-8 text-white">Loading wallet...</div>;

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">My Wallet</h1>
                <p className="text-gray-400">Manage your earnings and payouts.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Available Balance */}
                <Card className="bg-surface-100 border-gold-500/50 border text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <DollarSign className="w-24 h-24" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-gray-400 font-medium text-sm">Available Balance</CardTitle>
                        <div className="text-4xl font-bold text-gold-500">
                            ${wallet?.available_balance?.toFixed(2) || "0.00"}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="w-full bg-gold-500 text-black hover:bg-gold-600 font-bold">
                                    <ArrowUpRight className="mr-2 h-4 w-4" /> Withdraw Funds
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-surface-100 border-white/10 text-white">
                                <DialogHeader>
                                    <DialogTitle>Request Payout</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Amount ($)</Label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            className="bg-surface-50 border-white/10"
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                        />
                                        <p className="text-xs text-gray-400">
                                            Available: ${wallet?.available_balance?.toFixed(2)}
                                        </p>
                                    </div>
                                    <Button onClick={handleWithdraw} disabled={isWithdrawing} className="w-full bg-gold-500 text-black">
                                        {isWithdrawing ? <Loader2 className="animate-spin" /> : "Confirm Withdrawal"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                {/* Pending Balance */}
                <Card className="bg-surface-50 border-white/10 text-white">
                    <CardHeader>
                        <CardTitle className="text-gray-400 font-medium text-sm">Pending Balance</CardTitle>
                        <div className="text-4xl font-bold text-white">
                            ${wallet?.pending_balance?.toFixed(2) || "0.00"}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-400 flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Funds are available 24 hours after check-in.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History */}
            <Card className="bg-surface-50 border-white/10 text-white">
                <CardHeader>
                    <CardTitle>Payout History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {transactions.length === 0 ? (
                            <p className="text-gray-400">No payouts yet.</p>
                        ) : (
                            transactions.map((tx) => (
                                <div key={tx.id} className="flex justify-between items-center p-4 bg-surface-100 rounded-lg border border-white/5">
                                    <div>
                                        <p className="font-bold">Withdrawal Request</p>
                                        <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg">-${tx.amount}</p>
                                        <span className={`text-xs px-2 py-1 rounded-full ${tx.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                                tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                                    'bg-red-500/20 text-red-500'
                                            }`}>
                                            {tx.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
