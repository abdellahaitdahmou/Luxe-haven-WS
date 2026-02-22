"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
    const pathname = usePathname();

    useEffect(() => {
        checkStatus();
    }, [pathname]);

    const checkStatus = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setIsLoading(false);
            return;
        }

        // Check role — hosts/admins never need ID verification
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = profile?.role || 'guest';
        if (role === 'admin' || role === 'owner' || role === 'host') {
            setIsVerified(true); // treat hosts as inherently verified
            setIsLoading(false);
            return;
        }

        const data = await getVerificationStatus();

        if (data && data.status === 'verified') {
            setIsVerified(true);
        } else {
            setIsVerified(false);
            // Only prompt guests browsing the dashboard
            if (!data || data.status === 'rejected' || data.status === 'pending') {
                if (pathname.startsWith('/dashboard')) {
                    setIsOpen(true);
                } else {
                    setIsOpen(false);
                }
            }
        }
        setIsLoading(false);
    };

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
