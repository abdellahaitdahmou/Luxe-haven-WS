"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save, DollarSign, BadgeEuro, Coins } from "lucide-react";
import { CURRENCIES, CurrencyCode } from "@/context/CurrencyContext";

export default function AdminSettingsPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Settings State
    const [cancellationPolicy, setCancellationPolicy] = useState("moderate");
    const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
    const [payoutMethods, setPayoutMethods] = useState("stripe");
    const [platformCurrency, setPlatformCurrency] = useState<CurrencyCode>("USD");

    // Configuration State
    const [stripeConfig, setStripeConfig] = useState({ publicKey: "", secretKey: "" });
    const [paypalConfig, setPaypalConfig] = useState({ clientId: "", secret: "" });
    const [ccConfig, setCcConfig] = useState({ merchantId: "", merchantKey: "" });

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        try {
            setLoading(true);
            const { data, error } = await supabase.from("admin_settings").select("*");
            if (error) {
                console.error("Supabase Error Object:", JSON.stringify(error, null, 2));
                throw error;
            }

            if (data) {
                data.forEach(setting => {
                    if (setting.key === "global_cancellation_policy") setCancellationPolicy(setting.value);
                    if (setting.key === "payment_methods") setPaymentMethods(setting.value || []);
                    if (setting.key === "payout_methods") setPayoutMethods(setting.value);
                    if (setting.key === "platform_currency") setPlatformCurrency(setting.value as CurrencyCode);

                    // Load Configs
                    if (setting.key === "stripe_config") setStripeConfig(setting.value);
                    if (setting.key === "paypal_config") setPaypalConfig(setting.value);
                    if (setting.key === "cc_config") setCcConfig(setting.value);
                });
            }
        } catch (error: any) {
            console.error("Error fetching settings (Full):", error);
            if (error?.code === '42P01') {
                toast.error("Database table 'admin_settings' is missing!");
            } else {
                toast.error(`Failed to load settings: ${error.message || "Unknown error"}`);
            }
        } finally {
            setLoading(false);
        }
    }

    async function saveSetting(key: string, value: any) {
        try {
            setSaving(true);
            const { error } = await supabase
                .from("admin_settings")
                .upsert({ key, value, updated_at: new Date().toISOString() });

            if (error) throw error;
            toast.success("Settings saved successfully");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    }

    const togglePaymentMethod = (method: string) => {
        setPaymentMethods(prev =>
            prev.includes(method)
                ? prev.filter(m => m !== method)
                : [...prev, method]
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto p-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Platform Settings</h1>
                <p className="text-gray-400">Configure global platform policies and financial settings.</p>
            </div>

            <Tabs defaultValue="policies" className="w-full">
                <TabsList className="bg-surface-50 border border-white/10">
                    <TabsTrigger value="policies">Policies</TabsTrigger>
                    <TabsTrigger value="payments">Payments & Payouts</TabsTrigger>
                </TabsList>

                {/* POLICIES TAB */}
                <TabsContent value="policies" className="mt-6">
                    <Card className="bg-surface-50 border-white/10 text-white">
                        <CardHeader>
                            <CardTitle>Global Policies</CardTitle>
                            <CardDescription>Set default policies for new listings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Default Cancellation Policy</Label>
                                <Select value={cancellationPolicy} onValueChange={setCancellationPolicy}>
                                    <SelectTrigger className="bg-surface-100 border-white/10">
                                        <SelectValue placeholder="Select policy" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="flexible">Flexible (Full refund 1 day prior)</SelectItem>
                                        <SelectItem value="moderate">Moderate (Full refund 5 days prior)</SelectItem>
                                        <SelectItem value="strict">Strict (No refund)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* ─── Currency ─── */}
                            <div className="space-y-3 border-t border-white/10 pt-6">
                                <Label className="text-base font-semibold">Platform Currency</Label>
                                <p className="text-sm text-gray-400">All prices displayed to guests will use this currency.</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {CURRENCIES.map(cur => (
                                        <button
                                            key={cur.code}
                                            type="button"
                                            onClick={() => setPlatformCurrency(cur.code as CurrencyCode)}
                                            className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition ${platformCurrency === cur.code
                                                    ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                                                    : 'border-white/10 bg-black/30 text-gray-400 hover:border-white/30 hover:text-white'
                                                }`}
                                        >
                                            <span className="text-2xl font-bold">{cur.symbol}</span>
                                            <span className="text-sm font-semibold">{cur.code}</span>
                                            <span className="text-xs text-gray-500">{cur.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-3">
                            <Button
                                onClick={() => saveSetting("global_cancellation_policy", cancellationPolicy)}
                                className="bg-gold-500 text-black hover:bg-gold-600"
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Policy
                            </Button>
                            <Button
                                onClick={() => saveSetting("platform_currency", platformCurrency)}
                                variant="outline"
                                className="border-white/10 text-white hover:bg-white/10"
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Currency
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* PAYMENTS TAB */}
                <TabsContent value="payments" className="mt-6">
                    <Card className="bg-surface-50 border-white/10 text-white mb-6">
                        <CardHeader>
                            <CardTitle>Accepted Payment Methods</CardTitle>
                            <CardDescription>Select which payment methods guests can use.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Stripe */}
                            <div className="space-y-4 border-b border-white/10 pb-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="stripe"
                                        checked={paymentMethods.includes("stripe")}
                                        onCheckedChange={() => togglePaymentMethod("stripe")}
                                        className="border-white/20 data-[state=checked]:bg-gold-500 data-[state=checked]:text-black"
                                    />
                                    <Label htmlFor="stripe" className="text-lg font-medium cursor-pointer">Stripe</Label>
                                </div>
                                {paymentMethods.includes("stripe") && (
                                    <div className="ml-6 grid gap-4 p-4 bg-surface-100 rounded-lg border border-white/5">
                                        <div className="grid gap-2">
                                            <Label>Publishable Key</Label>
                                            <Input
                                                value={stripeConfig.publicKey}
                                                onChange={(e) => setStripeConfig({ ...stripeConfig, publicKey: e.target.value })}
                                                placeholder="pk_test_..."
                                                className="bg-surface-50 border-white/10"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Secret Key</Label>
                                            <Input
                                                type="password"
                                                value={stripeConfig.secretKey}
                                                onChange={(e) => setStripeConfig({ ...stripeConfig, secretKey: e.target.value })}
                                                placeholder="sk_test_..."
                                                className="bg-surface-50 border-white/10"
                                            />
                                        </div>
                                        <Button size="sm" onClick={() => saveSetting("stripe_config", stripeConfig)} disabled={saving} className="w-fit bg-gold-500/20 text-gold-500 hover:bg-gold-500/30">Save Stripe Config</Button>
                                    </div>
                                )}
                            </div>

                            {/* PayPal */}
                            <div className="space-y-4 border-b border-white/10 pb-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="paypal"
                                        checked={paymentMethods.includes("paypal")}
                                        onCheckedChange={() => togglePaymentMethod("paypal")}
                                        className="border-white/20 data-[state=checked]:bg-gold-500 data-[state=checked]:text-black"
                                    />
                                    <Label htmlFor="paypal" className="text-lg font-medium cursor-pointer">PayPal</Label>
                                </div>
                                {paymentMethods.includes("paypal") && (
                                    <div className="ml-6 grid gap-4 p-4 bg-surface-100 rounded-lg border border-white/5">
                                        <div className="grid gap-2">
                                            <Label>Client ID</Label>
                                            <Input
                                                value={paypalConfig.clientId}
                                                onChange={(e) => setPaypalConfig({ ...paypalConfig, clientId: e.target.value })}
                                                className="bg-surface-50 border-white/10"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Client Secret</Label>
                                            <Input
                                                type="password"
                                                value={paypalConfig.secret}
                                                onChange={(e) => setPaypalConfig({ ...paypalConfig, secret: e.target.value })}
                                                className="bg-surface-50 border-white/10"
                                            />
                                        </div>
                                        <Button size="sm" onClick={() => saveSetting("paypal_config", paypalConfig)} disabled={saving} className="w-fit bg-gold-500/20 text-gold-500 hover:bg-gold-500/30">Save PayPal Config</Button>
                                    </div>
                                )}
                            </div>


                            {/* Credit Card (Direct) */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="credit_card"
                                        checked={paymentMethods.includes("credit_card")}
                                        onCheckedChange={() => togglePaymentMethod("credit_card")}
                                        className="border-white/20 data-[state=checked]:bg-gold-500 data-[state=checked]:text-black"
                                    />
                                    <Label htmlFor="credit_card" className="text-lg font-medium cursor-pointer">Credit Card (Direct Gateway)</Label>
                                </div>
                                {paymentMethods.includes("credit_card") && (
                                    <div className="ml-6 grid gap-4 p-4 bg-surface-100 rounded-lg border border-white/5">
                                        <div className="grid gap-2">
                                            <Label>Merchant ID</Label>
                                            <Input
                                                value={ccConfig.merchantId}
                                                onChange={(e) => setCcConfig({ ...ccConfig, merchantId: e.target.value })}
                                                className="bg-surface-50 border-white/10"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Merchant Key / Secret</Label>
                                            <Input
                                                type="password"
                                                value={ccConfig.merchantKey}
                                                onChange={(e) => setCcConfig({ ...ccConfig, merchantKey: e.target.value })}
                                                className="bg-surface-50 border-white/10"
                                            />
                                        </div>
                                        <Button size="sm" onClick={() => saveSetting("cc_config", ccConfig)} disabled={saving} className="w-fit bg-gold-500/20 text-gold-500 hover:bg-gold-500/30">Save Card Config</Button>
                                    </div>
                                )}
                            </div>

                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={() => saveSetting("payment_methods", paymentMethods)}
                                className="bg-gold-500 text-black hover:bg-gold-600"
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Enabled Methods List
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="bg-surface-50 border-white/10 text-white">
                        <CardHeader>
                            <CardTitle>Payout Methods</CardTitle>
                            <CardDescription>Configure how owners receive their earnings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Label>Primary Payout System</Label>
                            <Select value={payoutMethods} onValueChange={setPayoutMethods}>
                                <SelectTrigger className="bg-surface-100 border-white/10">
                                    <SelectValue placeholder="Select system" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="stripe">Stripe Connect (Automated)</SelectItem>
                                    <SelectItem value="manual">Manual Bank Transfer</SelectItem>
                                    <SelectItem value="paypal">PayPal Payouts</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={() => saveSetting("payout_methods", payoutMethods)}
                                className="bg-gold-500 text-black hover:bg-gold-600"
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Payout Settings
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
