"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isWeekend, addMonths, parseISO, isSameDay } from "date-fns";
import { Sparkles, TrendingUp, Calendar } from "lucide-react";

interface SmartPricingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    properties: any[];
    onUpdate: () => void;
}

const STRATEGIES = [
    { id: "conservative", label: "Conservative", description: "Small adjustments (+10% weekends)", multiplier: 1.1 },
    { id: "balanced", label: "Balanced", description: "Moderate adjustments (+20% weekends)", multiplier: 1.2 },
    { id: "aggressive", label: "Aggressive", description: "Maximize revenue (+30% weekends)", multiplier: 1.3 },
];

// Simple hardcoded holidays (expand as needed or fetch from API)
const HOLIDAYS = [
    "2024-12-25", "2024-12-31", "2025-01-01", "2025-07-04", "2025-11-27", "2025-12-25"
];

export function SmartPricingDialog({ open, onOpenChange, properties, onUpdate }: SmartPricingDialogProps) {
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
    const [strategy, setStrategy] = useState("balanced");
    const [targetMonth, setTargetMonth] = useState(new Date()); // Default to current month
    const [loading, setLoading] = useState(false);
    const [simulation, setSimulation] = useState<{ date: string, price: number, reason: string }[] | null>(null);

    const handleSimulate = () => {
        if (!selectedPropertyId) {
            toast.error("Please select a property");
            return;
        }

        const property = properties.find(p => p.id === selectedPropertyId);
        if (!property) return;

        const basePrice = property.price_per_night;
        const selectedStrategy = STRATEGIES.find(s => s.id === strategy)!;

        const start = startOfMonth(targetMonth);
        const end = endOfMonth(targetMonth);
        const dates = eachDayOfInterval({ start, end });

        const results = dates.map(date => {
            let price = basePrice;
            let reason = "Base Price";

            // Holiday check
            const dateStr = format(date, "yyyy-MM-dd");
            if (HOLIDAYS.includes(dateStr)) {
                price = basePrice * (selectedStrategy.multiplier + 0.3); // Holiday boost
                reason = "Holiday 🔥";
            }
            // Weekend check
            else if (isWeekend(date)) {
                price = basePrice * selectedStrategy.multiplier;
                reason = "Weekend 📈";
            }

            return {
                date: dateStr,
                price: Math.round(price),
                reason
            };
        });

        setSimulation(results);
    };

    const handleApply = async () => {
        if (!selectedPropertyId || !simulation) return;

        setLoading(true);
        try {
            const supabase = createClient();
            const updates = simulation.map(item => ({
                property_id: selectedPropertyId,
                date: item.date,
                price: item.price
            }));

            const { error } = await supabase
                .from("daily_prices")
                .upsert(updates, { onConflict: "property_id, date" });

            if (error) throw error;

            toast.success(`Applied smart pricing for ${format(targetMonth, "MMMM yyyy")}`);
            onUpdate();
            onOpenChange(false);
            setSimulation(null);
        } catch (error: any) {
            console.error("Smart Pricing Upsert Error:", error);
            toast.error(`Failed to apply pricing: ${error.message || "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-surface-100 border-white/10 text-white sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-gold-500" />
                        Smart Pricing Assistant
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Controls */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Property</Label>
                            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                                <SelectTrigger className="bg-surface-50 border-white/10 text-white">
                                    <SelectValue placeholder="Select property" />
                                </SelectTrigger>
                                <SelectContent className="bg-surface-100 border-white/10 text-white">
                                    {properties.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.title} (${p.price_per_night})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Target Month</Label>
                            <div className="flex items-center border border-white/10 rounded-md bg-surface-50 px-3 h-9">
                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                <span className="text-sm">{format(targetMonth, "MMMM yyyy")}</span>
                            </div>
                            {/* Simple month navigation could be added here, currently just shows current month context */}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Strategy</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {STRATEGIES.map((s) => (
                                <div
                                    key={s.id}
                                    onClick={() => setStrategy(s.id)}
                                    className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${strategy === s.id ? 'bg-gold-500/20 border-gold-500 text-gold-500' : 'bg-surface-50 border-white/10 hover:bg-surface-50/80'}`}
                                >
                                    <div className="font-bold text-sm">{s.label}</div>
                                    <div className="text-[10px] opacity-70 mt-1">{s.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {!simulation ? (
                        <div className="flex justify-center py-4">
                            <Button onClick={handleSimulate} disabled={!selectedPropertyId} className="bg-white/10 hover:bg-white/20 text-white w-full">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Simulate Pricing
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-surface-50 border border-white/10 rounded-lg p-4">
                                <h4 className="font-bold mb-3 text-sm text-gray-400">Preview: {format(targetMonth, "MMMM")}</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                    {simulation.filter((_, i) => i % 5 === 0 || i === simulation.length - 1).map((item) => ( // Show sample to save space
                                        <div key={item.date} className="flex justify-between text-sm border-b border-white/5 pb-1">
                                            <span>{format(parseISO(item.date), "MMM d")}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">{item.reason}</span>
                                                <span className="font-mono text-gold-500">${item.price}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="text-center text-xs text-gray-500 pt-2">
                                        ...and {simulation.length - 7} more days
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setSimulation(null)} className="flex-1">Back</Button>
                                <Button onClick={handleApply} disabled={loading} className="flex-1 bg-gold-500 text-black hover:bg-gold-400">
                                    {loading ? "Applying..." : "Apply Prices"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
