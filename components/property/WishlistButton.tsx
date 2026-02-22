"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface WishlistButtonProps {
    propertyId: string;
    initialIsSaved?: boolean;
    className?: string;
    readonly?: boolean;
}

export function WishlistButton({ propertyId, initialIsSaved = false, className = "", readonly = false }: WishlistButtonProps) {
    const [isSaved, setIsSaved] = useState(initialIsSaved);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        // Check initial status if not provided or to verify
        const checkStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('wishlist')
                .select('id')
                .eq('user_id', user.id)
                .eq('property_id', propertyId)
                .single();

            if (data) setIsSaved(true);
        };
        checkStatus();
    }, [propertyId]);

    const toggleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent link navigation if inside a card link
        e.stopPropagation();

        if (readonly) return;
        if (isLoading) return;

        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast.error("Please log in to save properties");
            router.push("/login");
            return;
        }

        try {
            if (isSaved) {
                // Remove
                const { error } = await supabase
                    .from('wishlist')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('property_id', propertyId);

                if (error) throw error;
                setIsSaved(false);
                toast.success("Removed from wishlist");
            } else {
                // Add
                const { error } = await supabase
                    .from('wishlist')
                    .insert({
                        user_id: user.id,
                        property_id: propertyId
                    });

                if (error) throw error;
                setIsSaved(true);
                toast.success("Added to wishlist");
            }
            router.refresh();
        } catch (error) {
            console.error("Error toggling wishlist:", error);
            toast.error("Failed to update wishlist");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={toggleWishlist}
            className={`transition-transform active:scale-95 focus:outline-none ${className}`}
            disabled={isLoading}
        >
            <Heart
                className={`w-6 h-6 ${isSaved ? "fill-gold-500 text-gold-500" : "text-white hover:text-gold-500"} transition-colors`}
            />
        </button>
    );
}
