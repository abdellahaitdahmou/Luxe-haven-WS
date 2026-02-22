"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";
import { startConversation } from "@/app/actions/messages";
import { toast } from "sonner";

interface ContactHostButtonProps {
    propertyId: string;
    ownerId: string;
    isLoggedIn: boolean;
}

export function ContactHostButton({ propertyId, ownerId, isLoggedIn }: ContactHostButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleContact() {
        if (!isLoggedIn) {
            router.push("/login?redirect=/properties/" + propertyId);
            return;
        }

        try {
            setLoading(true);
            const result = await startConversation(propertyId, ownerId);

            if (result.error) {
                toast.error(result.error);
                return;
            }

            router.push(`/dashboard/messages/${result.conversationId}`);
        } catch {
            toast.error("Failed to start conversation. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button
            onClick={handleContact}
            disabled={loading}
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10 hover:border-white/40 gap-2 h-11"
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <MessageCircle className="w-4 h-4" />
            )}
            {loading ? "Opening chat..." : "Contact Host"}
        </Button>
    );
}
