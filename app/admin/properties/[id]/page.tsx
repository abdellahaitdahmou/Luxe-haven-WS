"use client"

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Save, ArrowLeft, Image as ImageIcon, Upload, X, Trash2, GripVertical, CheckCircle, Wand2, Users, BedDouble, Bed as BedIcon, Bath } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { classifyImage } from "@/utils/ai/classifyImage";


// Unified type for handling both existing images and new uploads in the same list
interface MediaItem {
    id: string; // Unique ID for keying/reordering
    type: 'existing' | 'new';
    url: string; // Preview URL or Real URL
    file?: File; // Only for 'new'
    category: string;
    classifying?: boolean;
}

const CATEGORIES = [
    "Living Room", "Bedroom", "Bathroom", "Kitchen", "Dining Room",
    "Exterior", "Pool", "Garden", "Office", "Gym", "Balcony", "Other"
];

const PROPERTY_TYPES = [
    { value: "villa", label: "Villa", emoji: "🏖️" },
    { value: "apartment", label: "Apartment", emoji: "🏢" },
    { value: "house", label: "House", emoji: "🏠" },
    { value: "studio", label: "Studio", emoji: "🛋️" },
    { value: "chalet", label: "Chalet", emoji: "🏔️" },
    { value: "penthouse", label: "Penthouse", emoji: "🌆" },
    { value: "cabin", label: "Cabin", emoji: "🪵" },
    { value: "island", label: "Island", emoji: "🏝️" },
];

