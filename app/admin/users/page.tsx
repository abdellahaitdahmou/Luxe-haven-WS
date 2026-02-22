"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    MoreHorizontal, Search, Shield, ShieldAlert, ShieldCheck,
    User, Loader2, Users, UserCheck, UserPlus, Building2, CheckSquare,
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface Profile {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    role: "admin" | "owner" | "manager" | "guest";
    is_verified: boolean;
    created_at: string;
}

interface Owner {
    id: string;
    profile_id: string;
    display_name: string | null;
    notes: string | null;
    created_at: string;
    profile: Profile;
}

interface Property {
    id: string;
    title: string;
    city: string | null;
    country: string | null;
    status: string;
}

const ROLE_COLORS: Record<string, string> = {
    admin: "bg-red-500/10 text-red-500 border-red-500/20",
    owner: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    manager: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    guest: "bg-white/5 text-gray-400 border-white/10",
};

const ROLE_ICONS: Record<string, any> = {
    admin: ShieldAlert,
    owner: ShieldCheck,
    manager: Shield,
    guest: User,
};

const HOST_ROLES = ["admin", "owner", "manager"];

export default function AdminUsersPage() {
    const supabase = createClient();
    const [users, setUsers] = useState<Profile[]>([]);
    const [owners, setOwners] = useState<Owner[]>([]);
    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [updating, setUpdating] = useState<string | null>(null);

    // Invite dialog
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"owner" | "manager" | "admin">("owner");
    const [isInviting, setIsInviting] = useState(false);

    // Listing assignment dialog
    const [assignDialogOwner, setAssignDialogOwner] = useState<Owner | null>(null);
    const [assignedPropertyIds, setAssignedPropertyIds] = useState<Set<string>>(new Set());
    const [savingAssignment, setSavingAssignment] = useState(false);

    useEffect(() => {
        fetchAll();
    }, []);

    async function fetchAll() {
        setLoading(true);
        await Promise.all([fetchUsers(), fetchOwners(), fetchProperties()]);
        setLoading(false);
    }

    async function fetchUsers() {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });
        if (!error) setUsers(data || []);
    }

    async function fetchOwners() {
        const { data, error } = await supabase
            .from("owners")
            .select(`
                id, profile_id, display_name, notes, created_at,
                profile:profiles(id, full_name, email, avatar_url, role, is_verified, created_at)
            `)
            .order("created_at", { ascending: false });
        if (!error) setOwners((data as any) || []);
    }

    async function fetchProperties() {
        const { data, error } = await supabase
            .from("properties")
            .select("id, title, city, country, status")
            .order("created_at", { ascending: false });
        if (!error) setAllProperties(data || []);
    }

    async function handleRoleUpdate(userId: string, newRole: Profile["role"]) {
        try {
            setUpdating(userId);
            const { error } = await supabase
                .from("profiles")
                .update({ role: newRole })
                .eq("id", userId);
            if (error) throw error;

            // If promoting to owner, upsert into owners (the DB trigger does it,
            // but we refresh the list so the UI updates immediately)
            if (newRole === "owner") {
                await supabase
                    .from("owners")
                    .upsert({ profile_id: userId }, { onConflict: "profile_id" });
            }

            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            toast.success(`Role updated to ${newRole}`);
            // Refresh owners list
            await fetchOwners();
        } catch {
            toast.error("Failed to update role");
        } finally {
            setUpdating(null);
        }
    }

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        try {
            setIsInviting(true);
            if (!inviteEmail.includes("@")) {
                toast.error("Please enter a valid email address");
                return;
            }
            const { error } = await supabase
                .from("user_invitations")
                .insert({ email: inviteEmail.toLowerCase(), role: inviteRole });

            if (error) {
                if (error.code === "23505") {
                    toast.error("This email has already been invited");
                } else {
                    toast.error(`Error: ${error.message}`);
                }
                return;
            }

            const emailRes = await fetch("/api/send-invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
            });

            if (!emailRes.ok) {
                toast.warning("Invitation saved but email failed to send");
            } else {
                toast.success(`Co-host invitation sent to ${inviteEmail}`);
            }

            setIsInviteOpen(false);
            setInviteEmail("");
            setInviteRole("owner");
        } catch (err: any) {
            toast.error(`Failed: ${err?.message || "Unknown error"}`);
        } finally {
            setIsInviting(false);
        }
    }

    // Open assign dialog and load current assignments for that owner
    async function openAssignDialog(owner: Owner) {
        setAssignDialogOwner(owner);
        const { data } = await supabase
            .from("owner_properties")
            .select("property_id")
            .eq("owner_id", owner.id);
        setAssignedPropertyIds(new Set((data || []).map((r: any) => r.property_id)));
    }

    function togglePropertySelection(propertyId: string) {
        setAssignedPropertyIds(prev => {
            const next = new Set(prev);
            if (next.has(propertyId)) {
                next.delete(propertyId);
            } else {
                next.add(propertyId);
            }
            return next;
        });
    }

    async function saveAssignments() {
        if (!assignDialogOwner) return;
        try {
            setSavingAssignment(true);

            // Delete all existing for this owner, then re-insert
            await supabase
                .from("owner_properties")
                .delete()
                .eq("owner_id", assignDialogOwner.id);

            if (assignedPropertyIds.size > 0) {
                const rows = Array.from(assignedPropertyIds).map(pid => ({
                    owner_id: assignDialogOwner.id,
                    property_id: pid,
                }));
                const { error } = await supabase.from("owner_properties").insert(rows);
                if (error) throw error;
            }

            toast.success("Listings assigned successfully");
            setAssignDialogOwner(null);
        } catch {
            toast.error("Failed to save assignments");
        } finally {
            setSavingAssignment(false);
        }
    }

    const filter = (list: Profile[]) =>
        list.filter(u =>
            (u.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (u.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
        );

    const filteredOwnersList = owners.filter(o =>
        (o.profile?.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (o.profile?.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    const hosts = filter(users.filter(u => HOST_ROLES.includes(u.role)));
    const travelers = filter(users.filter(u => u.role === "guest"));

    function UserTable({ data, showActions = true, emptyMsg }: { data: Profile[], showActions?: boolean, emptyMsg: string }) {
        return (
            <div className="bg-surface-50 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="text-gray-400">User</TableHead>
                            <TableHead className="text-gray-400">Role</TableHead>
                            <TableHead className="text-gray-400">Status</TableHead>
                            <TableHead className="text-gray-400">Joined</TableHead>
                            {showActions && <TableHead className="text-right text-gray-400">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={showActions ? 5 : 4} className="h-24 text-center text-gray-400">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
                                        Loading...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={showActions ? 5 : 4} className="h-24 text-center text-gray-500">
                                    {emptyMsg}
                                </TableCell>
                            </TableRow>
                        ) : data.map((user) => {
                            const RoleIcon = ROLE_ICONS[user.role] || User;
                            return (
                                <TableRow key={user.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-9 h-9 border border-white/10">
                                                <AvatarImage src={user.avatar_url || undefined} />
                                                <AvatarFallback className="bg-surface-100 text-yellow-500">
                                                    {user.full_name?.[0] || user.email?.[0] || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-white">{user.full_name || "Unnamed"}</span>
                                                <span className="text-xs text-gray-400">{user.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`gap-1.5 px-2.5 py-0.5 ${ROLE_COLORS[user.role]}`}>
                                            <RoleIcon className="w-3.5 h-3.5" />
                                            <span className="capitalize">{user.role}</span>
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.is_verified ? (
                                            <Badge className="bg-green-500/10 text-green-500 border-0">Verified</Badge>
                                        ) : (
                                            <Badge className="bg-gray-500/10 text-gray-400 border-0">Unverified</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-gray-400 text-sm">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </TableCell>
                                    {showActions && (
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10">
                                                        {updating === user.id
                                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                                            : <MoreHorizontal className="w-4 h-4" />}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-surface-50 border-white/10 text-white">
                                                    <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                                                    <DropdownMenuSeparator className="bg-white/10" />
                                                    <DropdownMenuItem onClick={() => handleRoleUpdate(user.id, "manager")} className="hover:bg-white/10 cursor-pointer">
                                                        <Shield className="mr-2 h-4 w-4" /> Manager
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleRoleUpdate(user.id, "owner")} className="hover:bg-white/10 cursor-pointer">
                                                        <ShieldCheck className="mr-2 h-4 w-4" /> Owner
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-white/10" />
                                                    <DropdownMenuItem onClick={() => handleRoleUpdate(user.id, "admin")} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer">
                                                        <ShieldAlert className="mr-2 h-4 w-4" /> Admin
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-7xl mx-auto p-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                    <p className="text-gray-400">Manage hosts and travelers across the platform.</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-surface-50 border-white/10 text-white placeholder:text-gray-500"
                        />
                    </div>

                    {/* Invite Co-host Button */}
                    <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-yellow-500 text-black hover:bg-yellow-400 font-semibold">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Invite Co-host
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-surface-50 border-white/10 text-white sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Invite a Co-host</DialogTitle>
                                <DialogDescription>
                                    Send an invitation to a co-host. They will receive platform access to manage properties.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleInvite} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Email Address</label>
                                    <Input
                                        type="email"
                                        placeholder="cohost@example.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="bg-surface-100 border-white/10 text-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Role</label>
                                    <select
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value as any)}
                                        className="flex h-10 w-full rounded-md border border-white/10 bg-surface-100 px-3 py-2 text-sm text-white focus-visible:outline-none"
                                    >
                                        <option value="owner">Owner (Co-host)</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)} className="text-gray-400 hover:text-white">
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="bg-yellow-500 text-black hover:bg-yellow-400" disabled={isInviting}>
                                        {isInviting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Inviting...</> : "Send Invitation"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* HOSTS TABLE */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                        <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Hosts &amp; Co-hosts</h2>
                        <p className="text-sm text-gray-500">{hosts.length} host{hosts.length !== 1 ? "s" : ""} — admin, owner, manager</p>
                    </div>
                </div>
                <UserTable data={hosts} showActions={true} emptyMsg="No hosts found." />
            </section>

            {/* OWNERS TABLE */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                        <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Owners</h2>
                        <p className="text-sm text-gray-500">
                            {filteredOwnersList.length} owner{filteredOwnersList.length !== 1 ? "s" : ""} — assign listings to each owner
                        </p>
                    </div>
                </div>

                <div className="bg-surface-50 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                    <Table>
                        <TableHeader className="bg-white/5">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-gray-400">Owner</TableHead>
                                <TableHead className="text-gray-400">Email</TableHead>
                                <TableHead className="text-gray-400">Status</TableHead>
                                <TableHead className="text-gray-400">Member Since</TableHead>
                                <TableHead className="text-right text-gray-400">Listings</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-gray-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
                                            Loading...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredOwnersList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                                        No owners yet. Assign the &quot;Owner&quot; role to a user above to add them here.
                                    </TableCell>
                                </TableRow>
                            ) : filteredOwnersList.map((owner) => (
                                <TableRow key={owner.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-9 h-9 border border-white/10">
                                                <AvatarImage src={owner.profile?.avatar_url || undefined} />
                                                <AvatarFallback className="bg-surface-100 text-yellow-500">
                                                    {owner.profile?.full_name?.[0] || owner.profile?.email?.[0] || "O"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-white">
                                                {owner.display_name || owner.profile?.full_name || "Unnamed"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-400 text-sm">
                                        {owner.profile?.email || "—"}
                                    </TableCell>
                                    <TableCell>
                                        {owner.profile?.is_verified ? (
                                            <Badge className="bg-green-500/10 text-green-500 border-0">Verified</Badge>
                                        ) : (
                                            <Badge className="bg-gray-500/10 text-gray-400 border-0">Unverified</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-gray-400 text-sm">
                                        {new Date(owner.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300 gap-1.5"
                                            onClick={() => openAssignDialog(owner)}
                                        >
                                            <CheckSquare className="w-3.5 h-3.5" />
                                            Assign Listings
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </section>

            {/* TRAVELERS TABLE */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Users className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Travelers</h2>
                        <p className="text-sm text-gray-500">{travelers.length} traveler{travelers.length !== 1 ? "s" : ""} — registered guests</p>
                    </div>
                </div>
                <UserTable data={travelers} showActions={false} emptyMsg="No travelers have signed up yet." />
            </section>

            {/* ASSIGN LISTINGS DIALOG */}
            <Dialog open={!!assignDialogOwner} onOpenChange={(open) => { if (!open) setAssignDialogOwner(null); }}>
                <DialogContent className="bg-surface-50 border-white/10 text-white sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-yellow-400" />
                            Assign Listings to {assignDialogOwner?.display_name || assignDialogOwner?.profile?.full_name}
                        </DialogTitle>
                        <DialogDescription>
                            Select the properties this owner is responsible for.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-72 overflow-y-auto space-y-2 py-2 pr-1">
                        {allProperties.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-6">No properties found.</p>
                        ) : allProperties.map((property) => (
                            <label
                                key={property.id}
                                className="flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                            >
                                <Checkbox
                                    checked={assignedPropertyIds.has(property.id)}
                                    onCheckedChange={() => togglePropertySelection(property.id)}
                                    className="border-white/20 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{property.title}</p>
                                    <p className="text-xs text-gray-400">
                                        {[property.city, property.country].filter(Boolean).join(", ") || "No location"}
                                        <span className="ml-2 capitalize opacity-60">{property.status}</span>
                                    </p>
                                </div>
                            </label>
                        ))}
                    </div>

                    <DialogFooter className="mt-2">
                        <Button
                            variant="ghost"
                            onClick={() => setAssignDialogOwner(null)}
                            className="text-gray-400 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={saveAssignments}
                            disabled={savingAssignment}
                            className="bg-yellow-500 text-black hover:bg-yellow-400 font-semibold"
                        >
                            {savingAssignment
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                                : "Save Assignments"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
