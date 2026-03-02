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
    const [extractedData, setExtractedData] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const webcamRef = useRef<Webcam>(null);

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
            if (result.success) {
                setExtractedData(result.data);
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

    const handleSave = async () => {
        if (!extractedData) return;
        setIsSaving(true);
        try {
            // 1. Save to local DB (Supabase)
            await createExpense({
                description: extractedData.supplier ? `${extractedData.supplier} - ${extractedData.invoice_number || "Invoice"}` : "Scanned Invoice",
                amount: extractedData.amount_ttc || 0,
                date: extractedData.date || new Date().toISOString().split("T")[0],
                payment_method: "cash", // Default or map from extractedData
                property_name: "platform", // Default
                category: extractedData.category || "Other"
            });

            // 2. Save to Google Sheet
            const sheetResult = await saveToGoogleSheet(extractedData);
            if (sheetResult.success) {
                toast.success("Saved to database and Google Sheets!");
            } else {
                toast.warning("Saved to database, but failed to sync with Google Sheets. Please check your credentials.");
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
        setExtractedData(null);
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

                <div className="p-6">
                    {mode === "choice" && (
                        <div className="grid grid-cols-2 gap-4">
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
                        <div className="space-y-4">
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
                            ) : extractedData ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 ml-1">Supplier</p>
                                            <div className="bg-white/5 border border-white/10 p-3 rounded-xl font-bold text-gold-500">
                                                {extractedData.supplier || "Not found"}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 ml-1">Invoice #</p>
                                            <div className="bg-white/5 border border-white/10 p-3 rounded-xl font-bold">
                                                {extractedData.invoice_number || "Not found"}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 ml-1">Date</p>
                                            <div className="bg-white/5 border border-white/10 p-3 rounded-xl font-bold">
                                                {extractedData.date || "Not found"}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 ml-1">Total TTC</p>
                                            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl font-black text-rose-500 text-lg">
                                                {extractedData.amount_ttc ? `${extractedData.amount_ttc} DH` : "Not found"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-3">
                                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                        <p className="text-xs text-emerald-300 font-medium">Ready to sync with Local DB & Google Sheets</p>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    )}
                </div>

                {mode === "review" && !isProcessing && (
                    <DialogFooter className="p-6 pt-0 flex gap-3">
                        <Button variant="ghost" onClick={reset} disabled={isSaving} className="flex-1 h-12 rounded-xl text-gray-400">Discard</Button>
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
