"use client";

import { useUserRole } from "@/hooks/useUserRole";
import { createClient } from "@/utils/supabase/client";
import { LogOut, Settings, User, Bell, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { NotificationBell } from "../notifications/NotificationBell";

export function AdminHeader({ userProfile }: { userProfile: any }) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    const displayName = userProfile?.full_name || userProfile?.email?.split('@')[0] || "Admin";

    return (
        <header className="flex items-center justify-end py-4 px-8 mb-8">
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <NotificationBell />

                <div className="h-6 w-px bg-white/10 mx-2"></div>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
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
                                    {userProfile?.full_name?.charAt(0) || "A"}
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
                                        userProfile?.full_name?.charAt(0) || "A"
                                    )}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-bold text-white truncate">{displayName}</p>
                                    <p className="text-xs text-gray-400 truncate">{userProfile?.email}</p>
                                </div>
                            </div>

                            <div className="py-2">
                                <Link
                                    href="/admin/profile"
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
                                    <HelpCircle className="w-4 h-4" />
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
