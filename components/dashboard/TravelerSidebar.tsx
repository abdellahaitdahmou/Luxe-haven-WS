"use client";

import Link from "next/link";
import { UnreadMessageBadge } from "@/components/messages/UnreadMessageBadge";
import { Home, Settings, Map, MessageCircle, Heart, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function TravelerSidebar({ mobile }: { mobile?: boolean }) {
    const baseClass = mobile
        ? "w-full border-b border-white/10 p-6 block"
        : "w-64 border-r border-white/10 p-6 hidden md:flex md:flex-col sticky top-0 h-screen";

    const supabase = createClient();
    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <aside className={baseClass}>
            <div className="mb-8">
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                    Traveler Dashboard
                </h2>
            </div>
            <nav className="space-y-2 flex-col flex h-full">
                <div className="space-y-2">
                    <Link href="/dashboard" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors">
                        <Home className="w-5 h-5" />
                        <span>Overview</span>
                    </Link>
                    <Link href="/dashboard/trips" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors">
                        <Map className="w-5 h-5" />
                        <span>My Trips</span>
                    </Link>
                    <Link href="/dashboard/messages" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span>Messages</span>
                        <UnreadMessageBadge />
                    </Link>
                    <Link href="/dashboard/wishlist" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors">
                        <Heart className="w-5 h-5" />
                        <span>Wishlist</span>
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors">
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                    </Link>
                </div>

                <div className="mt-auto pt-4 border-t border-white/10">
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
