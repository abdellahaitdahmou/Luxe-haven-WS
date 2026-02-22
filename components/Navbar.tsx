"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useUserRole } from "@/hooks/useUserRole"
import { Menu, Search, LayoutDashboard, Settings, LogOut, ChevronDown, User as UserIcon } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { NotificationBell } from "./notifications/NotificationBell"

export function Navbar() {
    const { role } = useUserRole()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user)
        })
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
            setUser(session?.user ?? null)
        })
        return () => subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        setIsMenuOpen(false)
        router.push("/")
        router.refresh()
    }

    const displayName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || null
    const isAdmin = role === "admin" || role === "owner"

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 right-0 z-50 px-4 md:px-12 lg:px-24 py-2"
        >
            <div className="w-full mx-auto">
                <div className={`flex items-center justify-between transition-all duration-300 ${pathname === "/"
                    ? "bg-transparent py-6"
                    : "bg-transparent py-4"
                    }`}>

                    {/* Logo */}
                    <Link href="/" className="flex items-center relative w-24 md:w-32 h-10 md:h-12">
                        <img
                            src="/logo.png"
                            alt="Luxe Haven"
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-24 md:h-36 max-w-none w-auto object-contain pointer-events-none"
                        />
                    </Link>

                    {/* Center Search (Only on Home Page) */}
                    {pathname === "/" ? (
                        <div
                            onClick={() => router.push("/explore")}
                            className="hidden md:flex items-center bg-white/20 rounded-full px-4 py-2 space-x-2 border border-white/10 cursor-pointer hover:bg-white/30 transition"
                        >
                            <Search className="w-4 h-4 text-white/70" />
                            <span className="text-sm text-white/70">Anywhere • Any week • Add guests</span>
                        </div>
                    ) : (
                        <div className="hidden md:block w-32" />
                    )}

                    {/* Right Actions */}
                    <div className="flex items-center space-x-4">
                        {user && <NotificationBell />}

                        {isAdmin && (
                            <Link href="/admin" className="hidden md:block text-sm font-medium text-white hover:text-gold-400 transition">
                                Admin
                            </Link>
                        )}

                        <div className="relative">
                            <div
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition p-2 rounded-full border border-white/10 cursor-pointer"
                            >
                                <Menu className="w-5 h-5 text-white" />
                                {user?.user_metadata?.avatar_url ? (
                                    <img
                                        src={user.user_metadata.avatar_url}
                                        alt="avatar"
                                        className="w-7 h-7 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="bg-gray-500 rounded-full p-1 opacity-80">
                                        <UserIcon className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute right-0 top-12 w-52 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl py-2 overflow-hidden"
                                >
                                    <div className="flex flex-col">
                                        {user ? (
                                            <>
                                                {/* User info */}
                                                <div className="px-4 py-3 border-b border-white/10">
                                                    <p className="text-white font-semibold text-sm">{displayName}</p>
                                                    <p className="text-gray-500 text-xs truncate">{user.email}</p>
                                                </div>

                                                {isAdmin ? (
                                                    <Link
                                                        href="/admin"
                                                        onClick={() => setIsMenuOpen(false)}
                                                        className="px-4 py-2.5 hover:bg-white/5 text-sm transition flex items-center gap-2 text-gray-200 hover:text-gold-500"
                                                    >
                                                        <LayoutDashboard className="w-4 h-4" />
                                                        Admin Dashboard
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        href="/dashboard"
                                                        onClick={() => setIsMenuOpen(false)}
                                                        className="px-4 py-2.5 hover:bg-white/5 text-sm transition flex items-center gap-2 text-gray-200 hover:text-gold-500"
                                                    >
                                                        <LayoutDashboard className="w-4 h-4" />
                                                        My Dashboard
                                                    </Link>
                                                )}

                                                <Link
                                                    href="/dashboard/profile"
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className="px-4 py-2.5 hover:bg-white/5 text-sm transition flex items-center gap-2 text-gray-200 hover:text-gold-500"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                    Settings
                                                </Link>

                                                <div className="h-px bg-white/10 my-1" />

                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-sm transition flex items-center gap-2 text-red-400 hover:text-red-300"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Log Out
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <Link href="/services" onClick={() => setIsMenuOpen(false)} className="px-4 py-2.5 hover:bg-white/5 text-sm transition flex items-center gap-2 text-gray-200 hover:text-gold-500">
                                                    Services
                                                </Link>
                                                <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="px-4 py-2.5 hover:bg-white/5 text-sm transition flex items-center gap-2 text-gray-200 hover:text-gold-500">
                                                    Contact Us
                                                </Link>
                                                <div className="h-px bg-white/10 my-1" />
                                                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="px-4 py-2.5 hover:bg-white/5 text-sm transition flex items-center gap-2 text-gray-200 hover:text-gold-500">
                                                    Log In
                                                </Link>
                                                <Link href="/signup" onClick={() => setIsMenuOpen(false)} className="px-4 py-2.5 hover:bg-white/5 text-sm transition flex items-center gap-2 text-gray-200 hover:text-gold-500">
                                                    Sign Up
                                                </Link>
                                                <div className="h-px bg-white/10 my-1" />
                                                <Link href="/help" onClick={() => setIsMenuOpen(false)} className="px-4 py-2.5 hover:bg-white/5 text-sm transition flex items-center gap-2 text-gray-400 font-light">
                                                    Help Center
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </motion.nav>
    )
}
