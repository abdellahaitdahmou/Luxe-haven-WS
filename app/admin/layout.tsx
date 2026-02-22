import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch user profile for header
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const userProfile = {
        ...profile,
        email: user.email,
        full_name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-gold-500 selection:text-black flex flex-col md:flex-row">
            {/* Mobile Nav */}
            <AdminMobileNav />

            {/* Desktop Sidebar */}
            <AdminSidebar />

            <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-x-hidden flex flex-col">
                <AdminHeader userProfile={userProfile} />
                <div className="flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}
