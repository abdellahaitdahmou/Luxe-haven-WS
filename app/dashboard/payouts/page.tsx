"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function PayoutMethodsPage() {
    const [loading, setLoading] = useState(false);
    const [methodType, setMethodType] = useState("paypal");
    const [details, setDetails] = useState<any>({});
    const [isOpen, setIsOpen] = useState(false);

    async function handleAddMethod() {
        setLoading(true);
        const supabase = createClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase
                .from("user_payout_methods")
                .insert({
                    user_id: user.id,
                    method_type: methodType,
                    details: details,
                    is_default: true // Make default for now
                });

            if (error) throw error;
            toast.success("Payout method added successfully!");
            setIsOpen(false);
            setDetails({});
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Payout Methods</h1>
                    <p className="text-gray-400">Manage how you receive your earnings.</p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gold-500 text-black hover:bg-gold-600">
                            <Plus className="w-4 h-4 mr-2" /> Add Method
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-surface-100 border-white/10 text-white sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add Payout Method</DialogTitle>
                            <DialogDescription>
                                Securely add your financial details.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Method Type</Label>
                                <Select value={methodType} onValueChange={setMethodType}>
                                    <SelectTrigger className="bg-surface-50 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="paypal">PayPal</SelectItem>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="payoneer">Payoneer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {methodType === "paypal" && (
                                <div className="space-y-2">
                                    <Label>PayPal Email</Label>
                                    <Input
                                        placeholder="user@example.com"
                                        className="bg-surface-50 border-white/10"
                                        onChange={(e) => setDetails({ ...details, email: e.target.value })}
                                    />
                                </div>
                            )}

                            {methodType === "bank_transfer" && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Bank Name</Label>
                                        <Input
                                            className="bg-surface-50 border-white/10"
                                            onChange={(e) => setDetails({ ...details, bank_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Account Number / IBAN</Label>
                                        <Input
                                            className="bg-surface-50 border-white/10"
                                            onChange={(e) => setDetails({ ...details, account_number: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}
                            {methodType === "payoneer" && (
                                <div className="space-y-2">
                                    <Label>Payoneer Email</Label>
                                    <Input
                                        placeholder="user@example.com"
                                        className="bg-surface-50 border-white/10"
                                        onChange={(e) => setDetails({ ...details, email: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>

                        <Button onClick={handleAddMethod} disabled={loading} className="w-full bg-gold-500 text-black hover:bg-gold-600">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Method"}
                        </Button>
                    </DialogContent>
                </Dialog>
            </div>

            {/* List of Methods Placeholder */}
            <Card className="bg-surface-50 border-white/10 text-white">
                <CardHeader>
                    <CardTitle>Your Linked Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-400">No payout methods added yet.</p>
                </CardContent>
            </Card>
        </div>
    );
}
