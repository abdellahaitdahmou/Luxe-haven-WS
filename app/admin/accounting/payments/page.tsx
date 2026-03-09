"use client";

import { useEffect, useState, useRef } from "react";
import { createReceivedPayment, getReceivedPayments, importReceivedPayments, updateReceivedPayment, deleteReceivedPayments } from "@/app/actions/accounting";
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
import { Loader2, Plus, ArrowDownLeft, TrendingUp, Calendar as CalendarIcon, Wallet, Landmark, User, Search, SlidersHorizontal, FilterX, FileUp, Building2, Trash2, Edit2, Check, X, AlertTriangle, CreditCard, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Papa from "papaparse";

export default function PaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Selection
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    // Inline editing
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>(null);
    const [savingId, setSavingId] = useState<string | null>(null);

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
        property_name: "all",
        channel: "all"
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
            setSelectedIds([]);
            setEditingId(null);
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
            payment.property_name?.toLowerCase().includes(searchLower) ||
            payment.channel?.toLowerCase().includes(searchLower) ||
            payment.recipient?.full_name?.toLowerCase().includes(searchLower);

        const paymentDate = new Date(payment.date);
        const matchesStartDate = !filters.startDate || paymentDate >= new Date(filters.startDate);
        const matchesEndDate = !filters.endDate || paymentDate <= new Date(filters.endDate);

        const matchesMethod = filters.payment_method === "all" || payment.payment_method === filters.payment_method;
        const matchesCustodian = filters.received_by === "all" || payment.recipient?.full_name === filters.received_by;
        const matchesProperty = filters.property_name === "all" ||
            (filters.property_name === "platform" ? (!payment.property_name || payment.property_name === "platform") : payment.property_name === filters.property_name);
        const matchesChannel = filters.channel === "all" || payment.channel === filters.channel;

        return matchesSearch && matchesStartDate && matchesEndDate && matchesMethod && matchesCustodian && matchesProperty && matchesChannel;
    });

    const uniqueCustodians = Array.from(new Set(payments.map(p => p.recipient?.full_name))).filter(Boolean).sort();
    const uniqueProperties = Array.from(new Set(payments.map(p => p.property_name))).filter(p => p && p !== 'platform').sort();
    const uniqueChannels = Array.from(new Set(payments.map(p => p.channel))).filter(Boolean).sort();

    const clearFilters = () => setFilters({
        search: "",
        startDate: "",
        endDate: "",
        payment_method: "all",
        received_by: "all",
        property_name: "all",
        channel: "all"
    });

    const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
        if (['payment_method', 'received_by', 'property_name', 'channel'].includes(key)) return value !== 'all';
        return value !== "";
    }).length;

    // --- Selection handlers ---
    const toggleSelectAll = () => {
        if (selectedIds.length === filteredPayments.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredPayments.map(p => p.id));
        }
    };
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };
    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Delete ${selectedIds.length} selected record(s)?`)) return;
        setIsDeleting(true);
        try {
            await deleteReceivedPayments(selectedIds);
            toast.success(`Deleted ${selectedIds.length} records`);
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    // --- Inline editing handlers ---
    const startEditing = (payment: any) => {
        setEditingId(payment.id);
        setEditForm({
            from_whom: payment.from_whom,
            motif: payment.motif,
            amount: payment.amount.toString(),
            date: payment.date,
            payment_method: payment.payment_method,
            property_name: payment.property_name || "platform",
            channel: payment.channel || "",
            guests: payment.guests?.toString() || "",
            nights: payment.nights?.toString() || "",
            price_per_night: payment.price_per_night?.toString() || "",
            check_out_date: payment.check_out_date || ""
        });
    };
    const cancelEditing = () => { setEditingId(null); setEditForm(null); };
    const handleSaveEdit = async (id: string) => {
        if (!editForm) return;
        setSavingId(id);
        try {
            await updateReceivedPayment(id, {
                from_whom: editForm.from_whom,
                motif: editForm.motif,
                amount: parseFloat(editForm.amount),
                date: editForm.date,
                payment_method: editForm.payment_method,
                property_name: editForm.property_name,
                channel: editForm.channel || undefined,
                guests: editForm.guests ? parseInt(editForm.guests) : undefined,
                nights: editForm.nights ? parseInt(editForm.nights) : undefined,
                price_per_night: editForm.price_per_night ? parseFloat(editForm.price_per_night) : undefined,
                check_out_date: editForm.check_out_date || undefined
            });
            toast.success("Record updated");
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSavingId(null);
        }
    };

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
                    let indices = { date: -1, from: -1, motif: -1, amount: -1, property: -1, channel: -1, checkOut: -1, guests: -1, nights: -1, pricePerNight: -1 };
                    const keywords: Record<string, string[]> = {
                        date: ['check in', 'check-in', 'checkin', 'arrivée', 'arrivee', 'date arrivée', 'date d\'arrivée'],
                        checkOut: ['check out', 'check-out', 'checkout', 'départ', 'depart', 'date départ', 'date de départ'],
                        from: ['le client', 'client', 'voyageur', 'locataire', 'tiers', 'sender', 'from whom', 'third party'],
                        amount: ['le montant total', 'montant total', 'montant', 'inflow', 'amount', 'recette'],
                        property: ['propriété', 'propriete', 'logement', 'appartement', 'annonce', 'property', 'building'],
                        channel: ['canal de location', 'canal', 'booking channel', 'channel', 'source'],
                        guests: ['nombre d\'invités', 'nombre d\'invites', 'invités', 'invites', 'guests', 'voyageurs'],
                        nights: ['période de location', 'periode de location', 'nuits', 'nights', 'durée séjour', 'nombre de nuits'],
                        pricePerNight: ['le prix par nuit', 'prix par nuit', 'price per night', 'tarif nuit'],
                        motif: ['objet', 'motif', 'purpose', 'nature', 'description'],
                    };

                    for (let i = 0; i < Math.min(rows.length, 20); i++) {
                        const row = rows[i].map(c => c?.toLowerCase().trim() || "");
                        let matches = 0;
                        const tempIndices = { ...indices };
                        const usedCols = new Set<number>();

                        // Process keywords in order of specificity (longer/more specific first)
                        Object.entries(keywords).forEach(([key, list]) => {
                            // Sort keywords by length descending so more specific ones match first
                            const sorted = [...list].sort((a, b) => b.length - a.length);
                            const foundIndex = row.findIndex((cell, colIdx) => {
                                if (cell.length < 3) return false; // skip empty/trivial cells
                                if (usedCols.has(colIdx)) return false; // prevent double-mapping
                                return sorted.some(k => cell.includes(k));
                            });
                            if (foundIndex !== -1) {
                                (tempIndices as any)[key] = foundIndex;
                                usedCols.add(foundIndex);
                                matches++;
                            }
                        });

                        if (matches >= 2) {
                            headerIndex = i;
                            indices = tempIndices;
                            break;
                        }
                    }

                    if (headerIndex === -1) throw new Error("Could not find the header row. Make sure your CSV has columns like: Date, Client, Amount, Property.");

                    const parseDate = (str: string): string => {
                        if (!str) return "";
                        if (str.includes("/")) {
                            const parts = str.split("/");
                            if (parts.length === 3) {
                                let p1 = parts[0], p2 = parts[1], y = parts[2];
                                if (y.length === 2) y = `20${y}`;
                                return parseInt(p1) > 12
                                    ? `${y}-${p2.padStart(2, "0")}-${p1.padStart(2, "0")}`
                                    : `${y}-${p1.padStart(2, "0")}-${p2.padStart(2, "0")}`;
                            }
                        }
                        const d = new Date(str);
                        return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                    };

                    const parsedData = rows.slice(headerIndex + 1).map((row) => {
                        const getValue = (idx: number) => row[idx]?.trim() || "";
                        const dateStr = getValue(indices.date);
                        const from = getValue(indices.from);
                        const channelRaw = indices.channel !== -1 ? getValue(indices.channel) : "";
                        const motif = indices.motif !== -1 ? getValue(indices.motif) : (channelRaw || "CSV Import");
                        const amountStr = getValue(indices.amount);
                        const property = getValue(indices.property);
                        const checkOutStr = indices.checkOut !== -1 ? getValue(indices.checkOut) : "";
                        const guestsStr = indices.guests !== -1 ? getValue(indices.guests) : "";
                        const nightsStr = indices.nights !== -1 ? getValue(indices.nights) : "";
                        const ppnStr = indices.pricePerNight !== -1 ? getValue(indices.pricePerNight) : "";

                        const paymentMethod: "cash" | "virement" =
                            channelRaw.toLowerCase().includes("virement") || channelRaw.toLowerCase().includes("transfer") ? "virement" : "cash";

                        // Robust number parser: handles French locale (1 019,50), comma-thousands (1,019.50), currency suffix (dh, MAD)
                        const parseAmount = (str: string): number => {
                            if (!str) return NaN;
                            // Remove currency symbols/words and whitespace
                            let cleaned = str.replace(/[^\d,.\s]/gi, "").trim();
                            // Detect French locale: if comma is used as decimal separator (e.g. "1 019,50")
                            const hasSpaceThousands = /\d\s\d/.test(cleaned);
                            const commaIsDecimal = /,\d{1,2}$/.test(cleaned) && !cleaned.includes(".");
                            if (hasSpaceThousands || commaIsDecimal) {
                                // French: remove spaces (thousands), replace comma with dot (decimal)
                                cleaned = cleaned.replace(/\s/g, "").replace(",", ".");
                            } else {
                                // Standard: remove commas (thousands separator)
                                cleaned = cleaned.replace(/,/g, "").replace(/\s/g, "");
                            }
                            return parseFloat(cleaned);
                        };

                        const amount = parseAmount(amountStr);
                        const guests = parseInt(guestsStr) || undefined;
                        const nights = parseInt(nightsStr) || undefined;
                        const pricePerNight = parseAmount(ppnStr) || undefined;

                        return {
                            date: parseDate(dateStr),
                            from_whom: from || "Unknown",
                            motif: motif || "CSV Import",
                            amount: isNaN(amount) ? 0 : amount,
                            payment_method: paymentMethod,
                            property_name: property || "platform",
                            channel: channelRaw || undefined,
                            check_out_date: checkOutStr ? parseDate(checkOutStr) : undefined,
                            guests,
                            nights,
                            price_per_night: pricePerNight
                        };
                    }).filter(p => !isNaN(p.amount) && p.amount > 0);

                    if (parsedData.length === 0) throw new Error(
                        `No valid data found in CSV. Detected columns: amount@${indices.amount}, date@${indices.date}, from@${indices.from}, property@${indices.property}. Check that your Amount column contains numbers.`
                    );

                    await importReceivedPayments(parsedData);
                    toast.success(`Successfully imported ${parsedData.length} payments`);
                    setIsImportOpen(false);
                    fetchData();
                } catch (error: any) {
                    toast.error(error.message);
                } finally {
                    setImporting(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
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
                <div className="flex flex-wrap items-center gap-3">
                    {/* Bulk delete button */}
                    {selectedIds.length > 0 && (
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSelected}
                            disabled={isDeleting}
                            className="h-12 px-6 rounded-full font-bold shadow-[0_0_20px_rgba(244,63,94,0.2)] animate-in fade-in slide-in-from-right-4"
                        >
                            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5 mr-2" />}
                            Delete ({selectedIds.length})
                        </Button>
                    )}

                    {/* Import dialog */}
                    <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 font-bold h-12 px-6 rounded-full transition-all">
                                <FileUp className="w-5 h-5 mr-2" />
                                Smart Import
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white backdrop-blur-xl max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">Smart Import (CSV)</DialogTitle>
                                <DialogDescription className="text-gray-400">Upload an Airbnb or Google Sheet CSV export.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 pt-4">
                                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-sm text-amber-300 font-bold">Airbnb CSV supported</p>
                                        <p className="text-xs text-amber-200 opacity-80 leading-relaxed font-medium">Columns detected automatically: Check In, Check Out, Le client, Propriété, Canal de location, Montant total, Prix/nuit.</p>
                                    </div>
                                </div>
                                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-gold-500/50 hover:bg-white/[0.02] transition-all">
                                    {importing ? <Loader2 className="w-8 h-8 animate-spin text-gold-500" /> : <FileUp className="w-8 h-8 text-gray-500" />}
                                    <div className="text-center">
                                        <p className="font-bold text-white">Click to upload CSV</p>
                                        <p className="text-xs text-gray-500 mt-1">or drag and drop file</p>
                                    </div>
                                    <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleCsvUpload} disabled={importing} />
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
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

                                    {/* Booking Channel Section */}
                                    <div className="space-y-4 border-l border-white/5 pl-0 md:pl-8">
                                        <div className="flex items-center gap-2 text-gold-500/80">
                                            <ArrowDownLeft className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Booking Channel</span>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Platform</label>
                                            <Select value={filters.channel} onValueChange={(v) => setFilters(prev => ({ ...prev, channel: v }))}>
                                                <SelectTrigger className="bg-white/[0.03] border-white/5 text-[11px] h-10 rounded-xl focus:ring-1 focus:ring-gold-500/30 transition-all font-medium">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-black border-white/10 text-white rounded-xl">
                                                    <SelectItem value="all">All Platforms</SelectItem>
                                                    <div className="h-px bg-white/5 my-1" />
                                                    {uniqueChannels.map(c => (
                                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="overflow-x-auto bg-white/[0.02] border border-white/5 rounded-[2rem] backdrop-blur-sm">
                        <Table>
                            <TableHeader className="bg-white/[0.03]">
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="w-12 h-16 pl-8">
                                        <Checkbox
                                            checked={selectedIds.length === filteredPayments.length && filteredPayments.length > 0}
                                            onCheckedChange={toggleSelectAll}
                                            className="border-white/20 data-[state=checked]:bg-gold-500 data-[state=checked]:border-gold-500"
                                        />
                                    </TableHead>
                                    <TableHead className="text-gray-400 font-bold whitespace-nowrap">Check In</TableHead>
                                    <TableHead className="text-gray-400 font-bold whitespace-nowrap">Check Out</TableHead>
                                    <TableHead className="text-gray-400 font-bold">Guest / Motif</TableHead>
                                    <TableHead className="text-gray-400 font-bold">Property / Channel</TableHead>
                                    <TableHead className="text-gray-400 font-bold text-center">Guests</TableHead>
                                    <TableHead className="text-gray-400 font-bold text-center">Nights</TableHead>
                                    <TableHead className="text-gray-400 font-bold">Price/Night</TableHead>
                                    <TableHead className="text-gray-400 font-bold">Total</TableHead>
                                    <TableHead className="text-gray-400 font-bold text-right pr-8">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center text-gray-500 py-20 text-lg">No inward flows matching current filters.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPayments.map((payment) => {
                                        const isSelected = selectedIds.includes(payment.id);
                                        const isEditing = editingId === payment.id;
                                        const isSaving = savingId === payment.id;
                                        return (
                                            <TableRow key={payment.id} className={`border-white/5 hover:bg-white/[0.03] transition-colors group ${isSelected ? 'bg-gold-500/5' : ''}`}>
                                                {/* Checkbox */}
                                                <TableCell className="pl-8">
                                                    <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(payment.id)} className="border-white/20 data-[state=checked]:bg-gold-500 data-[state=checked]:border-gold-500" />
                                                </TableCell>
                                                {/* Check In */}
                                                <TableCell className="py-5">
                                                    {isEditing ? (
                                                        <Input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="h-9 bg-white/5 border-white/10 text-sm p-2 w-32" />
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-gray-300 whitespace-nowrap text-sm">
                                                            <CalendarIcon className="w-3.5 h-3.5 opacity-40 shrink-0" />
                                                            {new Date(payment.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                {/* Check Out */}
                                                <TableCell className="py-5">
                                                    {isEditing ? (
                                                        <Input type="date" value={editForm.check_out_date} onChange={(e) => setEditForm({ ...editForm, check_out_date: e.target.value })} className="h-9 bg-white/5 border-white/10 text-sm p-2 w-32" />
                                                    ) : payment.check_out_date ? (
                                                        <div className="text-gray-400 whitespace-nowrap text-sm">
                                                            {new Date(payment.check_out_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-700 text-xs">—</span>
                                                    )}
                                                </TableCell>
                                                {/* Guest / Motif */}
                                                <TableCell className="py-5">
                                                    {isEditing ? (
                                                        <div className="space-y-1 w-36">
                                                            <Input value={editForm.from_whom} onChange={(e) => setEditForm({ ...editForm, from_whom: e.target.value })} className="h-8 bg-white/5 border-white/10 text-xs" placeholder="Guest" />
                                                            <Input value={editForm.motif} onChange={(e) => setEditForm({ ...editForm, motif: e.target.value })} className="h-8 bg-white/5 border-white/10 text-xs" placeholder="Motif" />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="font-bold text-white text-sm group-hover:text-gold-500 transition-colors">{payment.from_whom}</div>
                                                            <div className="text-xs text-gray-500 font-medium italic mt-0.5">{payment.motif}</div>
                                                        </>
                                                    )}
                                                </TableCell>
                                                {/* Property / Channel */}
                                                <TableCell className="py-5">
                                                    {isEditing ? (
                                                        <div className="space-y-1 w-32">
                                                            <Select value={editForm.property_name} onValueChange={(v) => setEditForm({ ...editForm, property_name: v })}>
                                                                <SelectTrigger className="h-8 bg-white/5 border-white/10 text-[10px] py-0 px-2"><SelectValue /></SelectTrigger>
                                                                <SelectContent className="bg-black border-white/10 text-white">
                                                                    <SelectItem value="platform" className="text-[10px]">Platform</SelectItem>
                                                                    {uniqueProperties.map(p => <SelectItem key={p} value={p!} className="text-[10px]">{p}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                            <Input value={editForm.channel} onChange={(e) => setEditForm({ ...editForm, channel: e.target.value })} className="h-8 bg-white/5 border-white/10 text-[10px]" placeholder="Channel" />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {payment.property_name && payment.property_name !== 'platform' ? (
                                                                <Badge variant="outline" className="text-[10px] h-5 px-2 border-white/5 bg-white/[0.02] text-gray-400 font-normal mb-1 block w-fit">{payment.property_name}</Badge>
                                                            ) : (
                                                                <span className="text-[10px] text-gray-600 italic">Platform</span>
                                                            )}
                                                            {payment.channel && <Badge variant="outline" className="text-[10px] h-5 px-2 border-blue-500/20 bg-blue-500/5 text-blue-400 font-medium block w-fit mt-0.5">{payment.channel}</Badge>}
                                                        </>
                                                    )}
                                                </TableCell>
                                                {/* Guests */}
                                                <TableCell className="py-5 text-center">
                                                    {isEditing ? (
                                                        <Input type="number" value={editForm.guests} onChange={(e) => setEditForm({ ...editForm, guests: e.target.value })} className="h-8 bg-white/5 border-white/10 text-xs w-14 text-center" />
                                                    ) : payment.guests != null ? (
                                                        <span className="text-gray-300 text-sm font-medium">{payment.guests}</span>
                                                    ) : <span className="text-gray-700 text-xs">—</span>}
                                                </TableCell>
                                                {/* Nights */}
                                                <TableCell className="py-5 text-center">
                                                    {isEditing ? (
                                                        <Input type="number" value={editForm.nights} onChange={(e) => setEditForm({ ...editForm, nights: e.target.value })} className="h-8 bg-white/5 border-white/10 text-xs w-14 text-center" />
                                                    ) : payment.nights != null ? (
                                                        <span className="text-gray-300 text-sm font-medium">{payment.nights}</span>
                                                    ) : <span className="text-gray-700 text-xs">—</span>}
                                                </TableCell>
                                                {/* Price Per Night */}
                                                <TableCell className="py-5">
                                                    {isEditing ? (
                                                        <Input type="number" step="0.01" value={editForm.price_per_night} onChange={(e) => setEditForm({ ...editForm, price_per_night: e.target.value })} className="h-8 bg-white/5 border-amber-500/20 text-amber-400 text-xs w-20" />
                                                    ) : payment.price_per_night != null ? (
                                                        <span className="text-amber-400 font-semibold text-sm">{parseFloat(payment.price_per_night).toLocaleString()} DH</span>
                                                    ) : <span className="text-gray-700 text-xs">—</span>}
                                                </TableCell>
                                                {/* Total Inflow */}
                                                <TableCell className="py-5">
                                                    {isEditing ? (
                                                        <Input type="number" step="0.01" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} className="h-8 bg-emerald-500/5 border-emerald-500/20 text-emerald-400 font-bold text-xs w-24" />
                                                    ) : (
                                                        <div className="font-black text-emerald-500 text-base tracking-tight whitespace-nowrap">
                                                            +{parseFloat(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} DH
                                                        </div>
                                                    )}
                                                </TableCell>
                                                {/* Actions */}
                                                <TableCell className="text-right pr-8 py-5">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {isEditing ? (
                                                            <>
                                                                <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(payment.id)} disabled={isSaving} className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10">
                                                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                                </Button>
                                                                <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-8 w-8 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10">
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Button size="icon" variant="ghost" onClick={() => startEditing(payment)} className="h-8 w-8 text-gray-500 hover:text-gold-500 hover:bg-gold-500/10 opacity-0 group-hover:opacity-100 transition-all">
                                                                    <Edit2 className="h-4 w-4" />
                                                                </Button>
                                                                <div className="flex flex-col items-end group-hover:hidden">
                                                                    <div className="font-bold text-white text-xs">{payment.recipient?.full_name?.split(' ')[0]}</div>
                                                                    <div className="text-[9px] uppercase tracking-tighter text-emerald-500 font-black">Verified</div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