export default function EditPropertyPage() {
    const router = useRouter();
    const params = useParams();
    const supabase = createClient();

    // Form States
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [address, setAddress] = useState("");

    // Facilities State
    const [maxGuests, setMaxGuests] = useState(2);
    const [bedrooms, setBedrooms] = useState(1);
    const [beds, setBeds] = useState(1);
    const [bathrooms, setBathrooms] = useState(1);
    const [amenities, setAmenities] = useState<string[]>([]);
    const [propertyType, setPropertyType] = useState("villa");

    // Unified Image State
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

    // Track items to delete from storage on save
    const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

    // Drag State
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        fetchProperty();
    }, []);

    async function fetchProperty() {
        try {
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .eq('id', params.id)
                .single();

            if (error) throw error;

            if (data) {
                setTitle(data.title);
                setDescription(data.description || "");
                setPrice(data.price_per_night.toString());
                setAddress(data.address || "");
                setMaxGuests(data.max_guests || 2);
                setBedrooms(data.bedrooms || 1);
                setBeds(data.beds || 1);
                setBathrooms(data.bathrooms || 1);
                setPropertyType(data.property_type || "villa");

                // Ensure amenities is an array (handle null or empty object {})
                const amenitiesArray = Array.isArray(data.amenities) ? data.amenities : [];
                setAmenities(amenitiesArray);

                // Load existing images into unified state
                // Prefer 'images' JSONB column if populated, otherwise fallback to 'image_urls'
                let existing: MediaItem[] = [];

                if (data.images && Array.isArray(data.images) && data.images.length > 0) {
                    existing = data.images.map((img: any) => ({
                        id: img.id || `existing-${Math.random().toString(36).substr(2, 9)}`,
                        type: 'existing',
                        url: img.url,
                        category: img.category || "Other"
                    }));
                } else {
                    // Fallback for old listings
                    existing = (data.image_urls || []).map((url: string) => ({
                        id: `existing-${Math.random().toString(36).substr(2, 9)}`,
                        type: 'existing',
                        url: url,
                        category: "Other"
                    }));
                }

                setMediaItems(existing);
            }
        } catch (error: any) {
            console.error("Error fetching property:", error);
            alert("Failed to load property details.");
            router.push('/admin/properties');
        } finally {
            setLoading(false);
        }
    }

    // Handle New File Selection
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const newFiles = Array.from(files);

            const newItems: MediaItem[] = newFiles.map(file => ({
                id: `new-${Math.random().toString(36).substr(2, 9)}`,
                type: 'new',
                url: URL.createObjectURL(file), // Create preview URL
                file: file,
                category: "Other",
                classifying: true
            }));

            // Append new items to the end
            setMediaItems(prev => [...prev, ...newItems]);

            // Run Auto-Classification
            newItems.forEach(async (item) => {
                try {
                    const results = await classifyImage(item.url);
                    if (results && results.length > 0) {
                        setMediaItems(current => current.map(currItem =>
                            currItem.id === item.id
                                ? { ...currItem, category: results[0].label, classifying: false }
                                : currItem
                        ));
                    } else {
                        setMediaItems(current => current.map(currItem =>
                            currItem.id === item.id ? { ...currItem, classifying: false } : currItem
                        ));
                    }
                } catch (err) {
                    console.error("Classification error", err);
                    setMediaItems(current => current.map(currItem =>
                        currItem.id === item.id ? { ...currItem, classifying: false } : currItem
                    ));
                }
            });
        }
    };

    const removeMediaItem = (itemToRemove: MediaItem) => {
        if (itemToRemove.type === 'existing') {
            // Add URL to delete list
            setItemsToDelete(prev => [...prev, itemToRemove.url]);
        }
        setMediaItems(prev => prev.filter(item => item.id !== itemToRemove.id));
    };

    const updateCategory = (id: string, newCategory: string) => {
        setMediaItems(prev => prev.map(item => item.id === id ? { ...item, category: newCategory } : item));
    };

    // Drag and Drop Handlers
    const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = "move";
    };

    const onDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();

        if (dragItem.current === null) return;
        if (dragItem.current === index) return;

        // Reorder the list immediately to show visual feedback (The "Airbnb" shuffle)
        const newItems = [...mediaItems];
        const draggedItemContent = newItems[dragItem.current];

        // Remove from old pos
        newItems.splice(dragItem.current, 1);
        // Insert at new pos
        newItems.splice(index, 0, draggedItemContent);

        // Update ref
        dragItem.current = index;

        setMediaItems(newItems);
    };

    const onDragEnd = () => {
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleAutoCategorize = async () => {
        const unclassifiedItems = mediaItems.filter(item => item.category === "Other");

        if (unclassifiedItems.length === 0) {
            alert("All images are already categorized!");
            return;
        }

        // Set status to classifying
        setMediaItems(prev => prev.map(item =>
            item.category === "Other" ? { ...item, classifying: true } : item
        ));

        // Process sequentially to be nice to the browser thread
        for (const item of unclassifiedItems) {
            try {
                const results = await classifyImage(item.url);
                if (results && results.length > 0) {
                    setMediaItems(current => current.map(currItem =>
                        currItem.id === item.id
                            ? { ...currItem, category: results[0].label, classifying: false }
                            : currItem
                    ));
                } else {
                    setMediaItems(current => current.map(currItem =>
                        currItem.id === item.id ? { ...currItem, classifying: false } : currItem
                    ));
                }
            } catch (err) {
                console.error("Manual auto-classification failed", err);
                setMediaItems(current => current.map(currItem =>
                    currItem.id === item.id ? { ...currItem, classifying: false } : currItem
                ));
            }
        }
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // 1. Process deletions
            if (itemsToDelete.length > 0) {
                // Extract paths from URLs
                const pathsToDelete = itemsToDelete.map(url => {
                    const urlParts = url.split('/properties/');
                    return urlParts.length > 1 ? urlParts[1] : '';
                }).filter(path => path !== '');

                if (pathsToDelete.length > 0) {
                    await supabase.storage.from('properties').remove(pathsToDelete);
                }
            }

            // 2. Process all items in order (Upload new ones)
            const finalImagesMeta = [];
            const finalImageUrls: string[] = [];

            for (const item of mediaItems) {
                let finalUrl = item.url;

                if (item.type === 'existing') {
                    // already has url
                } else if (item.type === 'new' && item.file) {
                    // Upload new file
                    const fileExt = item.file.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const filePath = `${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('properties')
                        .upload(filePath, item.file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('properties')
                        .getPublicUrl(filePath);

                    finalUrl = publicUrl;
                }

                finalImageUrls.push(finalUrl);
                finalImagesMeta.push({
                    id: item.id.startsWith('new-') || item.id.startsWith('existing-') ? Math.random().toString(36).substr(2, 9) : item.id, // Ensure cleaner IDs for DB
                    url: finalUrl,
                    category: item.category
                });
            }

            // 3. Update Property Data
            const { error } = await supabase
                .from('properties')
                .update({
                    title,
                    description,
                    price_per_night: parseFloat(price),
                    address,
                    property_type: propertyType,
                    max_guests: maxGuests,
                    bedrooms,
                    beds,
                    bathrooms,
                    amenities,
                    image_urls: finalImageUrls,
                    images: finalImagesMeta,
                    updated_at: new Date().toISOString()
                })
                .eq('id', params.id);

            if (error) throw error;

            alert("Property updated successfully!");
            router.push('/admin/properties');
            router.refresh();

        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/properties" className="p-2 hover:bg-white/10 rounded-full transition">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Edit Property</h1>
                    <p className="text-gray-400">Update listing details and drag images to reorder.</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="relative bg-surface-50 border border-white/5 p-8 rounded-3xl shadow-2xl space-y-8 h-full w-full">

                {/* Basic Info */}
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gold-500 border-b border-white/10 pb-2">Basic Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-400">Property Title</label>
                            <input
                                required
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. Luxury Ocean Villa"
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-400">Price per Night ($)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500 font-bold text-lg pointer-events-none">$</span>
                                <input
                                    required
                                    type="number"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    placeholder="350"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white focus:border-gold-500 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Property Type Selector */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-400">Property Type</label>
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                            {PROPERTY_TYPES.map(pt => (
                                <button
                                    key={pt.value}
                                    type="button"
                                    onClick={() => setPropertyType(pt.value)}
                                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition text-center ${propertyType === pt.value
                                        ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                                        : 'border-white/10 bg-black/30 text-gray-400 hover:border-white/30 hover:text-white'
                                        }`}
                                >
                                    <span className="text-2xl">{pt.emoji}</span>
                                    <span className="text-xs font-medium">{pt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-400">Description</label>
                        <textarea
                            required
                            rows={4}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Describe the unique features of this property..."
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition"
                        />
                    </div>
                </div>

                {/* Location */}
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gold-500 border-b border-white/10 pb-2">Location</h3>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-400">Full Address</label>
                        <input
                            required
                            type="text"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            placeholder="e.g. 123 Palm Ave, Miami, FL"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition"
                        />
                    </div>
                </div>

                {/* Facilities */}
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gold-500 border-b border-white/10 pb-2">Facilities & Amenities</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {([
                            { label: "Guests", icon: Users, value: maxGuests, set: setMaxGuests, min: 1, step: 1 },
                            { label: "Bedrooms", icon: BedDouble, value: bedrooms, set: setBedrooms, min: 0, step: 1 },
                            { label: "Beds", icon: BedIcon, value: beds, set: setBeds, min: 0, step: 1 },
                            { label: "Bathrooms", icon: Bath, value: bathrooms, set: setBathrooms, min: 0, step: 0.5 },
                        ] as Array<{ label: string, icon: any, value: number, set: (v: number) => void, min: number, step: number }>).map(({ label, icon: Icon, value, set, min, step }) => (
                            <div key={label} className="flex items-center justify-between bg-black/30 border border-white/10 rounded-2xl px-5 py-4 hover:border-white/20 transition">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-500">
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-white">{label}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => set(Math.max(min, parseFloat((value - step).toFixed(1))))}
                                        disabled={value <= min}
                                        className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-gray-400 hover:border-gold-500 hover:text-gold-400 transition disabled:opacity-30 disabled:cursor-not-allowed text-lg font-light"
                                    >−</button>
                                    <span className="w-8 text-center text-white font-semibold text-sm tabular-nums">{value}</span>
                                    <button
                                        type="button"
                                        onClick={() => set(parseFloat((value + step).toFixed(1)))}
                                        className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-gray-400 hover:border-gold-500 hover:text-gold-400 transition text-lg font-light"
                                    >+</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-400">Amenities</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {["Wifi", "Air conditioning", "Kitchen", "Heating", "Workspace", "TV", "Pool", "Hot tub", "Gym", "Free parking"].map((item) => (
                                <label key={item} className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${amenities.includes(item) ? 'bg-gold-500 border-gold-500 text-black' : 'border-white/20 group-hover:border-gold-500'}`}>
                                        {amenities.includes(item) && <CheckCircle className="w-3.5 h-3.5" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={amenities.includes(item)}
                                        onChange={() => {
                                            if (amenities.includes(item)) {
                                                setAmenities(amenities.filter(a => a !== item));
                                            } else {
                                                setAmenities([...amenities, item]);
                                            }
                                        }}
                                    />
                                    <span className={`text-sm transition ${amenities.includes(item) ? 'text-white' : 'text-gray-400 group-hover:text-gold-500'}`}>{item}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Media */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <h3 className="text-xl font-semibold text-gold-500 flex items-center gap-2">
                            <Wand2 className="w-5 h-5" />
                            Smart Media ({mediaItems.length})
                        </h3>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleAutoCategorize}
                                disabled={loading || saving || mediaItems.some(i => i.classifying)}
                                className="text-xs bg-white/5 hover:bg-gold-500/20 text-gold-500 border border-gold-500/50 px-3 py-1.5 rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Wand2 className="w-3.5 h-3.5" />
                                Auto-Categorize
                            </button>
                            <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 group">
                                <Upload className="w-4 h-4 group-hover:text-gold-500 transition" />
                                Add Images
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-semibold text-gray-400">Property Images</label>
                            <span className="text-xs text-gray-500">Drag items to rearrange • Auto-tagged</span>
                        </div>

                        <div className="min-h-[100px] border border-dashed border-white/10 rounded-xl p-4 bg-black/20">
                            {mediaItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                                    <ImageIcon className="w-8 h-8 mb-2" />
                                    <p>No images yet.</p>
                                    <p className="text-sm">Click "Add Images" to upload.</p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-4">
                                    <AnimatePresence>
                                        {mediaItems.map((item, index) => (
                                            <motion.div
                                                layout
                                                key={item.id}
                                                draggable
                                                onDragStart={(e) => onDragStart(e as unknown as React.DragEvent<HTMLDivElement>, index)}
                                                onDragEnter={(e) => onDragEnter(e as unknown as React.DragEvent<HTMLDivElement>, index)}
                                                onDragEnd={onDragEnd}
                                                onDragOver={onDragOver}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ duration: 0.2 }}
                                                className="relative w-40 h-56 rounded-xl overflow-hidden border border-white/10 bg-gray-900 group cursor-grab active:cursor-grabbing shadow-sm hover:shadow-xl hover:scale-105 transition-shadow z-0 active:z-50 flex flex-col"
                                            >
                                                {/* Image Area */}
                                                <div className="relative h-40 w-full bg-black">
                                                    <img src={item.url} alt={`Image ${index}`} className="w-full h-full object-cover pointer-events-none" />

                                                    {/* Gradient Overlay for Actions */}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                                                        <GripVertical className="w-6 h-6 text-white/50" />
                                                        <button
                                                            type="button"
                                                            onPointerDown={(e) => e.stopPropagation()}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeMediaItem(item);
                                                            }}
                                                            className="p-1 px-3 bg-red-500/80 hover:bg-red-500 text-white rounded-full text-xs font-bold transition shadow-lg mt-1 cursor-pointer"
                                                            title="Remove Image"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>

                                                    {/* Badges */}
                                                    {index === 0 && (
                                                        <div className="absolute top-2 left-2 bg-gold-500 text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10 pointer-events-none">
                                                            COVER
                                                        </div>
                                                    )}
                                                    {item.classifying && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-1 text-gold-500 text-[10px] font-bold backdrop-blur-sm z-20">
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                            AI...
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Category Selector */}
                                                <div className="flex-1 bg-surface-100 border-t border-white/10 p-2 flex items-center">
                                                    <select
                                                        value={item.category}
                                                        onPointerDown={(e) => e.stopPropagation()} // Allow clicking select without dragging
                                                        onChange={(e) => updateCategory(item.id, e.target.value)}
                                                        className="w-full bg-black/50 text-white text-[10px] border border-white/10 rounded px-1.5 py-1 outline-none focus:border-gold-500 transition cursor-pointer"
                                                    >
                                                        {CATEGORIES.map(cat => (
                                                            <option key={cat} value={cat}>{cat}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="pt-4 flex justify-end">
                    <button
                        disabled={saving}
                        className="bg-gold-500 hover:bg-gold-600 text-black px-8 py-4 rounded-xl font-bold transition shadow-lg shadow-gold-500/20 disabled:opacity-70 flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Update Property
                            </>
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
}
