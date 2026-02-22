import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { MapPin, Globe, Heart, BadgeCheck, ShieldCheck, Star } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { Navbar } from "@/components/Navbar";
import { PropertyCard } from "@/components/PropertyCard";

export const dynamic = 'force-dynamic';

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch Current User for specific actions (like Contact Host)
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch Profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

    if (!profile) {
        notFound();
    }

    // 2. Fetch Listings
    const { data: listings } = await supabase
        .from("properties")
        .select("*")
        .eq("host_id", id)
        .eq("is_published", true)
        .limit(6); // Limit for preview

    // 3. Fetch Reviews (for all properties owned by this host)
    // First get all property IDs
    const { data: allProperties } = await supabase
        .from('properties')
        .select('id')
        .eq('host_id', id);

    let reviews: any[] = [];
    let averageRating = 0;
    let totalReviews = 0;

    if (allProperties && allProperties.length > 0) {
        const propertyIds = allProperties.map(p => p.id);

        const { data: reviewsData } = await supabase
            .from('reviews')
            .select(`
                *,
                reviewer:profiles(full_name, avatar_url),
                property:properties(title)
            `)
            .in('property_id', propertyIds)
            .order('created_at', { ascending: false });

        if (reviewsData) {
            reviews = reviewsData;
            totalReviews = reviews.length;
            if (totalReviews > 0) {
                const sum = reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0);
                averageRating = Number((sum / totalReviews).toFixed(1));
            }
        }
    }

    return (
        <main className="min-h-screen bg-black text-white font-sans selection:bg-gold-500 selection:text-black">
            <Navbar />

            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Profile Header Card */}
                <div className="relative bg-surface-50 border border-white/10 rounded-3xl overflow-hidden mb-12">
                    {/* Cover Image / Gradient */}
                    <div className="h-64 relative bg-surface-100">
                        <div className="absolute inset-0 bg-gradient-to-r from-surface-100 via-surface-100/50 to-gold-900/20" />
                        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
                    </div>

                    <div className="px-8 pb-8 md:px-12 md:pb-12 relative">
                        <div className="flex flex-col md:flex-row items-end gap-8 -mt-20">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="h-40 w-40 rounded-full border-4 border-surface-50 bg-surface-200 shadow-2xl overflow-hidden">
                                    {profile.avatar_url ? (
                                        <Image
                                            src={profile.avatar_url}
                                            alt={profile.full_name}
                                            fill
                                            className="object-cover rounded-full"
                                            sizes="(max-width: 768px) 100vw, 160px"
                                            priority
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-surface-100 text-5xl font-bold text-gray-500 rounded-full">
                                            {profile.full_name?.charAt(0) || "U"}
                                        </div>
                                    )}
                                </div>
                                {profile.is_verified && (
                                    <div className="absolute bottom-2 right-2 bg-blue-500 text-white p-1.5 rounded-full ring-4 ring-black" title="Verified Identity">
                                        <BadgeCheck className="w-5 h-5" />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 mb-2">
                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                                    {profile.full_name || "Luxe Member"}
                                </h1>
                                <p className="text-gray-400 flex items-center gap-2 text-lg">
                                    {/* Removed Role, replaced with Rating/New User */}
                                    {totalReviews > 0 ? (
                                        <>
                                            <span className="flex items-center text-white font-bold">
                                                {averageRating} <Star className="w-4 h-4 ml-1 fill-white" />
                                            </span>
                                            <span className="text-gray-600">•</span>
                                            <span>{totalReviews} reviews</span>
                                        </>
                                    ) : (
                                        <span className="flex items-center text-white font-bold">
                                            New User <Star className="w-4 h-4 ml-2 fill-white" />
                                        </span>
                                    )}
                                    <span className="text-gray-600">•</span>
                                    <span>Joined {format(new Date(profile.created_at || new Date()), 'MMMM yyyy')}</span>
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mb-2">
                                {user?.id !== profile.id && (
                                    <div className="min-w-[140px]">
                                        {profile.is_verified && (
                                            <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-500 text-sm font-bold flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4" />
                                                Identity Verified
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column: Stats & Details */}
                    <div className="space-y-8">
                        {/* Bio */}
                        <div className="bg-surface-50 border border-white/5 rounded-2xl p-8">
                            <h3 className="text-xl font-bold text-white mb-4">About</h3>
                            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                                {profile.bio || "This user hasn't written a bio yet."}
                            </p>
                        </div>

                        {/* Details Grid */}
                        <div className="bg-surface-50 border border-white/5 rounded-2xl p-8 space-y-6">
                            {profile.location && (
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-white/5 rounded-lg">
                                        <MapPin className="w-5 h-5 text-gold-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Lives in</h4>
                                        <p className="text-gray-300">{profile.location}</p>
                                    </div>
                                </div>
                            )}

                            {profile.languages && profile.languages.length > 0 && (
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-white/5 rounded-lg">
                                        <Globe className="w-5 h-5 text-gold-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Speaks</h4>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {profile.languages.map((lang: string) => (
                                                <span key={lang} className="text-gray-300">
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {profile.hobbies && profile.hobbies.length > 0 && (
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-white/5 rounded-lg">
                                        <Heart className="w-5 h-5 text-gold-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Passions</h4>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {profile.hobbies.map((hobby: string) => (
                                                <span key={hobby} className="px-2 py-1 bg-white/5 text-gray-300 text-xs rounded-md border border-white/5">
                                                    {hobby}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Listings & Reviews */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* 1. Listings */}
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-white">
                                    {listings && listings.length > 0 ? `${profile.full_name}'s Listings` : "No Active Listings"}
                                </h2>
                                {listings && listings.length > 0 && (
                                    <span className="text-gray-400 text-sm">{listings.length} properties</span>
                                )}
                            </div>

                            {listings && listings.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {listings.map((listing: any) => (
                                        <PropertyCard
                                            key={listing.id}
                                            id={listing.id}
                                            title={listing.title}
                                            location={`${listing.location_city}, ${listing.location_country}`}
                                            price={listing.price_per_night}
                                            image={listing.images?.[0] || listing.image_urls?.[0]}
                                            rating={listing.average_rating}
                                            guests={listing.max_guests}
                                            bedrooms={listing.bedrooms}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-surface-50 border border-white/5 rounded-2xl p-12 text-center">
                                    <p className="text-gray-400">This user has no active property listings.</p>
                                </div>
                            )}
                        </div>

                        {/* 2. Reviews */}
                        {totalReviews > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                                    <Star className="w-6 h-6 fill-white text-white" />
                                    {totalReviews} Reviews
                                    <span className="text-gray-400 text-lg font-normal">
                                        (Average {averageRating})
                                    </span>
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="bg-surface-50 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="h-12 w-12 rounded-full bg-surface-200 overflow-hidden relative">
                                                    {review.reviewer?.avatar_url ? (
                                                        <Image
                                                            src={review.reviewer.avatar_url}
                                                            alt={review.reviewer.full_name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                                            {review.reviewer?.full_name?.[0] || 'G'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white">{review.reviewer?.full_name || 'Guest'}</h4>
                                                    <div className="text-xs text-gray-500">
                                                        {format(new Date(review.created_at), 'MMMM yyyy')}
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-gray-300 text-sm leading-relaxed mb-4">
                                                {review.comment}
                                            </p>

                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span>Stayed at</span>
                                                <span className="text-gold-500">{review.property?.title}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
