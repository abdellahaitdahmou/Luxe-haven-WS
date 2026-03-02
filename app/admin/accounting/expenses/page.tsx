"use client";

import { useEffect, useState, useRef } from "react";
import { createExpense, getExpenses, importExpenses, deleteExpenses, updateExpense } from "@/app/actions/accounting";
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
import { Loader2, Plus, Receipt, TrendingDown, Calendar as CalendarIcon, Wallet, CreditCard, Landmark, Building2, FileUp, AlertTriangle, Trash2, Edit2, Check, X, Save, Search, SlidersHorizontal, FilterX, Scan } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Papa from "papaparse";
import { ScanFactureDialog } from "@/components/admin/ScanFactureDialog";

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isScanOpen, setIsScanOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    // Inline Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>(null);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Filters State
    const [filters, setFilters] = useState({
        search: "",
        startDate: "",
        endDate: "",
        payment_method: "all" as any,
        property_name: "all",
        category: "all"
    });

    const [stats, setStats] = useState({
        total: 0,
        thisMonth: 0,
        cashTotal: 0
    });

    const [form, setForm] = useState({
        description: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
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
            const data = await getExpenses();
            setExpenses(data || []);
            calculateStats(data || []);
            setSelectedIds([]); // Reset selection on refresh
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
        const cashTotal = data.filter(e => e.payment_method === 'cash').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

        setStats({ total, thisMonth, cashTotal });
    };

    const filteredExpenses = expenses.filter(expense => {
        // Search filter (description, property, category, auditor name)
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = !filters.search ||
            expense.description?.toLowerCase().includes(searchLower) ||
            expense.property_name?.toLowerCase().includes(searchLower) ||
            expense.category?.toLowerCase().includes(searchLower) ||
            expense.profiles?.full_name?.toLowerCase().includes(searchLower);

        // Date range filter
        const expenseDate = new Date(expense.date);
        const matchesStartDate = !filters.startDate || expenseDate >= new Date(filters.startDate);
        const matchesEndDate = !filters.endDate || expenseDate <= new Date(filters.endDate);

        // Dropdown filters
        const matchesMethod = filters.payment_method === "all" || expense.payment_method === filters.payment_method;
        const matchesProperty = filters.property_name === "all" ||
            (filters.property_name === "platform" ? (!expense.property_name || expense.property_name === "platform") : expense.property_name === filters.property_name);
        const matchesCategory = filters.category === "all" || expense.category === filters.category;

        return matchesSearch && matchesStartDate && matchesEndDate && matchesMethod && matchesProperty && matchesCategory;
    });

    const uniqueProperties = Array.from(new Set(expenses.map(e => e.property_name))).filter(p => p && p !== 'platform').sort();
    const uniqueCategories = Array.from(new Set(expenses.map(e => e.category))).filter(Boolean).sort();

    const clearFilters = () => setFilters({
        search: "",
        startDate: "",
        endDate: "",
        payment_method: "all",
        property_name: "all",
        category: "all"
    });

    const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
        if (key === 'payment_method' || key === 'property_name' || key === 'category') return value !== 'all';
        return value !== "";
    }).length;

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredExpenses.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredExpenses.map(e => e.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} records?`)) return;

        setIsDeleting(true);
        try {
            await deleteExpenses(selectedIds);
            toast.success(`Successfully deleted ${selectedIds.length} records`);
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const startEditing = (expense: any) => {
        setEditingId(expense.id);
        setEditForm({
            description: expense.description,
            amount: expense.amount.toString(),
            date: expense.date,
            property_name: expense.property_name || "platform",
            category: expense.category || "",
            payment_method: expense.payment_method
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm(null);
    };

    const handleSaveEdit = async (id: string) => {
        if (!editForm) return;
        setSavingId(id);
        try {
            await updateExpense(id, {
                description: editForm.description,
                amount: parseFloat(editForm.amount),
                date: editForm.date,
                property_name: editForm.property_name,
                category: editForm.category,
                payment_method: editForm.payment_method
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
            await createExpense({
                description: form.description,
                amount: parseFloat(form.amount),
                date: form.date,
                payment_method: form.payment_method,
                property_name: form.property_name,
                category: form.category
            });
            toast.success("Expense recorded successfully");
            setIsAddOpen(false);
            setForm({
                description: "",
                amount: "",
                date: new Date().toISOString().split('T')[0],
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
                    let indices = { date: -1, property: -1, category: -1, amount: -1, details: -1 };
                    const keywords = {
                        date: ['date'],
                        property: ['propriété', 'propriete', 'property'],
                        category: ['catégorie', 'categorie', 'category'],
                        amount: ['dépenses', 'depenses', 'expenses', 'amount'],
                        details: ['détails', 'details', 'nature', 'description']
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
                        let property = getValue(indices.property);
                        let category = getValue(indices.category);
                        let amountStr = getValue(indices.amount);
                        let details = getValue(indices.details);

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
                            description: details || "Imported Expense",
                            amount: isNaN(amount) ? 0 : amount,
                            date: date,
                            payment_method: "cash" as "cash",
                            property_name: property || "platform",
                            category: category || "Other"
                        };
                    });

                    const finalData = parsedData.filter(d => d.amount > 0);
                    if (finalData.length === 0) throw new Error("No valid data found.");

                    await importExpenses(finalData);
                    toast.success(`Successfully imported ${finalData.length} records`);
                    setIsImportOpen(false);
                    fetchData();
                } catch (error: any) {
                    toast.error(`Import failed: ${error.message}`);
                } finally {
                    setImporting(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                }
            }
        });
    };

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'cash': return <Wallet className="w-3.5 h-3.5" />;
            case 'personal_virement': return <CreditCard className="w-3.5 h-3.5" />;
            case 'society_virement': return <Landmark className="w-3.5 h-3.5" />;
            default: return <Receipt className="w-3.5 h-3.5" />;
        }
    };

    const getMethodLabel = (method: string) => {
        switch (method) {
            case 'cash': return 'Cash';
            case 'personal_virement': return 'Personal Virement';
            case 'society_virement': return 'Society Virement';
            default: return method;
        }
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
                        <TrendingDown className="w-10 h-10 text-rose-500" />
                        Expenses
                    </h1>
                    <p className="text-[var(--muted-text)] text-lg">Financial outflow tracking and management</p>
                </div>
                <div className="flex flex-wrap gap-4">
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

                    <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 font-bold h-12 px-6 rounded-full transition-all">
                                <FileUp className="w-5 h-5 mr-2" />
                                Import Google Sheet
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white backdrop-blur-xl max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">Import from Google Sheet</DialogTitle>
                                <DialogDescription className="text-gray-400">Export your sheet as **CSV** and upload it here.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 pt-4">
                                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-sm text-amber-300 font-bold">Automatic Date Handling:</p>
                                        <p className="text-xs text-amber-200 opacity-80 leading-relaxed font-medium">The system automatically detects date formats to prevent errors.</p>
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

                    <Button
                        onClick={() => setIsScanOpen(true)}
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold h-12 px-6 rounded-full transition-all group"
                    >
                        <Scan className="w-5 h-5 mr-2 text-gold-500 group-hover:scale-110 transition-transform" />
                        Scan Facture
                    </Button>

                    <ScanFactureDialog
                        open={isScanOpen}
                        onOpenChange={setIsScanOpen}
                        onSuccess={fetchData}
                    />

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gold-500 hover:bg-gold-400 text-black font-bold h-12 px-8 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all hover:scale-105 active:scale-95">
                                <Plus className="w-5 h-5 mr-2" />
                                Record New Expense
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white backdrop-blur-xl max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">New Expense Entry</DialogTitle>
                                <DialogDescription className="text-gray-400">Add detailed information about the expenditure.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-400">Description / Details</label>
                                        <Input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Monthly Electricity Bill" className="h-12 bg-white/5 border-white/10 focus:border-gold-500/50 transition-all rounded-xl" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-400">Property</label>
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
                                                    {uniqueProperties.map(p => (
                                                        <SelectItem key={p} value={p!} className="focus:bg-gold-500/10 focus:text-gold-500">{p}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-400">Category</label>
                                            <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Maintenance" className="h-12 bg-white/5 border-white/10 focus:border-gold-500/50 transition-all rounded-xl" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-400">Amount (DH)</label>
                                        <Input required type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="h-12 bg-rose-500/5 border-rose-500/20 focus:border-rose-500 transition-all text-rose-400 font-bold rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-400">Date</label>
                                        <Input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-12 bg-white/5 border-white/10 focus:border-gold-500/50 transition-all rounded-xl" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-400">Payment Method</label>
                                    <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v as any })}>
                                        <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl">
                                            <SelectValue placeholder="Select method" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black border-white/10 text-white rounded-xl">
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="personal_virement">Personal Virement</SelectItem>
                                            <SelectItem value="society_virement">Society Virement</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <DialogFooter className="pt-2">
                                    <Button type="submit" disabled={submitting} className="h-12 bg-gold-500 text-black hover:bg-gold-400 font-bold w-full rounded-xl transition-all">
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Expense Record"}
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
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Outflow</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{stats.total.toLocaleString()} DH</div>
                        <p className="text-xs text-rose-500 mt-1 font-medium italic">Cumulated lifetime</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border-white/5 backdrop-blur-md border-l-rose-500/30">
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest">Monthly Burn</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-rose-500">{stats.thisMonth.toLocaleString()} DH</div>
                        <p className="text-xs text-gray-400 mt-1 font-medium">For current period</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border-white/5 backdrop-blur-md border-l-amber-500/30">
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest">Cash Used</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-amber-500">{stats.cashTotal.toLocaleString()} DH</div>
                        <p className="text-xs text-gray-400 mt-1 font-medium">Physical currency flow</p>
                    </CardContent>
                </Card>
            </div>

            {/* Table Section */}
            <Card className="bg-transparent border-none shadow-none">
                <CardHeader className="px-0">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        Transaction History
                        <Badge className="bg-white/10 text-gray-400 font-normal hover:bg-white/10">{filteredExpenses.length} Records</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    {/* Filter Bar */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <Input
                                placeholder="Search by nature, property, category, auditor..."
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
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                    {/* Date Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-gold-500/80">
                                            <CalendarIcon className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Period</span>
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
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Property</span>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Select Asset</label>
                                            <Select value={filters.property_name} onValueChange={(v) => setFilters(prev => ({ ...prev, property_name: v }))}>
                                                <SelectTrigger className="bg-white/[0.03] border-white/5 text-[11px] h-10 rounded-xl focus:ring-1 focus:ring-gold-500/30 transition-all font-medium">
                                                    <SelectValue placeholder="All Assets" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-black border-white/10 text-white rounded-xl">
                                                    <SelectItem value="all">Everywhere</SelectItem>
                                                    <SelectItem value="platform">Platform General</SelectItem>
                                                    <div className="h-px bg-white/5 my-1" />
                                                    {uniqueProperties.map(p => (
                                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Category Section */}
                                    <div className="space-y-4 border-l border-white/5 pl-0 lg:pl-8">
                                        <div className="flex items-center gap-2 text-gold-500/80">
                                            <Receipt className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Category</span>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Type of Expense</label>
                                            <Select value={filters.category} onValueChange={(v) => setFilters(prev => ({ ...prev, category: v }))}>
                                                <SelectTrigger className="bg-white/[0.03] border-white/5 text-[11px] h-10 rounded-xl focus:ring-1 focus:ring-gold-500/30 transition-all font-medium">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-black border-white/10 text-white rounded-xl">
                                                    <SelectItem value="all">All Categories</SelectItem>
                                                    <div className="h-px bg-white/5 my-1" />
                                                    {uniqueCategories.map(c => (
                                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Method Section */}
                                    <div className="space-y-4 border-l border-white/5 pl-0 lg:pl-8">
                                        <div className="flex items-center gap-2 text-gold-500/80">
                                            <Wallet className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Settlement</span>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Payment Method</label>
                                            <Select value={filters.payment_method} onValueChange={(v) => setFilters(prev => ({ ...prev, payment_method: v }))}>
                                                <SelectTrigger className="bg-white/[0.03] border-white/5 text-[11px] h-10 rounded-xl focus:ring-1 focus:ring-gold-500/30 transition-all font-medium">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-black border-white/10 text-white rounded-xl">
                                                    <SelectItem value="all">Global (All)</SelectItem>
                                                    <div className="h-px bg-white/5 my-1" />
                                                    <SelectItem value="cash">Cash Flow</SelectItem>
                                                    <SelectItem value="personal_virement">Personal Virement</SelectItem>
                                                    <SelectItem value="society_virement">Society Virement</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-white/[0.03]">
                                    <TableRow className="border-white/5 hover:bg-transparent">
                                        <TableHead className="w-12 h-16 pl-8">
                                            <Checkbox
                                                checked={selectedIds.length === filteredExpenses.length && filteredExpenses.length > 0}
                                                onCheckedChange={toggleSelectAll}
                                                className="border-white/20 data-[state=checked]:bg-gold-500 data-[state=checked]:border-gold-500"
                                            />
                                        </TableHead>
                                        <TableHead className="text-gray-400 font-bold whitespace-nowrap">Entry Date</TableHead>
                                        <TableHead className="text-gray-400 font-bold">Nature of Expense</TableHead>
                                        <TableHead className="text-gray-400 font-bold">Details</TableHead>
                                        <TableHead className="text-gray-400 font-bold">Method</TableHead>
                                        <TableHead className="text-gray-400 font-bold">Amount</TableHead>
                                        <TableHead className="text-gray-400 font-bold text-right pr-8">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredExpenses.length === 0 ? (
                                        <TableRow><TableCell colSpan={7} className="text-center text-gray-500 py-20 text-lg">No records found matching filters.</TableCell></TableRow>
                                    ) : (
                                        filteredExpenses.map((expense) => {
                                            const isSelected = selectedIds.includes(expense.id);
                                            const isEditing = editingId === expense.id;
                                            const isSaving = savingId === expense.id;

                                            return (
                                                <TableRow key={expense.id} className={`border-white/5 hover:bg-white/[0.03] transition-colors group ${isSelected ? 'bg-gold-500/5' : ''}`}>
                                                    <TableCell className="pl-8">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => toggleSelect(expense.id)}
                                                            className="border-white/20 data-[state=checked]:bg-gold-500 data-[state=checked]:border-gold-500"
                                                        />
                                                    </TableCell>

                                                    {/* Date Cell */}
                                                    <TableCell className="py-6">
                                                        {isEditing ? (
                                                            <Input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="h-9 bg-white/5 border-white/10 text-sm p-2 w-32" />
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-gray-400 whitespace-nowrap">
                                                                <CalendarIcon className="w-4 h-4 opacity-40" />
                                                                {new Date(expense.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </div>
                                                        )}
                                                    </TableCell>

                                                    {/* Property & Category Cell */}
                                                    <TableCell>
                                                        {isEditing ? (
                                                            <div className="space-y-1 w-40">
                                                                <Select
                                                                    value={editForm.property_name}
                                                                    onValueChange={(v) => setEditForm({ ...editForm, property_name: v })}
                                                                >
                                                                    <SelectTrigger className="h-8 bg-white/5 border-white/10 text-[10px] py-0 px-2">
                                                                        <SelectValue placeholder="Property" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="bg-black border-white/10 text-white">
                                                                        <SelectItem value="platform" className="text-[10px]">Platform</SelectItem>
                                                                        {uniqueProperties.map(p => (
                                                                            <SelectItem key={p} value={p!} className="text-[10px]">{p}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <Input placeholder="Category" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="h-8 bg-white/5 border-white/20 text-[10px]" />
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="font-bold text-white group-hover:text-gold-500 transition-colors">{expense.property_name || "Platform"}</div>
                                                                    {expense.property_name && expense.property_name !== 'platform' && (
                                                                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-white/5 bg-white/[0.02] text-gold-500/70 font-normal">
                                                                            Asset
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-gray-500 font-medium">#{expense.category || "General"}</div>
                                                            </div>
                                                        )}
                                                    </TableCell>

                                                    {/* Description Cell */}
                                                    <TableCell>
                                                        {isEditing ? (
                                                            <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="h-9 bg-white/5 border-white/10 text-sm min-w-[200px]" />
                                                        ) : (
                                                            <div className="text-gray-300 max-w-xs truncate">{expense.description}</div>
                                                        )}
                                                    </TableCell>

                                                    {/* Method Cell */}
                                                    <TableCell>
                                                        {isEditing ? (
                                                            <Select value={editForm.payment_method} onValueChange={(v) => setEditForm({ ...editForm, payment_method: v })}>
                                                                <SelectTrigger className="h-9 bg-white/5 border-white/10 text-xs w-28">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-black border-white/10 text-white">
                                                                    <SelectItem value="cash">Cash</SelectItem>
                                                                    <SelectItem value="personal_virement">Personal</SelectItem>
                                                                    <SelectItem value="society_virement">Society</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-white/[0.01] border-white/10 text-gray-400 px-3 py-1 gap-2 flex w-fit items-center h-8 font-medium">
                                                                {getMethodIcon(expense.payment_method)}
                                                                {getMethodLabel(expense.payment_method)}
                                                            </Badge>
                                                        )}
                                                    </TableCell>

                                                    {/* Amount Cell */}
                                                    <TableCell>
                                                        {isEditing ? (
                                                            <Input type="number" step="0.01" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} className="h-9 bg-rose-500/5 border-rose-500/20 text-rose-400 font-bold w-24" />
                                                        ) : (
                                                            <div className="font-black text-rose-500 text-lg tracking-tight">
                                                                -{parseFloat(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} DH
                                                            </div>
                                                        )}
                                                    </TableCell>

                                                    {/* Actions Cell */}
                                                    <TableCell className="text-right pr-8">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {isEditing ? (
                                                                <>
                                                                    <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(expense.id)} disabled={isSaving} className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10">
                                                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                                    </Button>
                                                                    <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-8 w-8 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10">
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Button size="icon" variant="ghost" onClick={() => startEditing(expense)} className="h-8 w-8 text-gray-500 hover:text-gold-500 hover:bg-gold-500/10 opacity-0 group-hover:opacity-100 transition-all">
                                                                        <Edit2 className="h-4 w-4" />
                                                                    </Button>
                                                                    <div className="flex flex-col items-end group-hover:hidden animate-in fade-in duration-300">
                                                                        <div className="font-bold text-white text-xs">{expense.profiles?.full_name?.split(' ')[0]}</div>
                                                                        <div className="text-[9px] uppercase tracking-tighter text-gray-500 font-black">Audit</div>
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
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
