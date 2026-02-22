"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, Calendar, Users, ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react"
import { DayPicker, DateRange } from "react-day-picker"
import { format, addMonths } from "date-fns"
import "react-day-picker/dist/style.css"

type ActivePanel = "location" | "checkin" | "checkout" | "guests" | null

export function HeroSearch() {
    const router = useRouter()
    const [activePanel, setActivePanel] = useState<ActivePanel>(null)
    const [location, setLocation] = useState("")
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0 })
    const containerRef = useRef<HTMLDivElement>(null)

    const totalGuests = guests.adults + guests.children

    const formatDate = (date: Date | undefined) =>
        date ? format(date, "MMM d") : null

    const formatGuests = () => {
        if (totalGuests === 0) return null
        const parts = []
        if (guests.adults + guests.children > 0) parts.push(`${totalGuests} guest${totalGuests > 1 ? "s" : ""}`)
        if (guests.infants > 0) parts.push(`${guests.infants} infant${guests.infants > 1 ? "s" : ""}`)
        return parts.join(", ")
    }

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setActivePanel(null)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSearch = () => {
        const params = new URLSearchParams()
        if (location) params.set("location", location)
        if (dateRange?.from) params.set("checkin", format(dateRange.from, "yyyy-MM-dd"))
        if (dateRange?.to) params.set("checkout", format(dateRange.to, "yyyy-MM-dd"))
        if (totalGuests > 0) params.set("guests", String(totalGuests))
        router.push(`/explore?${params.toString()}`)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch()
    }

    const handleDateSelect = (range: DateRange | undefined) => {
        setDateRange(range)
        if (range?.from && !range?.to) {
            setActivePanel("checkout")
        } else if (range?.from && range?.to) {
            setActivePanel("guests")
        }
    }

    const adjust = (type: keyof typeof guests, delta: number) => {
        setGuests(prev => ({
            ...prev,
            [type]: Math.max(type === "adults" ? 1 : 0, prev[type] + delta)
        }))
    }

    const isActive = (panel: ActivePanel) => activePanel === panel

    return (
        <div ref={containerRef} className="w-full max-w-4xl relative">
            {/* Main Search Bar */}
            <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl md:rounded-full p-2 flex flex-col md:flex-row shadow-2xl">

                {/* Location */}
                <div
                    onClick={() => setActivePanel(isActive("location") ? null : "location")}
                    className={`flex-1 px-6 py-4 md:py-3 rounded-2xl md:rounded-full transition cursor-pointer group border-b border-white/5 md:border-none ${isActive("location") ? "bg-white/10" : "hover:bg-white/5"}`}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-gold-500" />
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider group-hover:text-gold-400 cursor-pointer">Location</label>
                    </div>
                    {isActive("location") ? (
                        <input
                            autoFocus
                            type="text"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Where are you going?"
                            className="w-full bg-transparent border-none outline-none text-white placeholder-gray-500 font-medium text-base"
                            onClick={e => e.stopPropagation()}
                        />
                    ) : (
                        <div className={`font-medium text-base ${location ? "text-white" : "text-gray-500"}`}>
                            {location || "Where are you going?"}
                        </div>
                    )}
                </div>

                <div className="w-px bg-white/10 my-2 hidden md:block" />

                {/* Check In */}
                <div
                    onClick={() => setActivePanel(isActive("checkin") ? null : "checkin")}
                    className={`flex-1 px-6 py-4 md:py-3 rounded-2xl md:rounded-full transition cursor-pointer group border-b border-white/5 md:border-none ${isActive("checkin") || isActive("checkout") ? "bg-white/10" : "hover:bg-white/5"}`}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-gold-500" />
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider group-hover:text-gold-400 cursor-pointer">Check In</label>
                    </div>
                    <div className={`font-medium text-base ${dateRange?.from ? "text-white" : "text-gray-500"}`}>
                        {formatDate(dateRange?.from) || "Add dates"}
                    </div>
                </div>

                <div className="w-px bg-white/10 my-2 hidden md:block" />

                {/* Check Out */}
                <div
                    onClick={() => setActivePanel(isActive("checkout") ? null : "checkout")}
                    className={`flex-1 px-6 py-4 md:py-3 rounded-2xl md:rounded-full transition cursor-pointer group border-b border-white/5 md:border-none ${isActive("checkout") ? "bg-white/10" : "hover:bg-white/5"}`}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-gold-500" />
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider group-hover:text-gold-400 cursor-pointer">Check Out</label>
                    </div>
                    <div className={`font-medium text-base ${dateRange?.to ? "text-white" : "text-gray-500"}`}>
                        {formatDate(dateRange?.to) || "Add dates"}
                    </div>
                </div>

                <div className="w-px bg-white/10 my-2 hidden md:block" />

                {/* Guests */}
                <div
                    onClick={() => setActivePanel(isActive("guests") ? null : "guests")}
                    className={`flex-1 px-6 py-4 md:py-3 rounded-2xl md:rounded-full transition cursor-pointer group ${isActive("guests") ? "bg-white/10" : "hover:bg-white/5"}`}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-gold-500" />
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider group-hover:text-gold-400 cursor-pointer">Guests</label>
                    </div>
                    <div className={`font-medium text-base ${totalGuests > 0 ? "text-white" : "text-gray-500"}`}>
                        {formatGuests() || "Add guests"}
                    </div>
                </div>

                {/* Search Button */}
                <div className="p-2 md:p-1 mt-2 md:mt-0">
                    <button
                        onClick={handleSearch}
                        className="w-full md:w-auto h-12 md:h-full md:aspect-square bg-gold-500 hover:bg-gold-600 text-black rounded-xl md:rounded-full flex items-center justify-center gap-2 md:gap-0 transition shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] font-bold"
                    >
                        <Search className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="md:hidden">Search</span>
                    </button>
                </div>
            </div>

            {/* Date Picker Panel */}
            {(isActive("checkin") || isActive("checkout")) && (
                <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 z-50 bg-[#18181b] border border-white/10 rounded-3xl shadow-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="text-center mb-4">
                        <p className="text-white font-semibold text-sm">
                            {!dateRange?.from
                                ? "Select check-in date"
                                : !dateRange?.to
                                    ? "Now select check-out date"
                                    : `${formatDate(dateRange.from)} → ${formatDate(dateRange.to)}`}
                        </p>
                    </div>
                    <DayPicker
                        mode="range"
                        selected={dateRange}
                        onSelect={handleDateSelect}
                        numberOfMonths={2}
                        disabled={{ before: new Date() }}
                        defaultMonth={new Date()}
                        components={{
                            IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                            IconRight: () => <ChevronRight className="h-4 w-4" />,
                        }}
                        classNames={{
                            months: "flex gap-8",
                            month: "space-y-4",
                            caption: "flex justify-center pt-1 relative items-center",
                            caption_label: "text-sm font-semibold text-white",
                            nav: "space-x-1 flex items-center",
                            nav_button: "h-7 w-7 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition",
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex",
                            head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem] text-center",
                            row: "flex w-full mt-2",
                            cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                            day: "h-9 w-9 p-0 font-normal rounded-full text-white hover:bg-white/10 flex items-center justify-center transition cursor-pointer",
                            day_selected: "bg-gold-500 text-black hover:bg-gold-400 font-bold",
                            day_range_start: "bg-gold-500 text-black rounded-full font-bold",
                            day_range_end: "bg-gold-500 text-black rounded-full font-bold",
                            day_range_middle: "bg-gold-500/20 text-white rounded-none",
                            day_today: "border border-gold-500/50 text-gold-400",
                            day_outside: "text-gray-700 opacity-50",
                            day_disabled: "text-gray-700 opacity-30 cursor-not-allowed",
                            day_hidden: "invisible",
                        }}
                    />
                    {dateRange?.from && dateRange?.to && (
                        <div className="flex justify-between mt-4 pt-4 border-t border-white/10">
                            <button
                                onClick={() => { setDateRange(undefined); setActivePanel("checkin") }}
                                className="text-sm text-gray-400 hover:text-white underline transition"
                            >
                                Clear dates
                            </button>
                            <button
                                onClick={() => setActivePanel("guests")}
                                className="bg-gold-500 hover:bg-gold-400 text-black text-sm font-semibold px-6 py-2 rounded-full transition"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Guests Panel */}
            {isActive("guests") && (
                <div className="absolute top-full mt-3 right-0 z-50 bg-[#18181b] border border-white/10 rounded-3xl shadow-2xl p-6 w-80 animate-in fade-in slide-in-from-top-2 duration-200">
                    <h3 className="text-white font-semibold mb-4">Who's coming?</h3>

                    {/* Adults */}
                    <div className="flex items-center justify-between py-4 border-b border-white/10">
                        <div>
                            <p className="text-white font-medium">Adults</p>
                            <p className="text-gray-500 text-sm">Ages 13 or above</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => adjust("adults", -1)}
                                disabled={guests.adults <= 1}
                                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-white/50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-white w-4 text-center font-medium">{guests.adults}</span>
                            <button
                                onClick={() => adjust("adults", 1)}
                                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-white/50 transition"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* Children */}
                    <div className="flex items-center justify-between py-4 border-b border-white/10">
                        <div>
                            <p className="text-white font-medium">Children</p>
                            <p className="text-gray-500 text-sm">Ages 2–12</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => adjust("children", -1)}
                                disabled={guests.children <= 0}
                                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-white/50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-white w-4 text-center font-medium">{guests.children}</span>
                            <button
                                onClick={() => adjust("children", 1)}
                                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-white/50 transition"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* Infants */}
                    <div className="flex items-center justify-between py-4">
                        <div>
                            <p className="text-white font-medium">Infants</p>
                            <p className="text-gray-500 text-sm">Under 2</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => adjust("infants", -1)}
                                disabled={guests.infants <= 0}
                                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-white/50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-white w-4 text-center font-medium">{guests.infants}</span>
                            <button
                                onClick={() => adjust("infants", 1)}
                                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-white/50 transition"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleSearch}
                        className="w-full mt-4 bg-gold-500 hover:bg-gold-400 text-black font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2"
                    >
                        <Search className="w-4 h-4" />
                        Search Properties
                    </button>
                </div>
            )}
        </div>
    )
}
