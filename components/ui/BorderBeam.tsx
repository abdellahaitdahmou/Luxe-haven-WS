"use client";

import { motion } from "framer-motion";

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

interface BorderBeamProps {
    className?: string;
    size?: number;
    duration?: number;
    colorFrom?: string;
    colorTo?: string;
    borderWidth?: number;
}

export function BorderBeam({
    className,
    size = 200, // Reverted to longer beam
    duration = 6,
    colorFrom = "#D4AF37",
    colorTo = "transparent",
    borderWidth = 1.0, // Reduced from 1.5 to 1.0 (thinner/lighter weight)
}: BorderBeamProps) {
    return (
        <div
            className={cn(
                "absolute inset-0 rounded-[inherit] pointer-events-none overflow-hidden",
                className
            )}
            style={{
                // Masking strategy:
                // 1. Create a mask that covers the content box (inner area) with opaque color (which we will exclude)
                // 2. Create a mask that covers the border box (full area) with opaque color
                // 3. Composite them to exclude the content box from the border box => Result: Border Only
                maskImage: "linear-gradient(transparent, transparent), linear-gradient(white, white)",
                maskClip: "content-box, border-box",
                padding: `${borderWidth}px`,
                // Standard & Webkit composite (exclude/xor)
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
            } as React.CSSProperties}
        >
            <motion.div
                className="absolute aspect-square"
                style={{
                    width: size,
                    height: size,
                    offsetPath: `rect(0 100% 100% 0 round 24px)`,
                    offsetAnchor: "100% 50%", // Anchor to the front
                    // Create a sharp gradient beam
                    background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
                } as React.CSSProperties}
                animate={{
                    offsetDistance: ["0%", "100%"],
                }}
                transition={{
                    duration: duration,
                    ease: "linear",
                    repeat: Infinity,
                }}
            />
        </div>
    );
}
