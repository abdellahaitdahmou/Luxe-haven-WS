"use client";

import { useUserRole } from "@/hooks/useUserRole";
import { createClient } from "@/utils/supabase/client";
import { LogOut, Settings, ShieldCheck, CreditCard, User, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { NotificationBell } from "../notifications/NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function DashboardHeader({ userProfile }: { userProfile: any }) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    const displayName = userProfile?.full_name || userProfile?.email?.split('@')[0] || "User";

    return (
        <header className="flex items-center justify-end py-3 md:py-4 px-4 md:px-8 mb-4 md:mb-8 border-b border-[var(--card-border)]">
            <div className="flex items-center gap-2 md:gap-4">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Settings Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => { setIsSettingsOpen(!isSettingsOpen); setIsProfileOpen(false); }}
                        className="p-2 text-[var(--muted-text)] hover:text-[var(--page-text)] transition-colors relative"
                    >
                        <Settings className="w-5 h-5" />
                    </button>

                    {isSettingsOpen && (
                        <div className="absolute right-0 top-12 w-64 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-2xl z-50 overflow-hidden py-2" onMouseLeave={() => setIsSettingsOpen(false)}>
                            <div className="px-4 py-2 border-b border-[var(--card-border)]">
                                <span className="text-xs font-bold text-[var(--muted-text)] uppercase tracking-wider">Settings</span>
                            </div>
                            <div className="py-2">
                                <Link
                                    href="/dashboard/settings?tab=verification"
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--muted-text)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-gold-500 transition-colors"
                                    onClick={() => setIsSettingsOpen(false)}
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    ID Verification
                                </Link>
                                <Link
                                    href="/dashboard/settings?tab=billing"
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--muted-text)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-gold-500 transition-colors"
                                    onClick={() => setIsSettingsOpen(false)}
                                >
                                    <CreditCard className="w-4 h-4" />
                                    Payment Methods
                                </Link>
                                <Link
                                    href="/dashboard/settings?tab=security"
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--muted-text)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-gold-500 transition-colors"
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

                <div className="h-6 w-px bg-[var(--card-border)] mx-1 md:mx-2"></div>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => { setIsProfileOpen(!isProfileOpen); setIsSettingsOpen(false); }}
                        className="flex items-center gap-2 md:gap-3 focus:outline-none group"
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-bold group-hover:text-gold-500 transition-colors">
                                {displayName}
                            </p>
                        </div>

                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-transparent group-hover:border-gold-500 transition-all bg-[var(--surface-200)] relative">
                            {userProfile?.avatar_url ? (
                                <Image
                                    src={userProfile.avatar_url}
                                    alt="Profile"
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[var(--surface-100)] text-[var(--muted-text)] font-bold">
                                    {userProfile?.full_name?.charAt(0) || "U"}
                                </div>
                            )}
                        </div>
                    </button>

                    {isProfileOpen && (
                        <div className="absolute right-0 top-12 w-72 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-2xl z-50 overflow-hidden py-2" onMouseLeave={() => setIsProfileOpen(false)}>
                            <div className="px-4 py-4 border-b border-[var(--card-border)] flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-[var(--surface-200)] flex items-center justify-center text-xl font-bold text-[var(--muted-text)] overflow-hidden relative">
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
                                    <p className="text-sm font-bold truncate">{displayName}</p>
                                    <p className="text-xs text-[var(--muted-text)] truncate">@{displayName}</p>
                                </div>
                            </div>

                            <div className="py-2">
                                <Link
                                    href={`/users/${userProfile?.id}`}
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--muted-text)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--page-text)] transition-colors"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <User className="w-4 h-4" />
                                    View Public Profile
                                </Link>
                                <Link
                                    href="/dashboard/profile"
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--muted-text)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--page-text)] transition-colors"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <User className="w-4 h-4" />
                                    Edit Personal Details
                                </Link>
                                <div className="h-px bg-[var(--card-border)] my-1" />
                                <Link
                                    href="/help"
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--muted-text)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--page-text)] transition-colors"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    Help & Support
                                </Link>
                            </div>

                            <div className="border-t border-[var(--card-border)] py-2">
                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left"
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
