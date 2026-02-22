"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeft, Image as ImageIcon, Upload, X, CheckCircle, Wand2, Users, BedDouble, Bed as BedIcon, Bath } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { classifyImage } from "@/utils/ai/classifyImage";


// Helper type for image metadata
interface ImageMetadata {
    id: string;
    file: File;
    preview: string;
    category: string;
    classifying: boolean;
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

export default function AddPropertyPage() {
    const router = useRouter();
    const supabase = createClient();

    // Form States
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [address, setAddress] = useState("");

    // Enhanced Image State
    const [images, setImages] = useState<ImageMetadata[]>([]);

    // Facilities State
    const [maxGuests, setMaxGuests] = useState(2);
    const [bedrooms, setBedrooms] = useState(1);
    const [beds, setBeds] = useState(1);
    const [bathrooms, setBathrooms] = useState(1);
    const [amenities, setAmenities] = useState<string[]>([]);
    const [propertyType, setPropertyType] = useState("villa");

    // Handle File Selection
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const newFiles = Array.from(files);

            // Create initial metadata objects
            const newImages: ImageMetadata[] = newFiles.map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                file,
                preview: URL.createObjectURL(file),
                category: "Other", // Default until classified
                classifying: true
            }));

            // Add to state immediately
            setImages(prev => [...prev, ...newImages]);

            // Run classification in background for each new image
            newImages.forEach(async (img) => {
                try {
                    const results = await classifyImage(img.preview);
                    console.log(`Classified ${img.file.name}:`, results);

                    if (results && results.length > 0) {
                        const bestLabel = results[0].label;

                        // Update state with result
                        setImages(current => current.map(item =>
                            item.id === img.id
                                ? { ...item, category: bestLabel, classifying: false }
                                : item
                        ));
                    } else {
                        setImages(current => current.map(item =>
                            item.id === img.id ? { ...item, classifying: false } : item
                        ));
                    }
                } catch (err) {
                    console.error("Auto-classification failed", err);
                    setImages(current => current.map(item =>
                        item.id === img.id ? { ...item, classifying: false } : item
                    ));
                }
            });
        }
    };

    const removeImage = (id: string) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    const updateCategory = (id: string, newCategory: string) => {
        setImages(prev => prev.map(img => img.id === id ? { ...img, category: newCategory } : img));
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            if (images.length === 0) {
                throw new Error("Please select at least one image.");
            }

            // 1. Upload Images in Parallel
            const uploadPromises = images.map(async (img) => {
                const fileExt = img.file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('properties')
                    .upload(filePath, img.file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('properties')
                    .getPublicUrl(filePath);

                return {
                    url: publicUrl,
                    category: img.category
                };
            });

            const uploadedImages = await Promise.all(uploadPromises);
            const imageUrls = uploadedImages.map(img => img.url); // Backward compatibility
            const imagesJson = uploadedImages; // New structured data

            // 2. Insert Property Data
            const { error } = await supabase.from('properties').insert({
                owner_id: user.id,
                title,
                description,
                price_per_night: parseFloat(price),
                address,
                property_type: propertyType,
                image_urls: imageUrls,
                images: imagesJson,
                location: "POINT(0 0)",
                max_guests: maxGuests,
                bedrooms,
                beds,
                bathrooms,
                amenities: amenities
            });

            if (error) throw error;

            alert("Property listed successfully!");
            router.push('/admin/properties');
            router.refresh();

        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/properties" className="p-2 hover:bg-white/10 rounded-full transition">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">List New Property</h1>
                    <p className="text-gray-400">Fill in the details to publish a new listing.</p>
                </div>
            </div>

            {/* Form Content */}
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

                {/* Media - AI Enhanced */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <h3 className="text-xl font-semibold text-gold-500 flex items-center gap-2">
                            <Wand2 className="w-5 h-5" />
                            Smart Media ({images.length})
                        </h3>
                        <p className="text-xs text-gray-400">AI Auto-categorization Enabled</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {images.map((img) => (
                            <div key={img.id} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/20">
                                {/* Preview */}
                                <div className="aspect-video relative">
                                    <img src={img.preview} alt="Preview" className="w-full h-full object-cover" />

                                    {/* Remove Button */}
                                    <button
                                        type="button"
                                        onClick={() => removeImage(img.id)}
                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>

                                    {/* Loading Indicator */}
                                    {img.classifying && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 text-gold-500 text-xs font-semibold backdrop-blur-sm">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Classifying...
                                        </div>
                                    )}
                                </div>

                                {/* Category Select */}
                                <div className="p-2 bg-surface-100 border-t border-white/5">
                                    <select
                                        value={img.category}
                                        onChange={(e) => updateCategory(img.id, e.target.value)}
                                        className="w-full bg-black/50 text-white text-xs border border-white/10 rounded px-2 py-1 outline-none focus:border-gold-500 transition"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}

                        {/* Upload Button */}
                        <label className="aspect-video border-2 border-dashed border-white/10 rounded-xl hover:bg-white/5 transition relative flex flex-col items-center justify-center cursor-pointer group">
                            <Upload className="w-6 h-6 text-gray-400 group-hover:text-gold-500 mb-2 transition" />
                            <span className="text-sm text-gray-400">Add Photos</span>
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

                {/* Submit */}
                <div className="pt-4 flex justify-end">
                    <button
                        disabled={loading}
                        className="bg-gold-500 hover:bg-gold-600 text-black px-8 py-4 rounded-xl font-bold transition shadow-lg shadow-gold-500/20 disabled:opacity-70 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Uploading & Listing...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                List Property
                            </>
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
}
