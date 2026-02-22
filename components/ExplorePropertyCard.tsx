"use client";

import { MapPin, Star, Bed, Bath, Users } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/context/CurrencyContext";

const PROPERTY_TYPE_EMOJIS: Record<string, string> = {
    villa: "🏖️", apartment: "🏢", house: "🏠",
    studio: "🛋️", chalet: "🏔️", penthouse: "🌆",
    cabin: "🪵", island: "🏝️"
};

export function ExplorePropertyCard({ property, checkin, checkout }: { property: any; checkin: string; checkout: string }) {
    const { format } = useCurrency();

    const href = `/properties/${property.id}${checkin && checkout
        ? `?checkin=${checkin}&checkout=${checkout}`
        : ""}`;

    const image = property.image_urls?.[0];
    const location = property.address || "Morocco";
    const rating = null;
    const reviewCount = 0;

    return (
        <Link
            href={href}
            className="group block bg-surface-50 border border-white/5 rounded-2xl overflow-hidden hover:border-gold-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]"
        >
            {/* Image */}
            <div className="relative h-56 overflow-hidden bg-gray-900">
                {image ? (
                    <img
                        src={image}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <span className="text-gray-600 text-sm">No image</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Property type badge */}
                {property.property_type && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10">
                        <span>{PROPERTY_TYPE_EMOJIS[property.property_type] || "✨"}</span>
                        <span className="capitalize">{property.property_type}</span>
                    </div>
                )}

                {/* Rating badge */}
                {rating && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10">
                        <Star className="w-3 h-3 fill-gold-500 text-gold-500" />
                        {rating}
                    </div>
                )}

                {/* Amenity tags */}
                {property.amenities && Array.isArray(property.amenities) && property.amenities.length > 0 && (
                    <div className="absolute bottom-3 left-3 flex gap-1.5">
                        {(property.amenities as string[]).slice(0, 2).map((tag: string) => (
                            <span key={tag} className="text-xs bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full border border-white/10">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-5">
                <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-lg leading-tight group-hover:text-gold-400 transition line-clamp-1">{property.title}</h3>
                    {!rating && reviewCount === 0 && (
                        <span className="text-xs text-gold-500 font-semibold shrink-0 ml-2 mt-0.5">New</span>
                    )}
                </div>
                <p className="text-gray-400 text-sm flex items-center gap-1 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                    <span className="line-clamp-1">{location}</span>
                </p>
                <div className="flex items-center gap-4 text-gray-500 text-sm mb-4">
                    {property.bedrooms && (
                        <span className="flex items-center gap-1">
                            <Bed className="w-3.5 h-3.5" /> {property.bedrooms} bed{property.bedrooms > 1 ? "s" : ""}
                        </span>
                    )}
                    {property.bathrooms && (
                        <span className="flex items-center gap-1">
                            <Bath className="w-3.5 h-3.5" /> {property.bathrooms} bath{property.bathrooms > 1 ? "s" : ""}
                        </span>
                    )}
                    {property.max_guests && (
                        <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> {property.max_guests}
                        </span>
                    )}
                </div>
                <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                    <div>
                        <span className="text-white font-bold text-lg">{format(property.price_per_night)}</span>
                        <span className="text-gray-500 text-sm"> / night</span>
                    </div>
                    {reviewCount > 0 && (
                        <span className="text-xs text-gray-500">{reviewCount} review{reviewCount > 1 ? "s" : ""}</span>
                    )}
                </div>
            </div>
        </Link>
    );
}
