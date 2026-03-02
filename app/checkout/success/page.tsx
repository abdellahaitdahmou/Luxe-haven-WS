"use client";

import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, ArrowRight, Map } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
    const searchParams = useSearchParams();
    const bookingId = searchParams.get("booking_id");

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--page-bg)] text-[var(--page-text)] p-6">
            <div className="text-center space-y-6 max-w-md">

                {/* Animated icon */}
                <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
                    <div className="relative w-24 h-24 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center">
                        <Clock className="w-10 h-10 text-amber-400" />
                    </div>
                </div>

                <div>
                    <h1 className="text-3xl font-bold mb-2">Request Sent!</h1>
                    <p className="text-[var(--muted-text)] text-base leading-relaxed">
                        Your reservation request has been sent to the host.
                        You'll receive a notification once they accept or decline — usually within 24 hours.
                    </p>
                </div>

                {/* Steps */}
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 text-left space-y-4">
                    {[
                        { icon: <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />, text: "Request received by the host" },
                        { icon: <Clock className="w-4 h-4 text-amber-400  shrink-0 mt-0.5" />, text: "Waiting for host approval (usually within 24h)" },
                        { icon: <ArrowRight className="w-4 h-4 text-[var(--muted-text)] shrink-0 mt-0.5" />, text: "You'll be notified by email & in-app notification" },
                    ].map((step, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                            {step.icon}
                            <span className="text-[var(--muted-text)]">{step.text}</span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-center">
                    <Link href="/dashboard/trips">
                        <Button className="bg-gold-500 hover:bg-gold-400 text-black font-bold">
                            View My Trips
                        </Button>
                    </Link>
                    <Link href="/properties">
                        <Button variant="outline" className="border-white/10 text-[var(--muted-text)] hover:bg-white/5">
                            Explore More
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Clock className="w-8 h-8 animate-spin text-gold-500" /></div>}>
            <SuccessContent />
        </Suspense>
    );
}
