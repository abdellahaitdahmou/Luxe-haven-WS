"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { usePathname } from "next/navigation";
import { VerificationModal } from "@/components/verification/VerificationModal";
import { getVerificationStatus } from "@/app/actions/verification";
import { createClient } from "@/utils/supabase/client";

interface VerificationContextType {
    openVerification: () => void;
    closeVerification: () => void;
    isVerified: boolean;
    isLoading: boolean;
}

const VerificationContext = createContext<VerificationContextType | undefined>(undefined);

export function VerificationProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified' | 'rejected'>('unverified');
    const pathname = usePathname();

    // Function to handle status updates and determine if modal should open
    const handleStatusUpdate = useCallback((status: 'unverified' | 'pending' | 'verified' | 'rejected') => {
        setVerificationStatus(status);
        setIsVerified(status === 'verified');

        // Only prompt guests browsing the dashboard if not verified or rejected/pending
        if (status !== 'verified') {
            if (pathname.startsWith('/dashboard')) {
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }
        } else {
            setIsOpen(false);
        }
    }, [pathname]);

    // Function declaration for checkStatus
    async function checkStatus() {
        setIsLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            handleStatusUpdate('unverified');
            setIsLoading(false);
            return;
        }

        // Check role — hosts/admins never need ID verification
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, verification_status')
            .eq('id', user.id)
            .single();

        const role = profile?.role || 'guest';
        if (role === 'admin' || role === 'owner' || role === 'host') {
            handleStatusUpdate('verified'); // treat hosts as inherently verified
            setIsLoading(false);
            return;
        }

        // If profile has a verification_status, use it
        if (profile?.verification_status) {
            handleStatusUpdate(profile.verification_status);
        } else {
            // Fallback to old getVerificationStatus if profile status is not set
            const data = await getVerificationStatus();
            if (data && data.status) {
                handleStatusUpdate(data.status);
            } else {
                handleStatusUpdate('unverified');
            }
        }
        setIsLoading(false);
    }

    useEffect(() => {
        checkStatus();

        const supabase = createClient();
        let channel: any;

        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                channel = supabase
                    .channel('profile_status_updates')
                    .on('postgres_changes', {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${user.id}`
                    }, (payload: any) => {
                        if (payload.new.verification_status) {
                            handleStatusUpdate(payload.new.verification_status);
                        }
                    })
                    .subscribe();
            }
        };

        setupRealtime();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [handleStatusUpdate]); // Dependency on handleStatusUpdate to ensure it's up-to-date

    useEffect(() => {
        // Re-evaluate modal visibility when pathname changes, based on current verificationStatus
        handleStatusUpdate(verificationStatus);
    }, [pathname, verificationStatus, handleStatusUpdate]);


    const openVerification = () => setIsOpen(true);
    const closeVerification = () => setIsOpen(false);

    return (
        <VerificationContext.Provider value={{ openVerification, closeVerification, isVerified, isLoading }}>
            {children}
            <VerificationModal
                isOpen={isOpen}
                onOpenChange={setIsOpen}
                isVerified={isVerified}
            />
        </VerificationContext.Provider>
    );
}

export function useVerification() {
    const context = useContext(VerificationContext);
    if (!context) {
        throw new Error("useVerification must be used within a VerificationProvider");
    }
    return context;
}
