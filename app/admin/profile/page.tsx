
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { User } from "lucide-react";

export default async function AdminProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
                <p className="text-gray-400">Manage your personal details.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Avatar & Quick Stats */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-surface-50 border border-white/10 rounded-xl p-6 flex flex-col items-center text-center">
                        <div className="flex flex-col items-center">
                            <AvatarUpload
                                uid={user.id}
                                url={profile?.avatar_url}
                                currentName={profile?.full_name}
                            />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">{profile?.full_name || profile?.email}</h2>
                        <p className="text-sm text-gray-400 capitalize">{profile?.role}</p>
                    </div>
                </div>

                {/* Right Column: Edit Form */}
                <div className="md:col-span-2">
                    <div className="bg-surface-50 border border-white/10 rounded-xl p-8">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <User className="w-5 h-5 text-gold-500" />
                            Personal Details
                        </h3>
                        <ProfileEditForm user={user} profile={profile} />
                    </div>
                </div>
            </div>
        </div>
    );
}
