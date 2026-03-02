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
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-8 max-w-2xl">
            <h3 className="text-xl font-bold text-[var(--page-text)] mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gold-500" />
                Payment Methods
            </h3>
            <p className="text-[var(--muted-text)] mb-6">
                Securely manage your payment cards and billing history.
            </p>

            {cards.length > 0 ? (
                <div className="space-y-4 mb-6">
                    {cards.map((card) => (
                        <div key={card.id} className="flex items-center justify-between p-4 bg-[var(--surface-100)] border border-[var(--card-border)] rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-8 bg-[var(--surface-200)] rounded flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-[var(--page-text)]" />
                                </div>
                                <div>
                                    <p className="text-[var(--page-text)] font-bold">{card.brand} ending in •••• {card.last4}</p>
                                    <p className="text-sm text-[var(--muted-text)]">Expires {card.exp_month}/{card.exp_year}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => removeCard(card.id)}
                                className="p-2 text-[var(--muted-text)] hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                !isAdding && (
                    <div className="mb-8 p-8 text-center border-2 border-dashed border-[var(--card-border)] rounded-xl">
                        <p className="text-[var(--muted-text)]">No payment methods added yet.</p>
                    </div>
                )
            )}

            {isAdding ? (
                <form onSubmit={handleAddCard} className="bg-[var(--surface-100)] p-6 rounded-lg border border-[var(--card-border)] space-y-4">
                    <h4 className="font-bold text-[var(--page-text)] mb-4">Add New Card</h4>

                    <div className="space-y-2">
                        <label className="text-sm text-[var(--muted-text)]">Card Number</label>
                        <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-3 text-[var(--page-text)] focus:border-gold-500 outline-none" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-[var(--muted-text)]">Expiry Date</label>
                            <input type="text" placeholder="MM/YY" className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-3 text-[var(--page-text)] focus:border-gold-500 outline-none" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-[var(--muted-text)]">CVC</label>
                            <input type="text" placeholder="123" className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-3 text-[var(--page-text)] focus:border-gold-500 outline-none" required />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="px-4 py-2 border border-[var(--card-border)] rounded-lg text-[var(--muted-text)] hover:text-[var(--page-text)] hover:bg-[var(--surface-200)] transition-colors"
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
                    className="mt-2 px-4 py-2 bg-[var(--surface-100)] hover:bg-[var(--surface-200)] border border-[var(--card-border)] text-[var(--page-text)] rounded-lg transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Payment Method
                </button>
            )}
        </div>
    );
}
