"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon,
    User, Loader2, DollarSign, Building2, SlidersHorizontal,
    Plus, Minus, X
} from "lucide-react";
import {
    format, addDays, startOfMonth, endOfMonth, eachDayOfInterval,
    isSameDay, isWithinInterval, startOfDay, parseISO, addMonths, subMonths
} from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Percent, Sparkles, Layers } from "lucide-react";
import { BulkUpdateDialog } from "@/components/admin/calendar/BulkUpdateDialog";
import { SmartPricingDialog } from "@/components/admin/calendar/SmartPricingDialog";

// Helper to generate the pill style for a booking
const getBookingStyle = (date: Date, booking: any) => {
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    checkOut.setDate(checkOut.getDate() - 1); // Display inclusive of last night

    const isStart = isSameDay(date, checkIn);
    const isEnd = isSameDay(date, checkOut);
    const isMiddle = isWithinInterval(date, { start: checkIn, end: checkOut });

    if (!isMiddle) return null;

    let className = "h-8 mt-1 text-xs font-medium flex items-center justify-center truncate px-1 cursor-pointer transition-all hover:brightness-110 relative z-10 ";

    // Status colors
    if (booking.status === 'confirmed') className += "bg-green-600 text-white ";
    else if (booking.status === 'pending') className += "bg-yellow-600 text-white ";
    else if (booking.status === 'cancelled') className += "bg-red-600/50 text-white/50 ";
    else className += "bg-gray-600 text-white ";

    // Border radius for start/end
    if (isStart && isEnd) className += "rounded-md mx-1";
    else if (isStart) className += "rounded-l-md ml-1";
    else if (isEnd) className += "rounded-r-md mr-1";
    else className += ""; // sharp corners for middle days

    return className;
};

const AMENITIES_LIST = [
    "Wifi", "Pool", "Kitchen", "Parking", "Gym", "Hot tub",
    "Air conditioning", "Heating", "Washer", "Dryer"
];

