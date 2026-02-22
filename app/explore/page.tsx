import { createClient } from "@/utils/supabase/server"
import { Suspense } from "react"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { Search, SlidersHorizontal, Calendar, Users } from "lucide-react"
import Link from "next/link"
import { ExplorePropertyCard } from "@/components/ExplorePropertyCard"

const PROPERTY_TYPES = [
    { value: "all", label: "All", emoji: "✨" },
    { value: "villa", label: "Villa", emoji: "🏖️" },
    { value: "apartment", label: "Apartment", emoji: "🏢" },
    { value: "house", label: "House", emoji: "🏠" },
    { value: "studio", label: "Studio", emoji: "🛋️" },
    { value: "chalet", label: "Chalet", emoji: "🏔️" },
    { value: "penthouse", label: "Penthouse", emoji: "🌆" },
    { value: "cabin", label: "Cabin", emoji: "🪵" },
    { value: "island", label: "Island", emoji: "🏝️" },
];

async function getProperties(searchParams: {
    location?: string
    guests?: string
    checkin?: string
    checkout?: string
    type?: string
}) {
    const supabase = await createClient()

    let query = supabase
        .from("properties")
        .select("id, title, address, price_per_night, image_urls, bedrooms, bathrooms, max_guests, amenities, status, property_type")
        .eq("status", "active")
        .order("created_at", { ascending: false })

    // Filter by location (address)
    if (searchParams.location) {
        const loc = searchParams.location
        query = query.ilike("address", `%${loc}%`)
    }

    // Filter by minimum guest capacity
    if (searchParams.guests) {
        const g = parseInt(searchParams.guests)
        if (!isNaN(g)) {
            query = query.gte("max_guests", g)
        }
    }

    // Filter by property type
    if (searchParams.type && searchParams.type !== "all") {
        query = query.eq("property_type", searchParams.type)
    }

    const { data, error } = await query.limit(50)

    if (error) {
        console.error("Supabase error:", error)
        return []
    }

    return data || []
}

export default async function ExplorePage({
    searchParams,
}: {
    searchParams: Promise<{ location?: string; guests?: string; checkin?: string; checkout?: string; type?: string }>
}) {
    const params = await searchParams
    const properties = await getProperties(params)

    const locationQuery = params.location || ""
    const guestsQuery = params.guests ? parseInt(params.guests) : null
    const checkin = params.checkin || ""
    const checkout = params.checkout || ""
    const typeFilter = params.type || "all"

    const hasFilters = locationQuery || checkin || checkout || guestsQuery || (typeFilter && typeFilter !== "all")

    // Build base URL preserving other params (for category link generation)
    const buildTypeUrl = (type: string) => {
        const p = new URLSearchParams()
        if (locationQuery) p.set("location", locationQuery)
        if (params.guests) p.set("guests", params.guests)
        if (checkin) p.set("checkin", checkin)
        if (checkout) p.set("checkout", checkout)
        if (type !== "all") p.set("type", type)
        const qs = p.toString()
        return `/explore${qs ? `?${qs}` : ""}`
    }

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />

            {/* Header */}
            <div className="pt-28 pb-8 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">
                            {locationQuery ? `Properties in ${locationQuery}` : "Explore Properties"}
                        </h1>
                        <p className="text-gray-400 flex flex-wrap items-center gap-3">
                            <span>
                                {properties.length === 0
                                    ? "No properties found"
                                    : `${properties.length} propert${properties.length === 1 ? "y" : "ies"} found`}
                            </span>
                            {checkin && checkout && (
                                <>
                                    <span className="text-white/20">•</span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-gold-500" />
                                        {checkin} — {checkout}
                                    </span>
                                </>
                            )}
                            {guestsQuery && (
                                <>
                                    <span className="text-white/20">•</span>
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5 text-gold-500" />
                                        {guestsQuery} guest{guestsQuery > 1 ? "s" : ""}
                                    </span>
                                </>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {hasFilters && (
                            <Link
                                href="/explore"
                                className="text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-4 py-2 rounded-full transition"
                            >
                                Clear filters
                            </Link>
                        )}
                        <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-4 py-2 rounded-full transition">
                            <SlidersHorizontal className="w-4 h-4" />
                            Filters
                        </button>
                    </div>
                </div>

                {/* Category Filter Strip */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1 mb-6">
                    {PROPERTY_TYPES.map((pt) => {
                        const isActive = typeFilter === pt.value
                        return (
                            <Link
                                key={pt.value}
                                href={buildTypeUrl(pt.value)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium whitespace-nowrap transition-all duration-200 ${isActive
                                    ? "border-gold-500 bg-gold-500/10 text-gold-400 shadow-[0_0_12px_rgba(212,175,55,0.15)]"
                                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/30 hover:text-white"
                                    }`}
                            >
                                <span className="text-base">{pt.emoji}</span>
                                <span>{pt.label}</span>
                            </Link>
                        )
                    })}
                </div>

                {/* Property Grid */}
                {properties.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-500" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">No properties found</h2>
                        <p className="text-gray-500 mb-6">
                            {locationQuery
                                ? `We couldn't find any properties matching "${locationQuery}". Try a different location.`
                                : "No properties are currently listed. Check back soon!"}
                        </p>
                        <Link
                            href="/explore"
                            className="inline-block bg-gold-500 hover:bg-gold-400 text-black font-semibold px-8 py-3 rounded-full transition"
                        >
                            View All Properties
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map((property: any) => (
                            <ExplorePropertyCard
                                key={property.id}
                                property={property}
                                checkin={checkin}
                                checkout={checkout}
                            />
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </main>
    )
}

function PropertyCard({ property, checkin, checkout }: { property: any; checkin: string; checkout: string }) {
    // NOTE: This function is called from a server component, so it renders as server HTML.
    // Currency symbol is injected server-side as a prop from the server currency fetch,
    // OR we simply use the useCurrency hook since Next.js client boundary propagates.
    // Since this file is a server component, we pass currencySymbol as prop via a wrapper.
    const href = `/properties/${property.id}${checkin && checkout
        ? `?checkin=${checkin}&checkout=${checkout}`
        : ""}`

    const image = property.image_urls?.[0]
    const location = property.address || "Morocco"
    const rating = null // will add when reviews system is wired
    const reviewCount = 0

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
                {property.property_type && (() => {
                    const pt = ["villa", "apartment", "house", "studio", "chalet", "penthouse", "cabin", "island"]
                    const emojis: Record<string, string> = { villa: "🏖️", apartment: "🏢", house: "🏠", studio: "🛋️", chalet: "🏔️", penthouse: "🌆", cabin: "🪵", island: "🏝️" }
                    const emoji = emojis[property.property_type] || "✨"
                    return (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10">
                            <span>{emoji}</span>
                            <span className="capitalize">{property.property_type}</span>
                        </div>
                    )
                })()}

                {/* Rating badge */}
                {rating && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10">
                        <Star className="w-3 h-3 fill-gold-500 text-gold-500" />
                        {rating}
                    </div>
                )}

                {/* Amenity tags */}
                {property.amenities && Array.isArray(property.amenities) && property.amenities.slice(0, 2).length > 0 && (
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
                        <span className="text-white font-bold text-lg">${property.price_per_night}</span>
                        <span className="text-gray-500 text-sm"> / night</span>
                    </div>
                    {reviewCount > 0 && (
                        <span className="text-xs text-gray-500">{reviewCount} review{reviewCount > 1 ? "s" : ""}</span>
                    )}
                </div>
            </div>
        </Link>
    )
}
