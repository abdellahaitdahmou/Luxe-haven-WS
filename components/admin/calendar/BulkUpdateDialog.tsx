"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format, eachDayOfInterval, parseISO } from "date-fns";

interface BulkUpdateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    properties: any[];
    onUpdate: () => void;
}

export function BulkUpdateDialog({ open, onOpenChange, properties, onUpdate }: BulkUpdateDialogProps) {
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [price, setPrice] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!selectedPropertyId || !startDate || !endDate || !price) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            const supabase = createClient();
            const start = parseISO(startDate);
            const end = parseISO(endDate);
            const dates = eachDayOfInterval({ start, end });

            const updates = dates.map(date => ({
                property_id: selectedPropertyId,
                date: format(date, "yyyy-MM-dd"),
                price: parseFloat(price)
            }));

            const { error } = await supabase
                .from("daily_prices")
                .upsert(updates, { onConflict: "property_id, date" });

            if (error) throw error;

            toast.success(`Updated prices for ${updates.length} dates`);
            onUpdate();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to update prices");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-surface-100 border-white/10 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Bulk Price Update</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Property</Label>
                        <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                            <SelectTrigger className="bg-surface-50 border-white/10 text-white">
                                <SelectValue placeholder="Select property" />
                            </SelectTrigger>
                            <SelectContent className="bg-surface-100 border-white/10 text-white">
                                {properties.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-surface-50 border-white/10 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-surface-50 border-white/10 text-white"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Price per Night</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                            <Input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="pl-7 bg-surface-50 border-white/10 text-white"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-gold-500 text-black hover:bg-gold-400">
                        {loading ? "Saving..." : "Update Prices"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
