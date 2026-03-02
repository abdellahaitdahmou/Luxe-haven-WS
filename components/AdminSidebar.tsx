"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { UnreadMessageBadge } from "@/components/messages/UnreadMessageBadge";
import {
    LayoutDashboard,
    Users,
    Home,
    Settings,
    LogOut,
    TrendingDown,
    TrendingUp,
    Building2,
    Calendar,
    CalendarRange,
    MessageCircle
} from "lucide-react";

export function AdminSidebar({ mobile }: { mobile?: boolean }) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    const links = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/properties", label: "Properties", icon: Building2 },
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/bookings", label: "Bookings", icon: Calendar },
        { href: "/dashboard/messages", label: "Messages", icon: MessageCircle }, // Admin communicates via dashboard messages for now
        { href: "/admin/calendar", label: "Master Calendar", icon: CalendarRange },
        { href: "/admin/accounting/expenses", label: "Expenses", icon: TrendingDown },
        { href: "/admin/accounting/payments", label: "Payments", icon: TrendingUp },
        { href: "/admin/settings", label: "Settings", icon: Settings },
    ];

    const baseClass = mobile
        ? "w-full border-b border-white/10 flex flex-col h-auto block bg-transparent"
        : "w-64 bg-[var(--card-bg)] border-r border-white/10 flex flex-col h-screen fixed left-0 top-0 z-40 hidden md:flex";

    return (
        <aside className={baseClass}>
            <div className="p-8">
                <h1 className="text-2xl font-bold tracking-tighter text-[var(--page-text)]">
                    LUXE <span className="text-gold-500">ADMIN</span>
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium ${isActive
                                ? "bg-gold-500 text-black shadow-lg shadow-gold-500/20"
                                : "text-[var(--muted-text)] hover:bg-white/5 hover:text-[var(--page-text)]"
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            {link.label}
                            {link.label === "Messages" && <UnreadMessageBadge />}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-[var(--card-border)]">
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium text-[var(--muted-text)] hover:bg-red-500/10 hover:text-red-500 w-full"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
