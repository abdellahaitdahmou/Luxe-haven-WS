"use client";

import { useState } from "react";
import { CreditCard, Plus, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function PaymentMethodsSection() {
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [cards, setCards] = useState<any[]>([]); // Mock state for now

    const handleAddCard = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock add
        setCards([...cards, {
            id: Date.now(),
            last4: "4242",
            brand: "Visa",
            exp_month: "12",
            exp_year: "2028"
        }]);

        setLoading(false);
        setIsAdding(false);
        toast.success("Payment method added successfully!");
    };

    const removeCard = (id: number) => {
        setCards(cards.filter(c => c.id !== id));
        toast.success("Payment method removed.");
    };

    return (
        <div className="bg-surface-50 border border-white/10 rounded-xl p-8 max-w-2xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gold-500" />
                Payment Methods
            </h3>
            <p className="text-gray-400 mb-6">
                Securely manage your payment cards and billing history.
            </p>

            {cards.length > 0 ? (
                <div className="space-y-4 mb-6">
                    {cards.map((card) => (
                        <div key={card.id} className="flex items-center justify-between p-4 bg-surface-100 border border-white/10 rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-bold">{card.brand} ending in •••• {card.last4}</p>
                                    <p className="text-sm text-gray-400">Expires {card.exp_month}/{card.exp_year}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => removeCard(card.id)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                !isAdding && (
                    <div className="mb-8 p-8 text-center border-2 border-dashed border-white/10 rounded-xl">
                        <p className="text-gray-500">No payment methods added yet.</p>
                    </div>
                )
            )}

            {isAdding ? (
                <form onSubmit={handleAddCard} className="bg-surface-100 p-6 rounded-lg border border-white/10 space-y-4">
                    <h4 className="font-bold text-white mb-4">Add New Card</h4>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Card Number</label>
                        <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-surface-50 border border-white/10 rounded-lg p-3 text-white focus:border-gold-500 outline-none" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Expiry Date</label>
                            <input type="text" placeholder="MM/YY" className="w-full bg-surface-50 border border-white/10 rounded-lg p-3 text-white focus:border-gold-500 outline-none" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">CVC</label>
                            <input type="text" placeholder="123" className="w-full bg-surface-50 border border-white/10 rounded-lg p-3 text-white focus:border-gold-500 outline-none" required />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="px-4 py-2 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-lg transition-colors flex items-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Card
                        </button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Payment Method
                </button>
            )}
        </div>
    );
}
