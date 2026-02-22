"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminSidebar } from "@/components/AdminSidebar";

export function AdminMobileNav() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="md:hidden border-b border-white/10 bg-black p-4 flex items-center justify-between sticky top-0 z-50">
            <span className="font-bold text-gold-500 text-lg">
                LUXE ADMIN
            </span>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X className="text-white" /> : <Menu className="text-white" />}
            </Button>

            {/* Overlay Menu */}
            {isOpen && (
                <div className="absolute top-16 left-0 w-full h-[calc(100vh-4rem)] bg-black/95 backdrop-blur-xl z-50 p-6 overflow-y-auto animate-in slide-in-from-top-10">
                    <div onClick={() => setIsOpen(false)}>
                        <AdminSidebar mobile />
                    </div>
                </div>
            )}
        </div>
    );
}
