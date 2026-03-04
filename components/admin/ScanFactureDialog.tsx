"use client";

import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Camera, Upload, Check, X, Receipt, Scan, ShieldCheck } from "lucide-react";
import Webcam from "react-webcam";
import { toast } from "sonner";
import { processInvoiceAction, saveToGoogleSheet } from "@/app/actions/scan-invoice";
import { createExpense } from "@/app/actions/accounting";

interface ScanFactureDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function ScanFactureDialog({ open, onOpenChange, onSuccess }: ScanFactureDialogProps) {
    const [mode, setMode] = useState<"choice" | "camera" | "upload" | "review">("choice");
    const [image, setImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const webcamRef = useRef<Webcam>(null);

    // Editable form state
    const [formData, setFormData] = useState({
        supplier: "",
        ice: "",
        invoice_number: "",
        date: "",
        due_date: "",
        amount_ht: 0,
        tva: 0,
        amount_ttc: 0,
        remise: 0,
        debit: 0,
        credit: 0,
        total_paye: 0,
        payment_method: "Espèce" as string,
        category: "Other"
    });

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setImage(imageSrc);
            handleProcess(imageSrc);
        }
    }, [webcamRef]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setImage(base64String);
                handleProcess(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProcess = async (base64: string) => {
        setIsProcessing(true);
        setMode("review");
        try {
            const result = await processInvoiceAction(base64);
            if (result.success && result.data) {
                const d = result.data;
                const ttc = d.amount_ttc || 0;
                setFormData({
                    supplier: d.supplier || "",
                    ice: d.ice || "",
                    invoice_number: d.invoice_number || "",
                    date: d.date || new Date().toISOString().split("T")[0],
                    due_date: d.due_date || d.date || new Date().toISOString().split("T")[0],
                    amount_ht: d.amount_ht || 0,
                    tva: d.tva || 0,
                    amount_ttc: ttc,
                    remise: d.remise || 0,
                    debit: d.debit || ttc,
                    credit: d.credit || 0,
                    total_paye: d.total_paye || ttc,
                    payment_method: d.payment_method || "Espèce",
                    category: d.category || "Other"
                });
                toast.success("Invoice scanned successfully");
            } else {
                toast.error(result.error || "Failed to process invoice");
            }
        } catch (error) {
            toast.error("An error occurred during scanning");
        } finally {
            setIsProcessing(false);
        }
    };

    const toDbPaymentMethod = (method: string): "cash" | "personal_virement" | "society_virement" => {
        if (!method) return "cash";
        const m = method.toLowerCase();
        if (m.includes("virement")) return "society_virement";
        if (m.includes("chèque") || m.includes("cheque")) return "personal_virement";
        return "cash";
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // 1. Save to local DB (Supabase)
            await createExpense({
                description: formData.supplier ? `${formData.supplier} - ${formData.invoice_number || "Invoice"}` : "Scanned Invoice",
                amount: formData.total_paye || formData.amount_ttc || 0,
                date: formData.date || new Date().toISOString().split("T")[0],
                payment_method: toDbPaymentMethod(formData.payment_method),
                property_name: "platform",
                category: formData.category
            });

            // 2. Save to Google Sheet — columns match LES FACTURES D'ACHATS exactly
            const sheetResult = await saveToGoogleSheet({
                "N° de facture": formData.invoice_number,
                "Date": formData.date,
                "Fournisseur": formData.supplier,
                "ICE": formData.ice,
                "Montant HT": formData.amount_ht,
                "TVA 20%": formData.tva,
                "Montant TTC": formData.amount_ttc,
                "Mode de paiement": formData.payment_method,
                "Débit": formData.debit,
                "Crédit": formData.credit,
                "Remise": formData.remise,
                "TOTAL PAYÉ": formData.total_paye,
            });

            if (sheetResult.success) {
                toast.success("Saved to database and Google Sheets!");
            } else {
                toast.warning("Saved to database, but failed to sync with Google Sheets. Check your script URL.");
            }

            onSuccess();
            onOpenChange(false);
            reset();
        } catch (error: any) {
            toast.error(error.message || "Failed to save record");
        } finally {
            setIsSaving(false);
        }
    };

    const reset = () => {
        setMode("choice");
        setImage(null);
        setFormData({
            supplier: "",
            ice: "",
            invoice_number: "",
            date: "",
            due_date: "",
            amount_ht: 0,
            tva: 0,
            amount_ttc: 0,
            remise: 0,
            debit: 0,
            credit: 0,
            total_paye: 0,
            payment_method: "Espèce",
            category: "Other"
        });
        setIsProcessing(false);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
            <DialogContent className="bg-[#0a0a0a]/95 border-white/10 text-white backdrop-blur-2xl max-w-xl overflow-hidden rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gold-500/10 rounded-xl">
                            <Scan className="w-6 h-6 text-gold-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold">Smart Scan Invoice</DialogTitle>
                            <DialogDescription className="text-gray-400">AI-powered extraction & Google Sheets sync</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 py-2">
                    {mode === "choice" && (
                        <div className="grid grid-cols-2 gap-4 py-8">
                            <button
                                onClick={() => setMode("camera")}
                                className="flex flex-col items-center justify-center gap-4 p-8 bg-white/[0.03] border border-white/5 rounded-3xl hover:bg-gold-500/5 hover:border-gold-500/30 transition-all group"
                            >
                                <div className="p-4 bg-white/5 rounded-full group-hover:scale-110 transition-transform">
                                    <Camera className="w-8 h-8 text-gold-500" />
                                </div>
                                <span className="font-bold">Use Camera</span>
                            </button>
                            <label className="flex flex-col items-center justify-center gap-4 p-8 bg-white/[0.03] border border-white/5 rounded-3xl hover:bg-gold-500/5 hover:border-gold-500/30 transition-all group cursor-pointer">
                                <div className="p-4 bg-white/5 rounded-full group-hover:scale-110 transition-transform">
                                    <Upload className="w-8 h-8 text-gold-500" />
                                </div>
                                <span className="font-bold">Upload Image</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </label>
                        </div>
                    )}

                    {mode === "camera" && (
                        <div className="space-y-4 py-4">
                            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black aspect-video">
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setMode("choice")} className="flex-1 h-12 rounded-xl border-white/10">Cancel</Button>
                                <Button onClick={capture} className="flex-[2] h-12 rounded-xl bg-gold-500 text-black hover:bg-gold-400 font-bold">
                                    Catch Snapshot
                                </Button>
                            </div>
                        </div>
                    )}

                    {mode === "review" && (
                        <div className="space-y-6">
                            {isProcessing ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="relative">
                                        <Loader2 className="w-16 h-16 animate-spin text-gold-500" />
                                        <Scan className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-gold-500" />
                                    </div>
                                    <p className="text-xl font-bold animate-pulse">AI is reading your invoice...</p>
                                    <p className="text-sm text-gray-500">Extracting amounts, dates, and supplier info</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {/* Row 1: Fournisseur + ICE */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 ml-1">Fournisseur</p>
                                            <Input
                                                value={formData.supplier}
                                                onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                                                className="bg-white/5 border-white/10 h-11 rounded-xl focus:border-gold-500/50"
                                                placeholder="e.g. Bricoma"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 ml-1">ICE</p>
                                            <Input
                                                value={formData.ice}
                                                onChange={e => setFormData({ ...formData, ice: e.target.value })}
                                                className="bg-white/5 border-white/10 h-11 rounded-xl focus:border-gold-500/50"
                                                placeholder="15-digit ICE"
                                            />
                                        </div>
                                    </div>

                                    {/* Row 2: N° Facture + Date */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 ml-1">N° Facture</p>
                                            <Input
                                                value={formData.invoice_number}
                                                onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
                                                className="bg-white/5 border-white/10 h-11 rounded-xl focus:border-gold-500/50"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 ml-1">Date Facture</p>
                                            <Input
                                                type="date"
                                                value={formData.date}
                                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                className="bg-white/5 border-white/10 h-11 rounded-xl focus:border-gold-500/50"
                                            />
                                        </div>
                                    </div>

                                    {/* Row 3: Montant HT + TVA + TTC */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 ml-1">Montant HT</p>
                                            <Input
                                                type="number"
                                                value={formData.amount_ht}
                                                onChange={e => setFormData({ ...formData, amount_ht: parseFloat(e.target.value) || 0 })}
                                                className="bg-white/5 border-white/10 h-11 rounded-xl focus:border-gold-500/50"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 ml-1">TVA 20% (MAD)</p>
                                            <Input
                                                type="number"
                                                value={formData.tva}
                                                onChange={e => setFormData({ ...formData, tva: parseFloat(e.target.value) || 0 })}
                                                className="bg-white/5 border-white/10 h-11 rounded-xl focus:border-gold-500/50"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 ml-1">Montant TTC</p>
                                            <Input
                                                type="number"
                                                value={formData.amount_ttc}
                                                onChange={e => setFormData({ ...formData, amount_ttc: parseFloat(e.target.value) || 0 })}
                                                className="bg-white/5 border-white/10 h-11 rounded-xl focus:border-gold-500/50"
                                            />
                                        </div>
                                    </div>

                                    {/* Row 4: Mode de paiement + Remise */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 ml-1">Mode de Paiement</p>
                                            <select
                                                value={formData.payment_method}
                                                onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 h-11 rounded-xl focus:border-gold-500/50 px-3 text-sm text-white"
                                            >
                                                <option value="Espèce" className="bg-black">Espèce</option>
                                                <option value="Carte banquaire" className="bg-black">Carte banquaire</option>
                                                <option value="Virement" className="bg-black">Virement</option>
                                                <option value="Chèque" className="bg-black">Chèque</option>
                                                <option value="BC" className="bg-black">BC</option>
                                                <option value="C/E" className="bg-black">C/E</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 ml-1">Remise (MAD)</p>
                                            <Input
                                                type="number"
                                                value={formData.remise}
                                                onChange={e => setFormData({ ...formData, remise: parseFloat(e.target.value) || 0 })}
                                                className="bg-white/5 border-white/10 h-11 rounded-xl focus:border-gold-500/50"
                                            />
                                        </div>
                                    </div>

                                    {/* Row 5: Débit + Crédit + TOTAL PAYÉ */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 ml-1">Débit</p>
                                            <Input
                                                type="number"
                                                value={formData.debit}
                                                onChange={e => setFormData({ ...formData, debit: parseFloat(e.target.value) || 0 })}
                                                className="bg-white/5 border-white/10 h-11 rounded-xl focus:border-gold-500/50"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 ml-1">Crédit</p>
                                            <Input
                                                type="number"
                                                value={formData.credit}
                                                onChange={e => setFormData({ ...formData, credit: parseFloat(e.target.value) || 0 })}
                                                className="bg-white/5 border-white/10 h-11 rounded-xl focus:border-gold-500/50"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 ml-1">TOTAL PAYÉ</p>
                                            <Input
                                                type="number"
                                                value={formData.total_paye}
                                                onChange={e => setFormData({ ...formData, total_paye: parseFloat(e.target.value) || 0 })}
                                                className="bg-rose-500/5 border-rose-500/20 text-rose-400 font-bold h-11 rounded-xl focus:border-rose-500/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-3">
                                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                        <p className="text-xs text-emerald-300 font-medium italic">Colonnes synchronisées avec LES FACTURES D&apos;ACHATS 2025.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {mode === "review" && !isProcessing && (
                    <DialogFooter className="p-6 pt-2 flex gap-3">
                        <Button variant="ghost" onClick={reset} disabled={isSaving} className="flex-1 h-12 rounded-xl text-gray-400 hover:text-white hover:bg-white/5">Discard</Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-[2] h-12 rounded-xl bg-gold-500 text-black hover:bg-gold-400 font-bold shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm & Save"}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
