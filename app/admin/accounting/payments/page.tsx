"use client";

import { useEffect, useState } from "react";
import { createReceivedPayment, getReceivedPayments } from "@/app/actions/accounting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, ArrowDownLeft, TrendingUp, Calendar as CalendarIcon, Wallet, Landmark, User, Search, SlidersHorizontal, FilterX, FileUp, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Papa from "papaparse";
import { importReceivedPayments } from "@/app/actions/accounting";

export default function PaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [importing, setImporting] = useState(false);

    const [stats, setStats] = useState({
        total: 0,
        thisMonth: 0,
        pendingDeposit: 0
    });

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        search: "",
        startDate: "",
        endDate: "",
        payment_method: "all" as any,
        received_by: "all",
        property_name: "all"
    });

    const [form, setForm] = useState({
        amount: "",
        date: new Date().toISOString().split('T')[0],
        motif: "",
        from_whom: "",
        payment_method: "cash" as any,
        property_name: "platform",
        category: ""
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getReceivedPayments();
            setPayments(data || []);
            calculateStats(data || []);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: any[]) => {
        const total = data.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
        const now = new Date();
        const thisMonth = data.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

        // Mocking pending deposit logic based on motif
        const pendingDeposit = data.filter(e => e.motif.toLowerCase().includes('deposit')).reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

        setStats({ total, thisMonth, pendingDeposit });
    };

    const filteredPayments = payments.filter(payment => {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = !filters.search ||
            payment.from_whom?.toLowerCase().includes(searchLower) ||
            payment.motif?.toLowerCase().includes(searchLower) ||
            payment.recipient?.full_name?.toLowerCase().includes(searchLower);

        const paymentDate = new Date(payment.date);
        const matchesStartDate = !filters.startDate || paymentDate >= new Date(filters.startDate);
        const matchesEndDate = !filters.endDate || paymentDate <= new Date(filters.endDate);

        const matchesMethod = filters.payment_method === "all" || payment.payment_method === filters.payment_method;
        const matchesCustodian = filters.received_by === "all" || payment.recipient?.full_name === filters.received_by;
        const matchesProperty = filters.property_name === "all" ||
            (filters.property_name === "platform" ? (!payment.property_name || payment.property_name === "platform") : payment.property_name === filters.property_name);

        return matchesSearch && matchesStartDate && matchesEndDate && matchesMethod && matchesCustodian && matchesProperty;
    });

    const uniqueCustodians = Array.from(new Set(payments.map(p => p.recipient?.full_name))).filter(Boolean).sort();
    const uniqueProperties = Array.from(new Set(payments.map(p => p.property_name))).filter(p => p && p !== 'platform').sort();

    const clearFilters = () => setFilters({
        search: "",
        startDate: "",
        endDate: "",
        payment_method: "all",
        received_by: "all",
        property_name: "all"
    });

    const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
        if (key === 'payment_method' || key === 'received_by' || key === 'property_name') return value !== 'all';
        return value !== "";
    }).length;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createReceivedPayment({
                amount: parseFloat(form.amount),
                date: form.date,
                motif: form.motif,
                from_whom: form.from_whom,
                payment_method: form.payment_method,
                property_name: form.property_name,
                category: form.category
            });
            toast.success("Payment recorded successfully");
            setIsAddOpen(false);
            setForm({
                amount: "",
                date: new Date().toISOString().split('T')[0],
                motif: "",
                from_whom: "",
                payment_method: "cash",
                property_name: "platform",
                category: ""
            });
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'cash': return <Wallet className="w-3.5 h-3.5" />;
            case 'virement': return <Landmark className="w-3.5 h-3.5" />;
            default: return <ArrowDownLeft className="w-3.5 h-3.5" />;
        }
    };

    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        Papa.parse(file, {
            header: false,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const rows = results.data as string[][];
                    if (rows.length < 2) throw new Error("Empty file detected.");

                    let headerIndex = -1;
                    let indices = { date: -1, from: -1, motif: -1, amount: -1, property: -1 };
                    const keywords = {
                        date: ['date'],
                        from: ['tiers', 'from', 'sender', 'party', 'third party'],
                        motif: ['objet', 'purpose', 'motif', 'nature', 'description'],
                        amount: ['montant', 'inflow', 'amount'],
                        property: ['propriété', 'propriete', 'property', 'building']
                    };

                    for (let i = 0; i < Math.min(rows.length, 20); i++) {
                        const row = rows[i].map(c => c?.toLowerCase().trim() || "");
                        let matches = 0;
                        const tempIndices = { ...indices };
                        Object.entries(keywords).forEach(([key, list]) => {
                            const foundIndex = row.findIndex(cell => list.some(k => cell === k));
                            if (foundIndex !== -1) {
                                (tempIndices as any)[key] = foundIndex;
                                matches++;
                            }
                        });
                        if (matches >= 3) {
                            headerIndex = i;
                            indices = tempIndices;
                            break;
                        }
                    }

                    if (headerIndex === -1) throw new Error("Could not find the header row.");

                    const parsedData = rows.slice(headerIndex + 1).map((row) => {
                        const getValue = (idx: number) => row[idx]?.trim() || "";
                        let dateStr = getValue(indices.date);
                        let from = getValue(indices.from);
                        let motif = getValue(indices.motif);
                        let amountStr = getValue(indices.amount);
                        let property = getValue(indices.property);

                        let date = "";
                        if (dateStr && dateStr.includes("/")) {
                            const parts = dateStr.split("/");
                            if (parts.length === 3) {
                                let p1 = parts[0], p2 = parts[1], y = parts[2];
                                if (y.length === 2) y = `20${y}`;
                                if (parseInt(p1) > 12) date = `${y}-${p2.padStart(2, "0")}-${p1.padStart(2, "0")}`;
                                else date = `${y}-${p1.padStart(2, "0")}-${p2.padStart(2, "0")}`;
                            }
                        } else {
                            const d = new Date(dateStr);
                            date = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                        }

                        const amount = parseFloat(amountStr.replace(/,/g, "").replace(/[^0-9.]/g, ""));

                        return {
                            date,
                            from_whom: from || "Unknown",
                            motif: motif || "CSV Import",
                            amount: isNaN(amount) ? 0 : amount,
                            payment_method: 'cash' as const,
                            property_name: property || "platform"
                        };
                    }).filter(p => !isNaN(p.amount) && p.amount > 0);

                    if (parsedData.length === 0) throw new Error("No valid data found in CSV.");

                    await importReceivedPayments(parsedData);
                    toast.success(`Successfully imported ${parsedData.length} payments`);
                    fetchData();
                } catch (error: any) {
                    toast.error(error.message);
                } finally {
                    setImporting(false);
                    e.target.value = "";
                }
            }
        });
    };

    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-gold-500" />
        </div>
    );

    return (
        <div className="space-y-10 p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        <TrendingUp className="w-10 h-10 text-emerald-500" />
                        Inward Payments
                    </h1>
                    <p className="text-[var(--muted-text)] text-lg">Inflow monitoring and collection tracking</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleCsvUpload}
                            className="hidden"
                            id="csv-upload"
                            disabled={importing}
                        />
                        <Button
                            variant="outline"
                            asChild
                            className={`h-12 px-6 rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold transition-all ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <label htmlFor="csv-upload" className="flex items-center gap-2 cursor-pointer">
                                {importing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
                                Smart Import
                            </label>
                        </Button>
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gold-500 hover:bg-gold-400 text-black font-bold h-12 px-8 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all hover:scale-105 active:scale-95">
                                <Plus className="w-5 h-5 mr-2" />
                                Record New Payment
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white backdrop-blur-xl max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">Inward Payment Entry</DialogTitle>
                                <DialogDescription className="text-gray-400">Log funds received from any third party.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-400">From Whom</label>
                                        <Input
                                            required
                                            value={form.from_whom}
                                            onChange={(e) => setForm({ ...form, from_whom: e.target.value })}
                                            placeholder="Sender Name"
                                            className="h-12 bg-white/5 border-white/10 focus:border-gold-500/50 transition-all rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-400">Amount (DH)</label>
                                        <Input
                                            required
                                            type="number"
                                            step="0.01"
                                            value={form.amount}
                                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                            placeholder="0.00"
                                            className="h-12 bg-emerald-500/5 border-emerald-500/20 focus:border-emerald-500 transition-all text-emerald-400 font-bold rounded-xl"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-400">Nature of Payment (Motif)</label>
                                    <Input
                                        required
                                        value={form.motif}
                                        onChange={(e) => setForm({ ...form, motif: e.target.value })}
                                        placeholder="e.g. Booking Reservation Balance"
                                        className="h-12 bg-white/5 border-white/10 focus:border-gold-500/50 transition-all rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-400">Related Property</label>
                                    <Select
                                        value={form.property_name}
                                        onValueChange={(v) => setForm({ ...form, property_name: v })}
                                    >
                                        <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl">
                                            <SelectValue placeholder="Select property" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black border-white/10 text-white rounded-xl">
                                            <SelectItem value="platform" className="focus:bg-gold-500/10 focus:text-gold-500 italic">Platform (Default)</SelectItem>
                                            <div className="h-px bg-white/5 my-1" />
                                            {Array.from(new Set(payments.map(p => p.property_name))).filter(p => p && p !== 'platform').map(p => (
                                                <SelectItem key={p} value={p!} className="focus:bg-gold-500/10 focus:text-gold-500">{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-400">Date Received</label>
                                        <Input
                                            required
                                            type="date"
                                            value={form.date}
                                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                                            className="h-12 bg-white/5 border-white/10 focus:border-gold-500/50 transition-all rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-400">Method</label>
                                        <Select
                                            value={form.payment_method}
                                            onValueChange={(v) => setForm({ ...form, payment_method: v as any })}
                                        >
                                            <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl">
                                                <SelectValue placeholder="Select method" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-black border-white/10 text-white rounded-xl">
                                                <SelectItem value="cash" className="focus:bg-gold-500/10 focus:text-gold-500">Cash</SelectItem>
                                                <SelectItem value="virement" className="focus:bg-gold-500/10 focus:text-gold-500">Virement</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-gold-500/5 border border-gold-500/10 flex items-start gap-3">
                                    <User className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-gold-300 leading-relaxed font-medium">
                                        This payment will be automatically attributed to you as the receiving manager. No manual selection required.
                                    </p>
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="h-12 bg-gold-500 text-black hover:bg-gold-400 font-bold w-full rounded-xl transition-all"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authorize Payment Receipt"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border-white/5 backdrop-blur-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{stats.total.toLocaleString()} DH</div>
                        <p className="text-xs text-emerald-500 mt-1 font-medium italic">Net collections</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border-white/5 backdrop-blur-md border-l-emerald-500/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest">Monthly Inflow</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-500">{stats.thisMonth.toLocaleString()} DH</div>
                        <p className="text-xs text-gray-400 mt-1 font-medium">Current cycle</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border-white/5 backdrop-blur-md border-l-amber-500/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest">Security Deposits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-amber-500">{stats.pendingDeposit.toLocaleString()} DH</div>
                        <p className="text-xs text-gray-400 mt-1 font-medium">Held in escrow</p>
                    </CardContent>
                </Card>
            </div>

            {/* Table Section */}
            <Card className="bg-transparent border-none shadow-none">
                <CardHeader className="px-0">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        Registry of Inward Flows
                        <Badge className="bg-white/10 text-gray-400 font-normal hover:bg-white/10">{filteredPayments.length} Records</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-8">
                    {/* Filter Bar */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <Input
                                placeholder="Search by party, motif, custodian..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="pl-11 h-12 bg-white/[0.03] border-white/5 focus:border-gold-500/50 rounded-2xl w-full"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`h-12 px-6 rounded-2xl border-white/5 transition-all gap-2 ${isFilterOpen ? 'bg-gold-500/10 border-gold-500/50 text-gold-500' : 'bg-white/[0.03] text-gray-400'}`}
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                Advanced Filters
                                {activeFilterCount > 0 && (
                                    <Badge className="bg-gold-500 text-black ml-1 px-1.5 h-5 min-w-[20px] rounded-full border-none">
                                        {activeFilterCount}
                                    </Badge>
                                )}
                            </Button>
                            {activeFilterCount > 0 && (
                                <Button
                                    variant="ghost"
                                    onClick={clearFilters}
                                    className="h-12 px-4 rounded-2xl text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                                >
                                    <FilterX className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Collapsible Advanced Filters */}
                    {isFilterOpen && (
                        <Card className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border-white/5 rounded-[2rem] animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden shadow-2xl">
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                    {/* Date Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-gold-500/80">
                                            <CalendarIcon className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Settlement Period</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">From</label>
                                                <Input
                                                    type="date"
                                                    value={filters.startDate}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                                    className="bg-white/[0.03] border-white/5 text-[11px] h-10 rounded-xl focus:border-gold-500/30 transition-all font-medium"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">To</label>
                                                <Input
                                                    type="date"
                                                    value={filters.endDate}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                                    className="bg-white/[0.03] border-white/5 text-[11px] h-10 rounded-xl focus:border-gold-500/30 transition-all font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Property Section */}
                                    <div className="space-y-4 border-l border-white/5 pl-0 md:pl-8">
                                        <div className="flex items-center gap-2 text-gold-500/80">
                                            <Building2 className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Asset Focus</span>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Property</label>
                                            <Select value={filters.property_name} onValueChange={(v) => setFilters(prev => ({ ...prev, property_name: v }))}>
                                                <SelectTrigger className="bg-white/[0.03] border-white/5 text-[11px] h-10 rounded-xl focus:ring-1 focus:ring-gold-500/30 transition-all font-medium">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-black border-white/10 text-white rounded-xl">
                                                    <SelectItem value="all">Everywhere</SelectItem>
                                                    <SelectItem value="platform">Platform General</SelectItem>
                                                    <div className="h-px bg-white/5 my-1" />
                                                    {uniqueProperties.map(p => (
                                                        <SelectItem key={p} value={p!}>{p}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Custodian Section */}
                                    <div className="space-y-4 border-l border-white/5 pl-0 md:pl-8">
                                        <div className="flex items-center gap-2 text-gold-500/80">
                                            <User className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Custodian</span>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Received By</label>
                                            <Select value={filters.received_by} onValueChange={(v) => setFilters(prev => ({ ...prev, received_by: v }))}>
                                                <SelectTrigger className="bg-white/[0.03] border-white/5 text-[11px] h-10 rounded-xl focus:ring-1 focus:ring-gold-500/30 transition-all font-medium">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-black border-white/10 text-white rounded-xl">
                                                    <SelectItem value="all">Global (All Managers)</SelectItem>
                                                    <div className="h-px bg-white/5 my-1" />
                                                    {uniqueCustodians.map(c => (
                                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Method Section */}
                                    <div className="space-y-4 border-l border-white/5 pl-0 md:pl-8">
                                        <div className="flex items-center gap-2 text-gold-500/80">
                                            <Wallet className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Settlement Type</span>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Channel</label>
                                            <Select value={filters.payment_method} onValueChange={(v) => setFilters(prev => ({ ...prev, payment_method: v as any }))}>
                                                <SelectTrigger className="bg-white/[0.03] border-white/5 text-[11px] h-10 rounded-xl focus:ring-1 focus:ring-gold-500/30 transition-all font-medium">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-black border-white/10 text-white rounded-xl">
                                                    <SelectItem value="all">All Channels</SelectItem>
                                                    <div className="h-px bg-white/5 my-1" />
                                                    <SelectItem value="cash">Cash Inflow</SelectItem>
                                                    <SelectItem value="virement">Virement (Transfer)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm">
                        <Table>
                            <TableHeader className="bg-white/[0.03]">
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="text-gray-400 font-bold h-16 pl-8">Flow Date</TableHead>
                                    <TableHead className="text-gray-400 font-bold">Third Party / Purpose</TableHead>
                                    <TableHead className="text-gray-400 font-bold">Method</TableHead>
                                    <TableHead className="text-gray-400 font-bold">Inflow</TableHead>
                                    <TableHead className="text-gray-400 font-bold text-right pr-8">Custodian</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-gray-500 py-20 text-lg">No inward flows matching current filters.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPayments.map((payment) => (
                                        <TableRow key={payment.id} className="border-white/5 hover:bg-white/[0.03] transition-colors group">
                                            <TableCell className="pl-8 py-6">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <CalendarIcon className="w-4 h-4 opacity-40" />
                                                    {new Date(payment.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-bold text-white text-base group-hover:text-gold-500 transition-colors">{payment.from_whom}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <div className="text-xs text-gray-500 font-medium italic">{payment.motif}</div>
                                                    {payment.property_name && payment.property_name !== 'platform' && (
                                                        <>
                                                            <span className="text-gray-700">•</span>
                                                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-white/5 bg-white/[0.02] text-gray-500 font-normal">
                                                                {payment.property_name}
                                                            </Badge>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-white/[0.01] border-white/10 text-gray-400 px-3 py-1 gap-2 flex w-fit items-center h-8 font-medium capitalize">
                                                    {getMethodIcon(payment.payment_method)}
                                                    {payment.payment_method}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-black text-emerald-500 text-lg tracking-tight">
                                                    +{parseFloat(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} DH
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <div className="flex flex-col items-end">
                                                    <div className="font-bold text-white leading-tight">{payment.recipient?.full_name || "Unknown"}</div>
                                                    <div className="text-[10px] uppercase tracking-tighter text-emerald-500 font-black">Verified Receipt</div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
