"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, Users, BedDouble } from "lucide-react";
import { WishlistButton } from "@/components/property/WishlistButton";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/context/CurrencyContext";

interface PropertyCardProps {
    id: string;
    title: string;
    location: string;
    price: number;
    image: string;
    rating?: number;
    guests: number;
    bedrooms: number;
    isPriority?: boolean;
}

export function PropertyCard({
    id,
    title,
    location,
    price,
    image,
    rating,
    guests,
    bedrooms,
    isPriority = false,
}: PropertyCardProps) {
    const { format } = useCurrency();
    return (
        <div className="group relative bg-surface-50 border border-white/5 rounded-2xl overflow-hidden hover:border-gold-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-gold-500/5">
            {/* Image Container */}
            <div className="aspect-[4/3] relative overflow-hidden">
                <Image
                    src={image || "/placeholder-property.jpg"}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    priority={isPriority}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                {/* Top Actions */}
                <div className="absolute top-4 right-4 z-10">
                    <WishlistButton propertyId={id} className="bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-gold-500 hover:text-black hover:border-gold-500 p-2 rounded-full transition-all" />
                </div>

                {/* Price Tag */}
                <div className="absolute bottom-4 left-4 z-10">
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg flex items-baseline gap-1">
                        <span className="text-gold-500 font-bold">{format(price)}</span>
                        <span className="text-white/60 text-xs"> / night</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <Link href={`/properties/${id}`} className="block p-5">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white text-lg line-clamp-1 group-hover:text-gold-500 transition-colors">
                        {title}
                    </h3>
                    {rating && (
                        <div className="flex items-center gap-1 text-gold-500 text-sm font-bold bg-gold-500/10 px-2 py-0.5 rounded-md">
                            <Star className="w-3.5 h-3.5 fill-gold-500" />
                            <span>{rating}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="truncate">{location}</span>
                </div>

                <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>{guests} Guests</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                        <BedDouble className="w-4 h-4 text-gray-500" />
                        <span>{bedrooms} Beds</span>
                    </div>
                </div>
            </Link>
        </div>
    );
}
