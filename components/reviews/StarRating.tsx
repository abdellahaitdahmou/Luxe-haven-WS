
"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface StarRatingProps {
    rating: number;
    setRating?: (rating: number) => void;
    readonly?: boolean;
    size?: "sm" | "md" | "lg";
}

export function StarRating({ rating, setRating, readonly = false, size = "md" }: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState(0);

    const handleMouseEnter = (index: number) => {
        if (!readonly) setHoverRating(index);
    };

    const handleMouseLeave = () => {
        if (!readonly) setHoverRating(0);
    };

    const handleClick = (index: number) => {
        if (!readonly && setRating) setRating(index);
    };

    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6",
    };

    return (
        <div className="flex gap-1" onMouseLeave={handleMouseLeave}>
            {[1, 2, 3, 4, 5].map((index) => {
                const isConfigured = index <= (hoverRating || rating);
                return (
                    <button
                        key={index}
                        type="button"
                        onClick={() => handleClick(index)}
                        onMouseEnter={() => handleMouseEnter(index)}
                        disabled={readonly}
                        className={cn(
                            "focus:outline-none transition-transform hover:scale-110",
                            readonly ? "cursor-default hover:scale-100" : "cursor-pointer"
                        )}
                    >
                        <Star
                            className={cn(
                                sizeClasses[size],
                                isConfigured ? "fill-gold-500 text-gold-500" : "text-gray-600",
                                !readonly && "hover:text-gold-400"
                            )}
                        />
                    </button>
                );
            })}
        </div>
    );
}
