"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Heart, MapPin, Star, BedDouble, Bath, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Property {
    id: string;
    title: string;
    description: string;
    image_urls: string[];
    price_per_night: number;
    location: string;
    rating: number;
    bedrooms: number;
    bathrooms: number;
    max_guests: number;
}

export default function WishlistPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchWishlist = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('wishlist')
                .select(`
                    property_id,
                    properties (*)
                `)
                .eq('user_id', user.id);

            if (data) {
                // Map the joined data to properties
                const props = data.map(item => item.properties as unknown as Property).filter(Boolean);
                setProperties(props);
            }
            setLoading(false);
        };

        fetchWishlist();
    }, []);

    if (loading) {
        return (
            <div className="flex bg-black min-h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Your Wishlist</h1>
                    <p className="text-gray-400">Places you've saved for later.</p>
                </div>
            </div>

            {properties.length === 0 ? (
                <div className="bg-surface-50 border border-white/10 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Heart className="w-8 h-8 text-gray-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">No saved properties yet</h2>
                    <p className="text-gray-400 max-w-md mx-auto mb-8">
                        Seems like you haven't found your dream stay yet. Browse our exclusive collection and save your favorites.
                    </p>
                    <Link href="/properties">
                        <Button className="bg-gold-500 text-black hover:bg-gold-400 font-bold px-8">
                            Explore Properties
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((property) => (
                        <Link href={`/properties/${property.id}`} key={property.id} className="group">
                            <div className="bg-surface-50 border border-white/10 rounded-2xl overflow-hidden hover:border-gold-500/50 transition-all duration-300 h-full flex flex-col">
                                <div className="relative h-64 overflow-hidden">
                                    <img
                                        src={property.image_urls?.[0] || "/placeholder-property.jpg"}
                                        alt={property.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-full">
                                        <Heart className="w-5 h-5 text-gold-500 fill-gold-500" />
                                    </div>
                                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1">
                                        <Star className="w-3 h-3 text-gold-500 fill-gold-500" />
                                        <span className="text-xs font-bold text-white">{property.rating || "New"}</span>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-white line-clamp-1 group-hover:text-gold-500 transition-colors">
                                            {property.title}
                                        </h3>
                                    </div>
                                    <div className="flex items-center text-gray-400 text-sm mb-4">
                                        <MapPin className="w-4 h-4 mr-1 text-gold-500" />
                                        <span className="truncate">{property.location || "Unknown Location"}</span>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-6 border-b border-white/5 pb-4">
                                        <div className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            <span>{property.max_guests} guests</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <BedDouble className="w-4 h-4" />
                                            <span>{property.bedrooms} beds</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Bath className="w-4 h-4" />
                                            <span>{property.bathrooms} baths</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex items-center justify-between">
                                        <div>
                                            <span className="text-2xl font-bold text-gold-500">${property.price_per_night}</span>
                                            <span className="text-gray-400 text-sm"> / night</span>
                                        </div>
                                        <Button variant="ghost" className="text-white hover:text-gold-500 hover:bg-white/5 p-0 h-auto font-semibold">
                                            View Details
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
