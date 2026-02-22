import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { BookingWidget } from "@/components/BookingWidget"
import { PropertyGallery } from "@/components/PropertyGallery"
import {
    MapPin, Star, Bed, Bath, Users, Wifi, Waves, Car,
    ChefHat, Dumbbell, Shield, CheckCircle
} from "lucide-react"
import Link from "next/link"

const AMENITY_ICONS: Record<string, any> = {
    "WiFi": <Wifi className="w-5 h-5" />,
    "Pool": <Waves className="w-5 h-5" />,
    "Parking": <Car className="w-5 h-5" />,
    "Kitchen": <ChefHat className="w-5 h-5" />,
    "Gym": <Dumbbell className="w-5 h-5" />,
    "Security": <Shield className="w-5 h-5" />,
}

async function getProperty(id: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single()

    if (error || !data) return null

    // Fetch owner separately to avoid JOIN typing issues
    let owner = null
    if (data.owner_id) {
        const { data: ownerData } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .eq("id", data.owner_id)
            .single()
        owner = ownerData
    }

    return { ...data, owner }
}

async function getBlockedDates(propertyId: string): Promise<Date[]> {
    const supabase = await createClient()
    const { data } = await supabase
        .from("calendar_availability")
        .select("date")
        .eq("property_id", propertyId)
        .eq("is_blocked", true)

    return (data || []).map((d: any) => new Date(d.date))
}

async function getSeasonalPrices(propertyId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from("calendar_availability")
        .select("date, price")
        .eq("property_id", propertyId)
        .not("price", "is", null)

    return (data || []).map((d: any) => ({
        date: new Date(d.date),
        price: d.price,
    }))
}

async function getReviews(propertyId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false })
        .limit(5)

    if (!data || data.length === 0) return []

    // Fetch reviewers separately
    const reviewerIds = [...new Set(data.map((r: any) => r.reviewer_id || r.user_id).filter(Boolean))]
    let reviewers: Record<string, any> = {}
    if (reviewerIds.length > 0) {
        const supabase2 = await createClient()
        const { data: profData } = await supabase2
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", reviewerIds)
        profData?.forEach((p: any) => { reviewers[p.id] = p })
    }

    return data.map((r: any) => ({
        ...r,
        reviewer: reviewers[r.reviewer_id || r.user_id] || null
    }))
}

