"use client";

import { useUserRole } from "@/hooks/useUserRole";
import { AvatarUpload } from "@/components/profile/AvatarUpload"; // We might want a smaller read-only avatar here, but AvatarUpload is fine for now or just an Image
import { createClient } from "@/utils/supabase/client";
import { LogOut, Settings, ShieldCheck, CreditCard, User, ChevronDown, Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { NotificationBell } from "../notifications/NotificationBell";

// Actually, let's check `components/ui` for dropdown-menu. If not, we'll build a simple one or use Popover.

// Let's assume we don't have a DropdownMenu component yet based on previous file lists (popover.tsx exists).
// I'll build a custom dropdown using Headless UI or just standard React state for now to be safe and quick, 
// or I can check if `registry` instructions were followed.
// The user asked for "clicking in the picture... and settings will contain...". 

// Let's use a simple state-based dropdown for simplicity and reliability.

export function DashboardHeader({ userProfile }: { userProfile: any }) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    const displayName = userProfile?.full_name || userProfile?.email?.split('@')[0] || "User";

    return (
        <header className="flex items-center justify-end py-4 px-8 mb-8">
            <div className="flex items-center gap-4">
                {/* Settings Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => { setIsSettingsOpen(!isSettingsOpen); setIsProfileOpen(false); }}
                        className="p-2 text-gray-400 hover:text-white transition-colors relative"
                    >
                        <Settings className="w-5 h-5" />
                    </button>

                    {isSettingsOpen && (
                        <div className="absolute right-0 top-12 w-64 bg-surface-50 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-2" onMouseLeave={() => setIsSettingsOpen(false)}>
                            <div className="px-4 py-2 border-b border-white/5">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Settings</span>
                            </div>
                            <div className="py-2">
                                <Link
                                    href="/dashboard/settings?tab=verification"
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-gold-500 transition-colors"
                                    onClick={() => setIsSettingsOpen(false)}
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    ID Verification
                                </Link>
                                <Link
                                    href="/dashboard/settings?tab=billing"
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-gold-500 transition-colors"
                                    onClick={() => setIsSettingsOpen(false)}
                                >
                                    <CreditCard className="w-4 h-4" />
                                    Payment Methods
                                </Link>
                                <Link
                                    href="/dashboard/settings?tab=security"
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-gold-500 transition-colors"
                                    onClick={() => setIsSettingsOpen(false)}
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    Privacy & Security
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notifications */}
                <NotificationBell />

                <div className="h-6 w-px bg-white/10 mx-2"></div>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => { setIsProfileOpen(!isProfileOpen); setIsSettingsOpen(false); }}
                        className="flex items-center gap-3 focus:outline-none group"
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-bold text-white group-hover:text-gold-500 transition-colors">
                                {displayName}
                            </p>
                        </div>

                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent group-hover:border-gold-500 transition-all bg-surface-200 relative">
                            {userProfile?.avatar_url ? (
                                <Image
                                    src={userProfile.avatar_url}
                                    alt="Profile"
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-surface-100 text-gray-500 font-bold">
                                    {userProfile?.full_name?.charAt(0) || "U"}
                                </div>
                            )}
                        </div>
                    </button>

                    {isProfileOpen && (
                        <div className="absolute right-0 top-12 w-72 bg-surface-50 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-2" onMouseLeave={() => setIsProfileOpen(false)}>
                            <div className="px-4 py-4 border-b border-white/5 flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-surface-200 flex items-center justify-center text-xl font-bold text-gray-400 overflow-hidden relative">
                                    {userProfile?.avatar_url ? (
                                        <Image
                                            src={userProfile.avatar_url}
                                            alt="Profile"
                                            fill
                                            className="object-cover"
                                            sizes="48px"
                                        />
                                    ) : (
                                        userProfile?.full_name?.charAt(0) || "U"
                                    )}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-bold text-white truncate">{displayName}</p>
                                    <p className="text-xs text-gray-400 truncate">@{displayName}</p>
                                </div>
                            </div>

                            <div className="py-2">
                                <Link
                                    href={`/users/${userProfile?.id}`}
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <User className="w-4 h-4" />
                                    View Public Profile
                                </Link>
                                <Link
                                    href="/dashboard/profile"
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <User className="w-4 h-4" />
                                    Edit Personal Details
                                </Link>
                                <div className="h-px bg-white/5 my-1" />
                                <Link
                                    href="/help"
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    Help & Support
                                </Link>
                            </div>

                            <div className="border-t border-white/5 py-2">
                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors text-left"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
