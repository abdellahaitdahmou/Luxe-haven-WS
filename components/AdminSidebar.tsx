"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { UnreadMessageBadge } from "@/components/messages/UnreadMessageBadge";
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    TrendingDown,
    TrendingUp,
    Building2,
    Calendar,
    CalendarRange,
    MessageCircle,
    CreditCard,
    DollarSign,
    Home,
    ChevronRight,
} from "lucide-react";

// ─── Role type ──────────────────────────────────────────────
export type UserRole = "admin" | "owner" | "manager" | "guest";

// ─── Link definitions ────────────────────────────────────────
type NavItem = {
    href: string;
    label: string;
    icon: React.ElementType;
    exact?: boolean;
    badge?: boolean;
    /** Which roles can see this link. Empty = everyone in the section. */
    roles?: UserRole[];
};

const adminLinks: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/properties", label: "Properties", icon: Building2 },
    { href: "/admin/users", label: "Users", icon: Users, roles: ["admin"] },
    { href: "/admin/bookings", label: "Bookings", icon: Calendar },
    { href: "/admin/calendar", label: "Master Calendar", icon: CalendarRange },
    { href: "/admin/accounting/expenses", label: "Expenses", icon: TrendingDown },
    { href: "/admin/accounting/payments", label: "Payments", icon: TrendingUp },
    { href: "/admin/settings", label: "Settings", icon: Settings, roles: ["admin"] },
];

const hostLinks: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: Home, exact: true },
    { href: "/dashboard/calendar", label: "My Calendar", icon: Calendar },
    { href: "/dashboard/bookings", label: "Bookings", icon: CalendarRange },
    { href: "/dashboard/messages", label: "Messages", icon: MessageCircle, badge: true },
    { href: "/dashboard/payouts", label: "Payout Methods", icon: CreditCard },
    { href: "/dashboard/wallet", label: "My Wallet", icon: DollarSign },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

// ─── Which sections are visible per role ─────────────────────
const sectionAccess: Record<UserRole, { showAdmin: boolean; showHost: boolean }> = {
    admin: { showAdmin: true, showHost: true },
    manager: { showAdmin: true, showHost: false },
    owner: { showAdmin: false, showHost: true },
    guest: { showAdmin: false, showHost: false },
};

// ─── Sub-components ──────────────────────────────────────────
function NavLink({
    href,
    label,
    icon: Icon,
    exact,
    badge,
    pathname,
}: Omit<NavItem, "roles"> & { pathname: string }) {
    const isActive = exact
        ? pathname === href
        : pathname === href || pathname.startsWith(href + "/");

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium group ${isActive
                    ? "bg-gold-500 text-black shadow-lg shadow-gold-500/20"
                    : "text-[var(--muted-text)] hover:bg-white/5 hover:text-[var(--page-text)]"
                }`}
        >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {badge && <UnreadMessageBadge />}
            {!isActive && (
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
            )}
        </Link>
    );
}

function SectionLabel({ label }: { label: string }) {
    return (
        <p className="px-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-text)] opacity-60">
            {label}
        </p>
    );
}

// ─── Main component ──────────────────────────────────────────
export function AdminSidebar({
    mobile,
    role = "guest",
}: {
    mobile?: boolean;
    role?: UserRole;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    const access = sectionAccess[role] ?? sectionAccess.guest;

    // Filter admin links that require a specific role list
    const visibleAdminLinks = adminLinks.filter(
        (l) => !l.roles || l.roles.includes(role)
    );

    const baseClass = mobile
        ? "w-full border-b border-white/10 flex flex-col h-auto bg-transparent"
        : "w-64 bg-[var(--card-bg)] border-r border-white/10 flex flex-col h-screen fixed left-0 top-0 z-40 hidden md:flex";

    return (
        <aside className={baseClass}>
            {/* Branding */}
            <div className="px-6 py-6 border-b border-white/10">
                <h1 className="text-xl font-bold tracking-tighter text-[var(--page-text)]">
                    LUXE <span className="text-gold-500">ADMIN</span>
                </h1>
                <p className="text-xs text-[var(--muted-text)] mt-0.5 capitalize">
                    {role} console
                </p>
            </div>

            {/* Scrollable nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">

                {/* ── Admin Section ──────────────────────────── */}
                {access.showAdmin && (
                    <div>
                        <SectionLabel label="Admin" />
                        <div className="space-y-1">
                            {visibleAdminLinks.map((link) => (
                                <NavLink key={link.href} {...link} pathname={pathname} />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Host Dashboard Section ─────────────────── */}
                {access.showHost && (
                    <div>
                        <SectionLabel label="Host Dashboard" />
                        <div className="space-y-1">
                            {hostLinks.map((link) => (
                                <NavLink key={link.href} {...link} pathname={pathname} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Fallback for guests */}
                {!access.showAdmin && !access.showHost && (
                    <p className="px-4 text-sm text-[var(--muted-text)] opacity-60">
                        No menu items available.
                    </p>
                )}
            </nav>

            {/* Sign Out */}
            <div className="p-4 border-t border-[var(--card-border)]">
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition text-sm font-medium text-[var(--muted-text)] hover:bg-red-500/10 hover:text-red-500 w-full"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
