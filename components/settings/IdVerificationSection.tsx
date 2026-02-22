"use client";

import { useState } from "react";
import { BadgeCheck, ShieldCheck, Loader2 } from "lucide-react";
import { VerificationModal } from "@/components/verification/VerificationModal";

interface IdVerificationSectionProps {
    profile: any;
}

export function IdVerificationSection({ profile }: IdVerificationSectionProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="bg-surface-50 border border-white/10 rounded-xl p-8 max-w-2xl">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-gold-500" />
                        Identity Verification
                    </h3>
                    <p className="text-gray-400 mb-6">
                        Verify your identity to unlock booking features and build trust with hosts.
                    </p>
                </div>
                {profile?.is_verified ? (
                    <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-sm font-bold border border-green-500/20 flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4" /> Verified
                    </span>
                ) : (
                    <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-sm font-bold border border-yellow-500/20">
                        Unverified
                    </span>
                )}
            </div>

            {!profile?.is_verified && (
                <div className="bg-surface-100 p-6 rounded-lg border border-white/5">
                    <p className="text-white mb-4">Please complete the verification process by uploading your government ID.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-gold-500 hover:bg-gold-400 text-black font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Start Verification
                    </button>
                    <p className="text-sm text-gray-500 italic mt-4">
                        * You can start verification here or when making your first booking.
                    </p>
                </div>
            )}

            <VerificationModal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                isVerified={profile?.is_verified}
            />
        </div>
    );
}
