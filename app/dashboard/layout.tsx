import { ReactNode } from "react";
import { createClient } from "@/utils/supabase/server";
import { HostSidebar } from "@/components/dashboard/HostSidebar";
import { TravelerSidebar } from "@/components/dashboard/TravelerSidebar";
import { DashboardMobileNav } from "@/components/dashboard/DashboardMobileNav";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch user role and profile details for header
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const role = profile?.role || 'guest';
    const isHost = role === 'admin' || role === 'owner' || role === 'host';

    // Merge auth data with profile data, prioritizing profile data but falling back to auth metadata
    const userProfile = {
        ...profile,
        email: user.email,
        full_name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture
    };

    return (
        <div className="flex min-h-screen bg-black text-white flex-col md:flex-row">
            {/* Mobile Navigation */}
            <DashboardMobileNav isHost={isHost} />

            {/* Sidebar based on Role (Desktop) */}
            {isHost ? <HostSidebar /> : <TravelerSidebar />}

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen">
                <DashboardHeader userProfile={userProfile} />
                <div className="p-8 pt-0">
                    {children}
                </div>
            </main>
        </div>
    );
}
