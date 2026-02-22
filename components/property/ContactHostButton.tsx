"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { startConversation } from "@/app/actions/messages";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ContactHostButtonProps {
    propertyId: string;
    ownerId: string;
    isAuthenticated: boolean;
}

export function ContactHostButton({ propertyId, ownerId, isAuthenticated }: ContactHostButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleContact = async () => {
        if (!isAuthenticated) {
            toast.error("Please log in to contact the host");
            router.push("/login");
            return;
        }

        setIsLoading(true);
        try {
            const result = await startConversation(propertyId, ownerId);

            if (result.error) {
                toast.error(result.error);
                return;
            }

            if (result.conversationId) {
                router.push(`/dashboard/messages/${result.conversationId}`);
            }
        } catch (error) {
            console.error("Failed to start conversation:", error);
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            className="w-full border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-black"
            onClick={handleContact}
            disabled={isLoading}
        >
            <MessageCircle className="w-4 h-4 mr-2" />
            {isLoading ? "Starting chat..." : "Contact Host"}
        </Button>
    );
}
