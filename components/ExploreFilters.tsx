"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SlidersHorizontal, X, Check, Search, Home, Building2 } from "lucide-react"

const AMENITIES_LIST = [
    "Wifi", "Air conditioning", "Kitchen", "Heating",
    "Workspace", "TV", "Pool", "Hot tub", "Gym", "Free parking"
]

const PROPERTY_TYPES = [
    { value: "villa", label: "Villa", emoji: "🏖️" },
    { value: "apartment", label: "Apartment", emoji: "🏢" },
    { value: "house", label: "House", emoji: "🏠" },
    { value: "studio", label: "Studio", emoji: "🛋️" },
    { value: "chalet", label: "Chalet", emoji: "🏔️" },
    { value: "penthouse", label: "Penthouse", emoji: "🌆" },
    { value: "cabin", label: "Cabin", emoji: "🪵" },
    { value: "island", label: "Island", emoji: "🏝️" },
]

export function ExploreFilters({ initialParams }: { initialParams: any }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isOpen, setIsOpen] = useState(false)

    // Local state for filters
    const [serviceType, setServiceType] = useState(() => {
        if (searchParams.get("type") === "office") return "office"
        if (searchParams.get("listingType") === "sale") return "sale"
        return "rent" // default
    })
    const [propertyType, setPropertyType] = useState(searchParams.get("type") && searchParams.get("type") !== "office" ? searchParams.get("type") : "all")

    const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "")
    const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "")
    const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") || "0")
    const [beds, setBeds] = useState(searchParams.get("beds") || "0")
    const [bathrooms, setBathrooms] = useState(searchParams.get("bathrooms") || "0")

    // Surface Area
    const [minSurface, setMinSurface] = useState(searchParams.get("minSurface") || "")
    const [maxSurface, setMaxSurface] = useState(searchParams.get("maxSurface") || "")

    // Amenities
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
        searchParams.get("amenities") ? searchParams.get("amenities")!.split(',') : []
    )

    // Sync state if URL changes outside
    useEffect(() => {
        if (searchParams.get("type") === "office") setServiceType("office")
        else if (searchParams.get("listingType") === "sale") setServiceType("sale")
        else setServiceType("rent")

        setPropertyType(searchParams.get("type") && searchParams.get("type") !== "office" ? searchParams.get("type") : "all")
        setMinPrice(searchParams.get("minPrice") || "")
        setMaxPrice(searchParams.get("maxPrice") || "")
        setBedrooms(searchParams.get("bedrooms") || "0")
        setBeds(searchParams.get("beds") || "0")
        setBathrooms(searchParams.get("bathrooms") || "0")
        setMinSurface(searchParams.get("minSurface") || "")
        setMaxSurface(searchParams.get("maxSurface") || "")
        setSelectedAmenities(searchParams.get("amenities") ? searchParams.get("amenities")!.split(',') : [])
    }, [searchParams])

    const toggleAmenity = (amenity: string) => {
        setSelectedAmenities(prev =>
            prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
        )
    }

    const Counter = ({ label, value, onChange, min = 0, step = 1 }: any) => (
        <div className="flex items-center justify-between py-3">
            <span className="text-[var(--page-text)] text-sm font-medium">{label}</span>
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => onChange(Math.max(min, parseFloat((parseFloat(value) - step).toFixed(1))).toString())}
                    disabled={parseFloat(value) <= min}
                    className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-[var(--muted-text)] hover:border-gold-500 hover:text-gold-400 transition disabled:opacity-30 text-lg font-light"
                >−</button>
                <span className="w-6 text-center text-white font-semibold text-sm tabular-nums">{value === '0' ? 'Any' : value}{value !== '0' && '+'}</span>
                <button
                    type="button"
                    onClick={() => onChange((parseFloat(value) + step).toString())}
                    className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-[var(--muted-text)] hover:border-gold-500 hover:text-gold-400 transition text-lg font-light"
                >+</button>
            </div>
        </div>
    )

    const applyFilters = () => {
        const params = new URLSearchParams(searchParams.toString())

        if (serviceType === "sale") {
            params.set("listingType", "sale")
            params.delete("type")
        } else if (serviceType === "office") {
            params.set("type", "office")
            params.set("listingType", "rent")
        } else {
            params.set("listingType", "rent")
            if (propertyType && propertyType !== "all") {
                params.set("type", propertyType)
            } else {
                params.delete("type")
            }
        }

        if (minPrice) params.set("minPrice", minPrice)
        else params.delete("minPrice")

        if (maxPrice) params.set("maxPrice", maxPrice)
        else params.delete("maxPrice")

        if (bedrooms !== "0") params.set("bedrooms", bedrooms)
        else params.delete("bedrooms")

        if (beds !== "0") params.set("beds", beds)
        else params.delete("beds")

        if (bathrooms !== "0") params.set("bathrooms", bathrooms)
        else params.delete("bathrooms")

        if (minSurface) params.set("minSurface", minSurface)
        else params.delete("minSurface")

        if (maxSurface) params.set("maxSurface", maxSurface)
        else params.delete("maxSurface")

        if (selectedAmenities.length > 0) params.set("amenities", selectedAmenities.join(','))
        else params.delete("amenities")

        setIsOpen(false)
        router.push(`/explore?${params.toString()}`)
    }

    const clearAll = () => {
        setServiceType("rent")
        setPropertyType("all")
        setMinPrice("")
        setMaxPrice("")
        setBedrooms("0")
        setBeds("0")
        setBathrooms("0")
        setMinSurface("")
        setMaxSurface("")
        setSelectedAmenities([])
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 text-sm text-[var(--muted-text)] hover:text-[var(--page-text)] border border-[var(--card-border)] hover:border-gold-500/30 px-4 py-2 rounded-full transition"
            >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="w-full max-w-md bg-[var(--card-bg)] border-l border-[var(--card-border)] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--card-border)]">
                            <h2 className="text-xl font-bold text-white">Filters</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrolling Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                            {/* Service Type */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-white">Looking For</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => setServiceType("rent")}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition border ${serviceType === "rent" ? "border-gold-500 bg-gold-500/10 text-gold-500" : "border-white/10 bg-black/30 hover:bg-[var(--surface-100)] text-[var(--page-text)]"}`}
                                    >
                                        <div className={`p-2 rounded-lg ${serviceType === "rent" ? "bg-gold-500/20" : "bg-[var(--surface-200)]"}`}>
                                            <Home className="w-5 h-5" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="font-semibold text-sm">Rent Property</p>
                                        </div>
                                        {serviceType === "rent" && <Check className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => setServiceType("sale")}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition border ${serviceType === "sale" ? "border-gold-500 bg-gold-500/10 text-gold-500" : "border-white/10 bg-black/30 hover:bg-[var(--surface-100)] text-[var(--page-text)]"}`}
                                    >
                                        <div className={`p-2 rounded-lg ${serviceType === "sale" ? "bg-gold-500/20" : "bg-[var(--surface-200)]"}`}>
                                            <Home className="w-5 h-5" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="font-semibold text-sm">Buy Property</p>
                                        </div>
                                        {serviceType === "sale" && <Check className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => setServiceType("office")}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition border ${serviceType === "office" ? "border-gold-500 bg-gold-500/10 text-gold-500" : "border-white/10 bg-black/30 hover:bg-[var(--surface-100)] text-[var(--page-text)]"}`}
                                    >
                                        <div className={`p-2 rounded-lg ${serviceType === "office" ? "bg-gold-500/20" : "bg-[var(--surface-200)]"}`}>
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="font-semibold text-sm">Rent Office</p>
                                        </div>
                                        {serviceType === "office" && <Check className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <hr className="border-white/5" />

                            {/* Property Type (Only if residential) */}
                            {serviceType !== "office" && (
                                <>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4 text-white">Property Type</h3>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                onClick={() => setPropertyType("all")}
                                                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition text-center ${propertyType === "all" || !propertyType
                                                    ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                                                    : 'border-white/10 bg-black/30 text-[var(--muted-text)] hover:border-white/30 hover:text-[var(--page-text)]'
                                                    }`}
                                            >
                                                <span className="text-2xl">✨</span>
                                                <span className="text-xs font-medium">All Types</span>
                                            </button>
                                            {PROPERTY_TYPES.map(pt => (
                                                <button
                                                    key={pt.value}
                                                    onClick={() => setPropertyType(pt.value)}
                                                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition text-center ${propertyType === pt.value
                                                        ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                                                        : 'border-white/10 bg-black/30 text-[var(--muted-text)] hover:border-white/30 hover:text-[var(--page-text)]'
                                                        }`}
                                                >
                                                    <span className="text-2xl">{pt.emoji}</span>
                                                    <span className="text-xs font-medium">{pt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <hr className="border-white/5" />
                                </>
                            )}

                            {/* Price Range */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-white">Price Range</h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-xs text-[var(--muted-text)] uppercase tracking-wider font-semibold">Min ($)</label>
                                        <input
                                            type="number"
                                            value={minPrice}
                                            onChange={e => setMinPrice(e.target.value)}
                                            placeholder="Any"
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-gold-500 outline-none transition"
                                        />
                                    </div>
                                    <span className="text-[var(--muted-text)] mt-5">-</span>
                                    <div className="flex-1 space-y-1">
                                        <label className="text-xs text-[var(--muted-text)] uppercase tracking-wider font-semibold">Max ($)</label>
                                        <input
                                            type="number"
                                            value={maxPrice}
                                            onChange={e => setMaxPrice(e.target.value)}
                                            placeholder="Any"
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-gold-500 outline-none transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-white/5" />

                            {/* Surface Area (Mainly for Offices) */}
                            <div>
                                <h3 className="text-lg font-semibold mb-1 text-white">Surface Area</h3>
                                <p className="text-xs text-[var(--muted-text)] mb-4">Especially useful for office rentals</p>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-xs text-[var(--muted-text)] uppercase tracking-wider font-semibold">Min (m²)</label>
                                        <input
                                            type="number"
                                            value={minSurface}
                                            onChange={e => setMinSurface(e.target.value)}
                                            placeholder="Any"
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-gold-500 outline-none transition"
                                        />
                                    </div>
                                    <span className="text-[var(--muted-text)] mt-5">-</span>
                                    <div className="flex-1 space-y-1">
                                        <label className="text-xs text-[var(--muted-text)] uppercase tracking-wider font-semibold">Max (m²)</label>
                                        <input
                                            type="number"
                                            value={maxSurface}
                                            onChange={e => setMaxSurface(e.target.value)}
                                            placeholder="Any"
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-gold-500 outline-none transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-white/5" />

                            {/* Rooms & Beds */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-white">Rooms & Capacity</h3>
                                <div className="flex flex-col">
                                    {serviceType !== "office" && (
                                        <>
                                            <Counter label="Bedrooms" value={bedrooms} onChange={setBedrooms} />
                                            <div className="w-full h-px bg-white/5" />
                                            <Counter label="Beds" value={beds} onChange={setBeds} />
                                            <div className="w-full h-px bg-white/5" />
                                        </>
                                    )}
                                    <Counter label="Bathrooms" value={bathrooms} onChange={setBathrooms} step={0.5} />
                                </div>
                            </div>

                            <hr className="border-white/5" />

                            {/* Amenities */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-white">Amenities</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {AMENITIES_LIST.map(amenity => (
                                        <label key={amenity} className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${selectedAmenities.includes(amenity) ? 'bg-gold-500 border-gold-500 text-black' : 'border-white/20 group-hover:border-gold-500'}`}>
                                                {selectedAmenities.includes(amenity) && <Check className="w-3.5 h-3.5" />}
                                            </div>
                                            <span className={`text-sm transition ${selectedAmenities.includes(amenity) ? 'text-white' : 'text-[var(--muted-text)] group-hover:text-gold-500'}`}>{amenity}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-[var(--card-border)] flex items-center justify-between bg-[var(--surface-100)]">
                            <button
                                onClick={clearAll}
                                className="text-sm font-semibold text-[var(--muted-text)] hover:text-white transition"
                            >
                                Clear all
                            </button>
                            <button
                                onClick={applyFilters}
                                className="bg-gold-500 hover:bg-gold-600 text-black font-bold px-8 py-3 rounded-xl transition shadow-lg shadow-gold-500/20 flex items-center gap-2"
                            >
                                <Search className="w-4 h-4" />
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
