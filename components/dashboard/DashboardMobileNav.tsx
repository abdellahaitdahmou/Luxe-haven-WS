"use client";

import { useState } from "react";
import { Link } from "lucide-react"; // Wait, Link is next/link. Lucide has Link icon.
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminSidebar, type UserRole } from "@/components/AdminSidebar";
import { TravelerSidebar } from "@/components/dashboard/TravelerSidebar";

export function DashboardMobileNav({ role, isHost }: { role: UserRole, isHost: boolean }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="md:hidden border-b border-white/10 bg-black p-4 flex items-center justify-between sticky top-0 z-50">
            <span className="font-bold text-gold-500 text-lg">
                {isHost ? "Host Dashboard" : "Traveler Dashboard"}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X className="text-[var(--page-text)]" /> : <Menu className="text-[var(--page-text)]" />}
            </Button>

            {/* Overlay Menu */}
            {isOpen && (
                <div className="absolute top-16 left-0 w-full h-[calc(100vh-4rem)] bg-black/95 backdrop-blur-xl z-50 p-6 overflow-y-auto animate-in slide-in-from-top-10">
                    <div onClick={() => setIsOpen(false)}>
                        {isHost ? <AdminSidebar role={role} mobile /> : <TravelerSidebar mobile />}
                    </div>
                </div>
            )}
        </div>
    );
}