export default function MasterCalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [properties, setProperties] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [dailyPrices, setDailyPrices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({
        bedrooms: 0,
        beds: 0,
        bathrooms: 0,
        amenities: [] as string[]
    });

    // Price Update State
    const [priceUpdateOpen, setPriceUpdateOpen] = useState(false);
    const [selectedPriceData, setSelectedPriceData] = useState<{
        propertyId: string;
        date: Date;
        currentPrice: number;
    } | null>(null);
    const [newPrice, setNewPrice] = useState("");

    // Discount State
    const [discountOpen, setDiscountOpen] = useState(false);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
    const [weeklyDiscount, setWeeklyDiscount] = useState("");
    const [monthlyDiscount, setMonthlyDiscount] = useState("");

    // Bulk & Smart Pricing State
    const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
    const [smartPricingOpen, setSmartPricingOpen] = useState(false);

    // Days to show in the grid
    const days = useMemo(() => {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    useEffect(() => {
        fetchData();
    }, [currentDate]);

    const fetchData = async () => {
        setLoading(true);
        const supabase = createClient();

        // 1. Fetch properties
        const { data: propsData } = await supabase
            .from("properties")
            .select("id, title, price_per_night, images, bedrooms, beds, bathrooms, amenities")
            .order("title");

        if (propsData) setProperties(propsData);

        // Date range for fetching
        const start = startOfMonth(currentDate).toISOString();
        const end = endOfMonth(currentDate).toISOString();

        // 2. Fetch bookings
        const { data: bookingsData } = await supabase
            .from("bookings")
            .select(`
                *,
                profiles:user_id (full_name, email, avatar_url)
            `)
            .neq('status', 'cancelled')
            .or(`check_in_date.lte.${end},check_out_date.gte.${start}`); // Better filtering overlap

        if (bookingsData) setBookings(bookingsData);

        // 3. Fetch daily prices
        // Note: 'daily_prices' might not exist if migration hasn't run. Handle gracefully.
        try {
            const { data: pricesData, error } = await supabase
                .from("daily_prices")
                .select("*")
                .gte("date", start)
                .lte("date", end);

            if (!error && pricesData) setDailyPrices(pricesData);
        } catch (e) {
            console.error("Daily prices table missing or error", e);
        }

        setLoading(false);
    };

    const getBookingForDate = (propertyId: string, date: Date) => {
        return bookings.find(b =>
            b.property_id === propertyId &&
            isWithinInterval(date, {
                start: new Date(b.check_in_date),
                end: new Date(new Date(b.check_out_date).setDate(new Date(b.check_out_date).getDate() - 1))
            })
        );
    };

    const getPriceForDate = (property: any, date: Date) => {
        // Check overrides first
        const override = dailyPrices.find(dp =>
            dp.property_id === property.id &&
            isSameDay(new Date(dp.date), date)
        );
        return override ? override.price : property.price_per_night;
    };

    const isPriceOverridden = (propertyId: string, date: Date) => {
        return dailyPrices.some(dp =>
            dp.property_id === propertyId &&
            isSameDay(new Date(dp.date), date)
        );
    };

    // Filter Logic
    const filteredProperties = properties.filter(p => {
        if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
        if ((p.bedrooms || 0) < filters.bedrooms) return false;
        if ((p.beds || 0) < filters.beds) return false;
        if ((p.bathrooms || 0) < filters.bathrooms) return false;
        if (filters.amenities.length > 0) {
            for (const amenity of filters.amenities) {
                const key = amenity.toLowerCase();
                const hasAmenity = p.amenities && (p.amenities[key] === true || p.amenities[key] === "true");
                if (!hasAmenity) return false;
            }
        }
        return true;
    });

    const updateFilterCount = (field: 'bedrooms' | 'beds' | 'bathrooms', delta: number) => {
        setFilters(prev => ({ ...prev, [field]: Math.max(0, (prev[field] as number) + delta) }));
    };

    const toggleAmenity = (amenity: string) => {
        setFilters(prev => {
            if (prev.amenities.includes(amenity)) return { ...prev, amenities: prev.amenities.filter(a => a !== amenity) };
            else return { ...prev, amenities: [...prev.amenities, amenity] };
        });
    };

    const clearFilters = () => setFilters({ bedrooms: 0, beds: 0, bathrooms: 0, amenities: [] });
    const activeFilterCount = (filters.bedrooms > 0 ? 1 : 0) + (filters.beds > 0 ? 1 : 0) + (filters.bathrooms > 0 ? 1 : 0) + filters.amenities.length;

    const openPriceDialog = (propertyId: string, date: Date, currentPrice: number) => {
        setSelectedPriceData({ propertyId, date, currentPrice });
        setNewPrice(currentPrice.toString());
        setPriceUpdateOpen(true);
    };

    const handleSavePrice = async () => {
        if (!selectedPriceData || !newPrice) return;

        try {
            const supabase = createClient();
            const dateStr = format(selectedPriceData.date, 'yyyy-MM-dd');

            const { error } = await supabase
                .from('daily_prices')
                .upsert({
                    property_id: selectedPriceData.propertyId,
                    date: dateStr,
                    price: parseFloat(newPrice)
                }, { onConflict: 'property_id, date' });

            if (error) throw error;

            toast.success("Price updated successfully");

            // Update local state
            setDailyPrices(prev => {
                const filtered = prev.filter(dp =>
                    !(dp.property_id === selectedPriceData.propertyId && dp.date === dateStr)
                );
                return [...filtered, {
                    property_id: selectedPriceData.propertyId,
                    date: dateStr,
                    price: parseFloat(newPrice)
                }];
            });

            setPriceUpdateOpen(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to update price");
        }
    };

    const openDiscountDialog = (propertyId: string) => {
        setSelectedPropertyId(propertyId);
        // Reset or fetch existing discounts here (omitted for brevity, would need another fetch)
        setWeeklyDiscount("");
        setMonthlyDiscount("");
        setDiscountOpen(true);
    };

    const handleSaveDiscount = async () => {
        if (!selectedPropertyId) return;
        try {
            const supabase = createClient();
            // Upsert weekly
            if (weeklyDiscount) {
                await supabase.from('discounts').upsert({
                    property_id: selectedPropertyId,
                    type: 'weekly',
                    value: parseFloat(weeklyDiscount),
                    is_percentage: true
                }, { onConflict: 'property_id, type' as any }); // Schema constraint needed on (property_id, type)
            }
            // Upsert monthly
            if (monthlyDiscount) {
                await supabase.from('discounts').upsert({
                    property_id: selectedPropertyId,
                    type: 'monthly',
                    value: parseFloat(monthlyDiscount),
                    is_percentage: true
                }, { onConflict: 'property_id, type' as any });
            }
            toast.success("Discounts updated");
            setDiscountOpen(false);
        } catch (error: any) {
            toast.error("Failed to save discounts");
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-gold-500" /></div>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] max-w-[100vw] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold text-white">Master Calendar</h1>
                    <span className="text-sm text-gray-400">({filteredProperties.length} listings)</span>

                    <div className="flex gap-2 ml-4">
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-surface-50 border-white/10 text-gray-300 gap-2 hover:text-white hover:bg-white/10"
                            onClick={() => setBulkUpdateOpen(true)}
                        >
                            <Layers className="w-4 h-4" />
                            Bulk Update
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-gradient-to-r from-gold-600 to-gold-400 text-black border-none hover:opacity-90 transition-opacity gap-2 shadow-lg shadow-gold-500/20"
                            onClick={() => setSmartPricingOpen(true)}
                        >
                            <Sparkles className="w-4 h-4" />
                            Smart Pricing
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Input
                            placeholder="Search properties..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-64 bg-surface-50 border-white/10 text-white pl-8 focus:border-gold-500"
                        />
                        <div className="absolute left-2.5 top-2.5 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </div>
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={`gap-2 border-white/10 ${activeFilterCount > 0 ? 'bg-gold-500/10 border-gold-500/50 text-gold-500' : 'bg-surface-50 text-white'}`}>
                                <SlidersHorizontal className="w-4 h-4" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <Badge className="bg-gold-500 text-black ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                                        {activeFilterCount}
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-80 bg-surface-100 border-white/10 text-white p-5">
                            <div className="space-y-6">
                                <h3 className="font-semibold text-lg">Filters</h3>
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-gray-400">Rooms and beds</h4>
                                    {['bedrooms', 'beds', 'bathrooms'].map((field) => (
                                        <div key={field} className="flex items-center justify-between">
                                            <span className="text-sm capitalize">{field}</span>
                                            <div className="flex items-center gap-3">
                                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateFilterCount(field as any, -1)} disabled={filters[field as keyof typeof filters] === 0}>
                                                    <Minus className="w-3 h-3" />
                                                </Button>
                                                <span className="w-4 text-center text-sm">{(filters[field as 'bedrooms' | 'beds' | 'bathrooms']) > 0 ? (filters[field as 'bedrooms' | 'beds' | 'bathrooms']) + '+' : 'Any'}</span>
                                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateFilterCount(field as any, 1)}>
                                                    <Plus className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="h-px bg-white/10" />
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-gray-400">Amenities</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {AMENITIES_LIST.map((amenity) => (
                                            <div key={amenity} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={amenity}
                                                    checked={filters.amenities.includes(amenity)}
                                                    onCheckedChange={() => toggleAmenity(amenity)}
                                                />
                                                <Label htmlFor={amenity} className="text-sm cursor-pointer">{amenity}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-2 flex justify-between items-center">
                                    <Button variant="ghost" className="text-sm text-gray-400 hover:text-white px-0" onClick={clearFilters}>
                                        Clear all
                                    </Button>
                                    <Button className="bg-gold-500 text-black hover:bg-gold-400">
                                        Apply
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <div className="h-8 w-px bg-white/10 mx-2" />

                    <div className="flex items-center bg-surface-50 rounded-lg border border-white/10 p-1">
                        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="hover:bg-white/5">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="w-40 text-center font-bold text-lg">{format(currentDate, "MMMM yyyy")}</span>
                        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="hover:bg-white/5">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <Button variant="outline" onClick={() => setCurrentDate(new Date())} className="border-gold-500/50 text-gold-500 hover:bg-gold-500/10">
                        Today
                    </Button>
                </div>
            </div>

            {/* Calendar Container */}
            <div className="flex-1 border border-white/10 rounded-xl bg-surface-50 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1 relative">
                    <div className="inline-block min-w-full">
                        {/* Header Row */}
                        <div className="flex sticky top-0 z-30 bg-surface-100 border-b border-white/10 isolate">
                            <div className="sticky left-0 w-64 shrink-0 bg-black border-r border-white/10 p-4 font-bold text-gray-400 z-50 shadow-[10px_0_20px_-5px_rgba(0,0,0,0.5)] flex items-center justify-between">
                                <span>Properties</span>
                                <span className="text-xs font-normal opacity-50">{filteredProperties.length} found</span>
                            </div>
                            {days.map((day) => {
                                const isToday = isSameDay(day, new Date());
                                return (
                                    <div key={day.toString()} className={`w-32 shrink-0 border-r border-white/5 p-2 text-center flex flex-col gap-1 ${isToday ? 'bg-gold-500/10' : ''}`}>
                                        <span className="text-xs text-gray-400 uppercase">{format(day, "EEE")}</span>
                                        <span className={`text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto ${isToday ? 'bg-gold-500 text-black' : 'text-white'}`}>
                                            {format(day, "d")}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Property Rows */}
                        {filteredProperties.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">No properties match your filters.</div>
                        ) : (
                            filteredProperties.map((property) => (
                                <div key={property.id} className="flex border-b border-white/5 hover:bg-white/5 transition-colors group isolate">
                                    <div className="sticky left-0 w-64 shrink-0 bg-black border-r border-white/10 p-3 flex items-center gap-3 z-40 shadow-[4px_0_24px_-2px_rgba(0,0,0,0.5)]">
                                        <div className="w-10 h-10 rounded-md bg-gray-800 overflow-hidden shrink-0 border border-white/10">
                                            {property.images && property.images.length > 0 ? (
                                                <img
                                                    src={typeof property.images[0] === 'string' ? property.images[0] : property.images[0].url}
                                                    alt={property.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500"><Building2 className="w-5 h-5" /></div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm text-white truncate">{property.title}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <span>${property.price_per_night}</span>
                                                {property.bedrooms > 0 && <span>• {property.bedrooms} BR</span>}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-[10px] text-gold-500 hover:text-gold-400 hover:bg-gold-500/10 mt-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openDiscountDialog(property.id);
                                                }}
                                            >
                                                <Percent className="w-3 h-3 mr-1" />
                                                Discounts
                                            </Button>
                                        </div>
                                    </div>

                                    {days.map((day) => {
                                        const booking = getBookingForDate(property.id, day);
                                        const isToday = isSameDay(day, new Date());
                                        const cellKey = `${property.id}-${day.toISOString()}`;
                                        const styleClass = booking ? getBookingStyle(day, booking) : null;
                                        const isStart = booking && isSameDay(day, new Date(booking.check_in_date));

                                        const displayPrice = getPriceForDate(property, day);
                                        const isOverridden = isPriceOverridden(property.id, day);

                                        return (
                                            <div key={cellKey} className={`w-32 shrink-0 border-r border-white/5 relative h-16 ${isToday ? 'bg-gold-500/5' : ''}`}>
                                                {booking && styleClass && (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <div className={styleClass} title={booking.profiles?.full_name}>
                                                                {isStart && (
                                                                    <span className="truncate flex items-center gap-1">
                                                                        <Avatar className="w-4 h-4 border border-white/20">
                                                                            <AvatarImage src={booking.profiles?.avatar_url} />
                                                                            <AvatarFallback className="text-[8px] bg-black text-white">{booking.profiles?.full_name?.charAt(0)}</AvatarFallback>
                                                                        </Avatar>
                                                                        {booking.profiles?.full_name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </DialogTrigger>
                                                        <DialogContent className="bg-surface-100 border-white/10 text-white">
                                                            <DialogHeader><DialogTitle>Booking Details</DialogTitle></DialogHeader>
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg">
                                                                    <Avatar className="w-12 h-12">
                                                                        <AvatarImage src={booking.profiles?.avatar_url} />
                                                                        <AvatarFallback>{booking.profiles?.full_name?.charAt(0)}</AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <p className="font-bold">{booking.profiles?.full_name}</p>
                                                                        <p className="text-sm text-gray-400">{booking.profiles?.email}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <p className="text-xs text-gray-500 uppercase">Check In</p>
                                                                        <p className="font-medium">{format(new Date(booking.check_in_date), "PPP")}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500 uppercase">Check Out</p>
                                                                        <p className="font-medium">{format(new Date(booking.check_out_date), "PPP")}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500 uppercase">Total Price</p>
                                                                        <p className="font-bold text-gold-500">${booking.total_price}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500 uppercase">Status</p>
                                                                        <Badge variant="outline" className="capitalize">{booking.status}</Badge>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}

                                                {!booking && (
                                                    <div
                                                        className="w-full h-full flex items-center justify-center hover:bg-white/5 cursor-pointer group/cell"
                                                        onClick={() => openPriceDialog(property.id, day, displayPrice)}
                                                    >
                                                        <span className={`text-xs font-mono transition-all ${isOverridden
                                                            ? "text-black bg-green-400 px-2 py-0.5 rounded-full font-bold shadow-sm shadow-green-900/50"
                                                            : "text-gray-500 group-hover/cell:text-white group-hover/cell:scale-110"
                                                            }`}>
                                                            ${displayPrice}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Price Update Dialog */}
            <Dialog open={priceUpdateOpen} onOpenChange={setPriceUpdateOpen}>
                <DialogContent className="bg-surface-100 border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Update Price</DialogTitle>
                    </DialogHeader>
                    {selectedPriceData && (
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <div className="text-sm text-gray-400 font-medium">
                                    {format(selectedPriceData.date, "EEEE, MMMM do, yyyy")}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Price per night</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={newPrice}
                                        onChange={(e) => setNewPrice(e.target.value)}
                                        className="pl-7 bg-surface-50 border-white/10 text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setPriceUpdateOpen(false)}>Cancel</Button>
                        <Button onClick={handleSavePrice} className="bg-gold-500 text-black hover:bg-gold-400">Save Price</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Discount Dialog */}
            <Dialog open={discountOpen} onOpenChange={setDiscountOpen}>
                <DialogContent className="bg-surface-100 border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Manage Discounts</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="length" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-surface-50">
                            <TabsTrigger value="length">Length of Stay</TabsTrigger>
                            <TabsTrigger value="custom">Custom (Coming Soon)</TabsTrigger>
                        </TabsList>
                        <TabsContent value="length" className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="weekly">Weekly Discount (%)</Label>
                                <div className="relative">
                                    <Input
                                        id="weekly"
                                        type="number"
                                        placeholder="e.g. 10"
                                        value={weeklyDiscount}
                                        onChange={(e) => setWeeklyDiscount(e.target.value)}
                                        className="bg-surface-50 border-white/10 text-white"
                                    />
                                    <span className="absolute right-3 top-2.5 text-gray-400">%</span>
                                </div>
                                <p className="text-xs text-gray-400">Applies to stays of 7 nights or more</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="monthly">Monthly Discount (%)</Label>
                                <div className="relative">
                                    <Input
                                        id="monthly"
                                        type="number"
                                        placeholder="e.g. 20"
                                        value={monthlyDiscount}
                                        onChange={(e) => setMonthlyDiscount(e.target.value)}
                                        className="bg-surface-50 border-white/10 text-white"
                                    />
                                    <span className="absolute right-3 top-2.5 text-gray-400">%</span>
                                </div>
                                <p className="text-xs text-gray-400">Applies to stays of 28 nights or more</p>
                            </div>
                        </TabsContent>
                        <TabsContent value="custom">
                            <div className="py-4 text-center text-gray-400">
                                Advanced rules coming soon...
                            </div>
                        </TabsContent>
                    </Tabs>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDiscountOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveDiscount} className="bg-gold-500 text-black hover:bg-gold-400">Save Discounts</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <BulkUpdateDialog
                open={bulkUpdateOpen}
                onOpenChange={setBulkUpdateOpen}
                properties={properties}
                onUpdate={fetchData}
            />

            <SmartPricingDialog
                open={smartPricingOpen}
                onOpenChange={setSmartPricingOpen}
                properties={properties}
                onUpdate={fetchData}
            />
        </div>
    );
}