export default async function PropertyDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ checkin?: string; checkout?: string; guests?: string }>
}) {
    const { id } = await params
    const sp = await searchParams

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const [property, blockedDates, seasonalPrices, reviews] = await Promise.all([
        getProperty(id),
        getBlockedDates(id),
        getSeasonalPrices(id),
        getReviews(id),
    ])

    if (!property) return notFound()

    const images: string[] = property.image_urls || []
    const amenities: string[] = Array.isArray(property.amenities)
        ? property.amenities
        : (typeof property.amenities === "object" && property.amenities !== null)
            ? Object.values<string[]>(property.amenities).flat()
            : []

    const location = property.address || "Morocco"

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-24 px-6 max-w-7xl mx-auto pb-24">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link href="/explore" className="hover:text-gold-500 transition">Properties</Link>
                    <span>›</span>
                    <span className="text-white line-clamp-1">{property.title}</span>
                </div>

                {/* Title Row */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">{property.title}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-gold-500" />
                                {location}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Gallery */}
                {images.length > 0 ? (
                    <div className="mb-10">
                        <PropertyGallery images={images} />
                    </div>
                ) : (
                    <div className="mb-10 h-64 bg-gray-900 rounded-2xl flex items-center justify-center">
                        <span className="text-gray-600">No images available</span>
                    </div>
                )}

                {/* Main Content + Booking Widget */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left: Details */}
                    <div className="lg:col-span-2 space-y-10">

                        {/* Host Info */}
                        {property.owner && (
                            <div className="flex items-center gap-4 pb-8 border-b border-white/10">
                                <div className="w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-500 font-bold text-lg overflow-hidden shrink-0">
                                    {property.owner.avatar_url ? (
                                        <img src={property.owner.avatar_url} alt={property.owner.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                        (property.owner.full_name as string)?.charAt(0) || "H"
                                    )}
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Hosted by</p>
                                    <p className="font-semibold text-white">{property.owner.full_name || "Luxe Haven"}</p>
                                </div>
                            </div>
                        )}

                        {/* Key Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {property.max_guests && (
                                <div className="flex flex-col items-center gap-2 bg-white/5 rounded-xl p-4 text-center">
                                    <Users className="w-6 h-6 text-gold-500" />
                                    <span className="text-white font-semibold">{property.max_guests}</span>
                                    <span className="text-gray-500 text-xs">Guests</span>
                                </div>
                            )}
                            {property.bedrooms && (
                                <div className="flex flex-col items-center gap-2 bg-white/5 rounded-xl p-4 text-center">
                                    <Bed className="w-6 h-6 text-gold-500" />
                                    <span className="text-white font-semibold">{property.bedrooms}</span>
                                    <span className="text-gray-500 text-xs">Bedrooms</span>
                                </div>
                            )}
                            {property.beds && (
                                <div className="flex flex-col items-center gap-2 bg-white/5 rounded-xl p-4 text-center">
                                    <Bed className="w-6 h-6 text-gold-500" />
                                    <span className="text-white font-semibold">{property.beds}</span>
                                    <span className="text-gray-500 text-xs">Beds</span>
                                </div>
                            )}
                            {property.bathrooms && (
                                <div className="flex flex-col items-center gap-2 bg-white/5 rounded-xl p-4 text-center">
                                    <Bath className="w-6 h-6 text-gold-500" />
                                    <span className="text-white font-semibold">{property.bathrooms}</span>
                                    <span className="text-gray-500 text-xs">Bathrooms</span>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {property.description && (
                            <div>
                                <h2 className="text-xl font-bold mb-4">About this property</h2>
                                <p className="text-gray-400 leading-relaxed whitespace-pre-line">{property.description}</p>
                            </div>
                        )}

                        {/* Amenities */}
                        {amenities.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold mb-4">What this place offers</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    {amenities.map((amenity: string) => (
                                        <div key={amenity} className="flex items-center gap-3 text-gray-300">
                                            <span className="text-gold-500">
                                                {AMENITY_ICONS[amenity] || <CheckCircle className="w-5 h-5" />}
                                            </span>
                                            <span>{amenity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reviews */}
                        {reviews.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <Star className="w-5 h-5 fill-gold-500 text-gold-500" />
                                    {reviews.length} Review{reviews.length !== 1 ? "s" : ""}
                                </h2>
                                <div className="space-y-6">
                                    {reviews.map((review: any) => (
                                        <div key={review.id} className="pb-6 border-b border-white/5 last:border-0">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-500 font-bold overflow-hidden">
                                                    {review.reviewer?.avatar_url ? (
                                                        <img src={review.reviewer.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        (review.reviewer?.full_name as string)?.charAt(0) || "G"
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white text-sm">{review.reviewer?.full_name || "Guest"}</p>
                                                    <p className="text-gray-500 text-xs">{new Date(review.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                                                </div>
                                                <div className="ml-auto flex items-center gap-0.5">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star key={i} className={`w-3 h-3 ${i < (review.rating || 0) ? "fill-gold-500 text-gold-500" : "text-gray-700"}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-gray-400 text-sm leading-relaxed">{review.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Booking Widget (includes Message Host button) */}
                    <div>
                        <BookingWidget
                            price={property.price_per_night}
                            seasonalPrices={seasonalPrices}
                            blockedDates={blockedDates}
                            propertyId={property.id}
                            ownerId={property.owner_id || undefined}
                            isLoggedIn={!!user}
                        />
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    )
}
