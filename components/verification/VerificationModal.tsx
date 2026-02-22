"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, FileText, CheckCircle, AlertCircle, Loader2, ShieldCheck, X as XIcon } from "lucide-react";
import { CameraCapture } from "./CameraCapture";
import { uploadIdentityDocument, getVerificationStatus } from "@/app/actions/verification";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface VerificationModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    isVerified: boolean;
}

export function VerificationModal({ isOpen, onOpenChange, isVerified }: VerificationModalProps) {
    const [step, setStep] = useState<'status' | 'type' | 'method' | 'capture' | 'preview'>('status');
    const [docType, setDocType] = useState<'passport' | 'id_card' | null>(null);
    const [method, setMethod] = useState<'upload' | 'camera' | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [statusData, setStatusData] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            checkStatus();
        }
    }, [isOpen]);

    const checkStatus = async () => {
        const data = await getVerificationStatus();
        setStatusData(data);

        // If no document or rejected, go to type selection
        if (!data || data.status === 'rejected') {
            setStep('type');
        } else if (data.status === 'pending') {
            setStep('status');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStep('preview');
        }
    };

    const handleCameraCapture = (capturedFile: File) => {
        setFile(capturedFile);
        setStep('preview');
    };

    const handleSubmit = async () => {
        if (!file || !docType) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentType", docType);

        const result = await uploadIdentityDocument(formData);

        if (result.error) {
            toast.error(result.error);
            setUploading(false);
        } else {
            toast.success("Document uploaded successfully!");
            setUploading(false);
            setStep('status'); // Move to status view
            checkStatus(); // Refresh status
            router.refresh(); // Refresh dashboard
            // Don't close immediately, let them see pending status
        }
    };

    // If verified, don't show modal
    if (isVerified) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-surface-100 border-white/10 text-white sm:max-w-md">
                <DialogHeader className="relative">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-gold-500" />
                        ID Verification
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        To ensure safety, please verify your identity.
                    </DialogDescription>
                    {/* Explicit Close Button if needed, but Dialog X usually exists. 
                        We can add a prominent "Ignore for now" if requested, but Dialog's default behavior allows dismissal.
                    */}
                </DialogHeader>

                {/* STEP: STATUS (Pending/Rejected) */}
                {step === 'status' && (
                    <div className="space-y-6 py-4 text-center">
                        {statusData?.status === 'pending' ? (
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                                    <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                                </div>
                                <h3 className="text-xl font-bold">Verification Pending</h3>
                                <p className="text-gray-400 mt-2">
                                    We are reviewing your document. This usually takes a few minutes.
                                </p>
                                <Button onClick={() => onOpenChange(false)} className="mt-6 w-full bg-white/10 hover:bg-white/20">
                                    Close & Continue Browsing
                                </Button>
                            </div>
                        ) : (
                            // Should not happen if strictly following logic, but fallback
                            <div className="flex flex-col items-center">
                                <p className="mb-4">Please upload your ID to continue booking.</p>
                                <div className="flex gap-2 w-full">
                                    <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Later</Button>
                                    <Button onClick={() => setStep('type')} className="flex-1 bg-gold-500 text-black hover:bg-gold-400">Verify Now</Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP: DOCUMENT TYPE */}
                {step === 'type' && (
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <Card
                            className={`p-6 bg-surface-50 border-white/10 hover:border-gold-500 cursor-pointer transition-all flex flex-col items-center gap-4 ${docType === 'passport' ? 'border-gold-500 bg-gold-500/10' : ''}`}
                            onClick={() => setDocType('passport')}
                        >
                            <FileText className="w-10 h-10 text-blue-400" />
                            <span className="font-bold text-white">Passport</span>
                        </Card>
                        <Card
                            className={`p-6 bg-surface-50 border-white/10 hover:border-gold-500 cursor-pointer transition-all flex flex-col items-center gap-4 ${docType === 'id_card' ? 'border-gold-500 bg-gold-500/10' : ''}`}
                            onClick={() => setDocType('id_card')}
                        >
                            <FileText className="w-10 h-10 text-green-400" />
                            <span className="font-bold text-white">ID Card</span>
                        </Card>
                        <div className="col-span-2 mt-4">
                            <Button className="w-full bg-gold-500 text-black hover:bg-gold-400 font-bold" disabled={!docType} onClick={() => setStep('method')}>
                                Continue
                            </Button>
                        </div>
                    </div>
                )}

                {/* STEP: METHOD */}
                {step === 'method' && (
                    <div className="space-y-4 py-4">
                        <Button
                            variant="outline"
                            className="w-full h-16 bg-surface-50 border-white/10 hover:bg-white/5 hover:border-gold-500 justify-start px-6 gap-4 text-lg"
                            onClick={() => { setMethod('upload'); setStep('preview'); }} // Directly go to preview (which handles upload input)
                        >
                            <Upload className="w-6 h-6 text-gold-500" />
                            Upload File
                        </Button>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-surface-100 px-2 text-gray-400">Or</span></div>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full h-16 bg-surface-50 border-white/10 hover:bg-white/5 hover:border-gold-500 justify-start px-6 gap-4 text-lg"
                            onClick={() => { setMethod('camera'); setStep('capture'); }}
                        >
                            <Camera className="w-6 h-6 text-gold-500" />
                            Take Photo
                        </Button>
                        <Button variant="ghost" onClick={() => setStep('type')} className="w-full mt-2">Back</Button>
                    </div>
                )}

                {/* STEP: CAPTURE (Camera) */}
                {step === 'capture' && (
                    <div className="py-4">
                        <CameraCapture
                            onCapture={handleCameraCapture}
                            onCancel={() => setStep('method')}
                        />
                    </div>
                )}

                {/* STEP: PREVIEW / UPLOAD INPUT */}
                {step === 'preview' && (
                    <div className="space-y-6 py-4">
                        {method === 'upload' && !file && (
                            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:bg-white/5 transition-colors relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-4" />
                                <p className="font-bold">Click to upload or drag and drop</p>
                                <p className="text-sm text-gray-500">JPG, PNG or PDF (Max 5MB)</p>
                            </div>
                        )}

                        {file && (
                            <div className="space-y-4">
                                <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-white/10">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt="Preview"
                                        className="w-full h-full object-contain"
                                    />
                                    <Button
                                        size="icon"
                                        className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 rounded-full"
                                        onClick={() => setFile(null)}
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </Button>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-white">{docType === 'passport' ? 'Passport' : 'ID Card'}</p>
                                    <p className="text-sm text-gray-400">File: {file.name}</p>
                                </div>
                                <div className="flex gap-4">
                                    <Button variant="outline" onClick={() => setFile(null)} className="flex-1">Retake</Button>
                                    <Button
                                        className="flex-1 bg-gold-500 text-black hover:bg-gold-400 font-bold"
                                        onClick={handleSubmit}
                                        disabled={uploading}
                                    >
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                        Submit Document
                                    </Button>
                                </div>
                            </div>
                        )}

                        {!file && <Button variant="ghost" onClick={() => setStep('method')} className="w-full">Back</Button>}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// Helper icon component for close button inside preview
function X({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
    )
}
