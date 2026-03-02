"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Initialize Stripe only when the key is available
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

function CheckoutForm({ clientSecret, bookingId, totalAmount }: { clientSecret: string, bookingId: string, totalAmount: number }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!stripe) {
            return;
        }
    }, [stripe]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/checkout/success?booking_id=${bookingId}`,
            },
        });

        if (error.type === "card_error" || error.type === "validation_error") {
            toast.error(error.message || "An error occurred");
        } else {
            toast.error("An unexpected error occurred.");
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
            <Button disabled={isLoading || !stripe || !elements} className="w-full bg-gold-500 text-black hover:bg-gold-600 font-bold text-lg py-6">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay $${totalAmount.toFixed(2)}`}
            </Button>
        </form>
    );
}

interface PaymentWrapperProps {
    bookingId: string;
    propertyId: string;
    checkIn: string | Date;
    checkOut: string | Date;
    guests: number;
}

export default function PaymentWrapper({ bookingId, propertyId, checkIn, checkOut, guests }: PaymentWrapperProps) {
    const [clientSecret, setClientSecret] = useState("");
    const [totalAmount, setTotalAmount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Create PaymentIntent as soon as the page loads
        fetch("/api/payments/create-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId, propertyId, checkIn, checkOut, guests }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    toast.error(data.error);
                    return;
                }
                setClientSecret(data.clientSecret);
                setTotalAmount(data.totalAmount);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error creating payment intent:", err);
                setLoading(false);
            });
    }, [bookingId, propertyId, checkIn, checkOut, guests]);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-gold-500" /></div>;
    }

    if (!clientSecret) {
        return <div className="text-red-500">Failed to initialize payment. Please try again.</div>;
    }

    if (!stripePromise) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-lg text-sm">
                <strong>Stripe not configured.</strong> Add <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to your <code>.env.local</code> and Vercel environment variables.
            </div>
        );
    }

    return (
        <div className="bg-surface-100 p-6 rounded-lg border border-[var(--card-border)]">
            <h3 className="text-xl font-bold text-white mb-4">Secure Payment</h3>
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#EAB308' } } }}>
                <CheckoutForm clientSecret={clientSecret} bookingId={bookingId} totalAmount={totalAmount} />
            </Elements>
        </div>
    );
}
