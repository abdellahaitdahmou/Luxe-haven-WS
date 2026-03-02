import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { Camera, User, BadgeCheck, ShieldCheck, CreditCard, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IdVerificationSection } from "@/components/settings/IdVerificationSection";
import { PaymentMethodsSection } from "@/components/settings/PaymentMethodsSection";
import { SecuritySection } from "@/components/settings/SecuritySection";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
    const { tab } = await searchParams;
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

    const currentTab = tab || "verification";

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-6">
            <div>
                <h1 className="text-3xl font-bold text-[var(--page-text)] mb-2">Account Settings</h1>
                <p className="text-[var(--muted-text)]">Manage your verification, payment methods, and security preferences.</p>
            </div>

            <Tabs defaultValue={currentTab} className="space-y-8">
                <TabsList className="bg-[var(--surface-100)] border border-[var(--card-border)] p-1 rounded-lg flex flex-col md:flex-row h-auto w-full md:w-max">
                    {/* Profile Tab Removed - Now in /dashboard/profile */}
                    <TabsTrigger value="verification" className="data-[state=active]:bg-gold-500 data-[state=active]:text-black text-[var(--muted-text)] w-full justify-start md:w-auto md:justify-center">
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        ID Verification
                    </TabsTrigger>
                    <TabsTrigger value="billing" className="data-[state=active]:bg-gold-500 data-[state=active]:text-black text-[var(--muted-text)] w-full justify-start md:w-auto md:justify-center">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Payment Methods
                    </TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-gold-500 data-[state=active]:text-black text-[var(--muted-text)] w-full justify-start md:w-auto md:justify-center">
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
