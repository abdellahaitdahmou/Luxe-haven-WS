/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Grid, ImageIcon } from "lucide-react"

interface GalleryImage {
    url: string;
    category?: string;
}

interface PropertyGalleryProps {
    images: GalleryImage[] | string[] | any[];
}

export function PropertyGallery({ images }: PropertyGalleryProps) {
    const [activeCategory, setActiveCategory] = useState("All");

    // Normalize images to unified format
    const allImages = useMemo(() => {
        if (!images || images.length === 0) return [];

        return images.map(img => {
            if (typeof img === 'string') {
                return { url: img, category: "Other" };
            }
            return {
                url: img.url,
                category: img.category || "Other"
            };
        });
    }, [images]);

    // Extract categories
    const categories = useMemo(() => {
        const cats = new Set(allImages.map(img => img.category));
        // Only show categories if there's more than one distinct category (excluding "Other" if it's the only one)
        const uniqueCats = Array.from(cats).filter(Boolean).sort();
        return ["All", ...uniqueCats];
    }, [allImages]);

    // Filter images
    const displayImages = useMemo(() => {
        if (activeCategory === "All") return allImages;
        return allImages.filter(img => img.category === activeCategory);
    }, [activeCategory, allImages]);

    // Get top 5 for the grid
    const gridImages = displayImages.slice(0, 5);

    if (allImages.length === 0) {
        return (
            <div className="h-[40vh] md:h-[60vh] bg-surface-50 rounded-3xl flex items-center justify-center text-gray-500 border border-white/10">
                <div className="text-center">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No images available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Category Tabs - Only show if we have meaningful categories */}
            {categories.length > 2 && ( // "All" + "Other" = 2, so > 2 means at least one real category
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${activeCategory === cat
                                ? "bg-gold-500 text-black shadow-lg shadow-gold-500/20"
                                : "bg-surface-50 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Bento Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 h-[300px] md:h-[60vh] rounded-3xl overflow-hidden relative group">
                {/* Main Image (Large) */}
                <motion.div
                    layout
                    className="col-span-2 md:col-span-2 md:row-span-2 relative h-full w-full cursor-pointer hover:opacity-95 transition bg-gray-900"
                >
                    <img
                        src={gridImages[0]?.url}
                        alt="Main View"
                        className="object-cover w-full h-full"
                    />
                </motion.div>

                {/* Secondary Images */}
                <div className="md:col-span-2 grid grid-cols-2 gap-2 h-full">
                    {gridImages.slice(1).map((img, idx) => (
                        <motion.div
                            layout
                            key={img.url + idx} // Use URL + idx to force re-render on exact dupe which shouldn't happen but safe
                            className="relative h-full w-full cursor-pointer hover:opacity-95 transition bg-gray-900"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.05 * idx }}
                        >
                            <img
                                src={img.url}
                                alt={`View ${idx + 2}`}
                                className="object-cover w-full h-full"
                            />
                        </motion.div>
                    ))}

                    {/* Placeholder for empty lots if filtering results in < 5 images */}
                    {Array.from({ length: Math.max(0, 4 - gridImages.slice(1).length) }).map((_, idx) => (
                        <div key={`empty-${idx}`} className="bg-surface-50/50 flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-white/10" />
                        </div>
                    ))}
                </div>

                {/* Show All Button */}
                <div className="absolute bottom-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition duration-300">
                    <button
                        onClick={() => alert("Full gallery view implementing soon...")}
                        className="bg-white/90 backdrop-blur text-black px-4 py-2 rounded-lg text-sm font-semibold shadow-lg flex items-center gap-2 hover:scale-105 transition"
                    >
                        <Grid className="w-4 h-4" />
                        Show all ({displayImages.length})
                    </button>
                </div>
            </div>
        </div>
    )
}
