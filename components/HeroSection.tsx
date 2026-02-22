"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeroSearch } from "@/components/HeroSearch";

export function HeroSection() {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const bgImages = [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop", // Luxury Mansion Pool at Dusk
        "https://images.unsplash.com/photo-1613490908736-b2a1a0134bc2?q=80&w=2070&auto=format&fit=crop", // Luxury Living Room
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop", // Modern Luxury House Exterior
        "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2070&auto=format&fit=crop"  // Luxury Resort Empty Pool
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % bgImages.length);
        }, 5000); // Change image every 5 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative min-h-screen md:h-[85vh] flex items-center justify-center pt-24 md:pt-0 overflow-hidden">
            {/* Background Carousel */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black z-10" />
                <AnimatePresence mode="popLayout">
                    <motion.img
                        key={currentImageIndex}
                        src={bgImages[currentImageIndex]}
                        alt="Luxury Moroccan Real Estate"
                        className="absolute inset-0 w-full h-full object-cover"
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                </AnimatePresence>
            </div>

            <div className="relative z-20 text-center w-full max-w-5xl px-6 md:-mt-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                >
                    <h1 className="text-4xl md:text-7xl font-bold mb-4 md:mb-6 tracking-tight leading-tight">
                        Discover Your <span className="text-gold-500 block md:inline relative">
                            Dream Home
                            <motion.span
                                className="absolute -bottom-2 left-0 w-full h-1 bg-gold-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 1, delay: 1.5, ease: "easeInOut" }}
                            />
                        </span>
                    </h1>
                </motion.div>

                <motion.p
                    className="text-lg md:text-xl text-gray-300 mb-8 md:mb-10 max-w-2xl mx-auto font-light"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1.0, ease: "easeOut" }}
                >
                    Experience the world&apos;s most exclusive stays. From private islands to mountain chalets, your journey begins here.
                </motion.p>

                <motion.div
                    className="flex justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1.8, ease: "easeOut" }}
                >
                    <HeroSearch />
                </motion.div>
            </div>
        </div>
    );
}
