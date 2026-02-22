import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { Camera, User, BadgeCheck, ShieldCheck, CreditCard, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IdVerificationSection } from "@/components/settings/IdVerificationSection";
import { PaymentMethodsSection } from "@/components/settings/PaymentMethodsSection";
import { SecuritySection } from "@/components/settings/SecuritySection";

export default async function SettingsPage({ searchParams }: { searchParams: { tab?: string } }) {
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

    const currentTab = searchParams.tab || "verification";

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
                <p className="text-gray-400">Manage your verification, payment methods, and security preferences.</p>
            </div>

            <Tabs defaultValue={currentTab} className="space-y-8">
                <TabsList className="bg-surface-100 border border-white/10 p-1 rounded-lg">
                    {/* Profile Tab Removed - Now in /dashboard/profile */}
                    <TabsTrigger value="verification" className="data-[state=active]:bg-gold-500 data-[state=active]:text-black text-gray-400">
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        ID Verification
                    </TabsTrigger>
                    <TabsTrigger value="billing" className="data-[state=active]:bg-gold-500 data-[state=active]:text-black text-gray-400">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Payment Methods
                    </TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-gold-500 data-[state=active]:text-black text-gray-400">
                        <Lock className="w-4 h-4 mr-2" />
                        Privacy & Security
                    </TabsTrigger>
                </TabsList>

                {/* VERIFICATION TAB */}
                <TabsContent value="verification" className="space-y-6">
                    <IdVerificationSection profile={profile} />
                </TabsContent>

                {/* BILLING TAB */}
                <TabsContent value="billing" className="space-y-6">
                    <PaymentMethodsSection />
                </TabsContent>

                {/* SECURITY TAB */}
                <TabsContent value="security" className="space-y-6">
                    <SecuritySection />
                </TabsContent>
            </Tabs>
        </div>
    );
}
