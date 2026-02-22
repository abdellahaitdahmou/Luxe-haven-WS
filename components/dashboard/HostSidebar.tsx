"use client";

import Link from "next/link";
import { UnreadMessageBadge } from "@/components/messages/UnreadMessageBadge";
import { CreditCard, Home, Settings, DollarSign, Calendar, MessageCircle, LayoutDashboard, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function HostSidebar({ mobile }: { mobile?: boolean }) {
    const baseClass = mobile
        ? "w-full border-b border-white/10 p-6 block"
        : "w-64 border-r border-white/10 p-6 hidden md:flex md:flex-col sticky top-0 h-screen";

    const supabase = createClient();
    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login"); // or router.refresh() if middleware handles it
        router.refresh();
    };

    return (
        <aside className={baseClass}>
            <div className="mb-8">
                <h2 className="text-xl font-bold bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
                    Host Dashboard
                </h2>
            </div>
            <nav className="space-y-2 flex-col flex h-full">
                <div className="space-y-2">
                    <Link href="/dashboard" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors">
                        <Home className="w-5 h-5" />
                        <span>Overview</span>
                    </Link>
                    <Link href="/dashboard/calendar" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors">
                        <Calendar className="w-5 h-5" />
                        <span>My Calendar</span>
                    </Link>
                    <Link href="/dashboard/bookings" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors">
                        <Calendar className="w-5 h-5" />
                        <span>Bookings</span>
                    </Link>
                    <Link href="/dashboard/messages" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span>Messages</span>
                        <UnreadMessageBadge />
                    </Link>
                    <Link href="/dashboard/payouts" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors">
                        <CreditCard className="w-5 h-5" />
                        <span>Payout Methods</span>
                    </Link>
                    <Link href="/dashboard/wallet" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors">
                        <DollarSign className="w-5 h-5" />
                        <span>My Wallet</span>
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors">
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                    </Link>
                </div>

                <div className="mt-auto space-y-2 pt-4 border-t border-white/10">
                    <Link href="/admin" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gold-500/10 text-gold-500 hover:text-gold-400 transition-colors">
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Back to Admin</span>
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors text-left"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </nav>
        </aside>
    );
}
