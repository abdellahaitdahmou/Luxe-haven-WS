"use client"

import { useEffect, useState, useRef } from "react";
import { Search, Filter, MoreHorizontal, Plus, Loader2, Pencil, Trash2, EyeOff, Eye, UserCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface Property {
    id: string;
    title: string;
    address: string;
    price_per_night: number;
    status: string;
    image_urls: string[];
    owner_id: string | null;
    owner_name: string;
    property_type: string;
    listing_type: string;
}

interface HostUser {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string;
}

export default function AdminPropertiesPage() {
    const supabase = createClient();
    const router = useRouter();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [hosts, setHosts] = useState<HostUser[]>([]);

    // Filtering State
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
    const [listingTypeFilter, setListingTypeFilter] = useState("all");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Dropdown State
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Assign Owner State
    const [assignOpen, setAssignOpen] = useState<string | null>(null); // property id
    const [selectedOwner, setSelectedOwner] = useState<string>("");
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        fetchProperties();

        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
            // Simple click outside handling for filters uses parent onClick below
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    async function fetchProperties() {
        try {
            setLoading(true);
            setErrorMsg(null);

            // Fetch properties and hosts in parallel
            const [{ data, error }, { data: hostsData }] = await Promise.all([
                supabase.from('properties').select('*, owner:profiles!owner_id(full_name, email)').order('created_at', { ascending: false }),
                supabase.from('profiles').select('id, full_name, email, role').in('role', ['admin', 'owner', 'manager']).order('full_name')
            ]);

            if (error) throw error;

            setHosts(hostsData || []);

            const formattedData = data?.map((item: any) => ({
                id: item.id,
                title: item.title,
                address: item.address || 'No Location',
                price_per_night: item.price_per_night,
                status: item.status || 'active',
                image_urls: item.image_urls || [],
                owner_id: item.owner_id || null,
                owner_name: item.owner?.full_name || 'Unassigned',
                property_type: item.property_type || 'villa',
                listing_type: item.listing_type || 'rent',
            })) || [];

            setProperties(formattedData);
        } catch (error: any) {
            console.error('Error fetching properties:', error);
            setErrorMsg(error.message || 'Failed to fetch properties');
        } finally {
            setLoading(false);
        }
    }

    async function assignOwner(propertyId: string) {
        if (!selectedOwner) { toast.error('Please select an owner'); return; }
        try {
            setAssigning(true);
            const { error } = await supabase
                .from('properties')
                .update({ owner_id: selectedOwner })
                .eq('id', propertyId);
            if (error) throw error;
            const host = hosts.find(h => h.id === selectedOwner);
            setProperties(prev => prev.map(p => p.id === propertyId
                ? { ...p, owner_id: selectedOwner, owner_name: host?.full_name || 'Owner' }
                : p
            ));
            toast.success('Owner assigned successfully');
            setAssignOpen(null);
            setSelectedOwner('');
        } catch (err: any) {
            toast.error(err.message || 'Failed to assign owner');
        } finally {
            setAssigning(false);
        }
    }

    const toggleStatus = async (id: string, currentStatus: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        setActiveDropdown(null);

        const newStatus = currentStatus === 'active' ? 'unlisted' : 'active';

        // Optimistic Update
        setProperties(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));

        const { error } = await supabase
            .from('properties')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            alert("Error updating status");
            fetchProperties(); // Revert on error
        }
    };

    const deleteProperty = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        setActiveDropdown(null);

        if (!confirm("Are you sure you want to permanently delete this property?")) return;

        // Optimistic Update
        setProperties(prev => prev.filter(p => p.id !== id));

        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', id);

        if (error) {
            alert("Error deleting property");
            fetchProperties();
        }
    };

    const handleRowClick = (id: string) => {
        router.push(`/admin/properties/${id}`);
    }

    const filteredProperties = properties.filter((p) => {
        const matchesSearch = searchQuery === "" ||
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.owner_name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || p.status === statusFilter;
        const matchesPropertyType = propertyTypeFilter === "all" || p.property_type === propertyTypeFilter;
        const matchesListingType = listingTypeFilter === "all" || p.listing_type === listingTypeFilter;

        return matchesSearch && matchesStatus && matchesPropertyType && matchesListingType;
    });

    const hasActiveFilters = statusFilter !== "all" || propertyTypeFilter !== "all" || listingTypeFilter !== "all";

    return (
        <div className="space-y-8 min-h-screen pb-20" onClick={() => { setActiveDropdown(null); setIsFilterOpen(false); }}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Properties</h1>
                    <p className="text-[var(--muted-text)]">Manage listings and review pending approvals.</p>
                </div>
                <Link href="/admin/properties/add" className="bg-gold-500 hover:bg-gold-600 text-black px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-gold-500/20 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add Property
                </Link>
            </div>

            {/* Error Message Debugging */}
            {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-500">
                    <p className="font-bold">Error Loading Properties:</p>
                    <p className="font-mono text-sm">{errorMsg}</p>
                    <button
                        onClick={fetchProperties}
                        className="mt-2 text-sm underline hover:text-[var(--page-text)]"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--card-border)] relative">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-text)] w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search properties by name, location, or owner..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-gold-500 outline-none transition"
                    />
                </div>
                <div className="relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsFilterOpen(!isFilterOpen); }}
                        className={`flex items-center gap-2 px-6 py-3 border rounded-xl transition ${hasActiveFilters ? 'bg-gold-500/10 border-gold-500 text-gold-500' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                    >
                        <Filter className="w-5 h-5" />
                        <span>Filters</span>
                    </button>

                    {isFilterOpen && (
                        <div
                            className="absolute right-0 top-full mt-2 w-72 bg-gray-900 border border-white/10 rounded-xl shadow-2xl z-50 p-4 space-y-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-white">Filter Properties</h3>
                                <button onClick={() => { setStatusFilter("all"); setPropertyTypeFilter("all"); setListingTypeFilter("all"); }} className="text-xs text-[var(--muted-text)] hover:text-white transition">Clear all</button>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-400">Status</label>
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-gold-500 outline-none">
                                    <option value="all">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="unlisted">Unlisted</option>
                                    <option value="pending_approval">Pending Approval</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-400">Property Type</label>
                                <select value={propertyTypeFilter} onChange={(e) => setPropertyTypeFilter(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-gold-500 outline-none">
                                    <option value="all">All Types</option>
                                    <option value="villa">Villa</option>
                                    <option value="apartment">Apartment</option>
                                    <option value="office">Business Office</option>
                                    <option value="house">House</option>
                                    <option value="chalet">Chalet</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-400">Listing Type</label>
                                <select value={listingTypeFilter} onChange={(e) => setListingTypeFilter(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-gold-500 outline-none">
                                    <option value="all">All Types</option>
                                    <option value="rent">For Rent</option>
                                    <option value="sale">For Sale</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Properties Table */}
            <div className="bg-[var(--card-bg)] border border-white/10 rounded-3xl overflow-visible shadow-2xl">
                {loading ? (
                    <div className="p-12 flex justify-center text-gold-500">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 text-left">
                            <tr>
                                <th className="px-8 py-4 text-sm font-semibold text-[var(--muted-text)]">Property</th>
                                <th className="px-8 py-4 text-sm font-semibold text-[var(--muted-text)]">Location</th>
                                <th className="px-8 py-4 text-sm font-semibold text-[var(--muted-text)]">Owner</th>
                                <th className="px-8 py-4 text-sm font-semibold text-[var(--muted-text)]">Price/Night</th>
                                <th className="px-8 py-4 text-sm font-semibold text-[var(--muted-text)]">Status</th>
                                <th className="px-8 py-4 text-sm font-semibold text-[var(--muted-text)] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredProperties.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-12 text-center text-[var(--muted-text)]">
                                        No properties found. Click &quot;Add Property&quot; to create one, or adjust filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredProperties.map((property) => (
                                    <tr
                                        key={property.id}
                                        onClick={() => handleRowClick(property.id)}
                                        className="hover:bg-white/5 transition group cursor-pointer relative"
                                    >
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-12 relative rounded-lg overflow-hidden bg-gray-800 shrink-0">
                                                    {property.image_urls[0] ? (
                                                        <img src={property.image_urls[0]} alt={property.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-white/10 flex items-center justify-center text-xs text-[var(--muted-text)]">No Image</div>
                                                    )}
                                                </div>
                                                <div className="font-semibold text-white group-hover:text-gold-500 transition line-clamp-2">
                                                    {property.title}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-[var(--muted-text)] max-w-xs truncate">{property.address}</td>
                                        <td className="px-8 py-4">
                                            {property.owner_id ? (
                                                <span className="text-white text-sm">{property.owner_name}</span>
                                            ) : (
                                                <span className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-4 font-medium text-gold-500">{property.price_per_night} DH</td>
                                        <td className="px-8 py-4">
                                            <StatusBadge status={property.status} />
                                        </td>
                                        <td className="px-8 py-4 text-right relative">
                                            <div className="relative inline-block">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdown(activeDropdown === property.id ? null : property.id);
                                                    }}
                                                    className={`p-2 rounded-lg transition ${activeDropdown === property.id ? 'bg-gold-500 text-black' : 'hover:bg-white/10 text-[var(--muted-text)]'}`}
                                                >
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>

                                                {/* Dropdown Menu */}
                                                {activeDropdown === property.id && (
                                                    <div
                                                        className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                                                        onClick={(e) => e.stopPropagation()} // Prevent row click when clicking inside menu
                                                    >
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/admin/properties/${property.id}`);
                                                            }}
                                                            className="w-full px-4 py-3 text-left text-sm text-[var(--muted-text)] hover:bg-white/10 hover:text-white flex items-center gap-2 transition"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                            Edit Property
                                                        </button>

                                                        <button
                                                            onClick={(e) => toggleStatus(property.id, property.status, e)}
                                                            className="w-full px-4 py-3 text-left text-sm text-[var(--muted-text)] hover:bg-white/10 hover:text-white flex items-center gap-2 transition"
                                                        >
                                                            {property.status === 'active' ? (
                                                                <>
                                                                    <EyeOff className="w-4 h-4" />
                                                                    Unlist (Hide)
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Eye className="w-4 h-4" />
                                                                    Publish (Show)
                                                                </>
                                                            )}
                                                        </button>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveDropdown(null);
                                                                setSelectedOwner(property.owner_id || '');
                                                                setAssignOpen(property.id);
                                                            }}
                                                            className="w-full px-4 py-3 text-left text-sm text-blue-400 hover:bg-blue-500/10 flex items-center gap-2 transition"
                                                        >
                                                            <UserCheck className="w-4 h-4" />
                                                            Assign Owner
                                                        </button>

                                                        <div className="border-t border-white/10 my-1"></div>

                                                        <button
                                                            onClick={(e) => deleteProperty(property.id, e)}
                                                            className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete Forever
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Assign Owner Modal */}
            {assignOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setAssignOpen(null)}>
                    <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white mb-1">Assign Property Owner</h3>
                        <p className="text-sm text-[var(--muted-text)] mb-4">
                            Select a host to assign to <strong className="text-[var(--page-text)]">{properties.find(p => p.id === assignOpen)?.title}</strong>
                        </p>
                        <select
                            value={selectedOwner}
                            onChange={e => setSelectedOwner(e.target.value)}
                            className="w-full bg-black border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm mb-4 focus:outline-none focus:border-gold-500"
                        >
                            <option value="">-- Select a host --</option>
                            {hosts.map(h => (
                                <option key={h.id} value={h.id}>
                                    {h.full_name || h.email} ({h.role})
                                </option>
                            ))}
                        </select>
                        <div className="flex gap-3">
                            <button onClick={() => setAssignOpen(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-[var(--muted-text)] hover:text-white hover:border-white/30 transition text-sm">
                                Cancel
                            </button>
                            <button
                                onClick={() => assignOwner(assignOpen)}
                                disabled={assigning || !selectedOwner}
                                className="flex-1 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold transition text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                                Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'active') {
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20">Active</span>;
    }
    if (status === 'unlisted') {
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-[var(--muted-text)] border border-gray-500/20">Unlisted</span>;
    }
    if (status === 'pending_approval') {
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gold-500/10 text-gold-500 border border-gold-500/20">Pending</span>;
    }
    if (status === 'rejected') {
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">Rejected</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-[var(--muted-text)] border border-gray-500/20">{status}</span>;
}
